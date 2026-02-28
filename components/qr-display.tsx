"use client";

import { useState, useEffect } from "react";
import { QRCodeSVG } from "qrcode.react";
import { CopyIcon, CheckIcon, CheckCircle, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";

interface QRDisplayProps {
  sessionId: string;
  fileName: string;
  pdfUrl: string | null;
}

export function QRDisplay({ sessionId, fileName, pdfUrl }: QRDisplayProps) {
  const [signUrl, setSignUrl] = useState("");
  const [copied, setCopied] = useState(false);
  const [signed, setSigned] = useState(false);

  useEffect(() => {
    setSignUrl(`${window.location.origin}/sign/${sessionId}`);
  }, [sessionId]);

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel(`session-${sessionId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "document_sessions",
          filter: `id=eq.${sessionId}`,
        },
        (payload) => {
          if (payload.new.status === "signed") setSigned(true);
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [sessionId]);

  async function copyUrl() {
    await navigator.clipboard.writeText(signUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (signed) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-24">
        <CheckCircle className="h-20 w-20 text-green-500" />
        <h2 className="text-2xl font-semibold">Document Signed</h2>
        <p className="text-muted-foreground text-sm">
          The signer has successfully verified their identity and signed the document.
        </p>
        {pdfUrl && (
          <Button asChild>
            <a href={pdfUrl} download={fileName}>
              <Download className="h-4 w-4 mr-2" />
              Download Document
            </a>
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 w-full max-w-2xl mx-auto">
      {pdfUrl ? (
        <iframe
          src={pdfUrl}
          className="w-full rounded-lg border"
          style={{ height: "60vh" }}
          title={fileName}
        />
      ) : (
        <div className="flex items-center justify-center h-48 border rounded-lg text-muted-foreground text-sm">
          Unable to load document preview.
        </div>
      )}
      <div className="flex flex-col items-center gap-6 max-w-sm mx-auto w-full">
      <div className="text-center">
        <p className="text-sm text-muted-foreground">Document</p>
        <p className="font-medium truncate max-w-xs">{fileName}</p>
        <p className="text-xs text-muted-foreground mt-1 font-mono">
          {sessionId.slice(0, 8)}…
        </p>
      </div>

      {signUrl && (
        <div className="rounded-xl border bg-white p-4">
          <QRCodeSVG value={signUrl} size={220} />
        </div>
      )}

      <div className="flex items-center gap-2 w-full">
        <p className="text-xs text-muted-foreground truncate flex-1 font-mono">{signUrl}</p>
        <Button variant="outline" size="icon" onClick={copyUrl} className="shrink-0">
          {copied ? <CheckIcon size={14} /> : <CopyIcon size={14} />}
        </Button>
      </div>

      <p className="text-sm text-muted-foreground text-center">
        Share this QR code or link with the signer.
      </p>
      </div>
    </div>
  );
}
