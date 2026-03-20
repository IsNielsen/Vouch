import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ challengeId: string }> }
) {
  const auth = req.headers.get("authorization") ?? "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : "";
  if (token !== process.env.VOUCH_API_KEY) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { challengeId } = await params;
  const admin = createAdminClient();

  const { data } = await admin
    .from("vouch_challenges")
    .select("id, created_at, expires_at, status, transaction_context, credential_id, pqc_signature, pqc_public_key")
    .eq("id", challengeId)
    .single();

  if (!data) {
    return Response.json({ error: "Challenge not found" }, { status: 404 });
  }

  return Response.json(data);
}
