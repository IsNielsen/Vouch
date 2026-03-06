"use client";

import { useState, useEffect } from "react";
import { QRCodeSVG } from "qrcode.react";
import { CopyIcon, CheckIcon, CheckCircle, Download, SendIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createClient } from "@/lib/supabase/client";

interface QRDisplayProps {
  sessionId: string;
  fileName: string;
  pdfUrl: string | null;
  multiSigner: boolean;
  initialSignatureCount: number;
}

async function downloadBlob(url: string, fileName: string) {
  const blob = await fetch(url).then((r) => r.blob());
  const blobUrl = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = blobUrl;
  a.download = fileName;
  a.click();
  URL.revokeObjectURL(blobUrl);
}

export function QRDisplay({ sessionId, fileName, pdfUrl, multiSigner, initialSignatureCount }: QRDisplayProps) {
  const [signUrl, setSignUrl] = useState("");
  const [copied, setCopied] = useState(false);
  const [signed, setSigned] = useState(false);
  const [signatureCount, setSignatureCount] = useState(initialSignatureCount);
  const [closing, setClosing] = useState(false);
  const [phone, setPhone] = useState("");
  const [smsState, setSmsState] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [smsError, setSmsError] = useState("");
  const [textedNumbers, setTextedNumbers] = useState<string[]>([]);

  useEffect(() => {
    setSignUrl(`${window.location.origin}/sign/${sessionId}`);
  }, [sessionId]);

  useEffect(() => {
    const supabase = createClient();

    // Always subscribe to session status updates
    const sessionChannel = supabase
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

    if (!multiSigner) {
      return () => { supabase.removeChannel(sessionChannel); };
    }

    // Multi-signer: also subscribe to new signatures
    const sigChannel = supabase
      .channel(`signatures-${sessionId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "signatures",
          filter: `session_id=eq.${sessionId}`,
        },
        () => {
          setSignatureCount((c) => c + 1);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(sessionChannel);
      supabase.removeChannel(sigChannel);
    };
  }, [sessionId, multiSigner]);

  useEffect(() => {
    if (signed && !multiSigner) downloadBlob(`/api/sign/${sessionId}/download`, fileName);
  }, [signed, multiSigner, sessionId, fileName]);

  async function closeSigning() {
    setClosing(true);
    const res = await fetch(`/api/sessions/${sessionId}/close`, { method: "POST" });
    if (!res.ok) setClosing(false);
    // setSigned will be triggered by the realtime subscription
  }

  async function copyUrl() {
    await navigator.clipboard.writeText(signUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function sendSms() {
    setSmsState("sending");
    setSmsError("");
    const res = await fetch(`/api/sessions/${sessionId}/send-sms`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone }),
    });
    if (res.ok) {
      setTextedNumbers((prev) => [...prev, phone]);
      setPhone("");
      setSmsState("sent");
      setTimeout(() => setSmsState("idle"), 3000);
    } else {
      const json = await res.json().catch(() => ({}));
      setSmsError(json.error ?? "Failed to send SMS");
      setSmsState("error");
    }
  }

  if (signed) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-24">
        <CheckCircle className="h-20 w-20 text-green-500" />
        <h2 className="text-2xl font-semibold">Document Signed</h2>
        <p className="text-muted-foreground text-sm">
          {multiSigner
            ? `${signatureCount} signer${signatureCount !== 1 ? "s" : ""} verified their identity and signed the document.`
            : "The signer has successfully verified their identity and signed the document."}
        </p>
        <Button onClick={() => downloadBlob(`/api/sign/${sessionId}/download`, fileName)}>
          <Download className="h-4 w-4 mr-2" />
          Download
        </Button>
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
          {multiSigner && (
            <p className="text-sm font-medium mt-2">
              Signatures collected: {signatureCount}
            </p>
          )}
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

        <div className="flex flex-col gap-2 w-full">
          <div className="flex items-center gap-2 w-full">
            <Input
              type="tel"
              placeholder="+1 (555) 000-0000"
              value={phone}
              onChange={(e) => { setPhone(e.target.value); setSmsState("idle"); }}
              className="flex-1 font-mono text-sm"
            />
            <Button
              variant="outline"
              size="icon"
              onClick={sendSms}
              disabled={!phone || smsState === "sending"}
              className="shrink-0"
              title="Send via text"
            >
              {smsState === "sent" ? <CheckIcon size={14} /> : <SendIcon size={14} />}
            </Button>
          </div>
          {smsState === "error" && (
            <p className="text-xs text-destructive">{smsError}</p>
          )}
          {multiSigner && textedNumbers.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-1">
              {textedNumbers.map((n) => (
                <span key={n} className="text-xs bg-muted px-2 py-0.5 rounded font-mono">{n}</span>
              ))}
            </div>
          )}
        </div>

        <p className="text-sm text-muted-foreground text-center">
          Share this QR code, link, or send a text to the signer{multiSigner ? "s" : ""}.
        </p>

        {multiSigner && (
          <Button variant="destructive" onClick={closeSigning} disabled={closing} className="w-full">
            {closing ? "Closing…" : "Close Signing"}
          </Button>
        )}
      </div>
    </div>
  );
}
