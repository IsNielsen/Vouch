"use client";

import { useState } from "react";
import { startAuthentication } from "@simplewebauthn/browser";
import { Button } from "@/components/ui/button";
import { PenLine, CheckCircle, Loader2, Download } from "lucide-react";

type State = "idle" | "loading" | "signed" | "error";

export function SignButton({ sessionId, pdfUrl, fileName }: { sessionId: string; pdfUrl: string | null; fileName: string }) {
  const [state, setState] = useState<State>("idle");
  const [error, setError] = useState<string | null>(null);

  async function extractError(res: Response): Promise<string> {
    try {
      const json = await res.json();
      return json.error ?? `Server error (${res.status})`;
    } catch {
      return `Server error (${res.status})`;
    }
  }

  async function handleSign() {
    setState("loading");
    setError(null);
    try {
      const challengeRes = await fetch(`/api/sign/${sessionId}/challenge`, {
        method: "POST",
      });
      if (!challengeRes.ok) throw new Error(await extractError(challengeRes));
      const options = await challengeRes.json();

      const assertion = await startAuthentication({ optionsJSON: options });

      const completeRes = await fetch(`/api/sign/${sessionId}/complete`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(assertion),
      });
      if (!completeRes.ok) throw new Error(await extractError(completeRes));

      setState("signed");
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Signing failed";
      setError(msg);
      setState("error");
    }
  }

  if (state === "signed") {
    return (
      <div className="fixed inset-0 bg-background flex flex-col items-center justify-center gap-4 z-50">
        <CheckCircle className="h-20 w-20 text-green-500" />
        <h2 className="text-2xl font-semibold">Identity Verified</h2>
        <p className="text-muted-foreground text-sm">Document signed successfully.</p>
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
    <div className="flex flex-col gap-2">
      {state === "error" && (
        <p className="text-destructive text-sm text-center">{error}</p>
      )}
      <Button
        size="lg"
        className="w-full gap-2"
        onClick={handleSign}
        disabled={state === "loading"}
      >
        {state === "loading" ? (
          <Loader2 className="h-5 w-5 animate-spin" />
        ) : (
          <PenLine className="h-5 w-5" />
        )}
        {state === "loading" ? "Signing..." : "Sign"}
      </Button>
    </div>
  );
}
