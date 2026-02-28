import { notFound } from "next/navigation";
import { Suspense } from "react";
import { ml_dsa65 } from "@noble/post-quantum/ml-dsa.js";
import { createAdminClient } from "@/lib/supabase/admin";
import { VerifyDocument } from "@/components/verify-document";

type RawSignature = {
  id: string;
  signer_id: string;
  document_hash: string;
  pqc_signature: string | null;
  pqc_public_key: string | null;
  signed_at: string;
  ip_address: string | null;
  auth_method: string | null;
  credential_id: string;
  authenticator_data: string | null;
};

export type VerifiedSignature = RawSignature & {
  signerEmail: string;
  pqcVerified: boolean;
};

async function VerifyContent({
  params,
}: {
  params: Promise<{ sessionId: string }>;
}) {
  const { sessionId } = await params;
  const admin = createAdminClient();

  const { data: session } = await admin
    .from("document_sessions")
    .select("id, file_name, file_path, status, created_at")
    .eq("id", sessionId)
    .single();

  if (!session) notFound();

  const { data: signatures } = await admin
    .from("signatures")
    .select(
      "id, signer_id, document_hash, pqc_signature, pqc_public_key, signed_at, ip_address, auth_method, credential_id, authenticator_data"
    )
    .eq("session_id", sessionId)
    .order("signed_at", { ascending: true });

  const sigs = (signatures ?? []) as RawSignature[];

  // Fetch signer emails via admin auth
  const signerIds = [...new Set(sigs.map((s) => s.signer_id))];
  const signerEmails: Record<string, string> = {};
  await Promise.all(
    signerIds.map(async (id) => {
      const { data: u } = await admin.auth.admin.getUserById(id);
      if (u.user) signerEmails[id] = u.user.email ?? id;
    })
  );

  // PQC verify each signature
  const verifiedSigs: VerifiedSignature[] = sigs.map((sig) => {
    let pqcVerified = false;
    if (sig.pqc_public_key && sig.pqc_signature && sig.document_hash) {
      try {
        pqcVerified = ml_dsa65.verify(
          Buffer.from(sig.pqc_public_key, "base64"),
          Buffer.from(sig.document_hash, "hex"),
          Buffer.from(sig.pqc_signature, "base64")
        );
      } catch {
        pqcVerified = false;
      }
    }
    return { ...sig, signerEmail: signerEmails[sig.signer_id] ?? sig.signer_id, pqcVerified };
  });

  const { data: signed } = await admin.storage
    .from("documents")
    .createSignedUrl(session.file_path, 3600);
  const pdfUrl = signed?.signedUrl ?? null;

  return (
    <VerifyDocument
      session={{
        id: session.id,
        file_name: session.file_name,
        created_at: session.created_at,
        status: session.status,
      }}
      signatures={verifiedSigs}
      pdfUrl={pdfUrl}
    />
  );
}

export default function VerifyPage({
  params,
}: {
  params: Promise<{ sessionId: string }>;
}) {
  return (
    <main className="min-h-screen flex flex-col">
      <div className="flex-1 w-full max-w-5xl mx-auto px-4 py-8 flex flex-col gap-6">
        <Suspense fallback={<p className="text-sm text-muted-foreground">Loading…</p>}>
          <VerifyContent params={params} />
        </Suspense>
      </div>
    </main>
  );
}
