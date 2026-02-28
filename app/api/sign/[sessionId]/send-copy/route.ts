import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  const { sessionId } = await params;

  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  if (!data?.claims) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const userId = data.claims.sub;

  let email: string;
  try {
    ({ email } = await req.json());
  } catch {
    return Response.json({ error: "Invalid body" }, { status: 400 });
  }
  if (!email) return Response.json({ error: "Email required" }, { status: 400 });

  const admin = createAdminClient();

  const { error } = await admin
    .from("signatures")
    .update({ signer_email: email })
    .eq("session_id", sessionId)
    .eq("signer_id", userId);

  if (error) return Response.json({ error: "Not found" }, { status: 404 });

  return new Response(null, { status: 204 });
}
