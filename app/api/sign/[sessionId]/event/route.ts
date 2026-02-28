import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  const { sessionId } = await params;

  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  if (!data?.claims) return new Response(null, { status: 401 });
  const userId = data.claims.sub;

  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0].trim() ??
    req.headers.get("x-real-ip") ??
    null;

  const admin = createAdminClient();
  await admin.from("signing_events").insert({
    session_id: sessionId,
    signer_id: userId,
    event_type: "document_opened",
    ip_address: ip,
  });

  return new Response(null, { status: 204 });
}
