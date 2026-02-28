import { verifyAuthenticationResponse } from "@simplewebauthn/server";
import { isoBase64URL } from "@simplewebauthn/server/helpers";
import { cookies } from "next/headers";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { getRpConfig } from "@/lib/webauthn/rp";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  const { sessionId } = await params;

  const cookieStore = await cookies();
  const raw = cookieStore.get(`sign_challenge_${sessionId}`)?.value;
  if (!raw) return Response.json({ error: "No challenge" }, { status: 400 });
  cookieStore.delete(`sign_challenge_${sessionId}`);

  const { challenge, documentHash, userId } = JSON.parse(raw);

  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  if (!data?.claims || data.claims.sub !== userId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { rpID, origin } = getRpConfig(req);
  const admin = createAdminClient();

  const { data: passkey } = await admin
    .from("passkeys")
    .select("*")
    .eq("id", body.id)
    .eq("user_id", userId)
    .single();

  if (!passkey) return Response.json({ error: "Passkey not found" }, { status: 404 });

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

  await admin
    .from("passkeys")
    .update({
      counter: verification.authenticationInfo.newCounter,
      last_used_at: new Date().toISOString(),
    })
    .eq("id", passkey.id);

  await admin.from("signatures").insert({
    session_id: sessionId,
    signer_id: userId,
    document_hash: documentHash,
    credential_id: passkey.id,
    authenticator_data: body.response.authenticatorData as string,
  });

  await admin
    .from("document_sessions")
    .update({ status: "signed" })
    .eq("id", sessionId);

  return Response.json({ success: true });
}
