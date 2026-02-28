import { ml_dsa65 } from "@noble/post-quantum/ml-dsa.js";
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

  const { challenge, documentHash, userId, fileName, filePath, ip: cookieIp } = JSON.parse(raw);

  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  if (!data?.claims || data.claims.sub !== userId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0].trim() ??
    req.headers.get("x-real-ip") ??
    cookieIp ??
    null;

  let body;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Invalid request body" }, { status: 400 });
  }
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

  let pqcSignature: string;
  let pqcPublicKey: string;
  try {
    const hmacKey = await crypto.subtle.importKey(
      "raw",
      Buffer.from(process.env.SUPABASE_SERVICE_ROLE_KEY!),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"]
    );
    const seedBuffer = await crypto.subtle.sign(
      "HMAC",
      hmacKey,
      Buffer.from("pqc-v1:" + passkey.id)
    );
    const seed = new Uint8Array(seedBuffer).slice(0, 32);

    const { secretKey, publicKey } = ml_dsa65.keygen(seed);
    const hashBytes = Buffer.from(documentHash, "hex");
    const pqcSig = ml_dsa65.sign(hashBytes, secretKey);

    pqcSignature = Buffer.from(pqcSig).toString("base64");
    pqcPublicKey = Buffer.from(publicKey).toString("base64");
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "PQC signing error";
    return Response.json({ error: msg }, { status: 500 });
  }

  const { error: insertError } = await admin.from("signatures").insert({
    session_id: sessionId,
    signer_id: userId,
    document_hash: documentHash,
    credential_id: passkey.id,
    authenticator_data: body.response.authenticatorData as string,
    pqc_signature: pqcSignature,
    pqc_public_key: pqcPublicKey,
    ip_address: ip,
    auth_method: "webauthn-passkey",
  });

  if (insertError) return Response.json({ error: insertError.message }, { status: 500 });

  await admin
    .from("document_sessions")
    .update({ status: "signed" })
    .eq("id", sessionId);

  // Log signature_applied event
  await admin.from("signing_events").insert({
    session_id: sessionId,
    signer_id: userId,
    event_type: "signature_applied",
    ip_address: ip,
    metadata: { credential_id: passkey.id, file_name: fileName, file_path: filePath },
  });

  return Response.json({ success: true });
}
