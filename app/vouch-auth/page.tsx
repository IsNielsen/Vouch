"use client";

import { useState } from "react";
import { startAuthentication } from "@simplewebauthn/browser";

export default function VouchAuthPage({
  searchParams,
}: {
  searchParams: Promise<{ challenge_id?: string; origin?: string }>;
}) {
  return <VouchAuth searchParamsPromise={searchParams} />;
}

function VouchAuth({
  searchParamsPromise,
}: {
  searchParamsPromise: Promise<{ challenge_id?: string; origin?: string }>;
}) {
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  async function handleVerify() {
    setStatus("loading");
    setErrorMsg("");

    let challengeId: string;
    let callerOrigin: string;
    try {
      const p = await searchParamsPromise;
      challengeId = p.challenge_id ?? "";
      callerOrigin = p.origin ?? "";
    } catch {
      setStatus("error");
      setErrorMsg("Invalid page parameters.");
      return;
    }

    if (!challengeId) {
      setStatus("error");
      setErrorMsg("Missing challenge_id.");
      return;
    }

    try {
      const optRes = await fetch(`/api/vouch/challenge/${challengeId}/options`);
      if (!optRes.ok) {
        const { error } = await optRes.json().catch(() => ({ error: "Failed to load challenge" }));
        throw new Error(error ?? "Failed to load challenge");
      }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const webauthnOptions: any = await optRes.json();

      const assertion = await startAuthentication({ optionsJSON: webauthnOptions });

      const verRes = await fetch(`/api/vouch/challenge/${challengeId}/complete`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ assertion }),
      });

      const receipt = await verRes.json();
      if (!verRes.ok) {
        throw new Error(receipt.error ?? "Verification failed");
      }

      setStatus("success");

      const target = callerOrigin || "*";
      window.opener?.postMessage({ event: "vouch.verified", ...receipt }, target);
      setTimeout(() => window.close(), 1500);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Verification failed";
      setStatus("error");
      setErrorMsg(msg);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-sm space-y-6 text-center">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">Verify your identity</h1>
          <p className="text-sm text-muted-foreground">
            Use your Verum passkey to confirm this action.
          </p>
        </div>

        {status === "success" && (
          <p className="text-sm text-green-600 font-medium">Verified. Closing…</p>
        )}

        {status === "error" && (
          <p className="text-sm text-destructive">{errorMsg}</p>
        )}

        {status !== "success" && (
          <button
            onClick={handleVerify}
            disabled={status === "loading"}
            className="w-full rounded-md bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground shadow-xs hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {status === "loading" ? "Verifying…" : "Verify with passkey"}
          </button>
        )}

        <p className="text-xs text-muted-foreground">
          Secured by <span className="font-medium">Verum</span>
        </p>
      </div>
    </div>
  );
}
