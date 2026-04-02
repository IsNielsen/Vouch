# Vouch API Integration Guide

Vouch provides biometric fraud-prevention challenges backed by WebAuthn + post-quantum cryptography (ML-DSA-65). Your backend creates a challenge, your frontend collects a biometric assertion from the user's registered passkey, your backend verifies it, and Vouch returns a cryptographically signed receipt.

---

## Prerequisites

| Requirement | Detail |
|-------------|--------|
| API key | Issued by the Vouch dashboard — store it **server-side only** |
| Registered user | The user must have a passkey registered with Vouch before they can verify |
| HTTPS | All API calls must originate from an HTTPS context |

---

## Authentication

Every request to `/api/vouch/*` must include:

```
Authorization: Bearer <your_api_key>
```

Missing or invalid keys return `401 Unauthorized`.

---

## Flow Overview

```
Your backend          Vouch API               User's browser
     │                    │                        │
     │── POST /challenge ─▶│                        │
     │◀── challenge_id ───│                        │
     │    webauthn_options │                        │
     │                    │                        │
     │─────────── webauthn_options ───────────────▶│
     │                         navigator.credentials.get()
     │◀──────────────── assertion ────────────────│
     │                    │                        │
     │── POST /verify ────▶│                        │
     │◀── signed receipt ─│                        │
```

The full round-trip must complete within **300 seconds** (5 minutes) — after that the challenge expires.

---

## Step 1 — Create a Challenge

**`POST /api/vouch/challenge`**

Call this from your **server**. Never expose your API key to the browser.

### Request

```http
POST https://<vouch-host>/api/vouch/challenge
Authorization: Bearer <api_key>
Content-Type: application/json
```

```json
{
  "action": "confirm_payment",
  "transaction_context": {
    "amount": 4999,
    "currency": "USD",
    "recipient": "acme-corp",
    "initiated_at": "2026-04-01T12:00:00Z"
  },
  "user_id": "usr_abc123",
  "webhook_url": "https://yoursite.com/webhooks/vouch"
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `action` | string | **yes** | Human-readable label for the action being authorized (e.g. `"confirm_payment"`, `"approve_transfer"`) |
| `transaction_context` | object | **yes** | Arbitrary key-value data describing the transaction. Must be non-empty. This is what gets signed. |
| `user_id` | string | no | Your internal user identifier — stored with the challenge for your records |
| `webhook_url` | string | no | HTTPS URL to receive a `vouch.verified` event after successful verification (see [Webhooks](#webhooks)) |

### Response `200`

```json
{
  "challenge_id": "550e8400-e29b-41d4-a716-446655440000",
  "webauthn_options": { ... },
  "expires_in": 300
}
```

| Field | Description |
|-------|-------------|
| `challenge_id` | UUID — pass to Step 3 |
| `webauthn_options` | Pass directly to `navigator.credentials.get()` in the browser |
| `expires_in` | Seconds until the challenge expires (always 300) |

---

## Step 2 — Collect the Biometric Assertion (Browser)

Pass `webauthn_options` from Step 1 to the WebAuthn API. The `challenge` field inside is a one-time token; do not modify it.

### Vanilla JS

```js
async function collectAssertion(webauthnOptions) {
  // Decode the base64url challenge Vouch sends
  const options = {
    ...webauthnOptions,
    challenge: base64urlToBuffer(webauthnOptions.challenge),
    allowCredentials: (webauthnOptions.allowCredentials ?? []).map(c => ({
      ...c,
      id: base64urlToBuffer(c.id),
    })),
  };

  const credential = await navigator.credentials.get({ publicKey: options });

  // Re-encode for JSON transport
  return {
    id: credential.id,
    rawId: bufferToBase64url(credential.rawId),
    type: credential.type,
    response: {
      authenticatorData: bufferToBase64url(credential.response.authenticatorData),
      clientDataJSON: bufferToBase64url(credential.response.clientDataJSON),
      signature: bufferToBase64url(credential.response.signature),
      userHandle: credential.response.userHandle
        ? bufferToBase64url(credential.response.userHandle)
        : null,
    },
  };
}

// Helpers
function base64urlToBuffer(b64url) {
  const bin = atob(b64url.replace(/-/g, '+').replace(/_/g, '/'));
  return Uint8Array.from(bin, c => c.charCodeAt(0)).buffer;
}

