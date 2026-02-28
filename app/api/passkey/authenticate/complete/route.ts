import { verifyAuthenticationResponse } from "@simplewebauthn/server";
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
  } catch (e: any) {
    return Response.json({ error: e.message }, { status: 400 });
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

  // Get the user's email to generate a magic link
  const { data: userData, error: userError } = await admin.auth.admin.getUserById(passkey.user_id);
  if (userError || !userData.user?.email) {
    return Response.json({ error: "User not found" }, { status: 500 });
  }

  const { data: linkData, error: linkError } = await admin.auth.admin.generateLink({
    type: "magiclink",
    email: userData.user.email,
  });

  if (linkError || !linkData.properties?.hashed_token) {
    return Response.json({ error: linkError?.message ?? "Link generation failed" }, { status: 500 });
  }

  return Response.json({ token_hash: linkData.properties.hashed_token });
}
