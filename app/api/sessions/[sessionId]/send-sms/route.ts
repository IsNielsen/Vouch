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
  const admin = createAdminClient();

  const { data: session } = await admin
    .from("document_sessions")
    .select("owner_id")
    .eq("id", sessionId)
    .single();

  if (!session) return Response.json({ error: "Not found" }, { status: 404 });
  if (session.owner_id !== userId) return Response.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const phone: string = body.phone ?? "";
  if (!phone.startsWith("+")) {
    return Response.json({ error: "Phone must be in E.164 format (e.g. +18015551234)" }, { status: 400 });
  }

  const origin =
    req.headers.get("origin") ??
    (req.headers.get("host") ? `https://${req.headers.get("host")}` : "");
  const signingUrl = `${origin}/sign/${sessionId}`;

  const surgeRes = await fetch(
    `https://api.surge.app/accounts/${process.env.SURGE_ACCOUNT_ID}/messages`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.SURGE_API_KEY}`,
      },
      body: JSON.stringify({
        body: `Sign your document here: ${signingUrl}`,
        conversation: { contact: { phone_number: phone } },
      }),
    }
  );

  if (!surgeRes.ok) {
    const text = await surgeRes.text();
    console.error("Surge error:", surgeRes.status, text);
    return Response.json({ error: "Failed to send SMS" }, { status: 502 });
  }

  return Response.json({ success: true });
}
