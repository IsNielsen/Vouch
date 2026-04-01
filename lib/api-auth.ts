import { createAdminClient } from "@/lib/supabase/admin";

export async function verifyApiKey(
  req: Request
): Promise<{ userId: string; keyId: string; keyHash: string } | null> {
  const authHeader = req.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) return null;

  const rawKey = authHeader.slice(7).trim();
  if (!rawKey) return null;

  const hashBuffer = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(rawKey)
  );
  const keyHash = Buffer.from(hashBuffer).toString("hex");

  const admin = createAdminClient();
  const { data } = await admin
    .from("api_keys")
    .select("id, user_id")
    .eq("key_hash", keyHash)
    .single();

  if (!data) return null;
  return { userId: data.user_id, keyId: data.id, keyHash };
}
