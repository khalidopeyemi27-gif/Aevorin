/**
 * AEVORIN API Configuration
 *
 * Controls where API requests are sent based on the environment.
 *
 * --- Modes ---
 *
 * 1. Development (PC browser)
 *    .env.development → VITE_API_URL=""
 *    Vite proxy forwards /api/* → localhost:5000
 *
 * 2. Android WebView → PC backend (current stage)
 *    .env.android → VITE_API_URL="http://192.168.76.119:5000"
 *    Android hits the PC backend directly (no proxy needed)
 *
 * 3. Future: Standalone mobile (Node bundled in APK)
 *    .env.mobile → VITE_API_URL="http://localhost:5000"
 *    The Node engine runs inside the device itself
 *
 * To switch modes:
 *   npm run dev              → uses .env.development (proxy)
 *   npm run dev:android      → uses .env.android (direct IP)
 */

// Reads VITE_API_URL at build/dev time.
// Empty string = use relative URLs (Vite proxy handles it on PC).
const BASE_URL: string = (import.meta.env.VITE_API_URL as string) ?? '';

/**
 * Build a full API endpoint URL.
 * @param path - e.g. "/api/projects" or "/api/projects/123/chapters"
 */
export function apiUrl(path: string): string {
  // Ensure path starts with /
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${BASE_URL}${cleanPath}`;
}

export default BASE_URL;
