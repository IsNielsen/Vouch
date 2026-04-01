import { checkRateLimit } from "@/lib/rate-limit";
import { demoChallenges } from "@/lib/demo-store";

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

  const challenge = demoChallenges.get(challengeId);
  const transactionContext = challenge?.transaction_context ?? null;

  const verifiedAt = new Date().toISOString();
  const fakeKey = `pqc_pub_MLDSA_demo_${challengeId.slice(0, 8)}`;
  const fakeSig = `pqc_sig_MLDSA_demo_${challengeId.slice(0, 8)}_${Date.now()}`;

  if (challenge) {
    demoChallenges.delete(challengeId);
  }

  return Response.json({
    challenge_id: challengeId,
    transaction_verified: true,
    verified_at: verifiedAt,
    pqc_public_key: fakeKey,
    pqc_signature: fakeSig,
    transaction_context: transactionContext,
  });
}
