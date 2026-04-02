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
    return Response.json({
      this_month: { total: 0, verified: 0, failed: 0, pending: 0 },
      failed_reasons: [],
    });
  }

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

  const { data: challenges, error: fetchError } = await admin
    .from("vouch_challenges")
    .select("status, failure_reason")
    .in("api_key_hash", hashes)
    .gte("created_at", monthStart);

  if (fetchError) return Response.json({ error: fetchError.message }, { status: 500 });

  const all = challenges ?? [];
  const stats = {
    total: all.length,
    verified: all.filter((c: { status: string }) => c.status === "verified").length,
    failed: all.filter((c: { status: string }) => c.status === "failed").length,
    pending: all.filter((c: { status: string }) => c.status === "pending").length,
  };

  const reasonCounts: Record<string, number> = {};
  for (const c of all.filter((c: { status: string }) => c.status === "failed")) {
    const r = (c as { failure_reason?: string | null }).failure_reason ?? "Unknown";
    reasonCounts[r] = (reasonCounts[r] ?? 0) + 1;
  }
  const failed_reasons = Object.entries(reasonCounts).map(([reason, count]) => ({ reason, count }));

  return Response.json({ this_month: stats, failed_reasons });
}
