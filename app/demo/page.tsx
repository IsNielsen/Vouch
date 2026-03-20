"use client";

import { useState } from "react";
import { startAuthentication } from "@simplewebauthn/browser";
import { Button } from "@/components/ui/button";
import { Loader2, Copy, Check, ArrowRight, ShieldCheck, Fingerprint } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import Prism from "prismjs";
import "prismjs/components/prism-typescript";
import "prismjs/components/prism-bash";
import "prismjs/components/prism-python";
import "prismjs/themes/prism-tomorrow.css";

const TABS = ["TypeScript", "cURL", "Python"] as const;
type Tab = (typeof TABS)[number];

const CODE: Record<Tab, string> = {
  TypeScript: `import Vouch, {
  Challenge,
  VouchReceipt,
} from "@vouch/sdk";

const vouch = new Vouch({
  apiKey: process.env.VOUCH_API_KEY as string,
});

interface TransactionContext {
  amount: number;
  currency: string;
  recipient: string;
  account_last4: string;
}

const tx: TransactionContext = {
  amount: 2500,
  currency: "USD",
  recipient: "James Chen",
  account_last4: "4821",
};

// Step 1: Create a fraud-prevention challenge
const challenge: Challenge = await vouch.challenge.create({
  transaction_context: tx,
});

// Step 2: Collect biometric assertion (browser)
const assertion = await vouch.collectAssertion(
  challenge.webauthn_options
);

// Step 3: Verify and get PQC-signed receipt
const receipt: VouchReceipt = await vouch.challenge.verify(
  challenge.challenge_id,
  { assertion }
);

// ML-DSA-65 (FIPS 204) post-quantum signature
console.log(receipt.pqc_signature);`,

  cURL: `# Step 1: Create challenge
curl -X POST https://api.vouch.id/v1/challenge \\
  -H "Authorization: Bearer $VOUCH_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "transaction_context": {
      "amount": 2500,
      "currency": "USD",
      "recipient": "James Chen",
      "account_last4": "4821"
    }
  }'

# Step 2: Verify assertion (after browser collects it)
curl -X POST https://api.vouch.id/v1/verify/$CHALLENGE_ID \\
  -H "Authorization: Bearer $VOUCH_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{ "assertion": { ... } }'`,

  Python: `import vouch

client = vouch.Client(api_key=os.environ["VOUCH_API_KEY"])

# Step 1: Create a fraud-prevention challenge
challenge = client.challenge.create(
    transaction_context={
        "amount": 2500,
        "currency": "USD",
        "recipient": "James Chen",
        "account_last4": "4821",
    }
)

# Step 2: Pass webauthn_options to your frontend
# Step 3: Verify and get PQC-signed receipt
receipt = client.challenge.verify(
    challenge.challenge_id,
    assertion=assertion,
)

print(receipt.pqc_signature)  # ML-DSA-65 (FIPS 204)`,
};

const PRISM_LANG: Record<Tab, string> = {
  TypeScript: "typescript",
  cURL: "bash",
  Python: "python",
};

function highlight(code: string, tab: Tab): string {
  const lang = PRISM_LANG[tab];
  return Prism.highlight(code, Prism.languages[lang], lang);
}

type RunStatus = "idle" | "loading" | "success" | "no-passkey" | "error";

const ACCOUNTS = [
  { label: "Checking ••4821", value: "4821" },
  { label: "Savings ••9302", value: "9302" },
];

const RECIPIENTS = [
  { name: "James Chen", bank: "Chase", initials: "JC", color: "bg-blue-100 text-blue-700" },
  { name: "Maria Lopez", bank: "Wells Fargo", initials: "ML", color: "bg-purple-100 text-purple-700" },
  { name: "David Park", bank: "Bank of America", initials: "DP", color: "bg-green-100 text-green-700" },
];

