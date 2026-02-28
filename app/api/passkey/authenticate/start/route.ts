import { generateAuthenticationOptions } from "@simplewebauthn/server";
import { cookies } from "next/headers";
import { getRpConfig } from "@/lib/webauthn/rp";

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
    sameSite: "strict",
    path: "/",
    maxAge: 300,
  });

  return Response.json(options);
}
