import { Suspense } from "react";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { QRDisplay } from "@/components/qr-display";

async function SessionContent({
  params,
}: {
  params: Promise<{ sessionId: string }>;
}) {
  const { sessionId } = await params;
  const supabase = await createClient();

  const { data: claims, error: claimsError } = await supabase.auth.getClaims();
  if (claimsError || !claims) redirect("/auth/login");

  const { data: session } = await supabase
    .from("document_sessions")
    .select("id, file_name, file_path, multi_signer")
    .eq("id", sessionId)
    .single();

  if (!session) notFound();

  const admin = createAdminClient();
  const [{ data: signed }, { count: signatureCount }] = await Promise.all([
    admin.storage.from("documents").createSignedUrl(session.file_path, 3600),
    admin.from("signatures").select("id", { count: "exact", head: true }).eq("session_id", sessionId),
  ]);

  return (
    <QRDisplay
      sessionId={session.id}
      fileName={session.file_name}
      pdfUrl={signed?.signedUrl ?? null}
      multiSigner={session.multi_signer}
      initialSignatureCount={signatureCount ?? 0}
    />
  );
}

export default function SessionQRPage({
  params,
}: {
  params: Promise<{ sessionId: string }>;
}) {
  return (
    <div className="flex-1 w-full flex flex-col gap-8">
      <div>
        <h1 className="font-bold text-2xl">Signing Session</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Have the signer scan the QR code below.
        </p>
      </div>
      <Suspense>
        <SessionContent params={params} />
      </Suspense>
    </div>
  );
}
