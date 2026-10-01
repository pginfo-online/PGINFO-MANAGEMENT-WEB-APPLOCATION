// ─── Environment Configuration ─────────────────────────────────────────────
// All environment variables are validated at startup. Server-only secrets
// are never prefixed with NEXT_PUBLIC_ and are not accessible in the browser.

const requiredEnv = (key: string): string => {
  const val = process.env[key];
  if (!val) throw new Error(`Missing required env var: ${key}`);
  return val;
};

const optionalEnv = (key: string, fallback: string): string =>
  process.env[key] || fallback;

// ─── Public (browser-safe) ────────────────────────────────────────────────────
export const env = {
  /** API base URL — must include /api/v1 */
  NEXT_PUBLIC_API_URL: optionalEnv(
    'NEXT_PUBLIC_API_URL',
    'http://localhost:5001/api/v1'
  ),
  /** App name for display */
  NEXT_PUBLIC_APP_NAME: optionalEnv('NEXT_PUBLIC_APP_NAME', 'PGinfo Management'),
  /** Google Maps API Key for Places Autocomplete, Geocoding, and Interactive Map */
  NEXT_PUBLIC_GOOGLE_MAPS_API_KEY: optionalEnv(
    'NEXT_PUBLIC_GOOGLE_MAPS_API_KEY',
    'AIzaSyCCWonK_9QaSv9_vhRM3bKsVJUoU2e4MRM'
  ),
} as const;

// ─── Server-only ──────────────────────────────────────────────────────────────
// These are only accessible in Server Components, API routes, and middleware.
export const serverEnv = {
  get JWT_SECRET() {
    return requiredEnv('JWT_SECRET');
  },
} as const;
