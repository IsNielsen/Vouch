import { verifyAuthenticationResponse } from "@simplewebauthn/server";
import { isoBase64URL } from "@simplewebauthn/server/helpers";
import { cookies } from "next/headers";
import { createAdminClient } from "@/lib/supabase/admin";
import { getRpConfig } from "@/lib/webauthn/rp";
import { CORS_PREFLIGHT_HEADERS } from "@/lib/cors";

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: CORS_PREFLIGHT_HEADERS });
}

export async function POST(req: Request) {
  const cookieStore = await cookies();
  const challenge = cookieStore.get("webauthn_challenge")?.value;
  if (!challenge) return Response.json({ error: "No challenge" }, { status: 400 });

  cookieStore.delete("webauthn_challenge");

  const body = await req.json();
  const { rpID, origin } = getRpConfig(req);
  const admin = createAdminClient();

  // Lookup passkey by credential ID
  const { data: passkey, error: pkError } = await admin
    .from("passkeys")
    .select("*")
    .eq("id", body.id)
    .single();

  if (pkError || !passkey) {
    return Response.json({ error: "Passkey not found" }, { status: 404 });
  }

  let verification;
  try {
    verification = await verifyAuthenticationResponse({
      response: body,
      expectedChallenge: challenge,
      expectedOrigin: origin,
      expectedRPID: rpID,
      requireUserVerification: true,
      credential: {
        id: passkey.id,
        publicKey: isoBase64URL.toBuffer(passkey.public_key),
        counter: passkey.counter,
        transports: passkey.transports ?? undefined,
      },
    });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Verification error";
    return Response.json({ error: msg }, { status: 400 });
  }

  if (!verification.verified) {
    return Response.json({ error: "Verification failed" }, { status: 400 });
  }

  // Update counter and last_used_at
  await admin
    .from("passkeys")
    .update({
      counter: verification.authenticationInfo.newCounter,
      last_used_at: new Date().toISOString(),
    })
    .eq("id", passkey.id);

  // Accountless passkeys (signers) have no user_id — not an error, just no session to issue
  if (!passkey.user_id) {
    return Response.json({ error: "No account linked to this passkey" }, { status: 404 });
  }

  // Get the user's email to generate a magic link; derive one for anonymous users
  const { data: userData } = await admin.auth.admin.getUserById(passkey.user_id);
  const email = userData.user?.email ?? `uid-${passkey.user_id}@vouch.internal`;

  if (!userData.user?.email) {
    await admin.auth.admin.updateUserById(passkey.user_id, { email, email_confirm: true });
  }

  const { data: linkData, error: linkError } = await admin.auth.admin.generateLink({
    type: "magiclink",
    email,
  });

  if (linkError || !linkData.properties?.hashed_token) {
    return Response.json({ error: linkError?.message ?? "Link generation failed" }, { status: 500 });
  }

  return Response.json({ token_hash: linkData.properties.hashed_token });
}
