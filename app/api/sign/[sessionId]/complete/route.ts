import { ml_dsa65 } from "@noble/post-quantum/ml-dsa.js";
import { verifyAuthenticationResponse } from "@simplewebauthn/server";
import { isoBase64URL } from "@simplewebauthn/server/helpers";
import { cookies } from "next/headers";
import { createAdminClient } from "@/lib/supabase/admin";
import { getRpConfig } from "@/lib/webauthn/rp";
import { fillPdfFields } from "@/lib/pdf/fill-fields";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  const { sessionId } = await params;

  const cookieStore = await cookies();
  const raw = cookieStore.get(`sign_challenge_${sessionId}`)?.value;
  if (!raw) return Response.json({ error: "No challenge" }, { status: 400 });
  cookieStore.delete(`sign_challenge_${sessionId}`);

  const { challenge, documentHash, fileName, filePath, ip: cookieIp } = JSON.parse(raw);

  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0].trim() ??
    req.headers.get("x-real-ip") ??
    cookieIp ??
    null;

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Invalid request body" }, { status: 400 });
  }
  const signerName = typeof body.signerName === "string" ? body.signerName.trim() : "";
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { signerName: _sn, ...assertion } = body;
  const { rpID, origin } = getRpConfig(req);
  const admin = createAdminClient();

  const { data: passkey } = await admin
    .from("passkeys")
    .select("*")
    .eq("id", assertion.id)
    .single();

  if (!passkey) return Response.json({ error: "Passkey not found" }, { status: 404 });

  let verification;
  try {
    verification = await verifyAuthenticationResponse({
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      response: assertion as any,
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

  // Derive identity from passkey — null if signer has no account
  const userId = passkey.user_id ?? null;

  // Fetch document session early to get transaction_context (and reuse below)
  // SQL migration: ALTER TABLE document_sessions ADD COLUMN IF NOT EXISTS transaction_context jsonb;
  // SQL migration: ALTER TABLE signatures ADD COLUMN IF NOT EXISTS transaction_context_signature text;
  const { data: docSession } = await admin
    .from("document_sessions")
    .select("multi_signer, webhook_url, transaction_context")
    .eq("id", sessionId)
    .single();

  // Derive PQC keypair once — reused for document hash and optionally transaction_context
  // Key versioning: use PQC_SIGNING_SECRET (v2) if set, fall back to SUPABASE_SERVICE_ROLE_KEY (v1)
  const pqcSigningSecret = process.env.PQC_SIGNING_SECRET;
  const pqcKeyVersion = pqcSigningSecret ? 2 : 1;
  const hmacRoot = pqcSigningSecret ?? process.env.SUPABASE_SERVICE_ROLE_KEY!;
  const derivationPrefix = pqcSigningSecret ? "pqc-v2:" : "pqc-v1:";

  let pqcSignature: string;
  let pqcPublicKey: string;
  let pqcSecretKey!: Uint8Array;
  try {
    const hmacKey = await crypto.subtle.importKey(
      "raw",
      Buffer.from(hmacRoot),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"]
    );
    const seedBuffer = await crypto.subtle.sign(
      "HMAC",
      hmacKey,
      Buffer.from(derivationPrefix + passkey.id)
    );
    const seed = new Uint8Array(seedBuffer).slice(0, 32);

    const { secretKey, publicKey } = ml_dsa65.keygen(seed);
    pqcSecretKey = secretKey;
    const hashBytes = Buffer.from(documentHash, "hex");
    const pqcSig = ml_dsa65.sign(hashBytes, secretKey);

    pqcSignature = Buffer.from(pqcSig).toString("base64");
    pqcPublicKey = Buffer.from(publicKey).toString("base64");
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "PQC signing error";
    return Response.json({ error: msg }, { status: 500 });
  }

  // Sign transaction_context if present (additive, non-fatal)
  let transactionContextSignature: string | null = null;
  if (docSession?.transaction_context) {
    try {
      const ctxBytes = Buffer.from(JSON.stringify(docSession.transaction_context));
      const ctxHash = await crypto.subtle.digest("SHA-256", ctxBytes);
      const ctxSig = ml_dsa65.sign(new Uint8Array(ctxHash), pqcSecretKey);
      transactionContextSignature = Buffer.from(ctxSig).toString("base64");
    } catch (e) {
      console.error("[sign] transaction_context signing failed:", e);
    }
  }

  // Check for duplicate signature by credential_id (works for accountless signers too)
  const { data: existing } = await admin
    .from("signatures")
    .select("id")
    .eq("session_id", sessionId)
    .eq("credential_id", assertion.id)
    .maybeSingle();

  if (existing) return Response.json({ error: "Already signed" }, { status: 409 });

  const { error: insertError } = await admin.from("signatures").insert({
    session_id: sessionId,
    signer_id: userId,
    signer_name: signerName || null,
    document_hash: documentHash,
    credential_id: passkey.id,
    authenticator_data: (assertion.response as Record<string, unknown>).authenticatorData as string,
    pqc_signature: pqcSignature,
    pqc_public_key: pqcPublicKey,
    pqc_key_version: pqcKeyVersion,
    ip_address: ip,
    auth_method: "webauthn-passkey",
    transaction_context_signature: transactionContextSignature,
  });

  if (insertError) return Response.json({ error: insertError.message }, { status: 500 });

  // Fill PDF fields (non-fatal)
  try {
    const { data: pdfBlob } = await admin.storage.from("documents").download(filePath);
    if (pdfBlob && signerName) {
      const pdfBytes = await pdfBlob.arrayBuffer();
      const filledBytes = await fillPdfFields(pdfBytes, { signerName, signedAt: new Date() });
      const filledPath = filePath.replace(/\.pdf$/i, "_signed.pdf");
      await admin.storage.from("documents").upload(filledPath, filledBytes, {
        contentType: "application/pdf",
        upsert: true,
      });
      await admin
        .from("document_sessions")
        .update({ filled_file_path: filledPath })
        .eq("id", sessionId);
    }
  } catch {
    // non-fatal — signing already recorded
  }

  // Fire webhook (fire-and-forget, best-effort)
  if (docSession?.webhook_url) {
    fetch(docSession.webhook_url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        event: "signature.completed",
        session_id: sessionId,
        signer_name: signerName,
        document_hash: documentHash,
        signed_at: new Date().toISOString(),
        pqc_public_key: pqcPublicKey,
      }),
    }).catch(() => {});
  }

  // Update session status + log event in parallel
  await Promise.all([
    docSession?.multi_signer
      ? Promise.resolve()
      : admin.from("document_sessions").update({ status: "signed" }).eq("id", sessionId),
    admin.from("signing_events").insert({
      session_id: sessionId,
      signer_id: userId,
      event_type: "signature_applied",
      ip_address: ip,
      metadata: { credential_id: passkey.id, file_name: fileName, file_path: filePath },
    }),
  ]);

  return Response.json({ success: true });
}
