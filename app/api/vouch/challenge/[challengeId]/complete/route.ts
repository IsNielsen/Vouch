import { verifyAuthenticationResponse } from "@simplewebauthn/server";
import { isoBase64URL } from "@simplewebauthn/server/helpers";
import { createAdminClient } from "@/lib/supabase/admin";
import { getRpConfig } from "@/lib/webauthn/rp";
import { pqcSign } from "@/lib/webauthn/pqc-sign";
import { recordVerifiedUsage } from "@/lib/billing";
import { CORS_PREFLIGHT_HEADERS } from "@/lib/cors";

const cors = (res: Response) => {
  const headers = new Headers(res.headers);
  headers.set("Access-Control-Allow-Origin", "*");
  return new Response(res.body, { status: res.status, headers });
};

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: CORS_PREFLIGHT_HEADERS });
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ challengeId: string }> }
) {
  const { challengeId } = await params;

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return cors(Response.json({ error: "Invalid request body" }, { status: 400 }));
  }

  const admin = createAdminClient();

  const markFailed = (reason: string) =>
    admin.from("vouch_challenges").update({ status: "failed", failure_reason: reason }).eq("id", challengeId);

  const { data: challenge } = await admin
    .from("vouch_challenges")
    .select("*")
    .eq("id", challengeId)
    .single();

  if (!challenge) {
    return cors(Response.json({ error: "Challenge not found" }, { status: 404 }));
  }

  if (
    (challenge as { status: string }).status !== "pending" ||
    new Date((challenge as { expires_at: string }).expires_at) < new Date()
  ) {
    return cors(Response.json({ error: "Challenge expired or already used" }, { status: 410 }));
  }

  const assertion = body.assertion as Record<string, unknown>;
  if (!assertion || typeof assertion.id !== "string") {
    return cors(Response.json({ error: "Missing assertion" }, { status: 400 }));
  }

  const { rpID, origin } = getRpConfig(req);

  const { data: passkey } = await admin
    .from("passkeys")
    .select("*")
    .eq("id", assertion.id)
    .single();

  if (!passkey) {
    await markFailed("Passkey not registered");
    return cors(Response.json({ error: "Passkey not found" }, { status: 404 }));
  }

  let verification;
  try {
    verification = await verifyAuthenticationResponse({
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      response: assertion as any,
      expectedChallenge: (challenge as { webauthn_challenge: string }).webauthn_challenge,
      expectedOrigin: origin,
      expectedRPID: rpID,
      requireUserVerification: true,
      credential: {
        id: (passkey as { id: string }).id,
        publicKey: isoBase64URL.toBuffer((passkey as { public_key: string }).public_key),
        counter: (passkey as { counter: number }).counter,
        transports: (passkey as { transports?: import("@simplewebauthn/server").AuthenticatorTransportFuture[] }).transports ?? undefined,
      },
    });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Verification error";
    await markFailed(msg);
    return cors(Response.json({ error: msg }, { status: 400 }));
  }

  if (!verification.verified) {
    await markFailed("WebAuthn assertion rejected");
    return cors(Response.json({ error: "Verification failed" }, { status: 400 }));
  }

  await admin
    .from("passkeys")
    .update({
      counter: verification.authenticationInfo.newCounter,
      last_used_at: new Date().toISOString(),
    })
    .eq("id", (passkey as { id: string }).id);

  const transactionContext = (challenge as { transaction_context: unknown }).transaction_context;

  let pqcSignature: string;
  let pqcPublicKey: string;
  let pqcKeyVersion: number;
  try {
    ({ pqcSignature, pqcPublicKey, pqcKeyVersion } = await pqcSign(
      (passkey as { id: string }).id,
      transactionContext
    ));
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "PQC signing error";
    return cors(Response.json({ error: msg }, { status: 500 }));
  }

  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0].trim() ??
    req.headers.get("x-real-ip") ??
    null;

  const verifiedAt = new Date().toISOString();

  const { error: updateError } = await admin
    .from("vouch_challenges")
    .update({
      status: "verified",
      verified_at: verifiedAt,
      credential_id: (passkey as { id: string }).id,
      pqc_signature: pqcSignature,
      pqc_public_key: pqcPublicKey,
      pqc_key_version: pqcKeyVersion,
      authenticator_data: ((assertion.response as Record<string, unknown>)?.authenticatorData as string) ?? null,
      ip_address: ip,
    })
    .eq("id", challengeId);

  if (updateError) {
    return cors(Response.json({ error: updateError.message }, { status: 500 }));
  }

  // Billing: look up the API key owner from the challenge's api_key_hash
  const apiKeyHash = (challenge as { api_key_hash?: string | null }).api_key_hash;
  if (apiKeyHash) {
    const { data: apiKey } = await admin
      .from("api_keys")
      .select("user_id")
      .eq("key_hash", apiKeyHash)
      .single();
    if (apiKey?.user_id) {
      recordVerifiedUsage({ challengeId, userId: apiKey.user_id, verifiedAt })
        .catch(error => console.error("Failed to record Stripe usage", error));
    }
  }

  const webhookUrl = (challenge as { webhook_url?: string | null }).webhook_url;
  if (webhookUrl) {
    const isSafeWebhookUrl = (() => {
      try {
        const u = new URL(webhookUrl);
        if (u.protocol !== "https:") return false;
        const host = u.hostname.toLowerCase();
        if (host === "localhost" || host === "169.254.169.254") return false;
        if (/^127\./.test(host)) return false;
        if (/^10\./.test(host)) return false;
        if (/^172\.(1[6-9]|2\d|3[01])\./.test(host)) return false;
        if (/^192\.168\./.test(host)) return false;
        if (/^::1$/.test(host) || host === "[::1]") return false;
        return true;
      } catch {
        return false;
      }
    })();
    if (isSafeWebhookUrl) {
      fetch(webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: AbortSignal.timeout(5000),
        body: JSON.stringify({
          event: "vouch.verified",
          challenge_id: challengeId,
          credential_id: (passkey as { id: string }).id,
          verified_at: verifiedAt,
          pqc_public_key: pqcPublicKey,
          transaction_context: transactionContext,
        }),
      }).catch(() => {});
    }
  }

  return cors(Response.json({
    challenge_id: challengeId,
    verified: true,
    verified_at: verifiedAt,
    credential_id: (passkey as { id: string }).id,
    device_id: (passkey as { id: string }).id,
    pqc_public_key: pqcPublicKey,
    pqc_signature: pqcSignature,
    transaction_context: transactionContext,
  }));
}
