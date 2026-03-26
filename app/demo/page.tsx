"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import { Copy, Check, ArrowRight, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { SectionEyebrow } from "@/components/section-eyebrow";
import { VouchButton, VouchReceipt } from "@/components/vouch-button";
import Prism from "prismjs";
import "prismjs/components/prism-typescript";
import "prismjs/components/prism-bash";
import "prismjs/components/prism-python";
import "prismjs/themes/prism-tomorrow.css";

const TABS = ["React", "TypeScript", "cURL", "Python"] as const;
type Tab = (typeof TABS)[number];

const CODE: Record<Tab, string> = {
  React: `import { VouchButton } from "@vouch/react";

<VouchButton
  transactionContext={{
    amount: 2500,
    currency: "USD",
    recipient: "James Chen",
    account_last4: "4821",
  }}
  onVerified={(receipt) => console.log(receipt.pqc_signature)}
/>`,

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
  React: "typescript",
  TypeScript: "typescript",
  cURL: "bash",
  Python: "python",
};

function highlight(code: string, tab: Tab): string {
  const lang = PRISM_LANG[tab];
  return Prism.highlight(code, Prism.languages[lang], lang);
}

const ACCOUNTS = [
  { label: "Checking ••4821", value: "4821" },
  { label: "Savings ••9302", value: "9302" },
];

const RECIPIENTS = [
  { name: "James Chen", bank: "Chase", initials: "JC" },
  { name: "Maria Lopez", bank: "Wells Fargo", initials: "ML" },
  { name: "David Park", bank: "Bank of America", initials: "DP" },
];

