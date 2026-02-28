import { redirect } from "next/navigation";
import { Suspense } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { FileText } from "lucide-react";

type SignatureRow = {
  session_id: string;
  signed_at: string;
  document_sessions: { file_name: string } | null;
};

type SentDocRow = {
  id: string;
  file_name: string;
  created_at: string;
  status: string;
  multi_signer: boolean;
  signatures: { id: string; signer_id: string; signed_at: string }[];
};

async function SignedDocuments() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();
  if (error || !data?.claims) redirect("/auth/login");

  const admin = createAdminClient();
  const userId = data.claims.sub;

  const [{ data: signatures }, { data: sentSessions }] = await Promise.all([
    admin
      .from("signatures")
      .select("session_id, signed_at, document_sessions (file_name)")
      .eq("signer_id", userId)
      .order("signed_at", { ascending: false }),
    admin
      .from("document_sessions")
      .select("id, file_name, created_at, status, multi_signer, signatures (id, signer_id, signed_at)")
      .eq("owner_id", userId)
      .order("created_at", { ascending: false }),
  ]);

  const signatureRows = (signatures ?? []) as unknown as SignatureRow[];
  const sentRows = (sentSessions ?? []) as unknown as SentDocRow[];

  // Fetch emails for all signers of sent documents
  const signerIds = [...new Set(sentRows.flatMap((d) => d.signatures.map((s) => s.signer_id)))];
  const signerEmails: Record<string, string> = {};
  await Promise.all(
    signerIds.map(async (id) => {
      const { data: u } = await admin.auth.admin.getUserById(id);
      if (u.user) signerEmails[id] = u.user.email ?? id;
    })
  );

  const signedDocs = signatureRows.map((sig) => {
    const ds = sig.document_sessions;
    if (!ds) return null;
    return { sessionId: sig.session_id, fileName: ds.file_name, signedAt: sig.signed_at };
  });

  const sentDocs = sentRows.map((doc) => ({
    id: doc.id,
    fileName: doc.file_name,
    createdAt: doc.created_at,
    isSigned: doc.status === "signed",
    multiSigner: doc.multi_signer,
    signers: doc.signatures.map((s) => ({ email: signerEmails[s.signer_id] ?? s.signer_id, signedAt: s.signed_at })),
  }));

  return (
    <div className="flex flex-col gap-12">
      {/* Documents sent by this user */}
      <section className="flex flex-col gap-4">
        <div>
          <h2 className="font-semibold text-lg">Documents You Sent</h2>
          <p className="text-sm text-muted-foreground">Documents you uploaded for others to sign.</p>
        </div>
        {sentDocs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 gap-3 text-muted-foreground">
            <FileText className="h-8 w-8" />
            <p className="text-sm">No sent documents yet.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {sentDocs.map((doc) => (
              <div key={doc.id} className="relative border rounded-lg p-4 flex flex-col gap-3 hover:bg-accent/50 transition-colors cursor-pointer">
                <Link href={`/protected/signed/${doc.id}`} className="absolute inset-0 rounded-lg" aria-label={doc.fileName} />
                <div className="flex items-center justify-between">
                  <div className="min-w-0">
                    <p className="font-medium truncate">{doc.fileName}</p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(doc.createdAt).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })}
                    </p>
                  </div>
                </div>
                {doc.signers.length > 0 ? (
                  <div className="flex flex-col gap-1 border-t pt-3">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Signatures</p>
                    {doc.signers.map((signer, i) => (
                      <div key={i} className="flex items-center justify-between text-sm">
                        <span>{signer.email}</span>
                        <span className="text-muted-foreground">
                          {new Date(signer.signedAt).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground border-t pt-3">No signatures yet.</p>
                )}
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Documents signed by this user */}
      <section className="flex flex-col gap-4">
        <div>
          <h2 className="font-semibold text-lg">Documents You Signed</h2>
          <p className="text-sm text-muted-foreground">Documents you signed with your passkey.</p>
        </div>
        {signedDocs.filter(Boolean).length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 gap-3 text-muted-foreground">
            <FileText className="h-8 w-8" />
            <p className="text-sm">No signed documents yet.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {signedDocs.map((doc) =>
              doc ? (
                <Link
                  key={doc.sessionId}
                  href={`/protected/signed/${doc.sessionId}`}
                  className="flex items-center justify-between border rounded-lg p-4 hover:bg-accent/50 transition-colors"
                >
                  <div className="min-w-0">
                    <p className="font-medium truncate">{doc.fileName}</p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(doc.signedAt).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })}
                    </p>
                  </div>
                </Link>
              ) : null
            )}
          </div>
        )}
      </section>
    </div>
  );
}

export default function SignedPage() {
  return (
    <div className="flex-1 w-full flex flex-col gap-8">
      <div>
        <h1 className="font-bold text-2xl">Documents</h1>
        <p className="text-muted-foreground mt-1 text-sm">Track documents you&apos;ve sent and signed.</p>
      </div>
      <Suspense fallback={<p className="text-sm text-muted-foreground">Loading…</p>}>
        <SignedDocuments />
      </Suspense>
    </div>
  );
}
