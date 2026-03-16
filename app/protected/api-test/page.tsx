"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Copy, Check, ExternalLink } from "lucide-react";

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

export default function ApiTestPage() {
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [keyName, setKeyName] = useState("My API Key");
  const [generatingKey, setGeneratingKey] = useState(false);

  const [documentUrl, setDocumentUrl] = useState("");
  const [signerEmail, setSignerEmail] = useState("");
  const [webhookUrl, setWebhookUrl] = useState("");
  const [logoUrl, setLogoUrl] = useState("");
  const [primaryColor, setPrimaryColor] = useState("#6366f1");
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

  async function createSession() {
    if (!apiKey) { setError("Generate an API key first"); return; }
    setSubmitting(true);
    setError(null);
    setResult(null);
    try {
      const body: Record<string, unknown> = {
        document_url: documentUrl,
        signer_email: signerEmail,
      };
      if (webhookUrl) body.webhook_url = webhookUrl;
      if (logoUrl || primaryColor) {
        body.branding = {};
        if (logoUrl) (body.branding as Record<string, string>).logo_url = logoUrl;
        if (primaryColor) (body.branding as Record<string, string>).primary_color = primaryColor;
      }
      const res = await fetch("/api/v1/sign", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify(body),
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
        <h1 className="font-bold text-2xl">API Test Console</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Generate an API key and test the Vouch-Link API.
        </p>
      </div>

      {/* Section 1: API Key */}
      <section className="flex flex-col gap-4 border rounded-lg p-6">
        <h2 className="font-semibold text-lg">1. Your API Key</h2>
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
              ⚠ Copy this key now — it will not be shown again.
            </p>
          </div>
        )}
      </section>

      {/* Section 2: Create Session */}
      <section className="flex flex-col gap-4 border rounded-lg p-6">
        <h2 className="font-semibold text-lg">2. Create Signing Session</h2>
        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium">Document URL <span className="text-destructive">*</span></label>
            <Input
              placeholder="https://example.com/document.pdf"
              value={documentUrl}
              onChange={(e) => setDocumentUrl(e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium">Signer Email <span className="text-destructive">*</span></label>
            <Input
              type="email"
              placeholder="signer@example.com"
              value={signerEmail}
              onChange={(e) => setSignerEmail(e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium">Webhook URL <span className="text-muted-foreground text-xs">(optional)</span></label>
            <Input
              placeholder="https://yourapp.com/webhooks/vouch"
              value={webhookUrl}
              onChange={(e) => setWebhookUrl(e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium">Brand Logo URL <span className="text-muted-foreground text-xs">(optional)</span></label>
            <Input
              placeholder="https://yourapp.com/logo.png"
              value={logoUrl}
              onChange={(e) => setLogoUrl(e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium">Brand Primary Color <span className="text-muted-foreground text-xs">(optional)</span></label>
            <div className="flex gap-2 items-center">
              <input
                type="color"
                value={primaryColor}
                onChange={(e) => setPrimaryColor(e.target.value)}
                className="h-9 w-14 rounded cursor-pointer border"
              />
              <Input
                value={primaryColor}
                onChange={(e) => setPrimaryColor(e.target.value)}
                className="max-w-[120px] font-mono"
              />
            </div>
          </div>
        </div>
        <Button
          onClick={createSession}
          disabled={submitting || !documentUrl || !signerEmail}
        >
          {submitting ? "Creating…" : "Create Session →"}
        </Button>
      </section>

      {/* Error */}
      {error && (
        <p className="text-destructive text-sm border border-destructive/30 rounded-md px-4 py-2 bg-destructive/5">
          {error}
        </p>
      )}

      {/* Section 3: Result */}
      {result && (
        <section className="flex flex-col gap-4 border rounded-lg p-6">
          <h2 className="font-semibold text-lg">3. Result</h2>
          {typeof result.vouch_link === "string" && (
            <div className="flex items-center gap-2 flex-wrap">
              <a
                href={result.vouch_link}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary underline underline-offset-2 text-sm font-medium break-all"
              >
                {result.vouch_link}
              </a>
              <a href={result.vouch_link} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground">
                <ExternalLink className="h-4 w-4" />
              </a>
              <CopyButton text={result.vouch_link} />
            </div>
          )}
          <pre className="bg-muted rounded-md p-4 text-xs overflow-x-auto whitespace-pre-wrap break-all">
            {JSON.stringify(result, null, 2)}
          </pre>
        </section>
      )}
    </div>
  );
}
