"use client";

import { useState } from "react";
import { startAuthentication } from "@simplewebauthn/browser";
import { Fingerprint, Loader2 } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

export interface VouchReceipt {
  pqc_signature: string;
  pqc_public_key: string;
  verified_at: string;
  [key: string]: unknown;
}

interface VouchButtonProps {
  onVerified: (receipt: VouchReceipt) => void;
  transactionContext?: Record<string, unknown>;
  label?: string;
  className?: string;
  challengeEndpoint?: string;
  verifyEndpoint?: string;
  /** Skip real WebAuthn — for the public demo page */
  demoMode?: boolean;
}

type State = "idle" | "loading" | "no-passkey" | "error";

export function VouchButton({
  onVerified,
  transactionContext,
  label = "Verify & Sign",
  className,
  challengeEndpoint = "/api/vouch/challenge",
  verifyEndpoint = "/api/vouch/verify",
  demoMode = false,
}: VouchButtonProps) {
  const [state, setState] = useState<State>("idle");
  const [error, setError] = useState("");

  async function handleClick() {
    setState("loading");
    setError("");

    try {
      const challengeRes = await fetch(challengeEndpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transaction_context: transactionContext }),
      });
      const { challenge_id, webauthn_options, error: challengeErr } =
        await challengeRes.json();
      if (challengeErr) throw new Error(challengeErr);

      let assertion;
      if (demoMode) {
        // Simulate a brief biometric delay without touching real WebAuthn
        await new Promise((r) => setTimeout(r, 800));
        assertion = { demo: true };
      } else {
        try {
          assertion = await startAuthentication({ optionsJSON: webauthn_options });
        } catch (e: unknown) {
          const name = e instanceof Error ? e.name : "";
          if (name === "NotAllowedError" || name === "NotSupportedError") {
            setState("no-passkey");
            return;
          }
          throw e;
        }
      }

      const verifyRes = await fetch(`${verifyEndpoint}/${challenge_id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ assertion }),
      });
      const result = await verifyRes.json();
      if (!verifyRes.ok) throw new Error(result.error);

      setState("idle");
      onVerified(result);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Something went wrong");
      setState("error");
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <p className="text-[11px] text-[#555570] text-center">
        Biometric verification required to authorize this transaction.
      </p>
      <button
        onClick={handleClick}
        disabled={state === "loading"}
        className={cn(
          "w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium",
          "bg-[#5577ff] hover:bg-[#3344cc] text-white transition-all duration-150 hover:-translate-y-px",
          "disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:translate-y-0",
          className
        )}
      >
        {state === "loading" ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Waiting for biometric…
          </>
        ) : (
          <>
            <Fingerprint className="h-4 w-4" />
            {label}
          </>
        )}
      </button>
      {state === "no-passkey" && (
        <p className="text-xs text-[#8888a8] text-center">
          No passkey found.{" "}
          <Link href="/auth/login" className="text-[#5577ff] underline">
            Register one first.
          </Link>
        </p>
      )}
      {state === "error" && (
        <p className="text-xs text-red-400 text-center">{error}</p>
      )}
    </div>
  );
}
