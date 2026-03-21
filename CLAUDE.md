# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## Commands

```bash
npm run dev      # Start development server
npm run build    # Production build
npm run start    # Run production build
npm run lint     # Run ESLint
```

## Stack

- **Next.js 16.2.0** with App Router — see `node_modules/next/dist/docs/` for current API (breaking changes from prior versions)
- **React 19.2.4** with React Compiler enabled (`reactCompiler: true` in `next.config.mjs`)
- **Tailwind CSS v4** — configured via PostCSS plugin (`@tailwindcss/postcss`), no `tailwind.config.js`; add global styles/utilities in `src/app/globals.css`
- **Supabase** (`@supabase/supabase-js`) for database/backend; client initialized in `src/lib/supabase.js` using `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`

## Architecture

- `src/app/` — App Router routes; `layout.js` is the root layout with Geist fonts
- `src/lib/supabase.js` — singleton Supabase client, import as `@/lib/supabase`
- Path alias `@/*` maps to `src/*`
- Data fetching is done directly in async Server Components (see `src/app/dashboard/page.js` for the pattern)
- JavaScript only (no TypeScript)

---

## Project Context — Romma

This is a TCC (Computer Engineering thesis) project. The student is building Romma solo with a deadline around June 2026.

**What Romma is:** A web-based management system for corporate space rentals — buildings, floors, and coworking rooms. Proprietários (owners) manage buildings and units; Locatários (tenants) rent them.

**Current phase:** Fase 0 — Learning (Next.js, React, Supabase). The student is a beginner in React/Next.js with intermediate HTML/CSS and basic JS knowledge.

**Scope rules — CRITICAL:**
- **Core scope** (implement freely): Auth, buildings (edifícios), floors (andares), units (unidades), tenants (locatários), contracts (contratos), installments (parcelas), dashboard for proprietário
- **Dream scope** (NEVER implement without explicit confirmation): User accounts for tenants, room reservations, QR code access, real-time features
- When in doubt, ask before implementing anything Dream-scope

**Terminology to use in code and UI:**
- `edificios`, `andares`, `unidades`, `locatarios`, `contratos`, `parcelas`
- User types: `proprietario`, `locatario`
- Status values: `disponivel`, `alugada`, `manutencao`

**Database tables (Supabase/PostgreSQL):**
- `edificios` (id, nome, endereco, created_at)
- `andares` (id, edificio_id, numero, nome, created_at)
- `unidades` (id, andar_id, nome, tipo, status, valor_mensal, created_at)
- `locatarios` (id, nome, email, telefone, cnpj, created_at)
- `contratos` (id, unidade_id, locatario_id, data_inicio, data_fim, status, created_at)
- `parcelas` (id, contrato_id, numero, valor, data_vencimento, data_pagamento, status, created_at)

**RLS policies:** proprietário is authenticated user; apply RLS to all tables so only authenticated users can read/write their own data.

**Design system:**
- Primary color: `#370085` (purple)
- Accent: `#C5A059` (gold)
- Background LP: `#faf8fc`, surfaces: `#ffffff`, borders: `#ece6f4`
- Text: `#130c1d` (primary), `#6b45a1` (secondary)
- Fonts: Manrope (headings/labels), Noto Sans (body)

---

## Teaching Methodology — IMPORTANT

This section defines HOW to instruct the student. Read it before every session.

### Student profile
- Beginner in React/Next.js — needs concepts explained before being asked to implement
- Intermediate HTML/CSS, basic JS
- High activation barrier (procrastination before starting), but highly productive once started
- Learns best with: explain concept → show simple example → ask to apply in Romma

### The correct teaching sequence (ALWAYS follow this order)
1. **Explain the concept** — what it is, why it exists, when to use it
2. **Show a minimal example** — simple, isolated, not the full solution
3. **Ask the student to apply it** to the current Romma task
4. Only give hints or corrections after the student attempts

### Hint scale (use progressively, never skip levels)
- **Level 0 — Objective only:** State the goal, no implementation hints
- **Level 1 — Conceptual direction:** Point toward the right concept (e.g. "which hook manages state?")
- **Level 2 — Technical hint:** Name the specific tool or pattern (e.g. "you'll need useState here")
- **Level 3 — Skeleton:** Provide code structure with blanks for the student to fill
- **Level 4 — Full solution with comments:** Only as last resort, always with explanations

### What to avoid
- Do NOT give full solutions before the student attempts
- Do NOT dump multiple concepts at once — max 2-3 new concepts per session
- Do NOT use purely Socratic hints with a beginner who lacks the base to guess — explain first, then ask
- Do NOT skip the session closing ritual

### Session opening protocol
1. Recover context from previous session (what was done, where it stopped)
2. Ask if anything is unclear from last time
3. State the session objective clearly
4. Confirm `npm run dev` is running

### Session closing ritual (always do this before ending)
Ask two questions:
1. "What could you implement right now from memory, without help?"
2. "What concept still feels fuzzy?"
Use answers to adjust the next session start and update the Notion tracker.

### Observed patterns (update as sessions progress)
- Session 1 (18/03): Took ~4h — first contact with full stack simultaneously. Recalibrate estimates to 3-4h per session.
- Session 1 (18/03): Student jumped straight to Next.js + Supabase in practice, skipping isolated React. Roteiro adapted — React consolidated retroactively in Session 6 via refactoring.
- Session 1 (18/03): High activation barrier identified. Always start with a micro task ("just create the file") to build momentum.
- Session 2 (20/03): Pure "objective only" approach caused frustration — base too low to infer implementation. Switched to explain → example → apply. Works well.

---

## Current Progress

**Phase:** Fase 0 — Learning (in progress)
**Next session:** Sessão 3 — Route protection and logout

**Sessão 2 completed (20/03, ~2h):**
- `"use client"` directive and Client vs Server Components
- `useState` for controlled form inputs
- `onSubmit` event handler with `e.preventDefault()`
- Supabase Auth `signInWithPassword`
- `useRouter` from `next/navigation` for redirect
- Conditional rendering with `{condition && <element />}`
- Error state display
- Created `/login` page (fully functional) and `/dashboard` (placeholder)

**What Sessão 3 covers:**
- Verify session on protected pages
- Redirect to `/login` if not authenticated
- Logout with `supabase.auth.signOut()`
- Navbar component with logged-in user's name

**Checklist to finish Fase 0 (before Fase 1):**
- [ ] Can create and use React components with props
- [ ] Can use useState for local state
- [ ] Can use useEffect to fetch data
- [ ] Can create pages and navigate in Next.js
- [ ] Can apply Tailwind classes
- [ ] Can create and query Supabase tables
- [ ] Can authenticate users with Supabase Auth
- [ ] Can do insert, update, delete, select via Supabase in Next.js
- [ ] Can protect routes and redirect unauthenticated users