import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();
  if (error || !data?.claims) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = data.claims.sub;

  const admin = createAdminClient();

  const { data: keys } = await admin
    .from("api_keys")
    .select("key_hash")
    .eq("user_id", userId);

  const hashes = (keys ?? []).map((k: { key_hash: string }) => k.key_hash);

  if (hashes.length === 0) {
    return Response.json({ entries: [] });
  }

  const { data: entries, error: fetchError } = await admin
    .from("vouch_challenges")
    .select("id, created_at, status, failure_reason, user_id, transaction_context, device_id, ip_address, verified_at")
    .in("api_key_hash", hashes)
    .order("created_at", { ascending: false })
    .limit(200);

  if (fetchError) return Response.json({ error: fetchError.message }, { status: 500 });
  return Response.json({ entries: entries ?? [] });
}
