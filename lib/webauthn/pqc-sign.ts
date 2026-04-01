import { ml_dsa65 } from "@noble/post-quantum/ml-dsa.js";

export async function pqcSign(
  credentialId: string,
  transactionContext: unknown
): Promise<{ pqcSignature: string; pqcPublicKey: string; pqcKeyVersion: number }> {
  const pqcSigningSecret = process.env.PQC_SIGNING_SECRET;
  const pqcKeyVersion = pqcSigningSecret ? 2 : 1;
  const hmacRoot = pqcSigningSecret ?? process.env.SUPABASE_SERVICE_ROLE_KEY!;
  const derivationPrefix = pqcSigningSecret ? "pqc-v2:" : "pqc-v1:";

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
    Buffer.from(derivationPrefix + credentialId)
  );
  const seed = new Uint8Array(seedBuffer).slice(0, 32);
  const { secretKey, publicKey } = ml_dsa65.keygen(seed);

  const contextBytes = Buffer.from(JSON.stringify(transactionContext ?? {}));
  const hashBuffer = await crypto.subtle.digest("SHA-256", contextBytes);
  const hashBytes = new Uint8Array(hashBuffer);
  const pqcSig = ml_dsa65.sign(hashBytes, secretKey);

  return {
    pqcSignature: Buffer.from(pqcSig).toString("base64"),
    pqcPublicKey: Buffer.from(publicKey).toString("base64"),
    pqcKeyVersion,
  };
}
