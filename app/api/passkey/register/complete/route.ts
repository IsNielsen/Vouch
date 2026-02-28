import { verifyRegistrationResponse } from "@simplewebauthn/server";
import { isoBase64URL } from "@simplewebauthn/server/helpers";
import { cookies } from "next/headers";
import { createAdminClient } from "@/lib/supabase/admin";
import { getRpConfig } from "@/lib/webauthn/rp";

export async function POST(req: Request) {
  const cookieStore = await cookies();
  const challenge = cookieStore.get("webauthn_challenge")?.value;
  if (!challenge) return Response.json({ error: "No challenge" }, { status: 400 });

  cookieStore.delete("webauthn_challenge");

  const body = await req.json();
  const { rpID, origin } = getRpConfig(req);

  let verification;
  try {
    verification = await verifyRegistrationResponse({
      response: body,
      expectedChallenge: challenge,
      expectedOrigin: origin,
      expectedRPID: rpID,
      requireUserVerification: true,
    });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Verification error";
    return Response.json({ error: msg }, { status: 400 });
  }

  if (!verification.verified || !verification.registrationInfo) {
    return Response.json({ error: "Verification failed" }, { status: 400 });
  }

  const { credential, aaguid } = verification.registrationInfo;
  const admin = createAdminClient();

  // Create a new anonymous user with a deterministic internal email
  const internalEmail = `passkey-${crypto.randomUUID()}@vouch.internal`;
  const { data: userData, error: userError } = await admin.auth.admin.createUser({
    email: internalEmail,
    email_confirm: true,
  });

  if (userError || !userData.user) {
    return Response.json({ error: userError?.message ?? "User creation failed" }, { status: 500 });
  }

  const userId = userData.user.id;

  const { error: pkError } = await admin.from("passkeys").insert({
    id: credential.id,
    user_id: userId,
    public_key: isoBase64URL.fromBuffer(credential.publicKey),
    counter: credential.counter,
    aaguid,
    transports: body.response.transports ?? null,
  });

  if (pkError) {
    return Response.json({ error: pkError.message }, { status: 500 });
  }

  const { data: linkData, error: linkError } = await admin.auth.admin.generateLink({
    type: "magiclink",
    email: internalEmail,
  });

  if (linkError || !linkData.properties?.hashed_token) {
    return Response.json({ error: linkError?.message ?? "Link generation failed" }, { status: 500 });
  }

  return Response.json({ token_hash: linkData.properties.hashed_token });
}
