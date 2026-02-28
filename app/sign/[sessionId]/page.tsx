import { Suspense } from "react";
import { notFound } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { PasskeyAuth } from "@/components/passkey-auth";
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
    .select("id, file_name, file_path")
    .eq("id", sessionId)
    .single();

  if (!session) notFound();

  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();
  const isAuthed = !!claims;

  let pdfUrl: string | null = null;
  if (isAuthed) {
    const { data } = await admin.storage
      .from("documents")
      .createSignedUrl(session.file_path, 3600);
    pdfUrl = data?.signedUrl ?? null;
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold">Sign Document</h1>
        <p className="text-muted-foreground mt-1 text-sm">{session.file_name}</p>
      </div>

      {!isAuthed ? (
        <div className="flex flex-col items-center gap-4 py-12 border rounded-lg">
          <p className="text-muted-foreground text-sm">
            Sign in to view and sign this document.
          </p>
          <PasskeyAuth redirectTo={`/sign/${sessionId}`} />
        </div>
      ) : (
        <>
          {pdfUrl ? (
            <iframe
              src={pdfUrl}
              className="w-full rounded-lg border"
              style={{ height: "60vh" }}
              title={session.file_name}
            />
          ) : (
            <div className="flex items-center justify-center h-48 border rounded-lg text-muted-foreground text-sm">
              Unable to load document preview.
            </div>
          )}
          <SignButton sessionId={session.id} />
        </>
      )}
    </div>
  );
}

export default function SignPage({
  params,
}: {
  params: Promise<{ sessionId: string }>;
}) {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center p-6">
      <div className="w-full max-w-2xl">
        <Suspense>
          <SignContent params={params} />
        </Suspense>
      </div>
    </div>
  );
}
