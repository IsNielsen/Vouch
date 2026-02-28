import { Suspense } from "react";
import { notFound } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { PasskeyAuth } from "@/components/passkey-auth";
import { PdfViewerClient } from "./pdf-viewer-client";
import { SignButton } from "./sign-button";

async function SignContent({
  params,
}: {
  params: Promise<{ sessionId: string }>;
}) {
  const { sessionId } = await params;
  const admin = createAdminClient();

  const { data: session } = await admin
    .from("document_sessions")
    .select("id, file_name, file_path, status")
    .eq("id", sessionId)
    .single();

  if (!session) notFound();

  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();
  const isAuthed = !!claims;

  let pdfUrl: string | null = null;
  let alreadySigned = false;

  if (isAuthed) {
    const userId = claims!.claims.sub;
    const [{ data: signedUrl }, { data: existingSig }] = await Promise.all([
      admin.storage.from("documents").createSignedUrl(session.file_path, 3600),
      admin.from("signatures").select("id").eq("session_id", sessionId).eq("signer_id", userId).maybeSingle(),
    ]);
    pdfUrl = signedUrl?.signedUrl ?? null;
    alreadySigned = !!existingSig;
  }

  if (!isAuthed) {
    return (
      <div className="flex min-h-svh flex-col items-center justify-center p-6">
        <div className="flex flex-col items-center gap-4 py-12 border rounded-lg w-full max-w-sm">
          <p className="text-muted-foreground text-sm">
            Sign in to view and sign this document.
          </p>
          <PasskeyAuth redirectTo={`/sign/${sessionId}`} />
        </div>
      </div>
    );
  }

  if (session.status === "signed") {
    return (
      <div className="flex min-h-svh flex-col items-center justify-center p-6">
        <div className="flex flex-col items-center gap-4 py-12 border rounded-lg w-full max-w-sm">
          <p className="font-medium">Signing is closed</p>
          <p className="text-muted-foreground text-sm text-center">
            This document is no longer accepting signatures.
          </p>
        </div>
      </div>
    );
  }

  if (alreadySigned) {
    return (
      <div className="flex min-h-svh flex-col items-center justify-center p-6">
        <div className="flex flex-col items-center gap-4 py-12 border rounded-lg w-full max-w-sm">
          <p className="font-medium">Already signed</p>
          <p className="text-muted-foreground text-sm text-center">
            You have already signed this document.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-svh">
      <div className="flex-1 overflow-hidden p-4 pb-0">
        {pdfUrl ? (
          <PdfViewerClient url={pdfUrl} />
        ) : (
          <div className="flex items-center justify-center h-full border rounded-lg text-muted-foreground text-sm">
            Unable to load document preview.
          </div>
        )}
      </div>
      <div className="p-4 border-t bg-background">
        <SignButton sessionId={session.id} pdfUrl={pdfUrl} fileName={session.file_name} />
      </div>
    </div>
  );
}

export default function SignPage({
  params,
}: {
  params: Promise<{ sessionId: string }>;
}) {
  return (
    <Suspense>
      <SignContent params={params} />
    </Suspense>
  );
}
