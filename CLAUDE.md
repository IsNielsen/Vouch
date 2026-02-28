# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

Be very concise in all your awnsers and plans. Code should be clean and simple.

I am risk at losing my job so be extra rigorous.
## Commands

```bash
npm run dev      # Start development server on localhost:3000
npm run build    # Production build
npm run lint     # ESLint check
```

No test suite is configured.

## Environment Variables

Copy `.env.local` and set:
```
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=...
```

Both are exposed to the browser. The `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` accepts either the new publishable key format (`sb_publishable_...`) or the legacy anon key.

## Architecture

This is a **Next.js 15 App Router** app with **Supabase** for auth and database, styled with **Tailwind CSS** and **shadcn/ui** (new-york style, neutral base color).

### Auth Flow

Authentication uses cookie-based sessions via `@supabase/ssr`:

- **`proxy.ts`** (root) — Next.js middleware that calls `lib/supabase/proxy.ts:updateSession()` on every request to refresh the session cookie. Redirects unauthenticated users to `/auth/login` for any route except `/`, `/login`, and `/auth/*`.
- **`lib/supabase/server.ts`** — Server-side Supabase client (async, reads/writes cookies). Create a new instance per function call — never store in a global.
- **`lib/supabase/client.ts`** — Browser-side Supabase client for Client Components.
- Auth pages live under `app/auth/` (login, sign-up, forgot-password, update-password, confirm, error, sign-up-success).
- Use `supabase.auth.getClaims()` (fast, JWT-based) instead of `supabase.auth.getUser()` (slower, network call) when you only need claims.

### Route Structure

- `/` — Public landing/home page
- `/auth/*` — Auth pages (public)
- `/protected` — Example auth-gated page with its own layout (`app/protected/layout.tsx`)

### Key Patterns

- **`lib/utils.ts`** exports `cn()` (clsx + tailwind-merge) and `hasEnvVars` (guards against missing env vars during setup).
- shadcn/ui components live in `components/ui/`. Add new ones with `npx shadcn@latest add <component>`.
- The `@/` path alias maps to the project root.
- Vercel Speed Insights and Analytics are included in `app/layout.tsx`.
