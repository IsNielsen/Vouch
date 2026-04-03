import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ keyId: string }> }
) {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();
  if (error || !data?.claims) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = data.claims.sub;
  const { keyId } = await params;

  let body: { allowed_origins?: unknown };
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!Array.isArray(body.allowed_origins)) {
    return Response.json({ error: "allowed_origins must be an array" }, { status: 400 });
  }
  if (body.allowed_origins.length > 10) {
    return Response.json({ error: "Maximum 10 allowed origins per key" }, { status: 400 });
  }
  const origins = body.allowed_origins as string[];
  for (const o of origins) {
    if (typeof o !== "string" || !o.startsWith("https://")) {
      return Response.json({ error: `Invalid origin "${o}" — must start with https://` }, { status: 400 });
    }
  }

  const admin = createAdminClient();
  const { data: updated, error: updateError } = await admin
    .from("api_keys")
    .update({ allowed_origins: origins })
    .eq("id", keyId)
    .eq("user_id", userId)
    .select("allowed_origins")
    .single();

  if (updateError || !updated) {
    return Response.json({ error: updateError?.message ?? "Not found" }, { status: updateError ? 500 : 404 });
  }
  return Response.json({ allowed_origins: updated.allowed_origins });
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ keyId: string }> }
) {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();
  if (error || !data?.claims) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = data.claims.sub;
  const { keyId } = await params;

  const admin = createAdminClient();
  const { error: deleteError } = await admin
    .from("api_keys")
    .delete()
    .eq("id", keyId)
    .eq("user_id", userId);

  if (deleteError) return Response.json({ error: deleteError.message }, { status: 500 });
  return new Response(null, { status: 204 });
}
