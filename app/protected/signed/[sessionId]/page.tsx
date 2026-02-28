import { notFound, redirect } from "next/navigation";
import { Suspense } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { DownloadButton } from "../download-button";
import { InlineQR } from "../inline-qr";
import { CheckCircle, Clock, ArrowLeft } from "lucide-react";

type Signature = {
  id: string;
  signer_id: string;
  signed_at: string;
  ip_address: string | null;
  auth_method: string | null;
};

async function DocumentDetail({ params }: { params: Promise<{ sessionId: string }> }) {
  const { sessionId } = await params;
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();
  if (error || !data?.claims) redirect("/auth/login");
  const userId = data.claims.sub;

  const admin = createAdminClient();

  const { data: session } = await admin
    .from("document_sessions")
    .select("id, file_name, file_path, status, created_at, owner_id, multi_signer")
    .eq("id", sessionId)
    .single();

  if (!session) notFound();

  const { data: signatures } = await admin
    .from("signatures")
    .select("id, signer_id, signed_at, ip_address, auth_method")
    .eq("session_id", sessionId)
    .order("signed_at", { ascending: true });

  const sigs = (signatures ?? []) as Signature[];
  const isOwner = session.owner_id === userId;
  const isSigner = sigs.some((s) => s.signer_id === userId);

  if (!isOwner && !isSigner) notFound();

  // Fetch signer emails
  const signerIds = [...new Set(sigs.map((s) => s.signer_id))];
  const signerEmails: Record<string, string> = {};
  await Promise.all(
    signerIds.map(async (id) => {
      const { data: u } = await admin.auth.admin.getUserById(id);
      if (u.user) signerEmails[id] = u.user.email ?? id;
    })
  );

  const { data: signed } = await admin.storage.from("documents").createSignedUrl(session.file_path, 3600);
  const pdfUrl = signed?.signedUrl ?? null;

  const isSigned = session.status === "signed";

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-3">
        <Link href="/protected/signed" className="text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div className="min-w-0">
          <h1 className="font-bold text-xl truncate">{session.file_name}</h1>
          <p className="text-sm text-muted-foreground">
            {new Date(session.created_at).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })}
          </p>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* PDF Preview */}
        <div className="flex-1 min-h-[500px] border rounded-lg overflow-hidden bg-muted">
          {pdfUrl ? (
            <iframe src={pdfUrl} className="w-full h-full min-h-[500px]" title={session.file_name} />
          ) : (
            <div className="flex items-center justify-center h-full min-h-[500px] text-muted-foreground text-sm">
              Preview unavailable
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="lg:w-72 flex flex-col gap-4">
          {/* Status */}
          <div className="border rounded-lg p-4 flex flex-col gap-3">
            <h2 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground">Status</h2>
            <div className="flex items-center gap-2">
              {isSigned ? (
                <>
                  <CheckCircle className="h-4 w-4 text-green-500 shrink-0" />
                  <span className="text-sm font-medium">Signed</span>
                </>
              ) : (
                <>
                  <Clock className="h-4 w-4 text-amber-500 shrink-0" />
                  <span className="text-sm font-medium">Awaiting signatures</span>
                </>
              )}
            </div>
          </div>

          {/* Signatures */}
          <div className="border rounded-lg p-4 flex flex-col gap-3">
            <h2 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground">
              Signatures {sigs.length > 0 && `(${sigs.length})`}
            </h2>
            {sigs.length === 0 ? (
              <p className="text-sm text-muted-foreground">No signatures yet.</p>
            ) : (
              <div className="flex flex-col gap-3">
                {sigs.map((sig) => (
                  <div key={sig.id} className="flex flex-col gap-0.5">
                    <div className="flex items-center gap-1.5">
                      <CheckCircle className="h-3.5 w-3.5 text-green-500 shrink-0" />
                      <span className="text-sm font-medium truncate">{signerEmails[sig.signer_id] ?? sig.signer_id}</span>
                    </div>
                    <p className="text-xs text-muted-foreground pl-5">
                      {new Date(sig.signed_at).toLocaleString("en-US", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                    {sig.auth_method && (
                      <p className="text-xs text-muted-foreground pl-5">{sig.auth_method}</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* QR Code for signing */}
          {isOwner && (!isSigned || session.multi_signer) && (
            <InlineQR sessionId={sessionId} />
          )}

          {/* Download */}
          {pdfUrl && (
            <DownloadButton url={pdfUrl} fileName={session.file_name} />
          )}
        </div>
      </div>
    </div>
  );
}

export default function DocumentDetailPage({ params }: { params: Promise<{ sessionId: string }> }) {
  return (
    <div className="flex-1 w-full flex flex-col gap-6">
      <Suspense fallback={<p className="text-sm text-muted-foreground">Loading…</p>}>
        <DocumentDetail params={params} />
      </Suspense>
    </div>
  );
}
