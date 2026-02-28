import { redirect } from "next/navigation";
import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { DownloadButton } from "./download-button";
import { FileText } from "lucide-react";

type SignatureRow = {
  session_id: string;
  created_at: string;
  document_sessions: { file_name: string; file_path: string } | null;
};

async function SignedDocuments({ userId }: { userId: string }) {
  const admin = createAdminClient();

  const { data: signatures } = await admin
    .from("signatures")
    .select("session_id, created_at, document_sessions (file_name, file_path)")
    .eq("signer_id", userId)
    .order("created_at", { ascending: false });

  const rows = (signatures ?? []) as SignatureRow[];

  if (!rows.length) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-3 text-muted-foreground">
        <FileText className="h-10 w-10" />
        <p className="text-sm">No signed documents yet.</p>
      </div>
    );
  }

  const docs = await Promise.all(
    rows.map(async (sig) => {
      const ds = sig.document_sessions;
      if (!ds) return null;
      const { data: signed } = await admin.storage
        .from("documents")
        .createSignedUrl(ds.file_path, 3600);
      return {
        sessionId: sig.session_id,
        fileName: ds.file_name,
        signedAt: sig.created_at,
        pdfUrl: signed?.signedUrl ?? null,
      };
    })
  );

  return (
    <div className="flex flex-col gap-3">
      {docs.map((doc) =>
        doc ? (
          <div
            key={doc.sessionId}
            className="flex items-center justify-between border rounded-lg p-4"
          >
            <div className="min-w-0">
              <p className="font-medium truncate">{doc.fileName}</p>
              <p className="text-sm text-muted-foreground">
                {new Date(doc.signedAt).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                })}
              </p>
            </div>
            {doc.pdfUrl && (
              <DownloadButton url={doc.pdfUrl} fileName={doc.fileName} />
            )}
          </div>
        ) : null
      )}
    </div>
  );
}

export default async function SignedPage() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();
  if (error || !data?.claims) redirect("/auth/login");

  return (
    <div className="flex-1 w-full flex flex-col gap-8">
      <div>
        <h1 className="font-bold text-2xl">Signed Documents</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Documents you have signed with your passkey.
        </p>
      </div>
      <Suspense fallback={<p className="text-sm text-muted-foreground">Loading…</p>}>
        <SignedDocuments userId={data.claims.sub} />
      </Suspense>
    </div>
  );
}
