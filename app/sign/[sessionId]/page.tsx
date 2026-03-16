import { Suspense } from "react";
import { notFound } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
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
    .select("id, file_name, file_path, status, branding_logo_url, branding_primary_color")
    .eq("id", sessionId)
    .single();

  if (!session) notFound();

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

  const { data: signedUrl } = await admin.storage
    .from("documents")
    .createSignedUrl(session.file_path, 3600);
  const pdfUrl = signedUrl?.signedUrl ?? null;

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
        <SignButton
          sessionId={session.id}
          pdfUrl={pdfUrl}
          fileName={session.file_name}
          branding={
            session.branding_logo_url || session.branding_primary_color
              ? {
                  logoUrl: session.branding_logo_url ?? undefined,
                  primaryColor: session.branding_primary_color ?? undefined,
                }
              : undefined
          }
        />
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
