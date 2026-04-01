import { checkRateLimit } from "@/lib/rate-limit";

// Stable fake keys for the demo receipt
const FAKE_PQC_PUBLIC_KEY =
  "pqc_pub_MLDSADemo1234567890abcdef" + "0".repeat(64);
const FAKE_PQC_SIGNATURE =
  "pqc_sig_MLDSADemo" + "a1b2c3d4e5f6".repeat(8);

export async function POST(
  req: Request,
  { params }: { params: Promise<{ challengeId: string }> }
) {
  const { challengeId } = await params;
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0].trim() ?? "unknown";

  if (!(await checkRateLimit(ip))) {
    return Response.json(
      { error: "Rate limit exceeded. Try again in a minute." },
      { status: 429 }
    );
  }

  // Return a fake PQC-signed receipt
  return Response.json({
    challenge_id: challengeId,
    verified_at: new Date().toISOString(),
    pqc_public_key: FAKE_PQC_PUBLIC_KEY,
    pqc_signature: FAKE_PQC_SIGNATURE,
    algorithm: "ML-DSA-65 (FIPS 204) — demo",
    transaction_verified: true,
  });
}
