import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { DocumentUploader } from "@/components/document-uploader";

export default async function UploadPage() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();

  if (error || !data?.claims) {
    redirect("/auth/login");
  }

  return (
    <div className="flex-1 w-full flex flex-col gap-8">
      <div>
        <h1 className="font-bold text-2xl">Document Uploader</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Upload PDF documents to your private storage.
        </p>
      </div>
      <DocumentUploader />
    </div>
  );
}
