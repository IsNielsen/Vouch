"use client";

import { useState } from "react";
import { startAuthentication, startRegistration } from "@simplewebauthn/browser";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Fingerprint } from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export function PasskeyAuth({ redirectTo = "/protected" }: { redirectTo?: string }) {
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const router = useRouter();
  const supabase = createClient();

  async function handlePasskey() {
    setStatus("loading");
    setErrorMsg("");

    try {
      // Try authentication first
      const authStartRes = await fetch("/api/passkey/authenticate/start", { method: "POST" });
      const authOptions = await authStartRes.json();

      let tokenHash: string;

      try {
        const authCredential = await startAuthentication({ optionsJSON: authOptions });
        const authCompleteRes = await fetch("/api/passkey/authenticate/complete", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(authCredential),
        });
        const authData = await authCompleteRes.json();
        if (!authCompleteRes.ok) throw new Error(authData.error);
        tokenHash = authData.token_hash;
      } catch {
        // No credential found — fall back to registration
        const regStartRes = await fetch("/api/passkey/register/start", { method: "POST" });
        const regOptions = await regStartRes.json();
        const regCredential = await startRegistration({ optionsJSON: regOptions });
        const regCompleteRes = await fetch("/api/passkey/register/complete", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(regCredential),
        });
        const regData = await regCompleteRes.json();
        if (!regCompleteRes.ok) throw new Error(regData.error);
        tokenHash = regData.token_hash;
      }

      const { error } = await supabase.auth.verifyOtp({
        type: "magiclink",
        token_hash: tokenHash,
      });

      if (error) throw error;

      router.push(redirectTo);
    } catch (e: any) {
      setStatus("error");
      setErrorMsg(e.message ?? "Something went wrong");
    }
  }

  return (
    <div className="flex flex-col items-center gap-4">
      <Button
        size="lg"
        className="gap-2"
        onClick={handlePasskey}
        disabled={status === "loading"}
      >
        <Fingerprint className="h-5 w-5" />
        {status === "loading" ? "Verifying…" : "Sign in with Passkey"}
      </Button>
      {status === "error" && (
        <p className="text-sm text-destructive">{errorMsg}</p>
      )}
      <Link
        href="/auth/email-login"
        className="text-sm text-muted-foreground hover:underline"
      >
        Sign in with email instead
      </Link>
    </div>
  );
}
