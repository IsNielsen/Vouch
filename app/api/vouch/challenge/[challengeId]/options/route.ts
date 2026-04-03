import { createAdminClient } from "@/lib/supabase/admin";
import { CORS_PREFLIGHT_HEADERS } from "@/lib/cors";

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: CORS_PREFLIGHT_HEADERS });
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ challengeId: string }> }
) {
  const { challengeId } = await params;
  const admin = createAdminClient();

  const { data: challenge } = await admin
    .from("vouch_challenges")
    .select("webauthn_options, status, expires_at")
    .eq("id", challengeId)
    .single();

  if (!challenge || !challenge.webauthn_options) {
    return Response.json({ error: "Challenge not found" }, { status: 404, headers: CORS_PREFLIGHT_HEADERS });
  }

  if (
    (challenge as { status: string }).status !== "pending" ||
    new Date((challenge as { expires_at: string }).expires_at) < new Date()
  ) {
    return Response.json({ error: "Challenge expired or already used" }, { status: 410, headers: CORS_PREFLIGHT_HEADERS });
  }

  return Response.json(challenge.webauthn_options, { headers: CORS_PREFLIGHT_HEADERS });
}
