# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

Be very concise in all your answers and plans. Code should be clean and simple.

I am risk at losing my job so be extra rigorous.
## Commands

```bash
npm run dev      # Start development server on localhost:3000
npm run build    # Production build
npm run lint     # ESLint check
npm test         # Vitest unit tests
```

## Environment Variables

Copy `.env.local` and set:
```
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...           # Server-only, never expose to client
NEXT_PUBLIC_WEBAUTHN_RP_NAME=...        # Optional, defaults to "Vouch"
VOUCH_API_KEY=...                       # Bearer token for /api/vouch/* routes
```

`NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` accepts either `sb_publishable_...` or the legacy anon key format.

## Architecture

**Next.js 15 App Router** + **Supabase** (cookie-based auth via `@supabase/ssr`), styled with **Tailwind CSS** and **shadcn/ui** (new-york style, neutral base color).

### Auth Flow (WebAuthn Passkey)

1. User visits `/auth/login` → `<PasskeyAuth>` tries authentication, falls back to registration
2. API routes under `/api/passkey/{register,authenticate}/{start,complete}` handle challenges stored in httpOnly cookies
3. On success, server generates a magic link via `admin.auth.admin.generateLink({ type: "magiclink" })` and returns `token_hash` for `verifyOtp()` → sets Supabase session cookie

Key files:
- `proxy.ts` (root) — middleware entry; calls `lib/supabase/proxy.ts:updateSession()` to refresh session cookies. Redirects unauthenticated users to `/auth/login` except `/`, `/login`, `/auth/*`, `/api`, `/sign/*`
- `lib/supabase/server.ts` — server-side client (create new instance per call, never store globally)
- `lib/supabase/client.ts` — browser-side client for Client Components
- `lib/supabase/admin.ts` — service-role client, server-only
- `lib/webauthn/rp.ts` — derives `rpID` + `origin` from request headers
- `components/passkey-auth.tsx` — auth UI

WebAuthn security: `residentKey: "required"`, `userVerification: "required"`, counter check on auth to detect cloned authenticators.

Use `supabase.auth.getClaims()` (fast, JWT-based) instead of `supabase.auth.getUser()` (slow, network call) when you only need auth claims.

### Document Signing Flow

1. **Upload** — `app/protected/upload/page.tsx` → `<DocumentUploader>` uploads PDF to Supabase Storage, creates a signing session in DB, redirects to QR page
2. **Share** — `app/protected/upload/[sessionId]/page.tsx` → `<QRDisplay>` shows QR code + realtime subscription for status updates
3. **Sign** — `app/sign/[sessionId]/page.tsx` (public, no auth required) → signer authenticates with passkey via `<SignButton>`
4. **Signature** — `/api/sign/[sessionId]/complete/route.ts`:
   - Verifies WebAuthn response
   - Derives ML-DSA key from `HMAC(service_role_key, "pqc-v1:" + credential_id)` — post-quantum cryptography via `@noble/post-quantum`
   - Signs SHA-256 document hash; stores `document_hash`, `pqc_signature`, `pqc_public_key`, `authenticator_data`, `ip_address`
   - Updates session status to `"signed"`, logs `signature_applied` event

### Route Structure

- `/` — Public landing page with sections (hero, features, pricing, FAQ, etc.)
- `/auth/*` — Auth pages (login, sign-up redirects to login, email-login fallback, forgot-password, etc.)
- `/protected/*` — Auth-gated: upload, QR display, signed documents list
- `/sign/[sessionId]` — Public signing page
- `/early-access` — Waitlist page
- `/api/passkey/*` — WebAuthn registration/authentication
- `/api/sign/[sessionId]/*` — Signing challenge, completion, events, send-copy
- `/api/vouch/challenge` — POST: create a fraud-prevention challenge (Bearer auth via `VOUCH_API_KEY`)
- `/api/vouch/challenge/[challengeId]` — GET: poll challenge status
- `/api/vouch/verify/[challengeId]` — POST: verify WebAuthn assertion, returns ML-DSA signed receipt

### Vouch API Flow

1. **Challenge** — `POST /api/vouch/challenge` with `{ transaction_context: {...} }` → returns `{ challenge_id, webauthn_options, expires_in: 300 }`
2. **Frontend** — pass `webauthn_options` to browser WebAuthn API, collect assertion
3. **Verify** — `POST /api/vouch/verify/[challengeId]` with `{ assertion }` → returns signed receipt with `pqc_signature`, `pqc_public_key`, `verified_at`

All `/api/vouch/*` routes require `Authorization: Bearer $VOUCH_API_KEY`.

DB table required: `vouch_challenges` (see SQL comment in `app/api/vouch/challenge/route.ts`).
Waitlist table migration: add `company text`, `use_case text` columns.

### Key Patterns

- `lib/utils.ts` exports `cn()` (clsx + tailwind-merge) and `hasEnvVars`
- shadcn/ui components in `components/ui/`. Add with `npx shadcn@latest add <component>`
- Landing page sections live in `components/sections/`
- `@/` path alias maps to project root
- Vercel Speed Insights and Analytics in `app/layout.tsx`
- DB table `signature_stats.total_signatures` powers the live signature counter on the landing page

Claude Code Technical Guidelines
Design System Access

Claude automatically reads design_brief.md when working on UI/styling tasks.

No manual invocation needed - just ask Claude to create or style components.

When Claude uses design_brief.md:

    Creating new UI components or pages
    Styling existing components
    Making visual/layout decisions
    Choosing colors, spacing, typography
    Implementing responsive behavior

Claude skips design_brief.md for:

    Bug fixes (unless styling-related)
    Backend logic, API routes, database queries
    Business logic or data processing
    Configuration changes
    Dependency updates
    Code refactoring (non-visual)
    Writing tests

Tailwind CSS v4 Setup
Required Configuration

1. postcss.config.mjs

export default {
  plugins: {
    '@tailwindcss/postcss': {},
  },
};

2. globals.css

@import "tailwindcss";

@layer base {
  :root {
    --background: 0 0% 100%;
    --foreground: 0 0% 3.9%;
    /* Use HSL format for color variables */
  }
}

3. tailwind.config.ts (optional, required only for plugins)

import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  // plugins: [require("tailwindcss-animate")], // Add if needed
};
export default config;

Quick v4 Reference

Renamed utilities:

    shadow-sm → shadow-xs
    blur-sm → blur-xs
    rounded-sm → rounded-xs
    outline-none → outline-hidden

Removed utilities (use modern syntax):

    bg-opacity-50 → bg-black/50
    flex-shrink-* → shrink-*
    flex-grow-* → grow-*

CSS variables:

<!-- v4 syntax -->
<div class="bg-(--brand-color)"></div>

Global CSS Guidelines

Keep globals.css minimal. Use Tailwind utilities in components for most styling.

globals.css should only contain:

    Base & reset styles
    Typography setup
    CSS variable definitions
    Global page styles (body background, etc.)
    Minimal reusable patterns via @apply
    Third-party/utility styles

Rule of thumb:

    One-off styles → Tailwind utilities in .tsx files
    Global/brand-defining → globals.css

Verification Checklist

After setup, verify:

    ✅ postcss.config.mjs uses @tailwindcss/postcss
    ✅ globals.css starts with @import "tailwindcss"
    ✅ No @tailwind base/components/utilities directives (v3 syntax)
    ✅ Color variables use HSL format
    ✅ Using v4 utility names (shadow-xs, not shadow-sm)