export default function DemoPage() {
  const [tab, setTab] = useState<Tab>("TypeScript");
  const [status, setStatus] = useState<RunStatus>("idle");
  const [error, setError] = useState("");
  const [response, setResponse] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [amount, setAmount] = useState("2,500.00");
  const [selectedRecipient, setSelectedRecipient] = useState(0);
  const [selectedAccount, setSelectedAccount] = useState(0);
  const [note, setNote] = useState("Rent - March 2026");

  async function handleVerify() {
    setStatus("loading");
    setError("");
    setResponse(null);

    try {
      const challengeRes = await fetch("/api/demo/challenge", { method: "POST" });
      const { challenge_id, webauthn_options, error: challengeErr } =
        await challengeRes.json();
      if (challengeErr) throw new Error(challengeErr);

      let assertion;
      try {
        assertion = await startAuthentication({ optionsJSON: webauthn_options });
      } catch (e: unknown) {
        const name = e instanceof Error ? e.name : "";
        if (name === "NotAllowedError" || name === "NotSupportedError") {
          setStatus("no-passkey");
          return;
        }
        throw e;
      }

      const verifyRes = await fetch(`/api/demo/verify/${challenge_id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ assertion }),
      });
      const result = await verifyRes.json();
      if (!verifyRes.ok) throw new Error(result.error);

      setResponse(JSON.stringify(result, null, 2));
      setStatus("success");
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Something went wrong");
      setStatus("error");
    }
  }

  function handleCopy() {
    navigator.clipboard.writeText(CODE[tab]);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const recipient = RECIPIENTS[selectedRecipient];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Back link */}
      <div className="flex justify-end px-8 pt-4">
        <Link
          href="/"
          className="text-xs text-muted-foreground underline underline-offset-2 hover:text-foreground"
        >
          ← Back
        </Link>
      </div>

      {/* Page header */}
      <div className="text-center pt-8 pb-10 px-4">
        <span className="inline-block border text-xs font-medium px-3 py-1 rounded-full bg-white mb-4 text-muted-foreground">
          API Documentation
        </span>
        <h1 className="text-4xl font-bold tracking-tight mb-3">API Integration Demo</h1>
        <p className="text-muted-foreground text-base">
          Complete example with code, live widget, and response viewer
        </p>
      </div>

      {/* Two-column layout */}
      <div className="max-w-6xl mx-auto px-6 pb-16 grid grid-cols-1 lg:grid-cols-[1fr_420px] gap-6 items-start">
        {/* Left: Code examples */}
        <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
          <div className="px-5 pt-5 pb-3">
            <h2 className="font-semibold text-base">Code Examples</h2>
            <p className="text-sm text-muted-foreground">
              Choose your preferred language or framework
            </p>
          </div>

          <div className="px-5 pb-3">
            <div className="inline-flex bg-gray-100 rounded-lg p-1 gap-1">
              {TABS.map((t) => (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  className={cn(
                    "px-4 py-1.5 rounded-md text-sm font-medium transition-colors",
                    tab === t
                      ? "bg-white shadow-sm text-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          <div className="relative mx-5 mb-5 rounded-lg overflow-hidden" style={{ background: "#1e1e2e" }}>
            <button
              onClick={handleCopy}
              className="absolute top-3 right-3 p-1.5 rounded text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
              title="Copy"
            >
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            </button>
            <pre
              className="overflow-auto p-5 text-[13px] font-mono leading-relaxed"
              style={{ color: "#cdd6f4", minHeight: 320 }}
              dangerouslySetInnerHTML={{ __html: highlight(CODE[tab], tab) }}
            />
          </div>
        </div>

        {/* Right column */}
        <div className="flex flex-col gap-5">
          {/* Transfer widget */}
          <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
            {/* Bank header */}
            <div className="bg-gradient-to-r from-slate-800 to-slate-700 px-5 py-4 flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-xs">NorthBank</p>
                <p className="text-white font-semibold text-sm">Send Money</p>
              </div>
              <ShieldCheck className="h-5 w-5 text-slate-400" />
            </div>

            <div className="p-5 space-y-4">
              {/* From account */}
              <div>
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">From</label>
                <div className="mt-1 flex gap-2">
                  {ACCOUNTS.map((a, i) => (
                    <button
                      key={a.value}
                      onClick={() => setSelectedAccount(i)}
                      className={cn(
                        "flex-1 text-sm py-2 px-3 rounded-lg border transition-colors text-left",
                        selectedAccount === i
                          ? "border-slate-800 bg-slate-50 font-medium"
                          : "border-gray-200 text-muted-foreground hover:border-gray-300"
                      )}
                    >
                      {a.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Amount */}
              <div>
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Amount</label>
                <div className="mt-1 relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-medium">$</span>
                  <input
                    type="text"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full border rounded-lg pl-7 pr-12 py-2.5 text-xl font-semibold focus:outline-none focus:ring-2 focus:ring-slate-800/20 focus:border-slate-800"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">USD</span>
                </div>
              </div>

              {/* To */}
              <div>
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">To</label>
                <div className="mt-1 space-y-2">
                  {RECIPIENTS.map((r, i) => (
                    <button
                      key={r.name}
                      onClick={() => setSelectedRecipient(i)}
                      className={cn(
                        "w-full flex items-center gap-3 p-3 rounded-lg border transition-colors text-left",
                        selectedRecipient === i
                          ? "border-slate-800 bg-slate-50"
                          : "border-gray-200 hover:border-gray-300"
                      )}
                    >
                      <span className={cn("w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0", r.color)}>
                        {r.initials}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium">{r.name}</p>
                        <p className="text-xs text-muted-foreground">{r.bank}</p>
                      </div>
                      {selectedRecipient === i && (
                        <Check className="h-4 w-4 text-slate-700 shrink-0" />
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Note */}
              <div>
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Note (optional)</label>
                <input
                  type="text"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  className="mt-1 w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-800/20 focus:border-slate-800"
                />
              </div>

              {/* Summary */}
              <div className="rounded-lg bg-gray-50 border px-4 py-3 flex items-center gap-3 text-sm">
                <div className={cn("w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0", recipient.color)}>
                  {recipient.initials}
                </div>
                <div className="flex-1">
                  <p className="font-medium">{recipient.name}</p>
                  <p className="text-xs text-muted-foreground">{recipient.bank}</p>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0" />
                <p className="font-bold text-base">${amount}</p>
              </div>

              {/* Verify button */}
              <Button
                className="w-full gap-2 bg-slate-800 hover:bg-slate-700"
                size="lg"
                onClick={handleVerify}
                disabled={status === "loading"}
              >
                {status === "loading" ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Waiting for biometric…
                  </>
                ) : (
                  <>
                    <Fingerprint className="h-4 w-4" />
                    Verify &amp; Send
                  </>
                )}
              </Button>

              {status === "no-passkey" && (
                <p className="text-xs text-muted-foreground text-center">
                  No passkey found.{" "}
                  <Link href="/auth/login" className="underline">
                    Register one first.
                  </Link>
                </p>
              )}
              {status === "error" && (
                <p className="text-xs text-destructive text-center">{error}</p>
              )}
            </div>
          </div>

          {/* API Response */}
          <div className="bg-white rounded-xl border shadow-sm p-5">
            <div className="flex items-center gap-2 mb-0.5">
              <h2 className="font-semibold text-base">Vouch Receipt</h2>
              {status === "success" && (
                <span className="text-xs text-green-600 font-medium bg-green-50 border border-green-200 px-2 py-0.5 rounded-full">
                  ● Verified
                </span>
              )}
            </div>
            <p className="text-sm text-muted-foreground mb-3">
              PQC-signed proof of biometric authorization
            </p>

            <div
              className="border-2 border-dashed border-gray-200 rounded-lg overflow-auto"
              style={{ minHeight: 120, background: "#fafafa" }}
            >
              {(status === "idle" || status === "no-passkey") && (
                <p className="text-sm text-muted-foreground/50 h-28 flex items-center justify-center">
                  No receipt yet
                </p>
              )}
              {status === "loading" && (
                <p className="text-sm text-muted-foreground/50 h-28 flex items-center justify-center">
                  Awaiting verification…
                </p>
              )}
              {status === "success" && (
                <pre className="p-4 text-xs font-mono leading-relaxed text-green-700 overflow-auto">
                  {response}
                </pre>
              )}
              {status === "error" && (
                <pre className="p-4 text-xs font-mono leading-relaxed text-destructive">
                  Error: {error}
                </pre>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
