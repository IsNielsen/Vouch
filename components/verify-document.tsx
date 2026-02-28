"use client";

import { useState } from "react";
import {
  CheckCircle,
  XCircle,
  Clock,
  Upload,
  ChevronDown,
  ChevronUp,
  Shield,
} from "lucide-react";
import type { VerifiedSignature } from "@/app/verify/[sessionId]/page";

type Session = {
  id: string;
  file_name: string;
  created_at: string;
  status: string;
};

type Props = {
  session: Session;
  signatures: VerifiedSignature[];
  pdfUrl: string | null;
};

export function VerifyDocument({ session, signatures, pdfUrl }: Props) {
  const [hashResult, setHashResult] = useState<"match" | "mismatch" | "insecure" | null>(null);
  const [showTechnical, setShowTechnical] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const isSigned = session.status === "signed";
  const allPqcVerified = signatures.length > 0 && signatures.every((s) => s.pqcVerified);

  async function handleFile(file: File) {
    if (!crypto.subtle) {
      setHashResult("insecure");
      return;
    }
    const buf = await file.arrayBuffer();
    const hashBuf = await crypto.subtle.digest("SHA-256", buf);
    const hex = Array.from(new Uint8Array(hashBuf))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
    const stored = signatures[0]?.document_hash;
    setHashResult(stored && hex === stored ? "match" : "mismatch");
  }

  function onFileInput(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-3 flex-wrap">
          <h1 className="font-bold text-xl">{session.file_name}</h1>
          {isSigned && allPqcVerified ? (
            <span className="inline-flex items-center gap-1 text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 px-2 py-0.5 rounded-full">
              <CheckCircle className="h-3 w-3" /> Verified
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 text-xs font-medium bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400 px-2 py-0.5 rounded-full">
              <Clock className="h-3 w-3" /> Pending
            </span>
          )}
        </div>
        <p className="text-sm text-muted-foreground">
          Uploaded{" "}
          {new Date(session.created_at).toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
        </p>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* PDF Preview */}
        {pdfUrl && (
          <div className="flex-1 min-h-[500px] border rounded-lg overflow-hidden bg-muted">
            <iframe
              src={pdfUrl}
              className="w-full h-full min-h-[500px]"
              title={session.file_name}
            />
          </div>
        )}

        {/* Sidebar */}
        <div className="lg:w-80 flex flex-col gap-4">
          {/* Signatures */}
          <div className="border rounded-lg p-4 flex flex-col gap-3">
            <h2 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground">
              Signatures {signatures.length > 0 && `(${signatures.length})`}
            </h2>
            {signatures.length === 0 ? (
              <p className="text-sm text-muted-foreground">No signatures yet.</p>
            ) : (
              <div className="flex flex-col gap-4">
                {signatures.map((sig) => (
                  <div key={sig.id} className="flex flex-col gap-1">
                    <div className="flex items-center gap-1.5">
                      <CheckCircle className="h-3.5 w-3.5 text-green-500 shrink-0" />
                      <span className="text-sm font-medium truncate">{sig.signerEmail}</span>
                    </div>
                    <p className="text-xs text-muted-foreground pl-5">
                      {new Date(sig.signed_at).toLocaleString("en-US", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                    {sig.ip_address && (
                      <p className="text-xs text-muted-foreground pl-5">IP: {sig.ip_address}</p>
                    )}
                    {sig.auth_method && (
                      <p className="text-xs text-muted-foreground pl-5">{sig.auth_method}</p>
                    )}
                    <div className="pl-5 mt-0.5">
                      {sig.pqcVerified ? (
                        <span className="inline-flex items-center gap-1 text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 px-2 py-0.5 rounded-full">
                          <Shield className="h-3 w-3" /> Cryptographic signature valid
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 px-2 py-0.5 rounded-full">
                          <XCircle className="h-3 w-3" /> Invalid signature
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Document Integrity */}
          <div className="border rounded-lg p-4 flex flex-col gap-3">
            <h2 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground">
              Document Integrity
            </h2>
            <p className="text-xs text-muted-foreground">
              Upload the original document to verify it hasn&apos;t been tampered with.
            </p>
            <label
              className={`flex flex-col items-center justify-center gap-2 border-2 border-dashed rounded-lg p-4 cursor-pointer transition-colors ${
                isDragging
                  ? "border-primary bg-primary/5"
                  : "border-muted-foreground/30 hover:border-primary/50"
              }`}
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={onDrop}
            >
              <Upload className="h-5 w-5 text-muted-foreground" />
              <span className="text-xs text-muted-foreground text-center">
                Drop PDF here or click to upload
              </span>
              <input
                type="file"
                accept=".pdf,application/pdf"
                className="hidden"
                onChange={onFileInput}
              />
            </label>
            {hashResult && (
              <div
                className={`flex items-center gap-2 text-sm font-medium ${
                  hashResult === "match"
                    ? "text-green-600 dark:text-green-400"
                    : "text-red-600 dark:text-red-400"
                }`}
              >
                {hashResult === "match" ? (
                  <>
                    <CheckCircle className="h-4 w-4 shrink-0" /> Document matches — not tampered
                  </>
                ) : hashResult === "insecure" ? (
                  <>
                    <XCircle className="h-4 w-4 shrink-0" /> Hashing requires a secure (HTTPS) connection
                  </>
                ) : (
                  <>
                    <XCircle className="h-4 w-4 shrink-0" /> Hash mismatch — document may be
                    altered
                  </>
                )}
              </div>
            )}
          </div>

          {/* Technical Details */}
          {signatures.length > 0 && (
            <div className="border rounded-lg p-4 flex flex-col gap-3">
              <button
                className="flex items-center justify-between text-sm font-semibold uppercase tracking-wide text-muted-foreground w-full"
                onClick={() => setShowTechnical((v) => !v)}
              >
                Technical Details
                {showTechnical ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </button>
              {showTechnical &&
                signatures.map((sig) => (
                  <div key={sig.id} className="flex flex-col gap-2 text-xs">
                    <div>
                      <span className="font-medium text-muted-foreground">
                        Document hash (SHA-256)
                      </span>
                      <p className="font-mono break-all mt-0.5">{sig.document_hash}</p>
                    </div>
                    <div>
                      <span className="font-medium text-muted-foreground">Credential ID</span>
                      <p className="font-mono break-all mt-0.5">{sig.credential_id}</p>
                    </div>
                    <div>
                      <span className="font-medium text-muted-foreground">
                        Public key (ML-DSA-65)
                      </span>
                      <p className="font-mono break-all mt-0.5">
                        {sig.pqc_public_key?.slice(0, 64)}…
                      </p>
                    </div>
                    <div>
                      <span className="font-medium text-muted-foreground">Verify hash locally</span>
                      <pre className="mt-0.5 bg-muted p-2 rounded text-xs overflow-x-auto">{`openssl dgst -sha256 -binary <file> | xxd -p -c 256`}</pre>
                    </div>
                  </div>
                ))}
            </div>
          )}

          {/* Legal Notice */}
          <div className="border rounded-lg p-4 text-xs text-muted-foreground flex flex-col gap-2">
            <p className="font-semibold text-foreground">Legal Notice</p>
            <p>
              Each signer authenticated with a registered passkey requiring biometric or PIN
              verification (WebAuthn Level 2, <code>userVerification: required</code>). The
              document hash was cryptographically bound to the signer&apos;s credential using
              ML-DSA-65 (NIST FIPS 204), a post-quantum digital signature scheme. The signature
              is independently verifiable using the stored public key without any shared secret.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
