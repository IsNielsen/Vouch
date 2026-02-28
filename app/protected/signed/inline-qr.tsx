"use client";

import { useState, useEffect } from "react";
import { QRCodeSVG } from "qrcode.react";
import { CopyIcon, CheckIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

export function InlineQR({ sessionId }: { sessionId: string }) {
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

  if (!signUrl) return null;

  return (
    <div className="border rounded-lg p-4 flex flex-col gap-3">
      <h2 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground">Signing QR Code</h2>
      <div className="flex justify-center">
        <div className="rounded-lg border bg-white p-3">
          <QRCodeSVG value={signUrl} size={160} />
        </div>
      </div>
      <div className="flex items-center gap-2">
        <p className="text-xs text-muted-foreground truncate flex-1 font-mono">{signUrl}</p>
        <Button variant="outline" size="icon" onClick={copyUrl} className="shrink-0">
          {copied ? <CheckIcon size={14} /> : <CopyIcon size={14} />}
        </Button>
      </div>
    </div>
  );
}
