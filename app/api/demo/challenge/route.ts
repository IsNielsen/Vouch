import { generateAuthenticationOptions } from "@simplewebauthn/server";
import { getRpConfig } from "@/lib/webauthn/rp";
import { checkRateLimit } from "@/lib/rate-limit";
import { demoChallenges } from "@/lib/demo-store";

export async function POST(req: Request) {
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0].trim() ?? "unknown";

  if (!(await checkRateLimit(ip))) {
    return Response.json(
      { error: "Rate limit exceeded. Try again in a minute." },
      { status: 429 }
    );
  }

  let body: { transaction_context?: unknown } = {};
  try {
    body = await req.json();
  } catch {
    // no-op: body is optional for the demo endpoint
  }

  const { rpID } = getRpConfig(req);
  const webauthnOptions = await generateAuthenticationOptions({
    rpID,
    userVerification: "required",
    allowCredentials: [],
  });

  const challengeId = crypto.randomUUID();
  const expiresAt = new Date(Date.now() + 300_000).toISOString();
  demoChallenges.set(challengeId, {
    id: challengeId,
    webauthn_challenge: webauthnOptions.challenge,
    transaction_context: body.transaction_context ?? null,
    expires_at: expiresAt,
    status: "pending",
  });

  return Response.json({
    challenge_id: challengeId,
    webauthn_options: webauthnOptions,
    expires_in: 300,
  });
}
