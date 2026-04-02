"use client";

import { useEffect, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Copy, Check, RefreshCw, Trash2 } from "lucide-react";

// ---- Types ----------------------------------------------------------------

interface ApiKey {
  id: string;
  name: string;
  created_at: string;
}

interface Stats {
  this_month: { total: number; verified: number; failed: number; pending: number };
  failed_reasons: { reason: string; count: number }[];
}

interface AuditEntry {
  id: string;
  created_at: string;
  status: string;
  failure_reason?: string | null;
  user_id?: string | null;
  transaction_context?: Record<string, unknown> | null;
  device_id?: string | null;
  ip_address?: string | null;
  verified_at?: string | null;
}

// ---- Helpers ---------------------------------------------------------------

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  async function copy() {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }
  return (
    <button onClick={copy} className="ml-2 text-muted-foreground hover:text-foreground transition-colors shrink-0">
      {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
    </button>
  );
}

function statusBadge(status: string) {
  const variants: Record<string, string> = {
    verified: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
    failed: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
    pending: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
    expired: "bg-muted text-muted-foreground",
  };
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${variants[status] ?? variants.expired}`}>
      {status}
    </span>
  );
}

function fmt(iso: string) {
  return new Date(iso).toLocaleString(undefined, {
    month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
  });
}

function truncate(s: string | null | undefined, n = 12) {
  if (!s) return "—";
  return s.length > n ? s.slice(0, n) + "…" : s;
}

// ---- Dashboard -------------------------------------------------------------

export default function DashboardPage() {
  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [audit, setAudit] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const [keyName, setKeyName] = useState("My API Key");
  const [newKey, setNewKey] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [revoking, setRevoking] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    const [keysRes, statsRes, auditRes] = await Promise.all([
      fetch("/api/v1/keys"),
      fetch("/api/v1/stats"),
      fetch("/api/v1/audit"),
    ]);
    const [keysJson, statsJson, auditJson] = await Promise.all([
      keysRes.json(), statsRes.json(), auditRes.json(),
    ]);
    setKeys(keysJson.keys ?? []);
    setStats(statsJson);
    setAudit(auditJson.entries ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  async function createKey() {
    if (!keyName.trim()) return;
    setCreating(true);
    setError(null);
    setNewKey(null);
    try {
      const res = await fetch("/api/v1/keys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: keyName }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Failed");
      setNewKey(json.key);
      await loadData();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Error");
    } finally {
      setCreating(false);
    }
  }

  async function revokeKey(id: string) {
    setRevoking(id);
    setError(null);
    try {
      const res = await fetch(`/api/v1/keys/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        throw new Error(json.error ?? "Failed to revoke");
      }
      if (newKey) setNewKey(null); // clear displayed key if it was for this key
      await loadData();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Error");
    } finally {
      setRevoking(null);
    }
  }

  async function rotateKey(id: string, name: string) {
    setRevoking(id);
    setError(null);
    setNewKey(null);
    try {
      // revoke old, create new with same name
      await fetch(`/api/v1/keys/${id}`, { method: "DELETE" });
      const res = await fetch("/api/v1/keys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Failed to rotate");
      setNewKey(json.key);
      await loadData();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Error");
    } finally {
      setRevoking(null);
    }
  }

  return (
    <div className="flex-1 w-full flex flex-col gap-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Developer Dashboard</h1>
        <Button variant="outline" size="sm" onClick={loadData} disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {error && (
        <p className="text-destructive text-sm border border-destructive/30 rounded-md px-4 py-2 bg-destructive/5">
          {error}
        </p>
      )}

      {/* ---- API Keys ---- */}
      <section className="flex flex-col gap-4 border rounded-lg p-6">
        <h2 className="font-semibold text-lg">API Keys</h2>

        {loading ? (
          <p className="text-sm text-muted-foreground">Loading…</p>
        ) : keys.length === 0 ? (
          <p className="text-sm text-muted-foreground">No API keys yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-muted-foreground">
                  <th className="pb-2 font-medium">Name</th>
                  <th className="pb-2 font-medium">Created</th>
                  <th className="pb-2 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {keys.map((k) => (
                  <tr key={k.id}>
                    <td className="py-2 pr-4 font-mono text-xs">{k.name}</td>
                    <td className="py-2 pr-4 text-muted-foreground">{fmt(k.created_at)}</td>
                    <td className="py-2 text-right flex gap-2 justify-end">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => rotateKey(k.id, k.name)}
                        disabled={revoking === k.id}
                      >
                        <RefreshCw className="h-3 w-3 mr-1" />
                        Rotate
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => revokeKey(k.id)}
                        disabled={revoking === k.id}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-3 w-3 mr-1" />
                        Revoke
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {newKey && (
          <div className="flex flex-col gap-1 mt-2">
            <div className="flex items-center bg-muted rounded-md px-3 py-2 font-mono text-xs break-all">
              <span className="flex-1">{newKey}</span>
              <CopyButton text={newKey} />
            </div>
            <p className="text-xs text-amber-600 font-medium">
              Copy this key now — it will not be shown again.
            </p>
          </div>
        )}

        <div className="flex gap-2 pt-2 border-t">
          <Input
            placeholder="Key name"
            value={keyName}
            onChange={(e) => setKeyName(e.target.value)}
            className="max-w-xs"
          />
          <Button onClick={createKey} disabled={creating || !keyName.trim()}>
            {creating ? "Creating…" : "Create Key"}
          </Button>
        </div>
      </section>

      {/* ---- This Month ---- */}
      <section className="flex flex-col gap-4 border rounded-lg p-6">
        <h2 className="font-semibold text-lg">This Month</h2>
        {loading || !stats ? (
          <p className="text-sm text-muted-foreground">Loading…</p>
        ) : (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {(
                [
                  ["Total", stats.this_month.total, "text-foreground"],
                  ["Verified", stats.this_month.verified, "text-green-600"],
                  ["Failed", stats.this_month.failed, "text-red-600"],
                  ["Pending", stats.this_month.pending, "text-yellow-600"],
                ] as [string, number, string][]
              ).map(([label, value, color]) => (
                <div key={label} className="flex flex-col gap-1 border rounded-md p-4">
                  <span className="text-xs text-muted-foreground">{label}</span>
                  <span className={`text-2xl font-bold ${color}`}>{value}</span>
                </div>
              ))}
            </div>

            {stats.failed_reasons.length > 0 && (
              <div className="flex flex-col gap-2">
                <p className="text-sm font-medium">Failed — breakdown</p>
                <ul className="flex flex-col gap-1">
                  {stats.failed_reasons.map(({ reason, count }) => (
                    <li key={reason} className="flex items-center justify-between text-sm border rounded-md px-3 py-1.5">
                      <span className="text-muted-foreground">{reason}</span>
                      <Badge variant="secondary">{count}</Badge>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </>
        )}
      </section>

      {/* ---- Audit Log ---- */}
      <section className="flex flex-col gap-4 border rounded-lg p-6">
        <h2 className="font-semibold text-lg">Audit Log</h2>
        {loading ? (
          <p className="text-sm text-muted-foreground">Loading…</p>
        ) : audit.length === 0 ? (
          <p className="text-sm text-muted-foreground">No verifications yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-muted-foreground">
                  <th className="pb-2 font-medium pr-4">When</th>
                  <th className="pb-2 font-medium pr-4">Status</th>
                  <th className="pb-2 font-medium pr-4">User ID</th>
                  <th className="pb-2 font-medium pr-4">Device ID</th>
                  <th className="pb-2 font-medium pr-4">IP</th>
                  <th className="pb-2 font-medium pr-4">Action</th>
                  <th className="pb-2 font-medium">Reason</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {audit.map((e) => (
                  <tr key={e.id} className="hover:bg-muted/30 transition-colors">
                    <td className="py-2 pr-4 text-muted-foreground whitespace-nowrap">{fmt(e.created_at)}</td>
                    <td className="py-2 pr-4">{statusBadge(e.status)}</td>
                    <td className="py-2 pr-4 font-mono text-xs">{truncate(e.user_id)}</td>
                    <td className="py-2 pr-4 font-mono text-xs">{truncate(e.device_id)}</td>
                    <td className="py-2 pr-4 font-mono text-xs">{e.ip_address ?? "—"}</td>
                    <td className="py-2 pr-4 text-xs">
                      {(e.transaction_context as { action?: string } | null)?.action ?? "—"}
                    </td>
                    <td className="py-2 text-xs text-muted-foreground">{e.failure_reason ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
