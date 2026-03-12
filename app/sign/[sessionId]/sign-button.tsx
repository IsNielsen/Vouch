"use client";

import { useEffect, useState } from "react";
import { startAuthentication, startRegistration } from "@simplewebauthn/browser";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CheckCircle, Download, Mail } from "lucide-react";
import { ConsentDisclosure } from "@/components/consent-disclosure";

type State = "idle" | "loading" | "signed" | "error";
type Step = "name" | "sign";

async function downloadBlob(url: string, fileName: string) {
  const blob = await fetch(url).then((r) => r.blob());
  const blobUrl = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = blobUrl;
  a.download = fileName;
  a.click();
  URL.revokeObjectURL(blobUrl);
}

export function SignButton({ sessionId, fileName }: { sessionId: string; fileName: string }) {
  const [state, setState] = useState<State>("idle");
  const [step, setStep] = useState<Step>("name");
  const [error, setError] = useState<string | null>(null);
  const [signerName, setSignerName] = useState("");
  const [signerEmail, setSignerEmail] = useState("");
  const [emailSent, setEmailSent] = useState(false);

  useEffect(() => {
    fetch(`/api/sign/${sessionId}/event`, { method: "POST" }).catch(() => {/* best-effort */});
  }, [sessionId]);

  async function extractError(res: Response): Promise<string> {
    try {
      const json = await res.json();
      return json.error ?? `Server error (${res.status})`;
    } catch {
      return `Server error (${res.status})`;
    }
  }

  async function fetchChallenge() {
    const res = await fetch(`/api/sign/${sessionId}/challenge`, { method: "POST" });
    if (!res.ok) throw new Error(await extractError(res));
    return res.json();
  }

  async function handleSign() {
    setState("loading");
    setError(null);
    try {
      const options = await fetchChallenge();

      let assertion;
      try {
        assertion = await startAuthentication({ optionsJSON: options });
      } catch {
        // New signer — register a passkey (no Supabase user created)
        const regStart = await fetch("/api/passkey/register/start", { method: "POST" });
        const regOptions = await regStart.json();
        const regCredential = await startRegistration({ optionsJSON: regOptions });
        const regRes = await fetch("/api/passkey/register/complete", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(regCredential),
        });
        if (!regRes.ok) throw new Error(await extractError(regRes));

        // Re-fetch challenge and sign with the newly registered key
        const newOptions = await fetchChallenge();
        assertion = await startAuthentication({ optionsJSON: newOptions });
      }

      const completeRes = await fetch(`/api/sign/${sessionId}/complete`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ signerName: signerName.trim(), ...assertion }),
      });
      if (!completeRes.ok) throw new Error(await extractError(completeRes));

      setState("signed");
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Signing failed";
      setError(msg);
      setState("idle");
    }
  }

  async function handleSendCopy() {
    await fetch(`/api/sign/${sessionId}/send-copy`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: signerEmail }),
    });
    setEmailSent(true);
  }

  if (state === "signed") {
    return (
      <div className="fixed inset-0 bg-background flex flex-col items-center justify-center gap-4 z-50 p-6">
        <CheckCircle className="h-20 w-20 text-green-500" />
        <h2 className="text-2xl font-semibold">Identity Verified</h2>
        <p className="text-muted-foreground text-sm">Document signed successfully.</p>
        <div className="flex gap-3">
          <Button variant="outline" onClick={() => downloadBlob(`/api/sign/${sessionId}/download`, fileName)}>
            <Download className="h-4 w-4 mr-2" />
            Download Document
          </Button>
          <Button variant="outline" onClick={() => downloadBlob(`/api/sign/${sessionId}/download?type=certificate`, fileName.replace(/\.pdf$/i, "_certificate.pdf"))}>
            <Download className="h-4 w-4 mr-2" />
            Download Certificate
          </Button>
        </div>
        <div className="w-full max-w-sm border rounded-lg p-4 flex flex-col gap-3">
          {emailSent ? (
            <p className="text-sm text-center text-muted-foreground">
              Your email has been saved. It will be sent soon.
            </p>
          ) : (
            <>
              <p className="text-sm font-medium">Get a copy by email</p>
              <Input
                type="email"
                placeholder="your@email.com"
                value={signerEmail}
                onChange={(e) => setSignerEmail(e.target.value)}
              />
              <Button disabled={!signerEmail} onClick={handleSendCopy} className="gap-2">
                <Mail className="h-4 w-4" />
                Save email
              </Button>
              <button
                className="text-xs text-muted-foreground hover:underline text-center"
                onClick={() => setEmailSent(true)}
              >
                No thanks
              </button>
            </>
          )}
        </div>
      </div>
    );
  }

  if (step === "name") {
    return (
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="signer-name" className="text-sm font-medium">Full name</label>
          <Input
            id="signer-name"
            placeholder="Your full legal name"
            value={signerName}
            onChange={(e) => setSignerName(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && signerName.trim()) setStep("sign"); }}
          />
        </div>
        <Button disabled={!signerName.trim()} onClick={() => setStep("sign")}>
          Continue →
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-muted-foreground">
        Signing as: <span className="font-medium text-foreground">{signerName}</span>
      </p>
      {error && <p className="text-destructive text-sm text-center">{error}</p>}
      <ConsentDisclosure onConsented={handleSign} isLoading={state === "loading"} disabled={false} />
    </div>
  );
}
