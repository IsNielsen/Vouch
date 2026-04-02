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
  const { data: keys, error: fetchError } = await admin
    .from("api_keys")
    .select("id, name, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (fetchError) return Response.json({ error: fetchError.message }, { status: 500 });
  return Response.json({ keys: keys ?? [] });
}

export async function POST(req: Request) {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();
  if (error || !data?.claims) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = data.claims.sub;

  let name = "Default";
  try {
    const body = await req.json();
    if (typeof body.name === "string" && body.name.trim()) name = body.name.trim();
  } catch { /* name stays default */ }

  // Generate raw key: vouch_sk_ + 32 random bytes hex
  const randomBytes = crypto.getRandomValues(new Uint8Array(32));
  const rawKey = "vouch_sk_" + Buffer.from(randomBytes).toString("hex");

  const hashBuffer = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(rawKey)
  );
  const keyHash = Buffer.from(hashBuffer).toString("hex");

  const admin = createAdminClient();
  const { error: insertError } = await admin.from("api_keys").insert({
    user_id: userId,
    name,
    key_hash: keyHash,
  });

  if (insertError) return Response.json({ error: insertError.message }, { status: 500 });

  // Return raw key once — never stored
  return Response.json({ key: rawKey, name });
}