function bufferToBase64url(buffer) {
  return btoa(String.fromCharCode(...new Uint8Array(buffer)))
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}
```

### With `@simplewebauthn/browser` (recommended)

```bash
npm install @simplewebauthn/browser
```

```js
import { startAuthentication } from '@simplewebauthn/browser';

const assertion = await startAuthentication({ optionsJSON: webauthnOptions });
```

`startAuthentication` handles all encoding/decoding automatically.

Send `assertion` to your backend — **never directly to Vouch**. Your backend performs Step 3.

---

## Step 3 — Verify the Assertion

**`POST /api/vouch/verify/{challengeId}`**

Call this from your **server** using the `challenge_id` from Step 1 and the `assertion` from Step 2.

### Request

```http
POST https://<vouch-host>/api/vouch/verify/550e8400-e29b-41d4-a716-446655440000
Authorization: Bearer <api_key>
Content-Type: application/json
```

```json
{
  "assertion": {
    "id": "credentialId...",
    "rawId": "credentialId...",
    "type": "public-key",
    "response": {
      "authenticatorData": "base64url...",
      "clientDataJSON": "base64url...",
      "signature": "base64url...",
      "userHandle": null
    }
  }
}
```

### Response `200` — Verification succeeded

```json
{
  "challenge_id": "550e8400-e29b-41d4-a716-446655440000",
  "verified": true,
  "verified_at": "2026-04-01T12:01:45.000Z",
  "credential_id": "abc123...",
  "device_id": "abc123...",
  "pqc_public_key": "base64...",
  "pqc_signature": "base64...",
  "transaction_context": {
    "action": "confirm_payment",
    "context": { "amount": 4999, "currency": "USD", ... }
  }
}
```

| Field | Description |
|-------|-------------|
| `verified` | Always `true` on 200 |
| `verified_at` | ISO 8601 timestamp of verification |
| `credential_id` / `device_id` | The passkey that signed (both fields are the same value) |
| `pqc_public_key` | ML-DSA-65 public key (base64) — use this to verify the signature offline |
| `pqc_signature` | ML-DSA-65 signature over SHA-256(`transaction_context`) (base64) |
| `transaction_context` | The context that was signed — verify this matches what you sent |

**Store `pqc_signature` and `pqc_public_key` in your database** alongside the transaction as a non-repudiation record.

---

## Step 4 — Poll Challenge Status (Optional)

If you need to check challenge status asynchronously (e.g. from a separate server process):

**`GET /api/vouch/challenge/{challengeId}`**

```http
GET https://<vouch-host>/api/vouch/challenge/550e8400-e29b-41d4-a716-446655440000
Authorization: Bearer <api_key>
```

### Response

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "created_at": "2026-04-01T12:00:00.000Z",
  "expires_at": "2026-04-01T12:05:00.000Z",
  "status": "verified",
  "transaction_context": { ... },
  "user_id": "usr_abc123",
  "verified_at": "2026-04-01T12:01:45.000Z",
  "credential_id": "abc123...",
  "pqc_signature": "base64...",
  "pqc_public_key": "base64..."
}
```

`status` is one of:

| Value | Meaning |
|-------|---------|
| `pending` | Waiting for user assertion |
| `verified` | Biometric check passed, receipt issued |
| `expired` | 5-minute window elapsed without verification |

---

## Webhooks

If you supply `webhook_url` in Step 1, Vouch will `POST` the following payload to your endpoint within seconds of verification:

```json
{
  "event": "vouch.verified",
  "challenge_id": "550e8400-e29b-41d4-a716-446655440000",
  "credential_id": "abc123...",
  "verified_at": "2026-04-01T12:01:45.000Z",
  "pqc_public_key": "base64...",
  "transaction_context": { ... }
}
```

**Requirements for your webhook endpoint:**
- Must be `https://` — plain HTTP or private/loopback IPs are blocked
- Must return `2xx` within 5 seconds
- Delivery is best-effort (one attempt, no retries) — always also check the verify response or poll `/challenge/{id}` for critical flows

---

## Error Reference

