**This is just a guideline, do not implement anything but what the original prompt wanted**

# Project Vouch: Biometric Post-Quantum E-Signatures
**Event:** HackUSU 2026 (Feb 27-28)
**Track:** Tech Start-Up / Data App Factory

## 1. Project Overview
Vouch is a high-security e-signature platform that replaces traditional "drawn" signatures with biometric verification (FaceID/TouchID) tied to a document hash. It aims for ESIGN Act compliance while ensuring privacy by never storing raw biometric data.

## 2. Technical Stack
- **Framework:** Next.js 14+ (App Router), Tailwind CSS
- **Backend/Database:** Supabase (Auth, PostgreSQL, Storage, Realtime)
- **Biometrics:** WebAuthn API / Passkeys
- **Cryptography:** - Hashing: SHA-256
  - Signature: Post-Quantum Cryptography (PQC) - specifically **ML-DSA (Dilithium)**
- **Deployment:** Vercel

## 3. Core Architecture: "Phone-First" Workflow
The system uses a decoupled two-device flow to ensure the private key stays in a hardware-backed Secure Enclave (the phone).

1. **Desktop (Initiator):** - User uploads a PDF.
   - Client-side SHA-256 hash is generated.
   - PDF is stored in Supabase; Hash is stored in the `documents` table.
   - A unique `session_id` and QR code are generated.

2. **Mobile (Signer):** - User scans QR code to open a unique signing URL.
   - WebAuthn triggers the phone's biometric check.
   - Upon success, the phone signs the **document hash** using a PQC private key.
   - The signature and public key are pushed to Supabase.

3. **Verification (Real-time):**
   - The Desktop dashboard uses Supabase Realtime to listen for the signature.
   - Once received, it displays a "Document Vouched" success state.

## 4. Database Schema (Supabase)
### `documents`
- `id`: uuid (PK)
- `owner_id`: uuid (FK to users)
- `file_url`: text
- `file_hash`: text (SHA-256)
- `status`: enum (pending, signed, verified)

### `signatures`
- `id`: uuid
- `document_id`: uuid (FK)
- `pqc_signature`: text
- `public_key`: text
- `metadata`: jsonb (IP address, device type, timestamp)

## 5. Security & Privacy Constraints (BIPA Compliance)
- **Zero Biometric Storage:** We do not store fingerprints or face maps. We only store the *cryptographic proof* that the device's biometric check was passed.
- **Hardware Bound:** The private key must be generated within the device's Secure Enclave/TPM via WebAuthn.

## 6. MVP Goals for Hackathon
- [ ] Functional PDF upload to Supabase.
- [ ] QR code generation linked to a unique document ID.
- [ ] Mobile-responsive signing page with WebAuthn trigger.
- [ ] Real-time UI update on Desktop when Mobile signs.
- [ ] Simple "Verification" tool to check a signature against a hash.