export default function DemoPage() {
  const [tab, setTab] = useState<Tab>("React");
  const [response, setResponse] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [amount, setAmount] = useState("2,500.00");
  const [selectedRecipient, setSelectedRecipient] = useState(0);
  const [selectedAccount, setSelectedAccount] = useState(0);
  const [note, setNote] = useState("Rent - March 2026");

  const highlightedCode = useMemo(() => highlight(CODE[tab], tab), [tab]);
  const copyTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => { if (copyTimeoutRef.current) clearTimeout(copyTimeoutRef.current); }, []);

  const tx = useMemo(() => ({
    amount: parseFloat(amount.replace(/,/g, "")),
    currency: "USD",
    recipient: RECIPIENTS[selectedRecipient].name,
    account_last4: ACCOUNTS[selectedAccount].value,
    note,
  }), [amount, selectedRecipient, selectedAccount, note]);

  function handleCopy() {
    navigator.clipboard.writeText(CODE[tab]);
    setCopied(true);
    if (copyTimeoutRef.current) clearTimeout(copyTimeoutRef.current);
    copyTimeoutRef.current = setTimeout(() => setCopied(false), 2000);
  }

  function handleVerified(receipt: VouchReceipt) {
    setResponse(JSON.stringify(receipt, null, 2));
  }

  const recipient = RECIPIENTS[selectedRecipient];

  return (
    <div className="min-h-screen bg-[#0a0a0f]">
      {/* Back link */}
      <div className="flex justify-end px-8 pt-4">
        <Link
          href="/"
          className="text-xs text-[#555570] hover:text-[#8888a8] transition-colors duration-150"
        >
          ← Back
        </Link>
      </div>

      {/* Page header */}
      <div className="text-center pt-8 pb-10 px-4">
        <SectionEyebrow label="API Documentation" center className="mb-4" />
        <h1 className="text-4xl font-semibold tracking-tight text-[#f0f0fa] mb-3">API integration demo</h1>
        <p className="text-[#8888a8] text-base">
          Complete example with code, live widget, and response viewer
        </p>
      </div>

      {/* Two-column layout */}
      <div className="max-w-6xl mx-auto px-6 pb-16 grid grid-cols-1 lg:grid-cols-[1fr_420px] gap-5 items-start">
        {/* Left: Code examples */}
        <div className="bg-[#111118] rounded-[10px] border border-[#1a1a2e] overflow-hidden">
          <div className="px-5 pt-5 pb-3">
            <h2 className="font-semibold text-sm text-[#f0f0fa]">Code examples</h2>
            <p className="text-xs text-[#8888a8] mt-0.5">
              Choose your preferred language or framework
            </p>
          </div>

          <div className="px-5 pb-3">
            <div className="inline-flex bg-[#16161f] border border-[#1a1a2e] rounded-lg p-1 gap-1">
              {TABS.map((t) => (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  className={cn(
                    "px-4 py-1.5 rounded-md text-xs font-medium transition-colors duration-150",
                    tab === t
                      ? "bg-[#5577ff] text-white"
                      : "text-[#8888a8] hover:text-[#f0f0fa]"
                  )}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          <div className="relative mx-5 mb-5 rounded-lg overflow-hidden border border-[#1a1a2e] border-l-2 border-l-[#5577ff]" style={{ background: "#080810" }}>
            <button
              onClick={handleCopy}
              className="absolute top-3 right-3 p-1.5 rounded text-[#555570] hover:text-[#f0f0fa] hover:bg-[#ffffff10] transition-colors duration-150"
              title="Copy"
            >
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            </button>
            <pre
              className="overflow-auto p-5 text-[13px] font-mono leading-relaxed"
              style={{ color: "#cdd6f4", minHeight: 320 }}
              dangerouslySetInnerHTML={{ __html: highlightedCode }}
            />
          </div>
        </div>

        {/* Right column */}
        <div className="flex flex-col gap-5">
          {/* Transfer widget */}
          <div className="bg-[#111118] rounded-[10px] border border-[#1a1a2e] overflow-hidden">
            {/* Bank header */}
            <div className="bg-[#16161f] border-b border-[#1a1a2e] px-5 py-4 flex items-center justify-between">
              <div>
                <p className="text-[#555570] text-xs">NorthBank</p>
                <p className="text-[#f0f0fa] font-semibold text-sm">Send money</p>
              </div>
              <ShieldCheck className="h-5 w-5 text-[#5577ff]" />
            </div>

            <div className="p-5 space-y-4">
              {/* From account */}
              <div>
                <label className="text-[11px] font-medium text-[#444466] uppercase tracking-widest">From</label>
                <div className="mt-1 flex gap-2">
                  {ACCOUNTS.map((a, i) => (
                    <button
                      key={a.value}
                      onClick={() => setSelectedAccount(i)}
                      className={cn(
                        "flex-1 text-xs py-2 px-3 rounded-lg border transition-colors duration-150 text-left",
                        selectedAccount === i
                          ? "border-[#5577ff] bg-[#0d1433] text-[#f0f0fa] font-medium"
                          : "border-[#1a1a2e] text-[#8888a8] hover:border-[#2a2a3a]"
                      )}
                    >
                      {a.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Amount */}
              <div>
                <label className="text-[11px] font-medium text-[#444466] uppercase tracking-widest">Amount</label>
                <div className="mt-1 relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8888a8] font-medium text-sm">$</span>
                  <input
                    type="text"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full bg-[#16161f] border border-[#1a1a2e] rounded-lg pl-7 pr-12 py-2.5 text-xl font-semibold text-[#f0f0fa] focus:outline-hidden focus:ring-2 focus:ring-[#5577ff]/50 focus:border-[#5577ff] transition-colors duration-150"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[#555570]">USD</span>
                </div>
              </div>

              {/* To */}
              <div>
                <label className="text-[11px] font-medium text-[#444466] uppercase tracking-widest">To</label>
                <div className="mt-1 space-y-2">
                  {RECIPIENTS.map((r, i) => (
                    <button
                      key={r.name}
                      onClick={() => setSelectedRecipient(i)}
                      className={cn(
                        "w-full flex items-center gap-3 p-3 rounded-lg border transition-colors duration-150 text-left",
                        selectedRecipient === i
                          ? "border-[#5577ff] bg-[#0d1433]"
                          : "border-[#1a1a2e] hover:border-[#2a2a3a]"
                      )}
                    >
                      <span className="w-8 h-8 rounded-full bg-[#16161f] border border-[#2233aa] flex items-center justify-center text-xs font-bold text-[#5577ff] shrink-0">
                        {r.initials}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-[#f0f0fa]">{r.name}</p>
                        <p className="text-xs text-[#555570]">{r.bank}</p>
                      </div>
                      {selectedRecipient === i && (
                        <Check className="h-4 w-4 text-[#5577ff] shrink-0" />
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Note */}
              <div>
                <label className="text-[11px] font-medium text-[#444466] uppercase tracking-widest">Note (optional)</label>
                <input
                  type="text"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  className="mt-1 w-full bg-[#16161f] border border-[#1a1a2e] rounded-lg px-3 py-2 text-sm text-[#f0f0fa] focus:outline-hidden focus:ring-2 focus:ring-[#5577ff]/50 focus:border-[#5577ff] transition-colors duration-150"
                />
              </div>

              {/* Summary */}
              <div className="rounded-lg bg-[#16161f] border border-[#1a1a2e] px-4 py-3 flex items-center gap-3 text-sm">
                <div className="w-8 h-8 rounded-full bg-[#0d1433] border border-[#2233aa] flex items-center justify-center text-xs font-bold text-[#5577ff] shrink-0">
                  {recipient.initials}
                </div>
                <div className="flex-1">
                  <p className="font-medium text-[#f0f0fa]">{recipient.name}</p>
                  <p className="text-xs text-[#555570]">{recipient.bank}</p>
                </div>
                <ArrowRight className="h-4 w-4 text-[#555570] shrink-0" />
                <p className="font-bold text-base text-[#f0f0fa]">${amount}</p>
              </div>

              <VouchButton
                transactionContext={tx}
                onVerified={handleVerified}
                demoMode
              />
            </div>
          </div>

          {/* API Response */}
          <div className="bg-[#111118] rounded-[10px] border border-[#1a1a2e] p-5">
            <div className="flex items-center gap-2 mb-0.5">
              <h2 className="font-semibold text-sm text-[#f0f0fa]">Vouch receipt</h2>
              {response !== null && (
                <span className="inline-flex items-center gap-1.5 text-[11px] px-2.5 py-0.5 rounded-full bg-[#0a1a10] text-[#44cc88] border border-[#1a5533]">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#44cc88]" />
                  Verified
                </span>
              )}
            </div>
            <p className="text-xs text-[#555570] mb-3">
              PQC-signed proof of biometric authorization
            </p>

            <div
              className="border border-[#1a1a2e] border-l-2 border-l-[#5577ff] rounded-lg overflow-auto bg-[#080810]"
              style={{ minHeight: 120 }}
            >
              {response === null ? (
                <p className="text-xs text-[#444466] h-28 flex items-center justify-center font-mono">
                  No receipt yet
                </p>
              ) : (
                <pre className="p-4 text-xs font-mono leading-relaxed text-[#44cc88] overflow-auto">
                  {response}
                </pre>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
