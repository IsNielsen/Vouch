"use client";

import { useState, useRef, DragEvent, ChangeEvent } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { UploadCloudIcon, CheckCircleIcon, XCircleIcon } from "lucide-react";

type Status = "idle" | "dragging" | "uploading" | "success" | "error";

export function DocumentUploader() {
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const supabase = createClient();
  const router = useRouter();

  async function upload(file: File) {
    if (file.type !== "application/pdf") {
      setStatus("error");
      setMessage("Only PDF files are supported.");
      return;
    }

    setStatus("uploading");
    setMessage("");

    const { data, error: claimsError } = await supabase.auth.getClaims();
    if (claimsError || !data?.claims) {
      setStatus("error");
      setMessage("Not authenticated.");
      return;
    }

    const userId = data.claims.sub;
    const path = `${userId}/${Date.now()}_${file.name}`;
    const { error } = await supabase.storage.from("documents").upload(path, file);

    if (error) {
      setStatus("error");
      setMessage(error.message);
      return;
    }

    const { data: session, error: sessionError } = await supabase
      .from("document_sessions")
      .insert({ owner_id: userId, file_path: path, file_name: file.name })
      .select("id")
      .single();

    if (sessionError || !session) {
      setStatus("error");
      setMessage(sessionError?.message ?? "Failed to create session.");
      return;
    }

    router.push(`/protected/upload/${session.id}`);
  }

  function onDrop(e: DragEvent) {
    e.preventDefault();
    setStatus("idle");
    const file = e.dataTransfer.files[0];
    if (file) upload(file);
  }

  function onDragOver(e: DragEvent) {
    e.preventDefault();
    setStatus("dragging");
  }

  function onDragLeave() {
    if (status === "dragging") setStatus("idle");
  }

  function onChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) upload(file);
    e.target.value = "";
  }

  const isActive = status === "dragging";
  const isUploading = status === "uploading";

  return (
    <div className="flex flex-col gap-4">
      <div
        onDrop={onDrop}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onClick={() => !isUploading && inputRef.current?.click()}
        className={[
          "relative flex flex-col items-center justify-center gap-3",
          "rounded-xl border-2 border-dashed p-16 text-center transition-colors",
          isUploading
            ? "cursor-not-allowed border-muted-foreground/30 bg-muted/30"
            : "cursor-pointer hover:bg-accent/50",
          isActive ? "border-primary bg-accent/50" : "border-muted-foreground/25",
        ].join(" ")}
      >
        <input
          ref={inputRef}
          type="file"
          accept="application/pdf"
          onChange={onChange}
          className="hidden"
        />

        {isUploading ? (
          <>
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            <p className="text-sm text-muted-foreground">Uploading…</p>
          </>
        ) : (
          <>
            <UploadCloudIcon
              size={40}
              className={isActive ? "text-primary" : "text-muted-foreground"}
            />
            <div>
              <p className="font-medium">
                {isActive ? "Drop to upload" : "Drag & drop a PDF here"}
              </p>
              <p className="text-sm text-muted-foreground">or click to browse</p>
            </div>
            <p className="text-xs text-muted-foreground">PDF only · max 20 MB</p>
          </>
        )}
      </div>

      {status === "success" && (
        <div className="flex items-center gap-2 rounded-md bg-green-500/10 px-4 py-3 text-sm text-green-700 dark:text-green-400">
          <CheckCircleIcon size={16} />
          {message}
        </div>
      )}

      {status === "error" && (
        <div className="flex items-center gap-2 rounded-md bg-destructive/10 px-4 py-3 text-sm text-destructive">
          <XCircleIcon size={16} />
          {message}
        </div>
      )}
    </div>
  );
}
