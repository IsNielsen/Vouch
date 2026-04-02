# Vouch-Link API

## Overview

The Vouch-Link API lets third-party applications trigger document signing programmatically. Send a document URL and receive a short-lived signing link to embed or share with your signer. When signing completes, Vouch posts a webhook to your server.

**Base URL:** `https://vouch.so`

---

## Authentication

All API endpoints require a Bearer token in the `Authorization` header.

### Generate a key

Keys are generated from the [Developer Dashboard](/protected/dashboard), or via the API (requires a Supabase session cookie):

```
POST /api/v1/keys
Content-Type: application/json

{ "name": "Production" }
```

Response (key shown **once** — store it securely):
```json
{ "key": "vouch_sk_...", "name": "Production" }
```

### Use the key

```
Authorization: Bearer vouch_sk_<your-key>
```

---

## Endpoints

### `POST /api/v1/sign`

Creates a signing session from a document URL and returns a Vouch signing link.

**Request**

```json
{
  "document_url": "https://example.com/contract.pdf",
  "signer_email": "alice@example.com",
  "webhook_url": "https://yourapp.com/webhooks/vouch",
  "branding": {
    "logo_url": "https://yourapp.com/logo.png",
    "primary_color": "#6366f1"
  }
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `document_url` | string | ✅ | Publicly accessible PDF URL (≤ 20 MB, `Content-Type: application/pdf`) |
| `signer_email` | string | ✅ | Email of the intended signer |
| `webhook_url` | string | — | URL to receive `signature.completed` events |
| `branding.logo_url` | string | — | Logo image URL shown on the signing page |
| `branding.primary_color` | string | — | Hex color for buttons on the signing page |

**Response `200`**

```json
{
  "session_id": "550e8400-e29b-41d4-a716-446655440000",
  "vouch_link": "https://vouch.so/sign/550e8400-e29b-41d4-a716-446655440000",
  "expires_at": null
}
```

Share `vouch_link` with your signer. They authenticate with a passkey and sign — no Vouch account required.

---

### `POST /api/v1/keys`

Generates a new API key for the authenticated user (requires Supabase session auth, not Bearer token).

**Request**

```json
{ "name": "Staging" }
```

**Response `200`**

```json
{ "key": "vouch_sk_...", "name": "Staging" }
```

The raw key is returned **once**. Store it securely — it cannot be retrieved again.

---

## Webhooks

When a signing session is completed, Vouch sends a `POST` request to your `webhook_url`:

```json
{
  "event": "signature.completed",
  "session_id": "550e8400-e29b-41d4-a716-446655440000",
  "signer_name": "Alice Smith",
  "document_hash": "sha256hexstring",
  "signed_at": "2026-03-16T12:00:00.000Z",
  "pqc_public_key": "base64encodedkey"
}
```

**Verification:** Compare `document_hash` (SHA-256 of the original PDF bytes) against your own copy to confirm the correct document was signed.

**Delivery:** Best-effort, fire-and-forget — no retries. Your endpoint should respond within 10 seconds. Failures are silently ignored.

---

## Branding

Pass `branding` in the session creation request to white-label the signing page:

- **`logo_url`** — Displayed above the signing form instead of the default Vouch wordmark. Use a transparent PNG or SVG for best results.
- **`primary_color`** — Hex color (e.g. `"#6366f1"`) applied to action buttons.

---

## Errors

| Status | Meaning |
|--------|---------|
| `400` | Malformed request body |
| `401` | Missing or invalid API key |
| `413` | Document exceeds 20 MB |
| `422` | `document_url` unreachable, wrong content-type, or required fields missing |
| `500` | Internal server error |

---

## Quick-start

```bash
# 1. Generate a key (from the dashboard or via session-authenticated request)
KEY="vouch_sk_your_key_here"

# 2. Create a signing session
curl -X POST https://vouch.so/api/v1/sign \
  -H "Authorization: Bearer $KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "document_url": "https://www.w3.org/WAI/WCAG21/wcag21.pdf",
    "signer_email": "alice@example.com",
    "webhook_url": "https://yourapp.com/webhooks/vouch"
  }'

# 3. Share the vouch_link from the response with your signer
```
