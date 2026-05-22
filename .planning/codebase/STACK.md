# STACK
_Last updated: 2026-05-21 | Focus: tech_

## Summary
Romma is a Next.js 16 App Router app (JavaScript, no TypeScript) using Supabase as the backend. Deployed on Vercel with Turbopack for dev. Styling is primarily inline CSS custom properties with Tailwind v4 used only in auth pages.

---

## Runtime & Framework

| Layer | Technology | Version |
|---|---|---|
| Runtime | Node.js | >=20 |
| Framework | Next.js App Router | ^16.2.4 |
| Language | JavaScript (no TypeScript) | — |
| Bundler (dev) | Turbopack (via `next dev`) | bundled with Next.js 16 |
| Deployment | Vercel | — |

**Next.js 16 critical differences:**
- `middleware.js` renamed to **`proxy.js`** (Node.js runtime, not Edge). File: `src/proxy.js`. Never create `middleware.js`.
- App Router with Server Components by default — hooks/events require `'use client'`.

---

## UI & Styling

| Technology | Version |
|---|---|
| Tailwind CSS | ^4 |
| @tailwindcss/postcss | ^4 |
| tw-animate-css | ^1.4.0 |
| shadcn/ui (CLI) | ^4.2.0 |
| radix-ui | ^1.4.3 |
| class-variance-authority | ^0.7.1 |
| clsx | ^2.1.1 |
| tailwind-merge | ^3.5.0 |

**In practice:** Tailwind used only in `login/page.js`. Feature components use inline `style={}` + CSS custom properties.

---

## React

| Technology | Version |
|---|---|
| react | 19.2.4 |
| react-dom | 19.2.4 |
| babel-plugin-react-compiler | 1.0.0 (devDep) |

---

## Backend / Database

| Technology | Detail |
|---|---|
| Supabase (hosted) | Project: `vfymttcajeyhrmsyhrtj` |
| @supabase/supabase-js | ^2.99.2 |
| @supabase/ssr | ^0.9.0 |
| server-only | ^0.0.1 (import guard) |
| Postgres | Managed by Supabase |
| Auth | Supabase Auth (email invite flow) |
| Edge Functions | Deno runtime (`supabase/functions/`) |

---

## Testing & Quality

| Technology | Version |
|---|---|
| Playwright (E2E only) | ^1.60.0 |
| ESLint | ^9 |
| eslint-config-next | 16.2.0 |
| dotenv (seed scripts) | ^17.4.2 |

```bash
npm run test:e2e        # playwright test
npm run test:e2e:ui     # playwright test --ui
npm run db:test:reset   # supabase db reset
npm run db:test:seed    # node e2e/seed.mjs
```

---

## Observability

- `@vercel/speed-insights` ^2.0.0 — injected in root layout

---

## Environment Variables

| Variable | Exposure | Purpose |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Public | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public | Supabase anon key |
| `SUPABASE_JWT` | Server-only | Legacy JWT for `functions.invoke()` only |
| `SUPABASE_ROLE_KEY` | Server-only | Service role key — bypasses RLS |
| `SITE_URL` | Server-only | Redirect target for email invites |
| `APP_URL` | Edge Function env | CORS origin for `gerar-parcelas` |
