import { handleCors } from './utils/cors';
import type { VercelRequest, VercelResponse } from '@vercel/node';

const ALLOWED_ENDPOINTS = [
  /^\/users\/[^/]+$/, // e.g. /users/inovia
  /^\/users\/[^/]+\/repos$/, // e.g. /users/inovia/repos
  /^\/repos\/[^/]+\/[^/]+$/, // e.g. /repos/inovia/portfolio
  /^\/repos\/[^/]+\/[^/]+\/readme$/, // e.g. /repos/inovia/portfolio/readme
  /^\/repos\/[^/]+\/[^/]+\/languages$/, // e.g. /repos/inovia/portfolio/languages
  /^\/repos\/[^/]+\/[^/]+\/contents\/[^]+$/, // e.g. /repos/inovia/portfolio/contents/package.json
];

import { verifyTurnstileToken } from './utils/turnstile';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (handleCors(req, res)) return;

  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const endpoint = req.query.endpoint as string;
  if (!endpoint) {
    return res.status(400).json({ error: 'Missing endpoint parameter' });
  }

  // Turnstile validation is required for ALL endpoints as requested.
  const turnstileToken = req.headers['x-turnstile-token'] as string | undefined;
  const isHuman = await verifyTurnstileToken(turnstileToken);
  if (!isHuman) {
    return res.status(403).json({ error: 'Invalid or missing Turnstile token' });
  }

  // Validate endpoint to prevent arbitrary SSRF
  const isAllowed = ALLOWED_ENDPOINTS.some(regex => regex.test(endpoint.split('?')[0]));
  if (!isAllowed) {
    return res.status(403).json({ error: 'Endpoint not allowed' });
  }

  // Get the secret key
  const apiKey = process.env.GITHUB_TOKEN || process.env.readRepoGHKey;
  if (!apiKey) {
    return res.status(500).json({ error: 'Server configuration error' });
  }

  const url = `https://api.github.com${endpoint}`;

  try {
    // Default to v3+json, but allow explicit github raw/html Accept headers
    const clientAccept = req.headers['accept'] as string | undefined;
    const acceptHeader = clientAccept?.includes('vnd.github') 
      ? clientAccept 
      : 'application/vnd.github.v3+json';

    const ghResponse = await fetch(url, {
      headers: {
        'Accept': acceptHeader,
        'User-Agent': 'Portfolio-Builder-App',
        'Authorization': `Bearer ${apiKey}`,
      }
    });

    // Forward rate limit headers
    const rateLimitHeaders = [
      'x-ratelimit-limit',
      'x-ratelimit-remaining',
      'x-ratelimit-reset',
      'x-ratelimit-used',
      'x-ratelimit-resource'
    ];

    rateLimitHeaders.forEach(header => {
      const val = ghResponse.headers.get(header);
      if (val) {
        res.setHeader(header, val);
      }
    });

    // Handle rate limit errors structurally
    if (ghResponse.status === 403 || ghResponse.status === 429) {
      const remaining = ghResponse.headers.get('x-ratelimit-remaining');
      if (remaining === '0') {
        return res.status(ghResponse.status).json({ 
          error: 'GitHub API rate limit exceeded.',
          status: ghResponse.status
        });
      }
      return res.status(ghResponse.status).json({ 
        error: 'GitHub API rate limit or abuse detection triggered.',
        status: ghResponse.status
      });
    }

    // Set cache control headers based on endpoint
    if (ghResponse.ok) {
      if (endpoint.startsWith('/users/') && !endpoint.includes('/repos')) {
        // User profile: 10 mins
        res.setHeader('Cache-Control', 's-maxage=600, stale-while-revalidate=1200');
      } else if (endpoint.includes('/repos')) {
        // Repo list: 5 mins
        res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=600');
      } else {
        // README, manifests, languages: 30 mins
        res.setHeader('Cache-Control', 's-maxage=1800, stale-while-revalidate=3600');
      }
    }

    const data = await ghResponse.text();

    res.status(ghResponse.status).send(data);
  } catch (error) {
    console.error('GitHub proxy error:', error);
    res.status(500).json({ error: 'Failed to proxy request to GitHub' });
  }
}
