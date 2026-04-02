import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

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
