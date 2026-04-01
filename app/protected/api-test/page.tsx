"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Copy, Check } from "lucide-react";

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  async function copy() {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }
  return (
    <button onClick={copy} className="ml-2 text-muted-foreground hover:text-foreground transition-colors">
      {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
    </button>
  );
}

const DEFAULT_CONTEXT = JSON.stringify({ amount: 500, currency: "USD", merchant: "Acme Inc" }, null, 2);

export default function ApiTestPage() {
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [keyName, setKeyName] = useState("My API Key");
  const [generatingKey, setGeneratingKey] = useState(false);

  const [action, setAction] = useState("approve_payment");
  const [contextJson, setContextJson] = useState(DEFAULT_CONTEXT);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<Record<string, unknown> | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function generateKey() {
    setGeneratingKey(true);
    setError(null);
    try {
      const res = await fetch("/api/v1/keys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: keyName }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Failed to generate key");
      setApiKey(json.key);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Error");
    } finally {
      setGeneratingKey(false);
    }
  }

  async function createChallenge() {
    if (!apiKey) { setError("Generate an API key first"); return; }
    setSubmitting(true);
    setError(null);
    setResult(null);
    try {
      let transaction_context: unknown;
      try {
        transaction_context = JSON.parse(contextJson);
      } catch {
        throw new Error("transaction_context must be valid JSON");
      }
      const res = await fetch("/api/vouch/challenge", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({ action, transaction_context }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? `Error ${res.status}`);
      setResult(json);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Error");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex-1 w-full flex flex-col gap-8 max-w-2xl">
      <div>
        <h1 className="font-bold text-2xl">API Console</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Generate an API key and test the Vouch fraud prevention API.
        </p>
      </div>

      {/* Section 1: API Key */}
      <section className="flex flex-col gap-4 border rounded-lg p-6">
        <h2 className="font-semibold text-lg">1. API Key</h2>
        <div className="flex gap-2">
          <Input
            placeholder="Key name"
            value={keyName}
            onChange={(e) => setKeyName(e.target.value)}
            className="max-w-xs"
          />
          <Button onClick={generateKey} disabled={generatingKey}>
            {generatingKey ? "Generating…" : "Generate New Key"}
          </Button>
        </div>
        {apiKey && (
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2 bg-muted rounded-md px-3 py-2 font-mono text-sm break-all">
              <span className="flex-1">{apiKey}</span>
              <CopyButton text={apiKey} />
            </div>
            <p className="text-xs text-amber-600 font-medium">
              Copy this key now — it will not be shown again.
            </p>
          </div>
        )}
      </section>

      {/* Section 2: Create Challenge */}
      <section className="flex flex-col gap-4 border rounded-lg p-6">
        <h2 className="font-semibold text-lg">2. Create Challenge</h2>
        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium">
              Action <span className="text-destructive">*</span>
            </label>
            <Input
              placeholder="e.g. approve_payment"
              value={action}
              onChange={(e) => setAction(e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium">
              Transaction Context <span className="text-destructive">*</span>
              <span className="text-muted-foreground font-normal ml-1">(JSON)</span>
            </label>
            <textarea
              className="w-full min-h-[120px] rounded-md border bg-background px-3 py-2 font-mono text-sm resize-y focus:outline-none focus:ring-2 focus:ring-ring"
              value={contextJson}
              onChange={(e) => setContextJson(e.target.value)}
            />
          </div>
        </div>
        <Button onClick={createChallenge} disabled={submitting || !action}>
          {submitting ? "Creating…" : "Create Challenge →"}
        </Button>
      </section>

      {error && (
        <p className="text-destructive text-sm border border-destructive/30 rounded-md px-4 py-2 bg-destructive/5">
          {error}
        </p>
      )}

      {result && (
        <section className="flex flex-col gap-4 border rounded-lg p-6">
          <h2 className="font-semibold text-lg">3. Result</h2>
          <p className="text-sm text-muted-foreground">
            Pass <code className="bg-muted px-1 rounded text-xs">webauthn_options</code> to the{" "}
            <code className="bg-muted px-1 rounded text-xs">VouchButton</code> SDK on your frontend,
            then POST the assertion to{" "}
            <code className="bg-muted px-1 rounded text-xs">/api/vouch/verify/{"{challenge_id}"}</code>.
          </p>
          <pre className="bg-muted rounded-md p-4 text-xs overflow-x-auto whitespace-pre-wrap break-all">
            {JSON.stringify(result, null, 2)}
          </pre>
        </section>
      )}
    </div>
  );
}
