import { createAdminClient } from "@/lib/supabase/admin";
import { generateCertificate } from "@/lib/pdf/certificate";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  const { sessionId } = await params;
  const type = new URL(req.url).searchParams.get("type");
  const admin = createAdminClient();

  const { data: session } = await admin
    .from("document_sessions")
    .select("file_path, file_name, filled_file_path")
    .eq("id", sessionId)
    .single();

  if (!session) return new Response("Not found", { status: 404 });

  const pathToDownload =
    type !== "certificate"
      ? (session.filled_file_path ?? session.file_path)
      : session.file_path;

  const { data: pdfBlob, error: downloadError } = await admin.storage
    .from("documents")
    .download(pathToDownload);

  if (downloadError || !pdfBlob) {
    return new Response("Failed to fetch document", { status: 500 });
  }

  const safeName = session.file_name.replace(/[^a-zA-Z0-9._-]/g, "_");
  const baseName = safeName.endsWith(".pdf") ? safeName.slice(0, -4) : safeName;

  if (type !== "certificate") {
    return new Response(pdfBlob, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${safeName}"`,
      },
    });
  }

  // Build certificate
  const { data: signatures } = await admin
    .from("signatures")
    .select("signer_id, signer_email, signed_at, credential_id, document_hash")
    .eq("session_id", sessionId)
    .order("signed_at", { ascending: true });

  const sigs = signatures ?? [];

  const signers = await Promise.all(
    sigs.map(async (sig) => {
      let email = sig.signer_email as string | null;
      if (!email) {
        const { data: u } = await admin.auth.admin.getUserById(sig.signer_id);
        email = u.user?.email ?? null;
      }
      return {
        email: email ?? sig.signer_id,
        signedAt: sig.signed_at,
        credentialId: sig.credential_id,
      };
    })
  );

  const documentHash = sigs[0]?.document_hash ?? "";
  const origin = new URL(req.url).origin;
  const verifyUrl = `${origin}/verify/${sessionId}`;

  const certBytes = await generateCertificate({
    fileName: session.file_name,
    documentHash,
    sessionId,
    signers,
    verifyUrl,
  });

  return new Response(Buffer.from(certBytes), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${baseName}_certificate.pdf"`,
    },
  });
}
