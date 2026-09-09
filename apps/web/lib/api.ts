/**
 * Smart API Base URL resolver.
 * When accessed locally on localhost, uses http://localhost:4000 (or NEXT_PUBLIC_API_URL).
 * When accessed remotely via ngrok, tunneling, or custom domain, returns empty string ''
 * so that requests go to /api/v1/... and Next.js rewrites proxy them directly to the backend.
 */
export function getApiBaseUrl(): string {
  if (typeof window !== 'undefined') {
    return '';
  }
  return process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
}
