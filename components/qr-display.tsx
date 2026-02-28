"use client";

import { useState, useEffect } from "react";
import { QRCodeSVG } from "qrcode.react";
import { CopyIcon, CheckIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

interface QRDisplayProps {
  sessionId: string;
  fileName: string;
  pdfUrl: string | null;
}

export function QRDisplay({ sessionId, fileName, pdfUrl }: QRDisplayProps) {
  const [signUrl, setSignUrl] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setSignUrl(`${window.location.origin}/sign/${sessionId}`);
  }, [sessionId]);

  async function copyUrl() {
    await navigator.clipboard.writeText(signUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
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