| Status | Body | Meaning |
|--------|------|---------|
| `400` | `{ "error": "action is required..." }` | Missing or invalid request field |
| `400` | `{ "error": "transaction_context must not be empty" }` | Empty context object |
| `400` | `{ "error": "Missing assertion" }` | Verify called without assertion body |
| `400` | `{ "error": "<webauthn error>" }` | Assertion failed cryptographic verification |
| `401` | `{ "error": "Unauthorized" }` | Invalid or missing API key |
| `404` | `{ "error": "Challenge not found" }` | Unknown challenge ID |
| `404` | `{ "error": "Passkey not found" }` | Credential ID not registered in Vouch |
| `410` | `{ "error": "Challenge expired or already used" }` | Challenge past 5-min TTL or already verified |
| `500` | `{ "error": "..." }` | Server-side error — retry with backoff |

---

## Verifying the PQC Signature Offline

The receipt is self-verifiable. No network call required:

```js
import { ml_dsa65 } from '@noble/post-quantum/ml-dsa.js';

async function verifyReceipt(receipt) {
  const contextBytes = new TextEncoder().encode(
    JSON.stringify(receipt.transaction_context)
  );
  const hashBuffer = await crypto.subtle.digest('SHA-256', contextBytes);
  const hashBytes = new Uint8Array(hashBuffer);

  const publicKey = Uint8Array.from(atob(receipt.pqc_public_key), c => c.charCodeAt(0));
  const signature = Uint8Array.from(atob(receipt.pqc_signature), c => c.charCodeAt(0));

  return ml_dsa65.verify(hashBytes, signature, publicKey);
}
```

```bash
npm install @noble/post-quantum
```

**Always verify:**
1. `receipt.transaction_context` matches what you originally sent — a signature over different context is meaningless.
2. `verified_at` is recent — define your own acceptable window.

---

## End-to-End Example (Node.js / Express)

```js
// server.js
import express from 'express';

const VOUCH_HOST = 'https://vouch.yourdomain.com';
const VOUCH_API_KEY = process.env.VOUCH_API_KEY; // never expose to browser

const app = express();
app.use(express.json());

// 1. Your backend creates the challenge and forwards options to the browser
app.post('/payment/initiate', async (req, res) => {
  const { amount, recipient } = req.body;

  const r = await fetch(`${VOUCH_HOST}/api/vouch/challenge`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${VOUCH_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      action: 'confirm_payment',
      transaction_context: { amount, recipient, initiated_at: new Date().toISOString() },
      user_id: req.user.id,
      webhook_url: 'https://yoursite.com/webhooks/vouch',
    }),
  });

  const { challenge_id, webauthn_options, expires_in } = await r.json();

  // Store challenge_id in your session so Step 3 can retrieve it
  req.session.vouchChallengeId = challenge_id;

  // Send webauthn_options to the browser
  res.json({ webauthn_options, expires_in });
});

// 2. Browser calls navigator.credentials.get(webauthn_options), sends assertion here
app.post('/payment/confirm', async (req, res) => {
  const { assertion } = req.body;
  const challengeId = req.session.vouchChallengeId;

  const r = await fetch(`${VOUCH_HOST}/api/vouch/verify/${challengeId}`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${VOUCH_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ assertion }),
  });

  if (!r.ok) {
    const err = await r.json();
    return res.status(400).json({ error: err.error });
  }

  const receipt = await r.json();

  // Store receipt for audit trail
  await db.payments.create({
    ...req.body.paymentDetails,
    vouch_challenge_id: receipt.challenge_id,
    vouch_pqc_signature: receipt.pqc_signature,
    vouch_pqc_public_key: receipt.pqc_public_key,
    vouch_verified_at: receipt.verified_at,
  });

  res.json({ success: true });
});
```

---

## Security Checklist

- [ ] API key is stored in an environment variable, never hard-coded or shipped to the browser
- [ ] `transaction_context` is constructed server-side from trusted data — never blindly echoed from user input
- [ ] Verify `receipt.transaction_context` matches what you sent before executing the transaction
- [ ] Store `pqc_signature` + `pqc_public_key` + `verified_at` for every verified transaction
- [ ] Set a short acceptable window on `verified_at` (e.g. reject if > 30s old when you receive it)
- [ ] Your webhook endpoint validates that `challenge_id` was one you created before acting on it
