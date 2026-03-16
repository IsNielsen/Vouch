import { createAdminClient } from "@/lib/supabase/admin";
import { verifyApiKey } from "@/lib/api-auth";

const MAX_SIZE = 20 * 1024 * 1024; // 20 MB

export async function POST(req: Request) {
  const auth = await verifyApiKey(req);
  if (!auth) return Response.json({ error: "Unauthorized" }, { status: 401 });

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Invalid request body" }, { status: 400 });
  }

  const documentUrl = typeof body.document_url === "string" ? body.document_url : null;
  const signerEmail = typeof body.signer_email === "string" ? body.signer_email : null;
  const webhookUrl = typeof body.webhook_url === "string" ? body.webhook_url : null;
  const branding = body.branding && typeof body.branding === "object" ? body.branding as Record<string, string> : null;

  if (!documentUrl) return Response.json({ error: "document_url is required" }, { status: 422 });
  if (!signerEmail) return Response.json({ error: "signer_email is required" }, { status: 422 });

  // Validate document URL and size via HEAD
  let contentLength = 0;
  try {
    const head = await fetch(documentUrl, { method: "HEAD" });
    if (!head.ok) return Response.json({ error: "Could not fetch document_url" }, { status: 422 });
    const ct = head.headers.get("content-type") ?? "";
    if (!ct.includes("pdf")) return Response.json({ error: "document_url must point to a PDF" }, { status: 422 });
    contentLength = parseInt(head.headers.get("content-length") ?? "0", 10);
    if (contentLength > MAX_SIZE) return Response.json({ error: "Document exceeds 20 MB limit" }, { status: 413 });
  } catch {
    return Response.json({ error: "Failed to validate document_url" }, { status: 422 });
  }

  // Fetch document
  let pdfBytes: ArrayBuffer;
  try {
    const res = await fetch(documentUrl);
    if (!res.ok) return Response.json({ error: "Failed to download document" }, { status: 422 });
    pdfBytes = await res.arrayBuffer();
    if (pdfBytes.byteLength > MAX_SIZE) return Response.json({ error: "Document exceeds 20 MB limit" }, { status: 413 });
  } catch {
    return Response.json({ error: "Failed to download document" }, { status: 422 });
  }

  // Derive filename from URL
  const urlPath = new URL(documentUrl).pathname;
  const rawName = urlPath.split("/").pop() ?? "document.pdf";
  const fileName = rawName.endsWith(".pdf") ? rawName : rawName + ".pdf";
  const timestamp = Date.now();
  const storagePath = `${auth.userId}/api/${timestamp}_${fileName}`;

  const admin = createAdminClient();
  const { error: uploadError } = await admin.storage
    .from("documents")
    .upload(storagePath, pdfBytes, { contentType: "application/pdf" });

  if (uploadError) return Response.json({ error: uploadError.message }, { status: 500 });

  // Compute document hash
  const hashBuffer = await crypto.subtle.digest("SHA-256", pdfBytes);
  const documentHash = Buffer.from(hashBuffer).toString("hex");

  const { data: sessionRow, error: insertError } = await admin
    .from("document_sessions")
    .insert({
      user_id: auth.userId,
      file_name: fileName,
      file_path: storagePath,
      document_hash: documentHash,
      status: "pending",
      api_key_id: auth.keyId,
      webhook_url: webhookUrl ?? null,
      branding_logo_url: branding?.logo_url ?? null,
      branding_primary_color: branding?.primary_color ?? null,
    })
    .select("id")
    .single();

  if (insertError || !sessionRow) {
    return Response.json({ error: insertError?.message ?? "Insert failed" }, { status: 500 });
  }

  const baseUrl = new URL(req.url).origin;
  return Response.json({
    session_id: sessionRow.id,
    vouch_link: `${baseUrl}/sign/${sessionRow.id}`,
    expires_at: null,
  });
}
