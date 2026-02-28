import { createAdminClient } from "@/lib/supabase/admin";
import { appendCertificatePage } from "@/lib/pdf/certificate";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  const { sessionId } = await params;
  const admin = createAdminClient();

  const { data: session } = await admin
    .from("document_sessions")
    .select("file_path, file_name")
    .eq("id", sessionId)
    .single();

  if (!session) return new Response("Not found", { status: 404 });

  const { data: signatures } = await admin
    .from("signatures")
    .select("signer_id, signed_at, credential_id, document_hash")
    .eq("session_id", sessionId)
    .order("signed_at", { ascending: true });

  const sigs = signatures ?? [];

  const signers = await Promise.all(
    sigs.map(async (sig) => {
      const { data: u } = await admin.auth.admin.getUserById(sig.signer_id);
      return {
        email: u.user?.email ?? sig.signer_id,
        signedAt: sig.signed_at,
        credentialId: sig.credential_id,
      };
    })
  );

  const { data: pdfBlob, error: downloadError } = await admin.storage
    .from("documents")
    .download(session.file_path);

  if (downloadError || !pdfBlob) {
    return new Response("Failed to fetch document", { status: 500 });
  }

  const pdfBytes = await pdfBlob.arrayBuffer();
  const documentHash = sigs[0]?.document_hash ?? "";
  const origin = new URL(req.url).origin;
  const verifyUrl = `${origin}/verify/${sessionId}`;

  const resultBytes = await appendCertificatePage(pdfBytes, {
    fileName: session.file_name,
    documentHash,
    sessionId,
    signers,
    verifyUrl,
  });

  const safeName = session.file_name.replace(/[^a-zA-Z0-9._-]/g, "_");
  const baseName = safeName.endsWith(".pdf") ? safeName.slice(0, -4) : safeName;
  const downloadName = `${baseName}_signed.pdf`;

  return new Response(Buffer.from(resultBytes), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${downloadName}"`,
    },
  });
}
