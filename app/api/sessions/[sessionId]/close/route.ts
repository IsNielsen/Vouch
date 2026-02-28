import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  const { sessionId } = await params;

  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  if (!data?.claims) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const userId = data.claims.sub;
  const admin = createAdminClient();

  const { data: session } = await admin
    .from("document_sessions")
    .select("owner_id")
    .eq("id", sessionId)
    .single();

  if (!session) return Response.json({ error: "Not found" }, { status: 404 });
  if (session.owner_id !== userId) return Response.json({ error: "Forbidden" }, { status: 403 });

  await admin
    .from("document_sessions")
    .update({ status: "signed" })
    .eq("id", sessionId);

  return Response.json({ success: true });
}
