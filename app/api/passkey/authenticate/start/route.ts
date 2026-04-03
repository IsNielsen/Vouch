import { generateAuthenticationOptions } from "@simplewebauthn/server";
import { cookies } from "next/headers";
import { getRpConfig } from "@/lib/webauthn/rp";
import { CORS_PREFLIGHT_HEADERS } from "@/lib/cors";

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: CORS_PREFLIGHT_HEADERS });
}

export async function POST(req: Request) {
  const { rpID } = getRpConfig(req);

  const options = await generateAuthenticationOptions({
    rpID,
    userVerification: "required",
    allowCredentials: [], // discoverable credential — no allowList needed
  });

  const cookieStore = await cookies();
  cookieStore.set("webauthn_challenge", options.challenge, {
    httpOnly: true,
    sameSite: "none",
    secure: true,
    path: "/",
    maxAge: 300,
  });

  return new Response(JSON.stringify(options), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}
