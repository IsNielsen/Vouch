import { createAdminClient } from "@/lib/supabase/admin";
import { verifyApiKey } from "@/lib/api-auth";
import { withCors, CORS_PREFLIGHT_HEADERS } from "@/lib/cors";

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: CORS_PREFLIGHT_HEADERS });
}

export async function GET(
  req: Request,
  { params }: { params: Promise<{ challengeId: string }> }
) {
  const requestOrigin = req.headers.get("origin");
  const apiAuth = await verifyApiKey(req);
  if (!apiAuth) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  const cors = (res: Response) => withCors(res, requestOrigin, apiAuth.allowedOrigins);

  const { challengeId } = await params;
  const admin = createAdminClient();

  const { data } = await admin
    .from("vouch_challenges")
    .select("id, created_at, expires_at, status, transaction_context, user_id, verified_at, credential_id, device_id, pqc_signature, pqc_public_key")
    .eq("id", challengeId)
    .single();

  if (!data) {
    return cors(Response.json({ error: "Challenge not found" }, { status: 404 }));
  }

  return cors(Response.json(data));
}
