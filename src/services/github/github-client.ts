export class GitHubRateLimitError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'GitHubRateLimitError';
  }
}

export class GitHubNotFoundError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'GitHubNotFoundError';
  }
}

export class GitHubApiError extends Error {
  constructor(message: string, public status: number) {
    super(message);
    this.name = 'GitHubApiError';
  }
}

interface FetchOptions extends RequestInit {
  timeoutMs?: number;
  turnstileToken?: string;
}

import { Platform } from 'react-native';

function getApiBaseUrl() {
  let url = Platform.OS !== 'web' && process.env.EXPO_PUBLIC_API_MOBILE_URL 
    ? process.env.EXPO_PUBLIC_API_MOBILE_URL 
    : (process.env.EXPO_PUBLIC_API_BASE_URL || '');

  url = url.replace(/\/api\/?$/, '').replace(/\/$/, '');

  if (Platform.OS === 'android' && url) {
    url = url.replace('localhost', '10.0.2.2').replace('127.0.0.1', '10.0.2.2');
  }
  return url;
}

export async function fetchFromGitHub<T>(endpoint: string, options: FetchOptions = {}): Promise<T> {
  const isDevelopment = process.env.NODE_ENV === 'development';
  
  // Extract just the path if a full URL was accidentally passed
  let path = endpoint;
  if (path.startsWith('http')) {
    try {
      const urlObj = new URL(path);
      path = urlObj.pathname + urlObj.search;
    } catch {
      // Fallback
    }
  }

  // Use the proxy for both development and production now, since we support proper local/remote routing
  const baseUrl = getApiBaseUrl();
  const url = `${baseUrl}/api/github?endpoint=${encodeURIComponent(path)}`;
  
  const headers = new Headers(options.headers || {});
  if (!headers.has('Accept')) {
    headers.set('Accept', 'application/vnd.github.v3+json');
  }
  
  // Injetar token opcional de autenticação se disponível para elevar limite para 5000 reqs/h
  const authToken = process.env.GITHUB_TOKEN || process.env.EXPO_PUBLIC_GITHUB_TOKEN || process.env.readRepoGHKey;
  if (authToken && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${authToken}`);
  }
  
  if (options.turnstileToken) {
    headers.set('x-turnstile-token', options.turnstileToken);
  }
  
  // Explicitly adding User-Agent as it's required by GitHub API, though browsers might override it
  headers.set('User-Agent', 'Portfolio-Builder-App');

  const controller = new AbortController();
  const timeoutMs = options.timeoutMs || 10000;
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      ...options,
      headers,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (response.status === 403 || response.status === 429) {
      const remaining = response.headers.get('x-ratelimit-remaining');
      if (remaining === '0') {
        throw new GitHubRateLimitError('GitHub API rate limit exceeded.');
      }
      // Could also be secondary rate limit
      throw new GitHubRateLimitError('GitHub API rate limit or abuse detection triggered.');
    }

    if (response.status === 404) {
      throw new GitHubNotFoundError(`Resource not found: ${endpoint}`);
    }

    if (!response.ok) {
      throw new GitHubApiError(`GitHub API error: ${response.statusText}`, response.status);
    }

    const acceptHeader = headers.get('Accept') || '';
    if (acceptHeader.includes('.raw') || acceptHeader.includes('.html')) {
      if (typeof response.text === 'function') {
        return await response.text() as unknown as T;
      }
      if (typeof response.json === 'function') {
        const json = await response.json();
        return (typeof json === 'string' ? json : JSON.stringify(json)) as unknown as T;
      }
    }

    if (typeof response.json === 'function') {
      return await response.json() as T;
    }
    if (typeof response.text === 'function') {
      return await response.text() as unknown as T;
    }
    return null as unknown as T;
  } catch (error) {
    clearTimeout(timeoutId);
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error(`Request timeout: ${endpoint}`);
    }
    throw error;
  }
}

/**
 * Normalizes a GitHub URL or username into just the username.
 */
export function normalizeGitHubUsername(input: string): string {
  let normalized = input.trim();
  if (!normalized) return '';

  // Remove trailing slashes
  normalized = normalized.replace(/\/+$/, '');

  if (normalized.includes('github.com/')) {
    const parts = normalized.split('github.com/');
    if (parts.length > 1) {
      // Get the first path segment after github.com/
      normalized = parts[1].split('/')[0];
    }
  }

  return normalized;
}
