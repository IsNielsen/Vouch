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

  // Verify this user signed this session and get the file path
  const { data: sig } = await admin
    .from("signatures")
    .select("id")
    .eq("session_id", sessionId)
    .eq("signer_id", userId)
    .single();

  if (!sig) return Response.json({ error: "Not found" }, { status: 404 });

  const { data: session } = await admin
    .from("document_sessions")
    .select("file_path, file_name")
    .eq("id", sessionId)
    .single();

  if (!session) return Response.json({ error: "Session not found" }, { status: 404 });

  // Generate 7-day signed URL
  const { data: urlData } = await admin.storage
    .from("documents")
    .createSignedUrl(session.file_path, 60 * 60 * 24 * 7);

  if (!urlData?.signedUrl) {
    return Response.json({ error: "Could not generate download link" }, { status: 500 });
  }

  // Update signer_email on the signature row
  await admin
    .from("signatures")
    .update({ signer_email: email })
    .eq("session_id", sessionId)
    .eq("signer_id", userId);

  // Fire-and-forget email via Resend
  fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
    },
    body: JSON.stringify({
      from: process.env.RESEND_FROM ?? "Vouch <no-reply@example.com>",
      to: [email],
      subject: `Your signed copy of ${session.file_name}`,
      html: `<p>Thank you for signing <strong>${session.file_name}</strong>.</p>
<p><a href="${urlData.signedUrl}">Download your signed copy</a> (link valid for 7 days).</p>`,
    }),
  }).catch(() => {/* best-effort */});

  return new Response(null, { status: 204 });
}
