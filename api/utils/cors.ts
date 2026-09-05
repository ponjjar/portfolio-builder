import type { VercelRequest, VercelResponse } from '@vercel/node';

const ALLOWED_ORIGINS = [
  'https://folium-builder.vercel.app',
  'http://localhost:3000',
  'http://localhost:8081',
  'http://localhost:19006',
  'http://127.0.0.1:3000',
  'http://127.0.0.1:8081',
  'http://127.0.0.1:19006',
];

/**
 * Applies CORS headers and handles preflight OPTIONS requests.
 * @returns true if the request was handled (e.g. OPTIONS preflight) and the caller should return immediately.
 */
export function handleCors(req: VercelRequest, res: VercelResponse): boolean {
  const origin = req.headers.origin;

  // React Native / Mobile apps often do not send an Origin header.
  // We do not block requests without an Origin header.
  if (origin && ALLOWED_ORIGINS.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }

  res.setHeader('Vary', 'Origin');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-turnstile-token');

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return true;
  }

  return false;
}
