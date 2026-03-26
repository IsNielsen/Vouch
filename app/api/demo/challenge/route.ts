import { randomUUID } from "crypto";

// Simple in-memory rate limiter: 10 requests per minute per IP
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const LIMIT = 10;
const WINDOW_MS = 60_000;

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);
  if (!entry || now >= entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + WINDOW_MS });
    return true;
  }
  if (entry.count >= LIMIT) return false;
  entry.count++;
  return true;
}

export async function POST(req: Request) {
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0].trim() ?? "unknown";

  if (!checkRateLimit(ip)) {
    return Response.json(
      { error: "Rate limit exceeded. Try again in a minute." },
      { status: 429 }
    );
  }

  const challenge_id = randomUUID();

  // Fake WebAuthn options — VouchButton in demoMode won't call startAuthentication
  const webauthn_options = {
    challenge: Buffer.from(randomUUID()).toString("base64url"),
    rpId: "demo",
    allowCredentials: [],
    userVerification: "required",
    timeout: 60000,
  };

  return Response.json({ challenge_id, webauthn_options, expires_in: 300 });
}
