import { randomUUID } from "crypto";
import { checkRateLimit } from "@/lib/rate-limit";

export async function POST(req: Request) {
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0].trim() ?? "unknown";

  if (!(await checkRateLimit(ip))) {
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
