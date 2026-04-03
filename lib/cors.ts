export const CORS_PREFLIGHT_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Authorization, Content-Type",
  "Access-Control-Max-Age": "86400",
};

/** Returns a new Response with CORS headers set. If allowed is non-empty, restricts to that list; empty means allow all. */
export function withCors(res: Response, origin: string | null, allowed: string[]): Response {
  if (!origin) return res;
  if (allowed.length > 0 && !allowed.includes(origin)) return res;
  const headers = new Headers(res.headers);
  headers.set("Access-Control-Allow-Origin", origin);
  headers.set("Access-Control-Allow-Credentials", "true");
  headers.set("Vary", "Origin");
  return new Response(res.body, { status: res.status, headers });
}
