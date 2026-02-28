import { generateRegistrationOptions } from "@simplewebauthn/server";
import { cookies } from "next/headers";
import { getRpConfig } from "@/lib/webauthn/rp";

export async function POST(req: Request) {
  const { rpID, rpName } = getRpConfig(req);

  const options = await generateRegistrationOptions({
    rpName,
    rpID,
    userName: "passkey-user",
    attestationType: "none",
    authenticatorSelection: {
      residentKey: "required",
      userVerification: "required",
    },
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
