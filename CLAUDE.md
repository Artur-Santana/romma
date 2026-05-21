# CLAUDE.md — Romma

**Romma** = sistema de aluguel corporativo (TCC). Proprietário ↔ Locatário. Ciclo: listagem pública de Unidades → Contratos → Parcelas.

---

## Stack

Next.js 16 App Router (JS, sem TS) · Tailwind v4 · shadcn/ui · Supabase (Postgres + Auth + RLS + Edge Functions Deno) · Turbopack · Vercel

> **Next.js 16** quebra muitas convenções de versões anteriores — não use conhecimento de versões anteriores.

**Next.js 16 — mudanças críticas vs versões anteriores:**
- `middleware.js` renomeado para **`proxy.js`** (Node.js runtime, não Edge). Arquivo correto: `src/proxy.js`. Nunca criar `middleware.js`.
- App Router com Server Components por padrão — qualquer componente com hooks/eventos precisa de `'use client'`.

---

## Terminologia (nunca use sinônimos)

| Conceito | Termo |
|---|---|
| Dono do espaço | **Proprietário** (único por instância) |
| Inquilino | **Locatário** |
| Prédio | **Edifício** |
| Espaço alugável | **Unidade** |
| Contrato de locação | **Contrato** |
| Pagamento mensal | **Parcela** |

---

## Schema (colunas id/created_at implícitas em todas tabelas)

**edificios:** `nome`, `endereco`

**unidades:** `edificio_id` (FK), `nome`, `descricao`, `area_m2`, `valor_mensal`, `valor_visivel` (BOOLEAN — false → exibir "Consulte o Proprietário"), `status` ENUM(`disponivel`, `alugada`)

**locatarios:** `usuario_id` (FK Auth), `nome_razao_social`, `tipo` ENUM(`pf`,`pj`), `documento` (CPF/CNPJ só dígitos), `email`, `telefone`

**contratos:** `unidade_id` (FK), `locatario_id` (FK), `data_inicio`, `data_fim`, `status` ENUM(`ativo`,`encerrado`,`cancelado`), `observacoes`
- Constraint: no máx 1 contrato `ativo` por `unidade_id` (partial unique index)

**parcelas:** `contrato_id` (FK), `numero` (INT sequencial), `data_fechamento`, `data_vencimento` (fechamento+7d), `data_pagamento` (nullable), `status` ENUM(`futura`,`pendente`,`paga`,`vencida`)

---

## Regras de Negócio

**Status Unidade:** `alugada` ao criar contrato `ativo`; volta `disponivel` ao encerrar/cancelar. Ambas transições no frontend.

**Geração de Parcelas** (via Edge Function `gerar-parcelas`, atômica):
- Parcela 1: se `data_inicio + 7d` mesmo mês → `fechamento = data_inicio`, `vencimento = +7d`. Se mês diferente → `fechamento = dia 1 mês seguinte`, `vencimento = +7d`.
- Parcelas 2+: `fechamento = dia 1` de cada mês subsequente. Todas criadas como `futura`.
- Status date-driven: `futura → pendente` quando `fechamento <= hoje`; `pendente → vencida` quando `vencimento < hoje` e não paga.

**Invite Locatário:** `inviteUserByEmail` via Server Action (admin API). Nunca importar `supabaseAdmin` em client components.

**Realtime — limitação conhecida:** `disponivel → alugada` não propaga em tempo real (RLS descarta evento). Card some só no refresh. Reversas/INSERT/DELETE funcionam.

---

## Clientes Supabase

| Arquivo | Chave | Uso |
|---|---|---|
| `lib/supabase.js` | anon | queries client-side gerais |
| `lib/supabase-browser.js` | anon | browser-specific |
| `lib/supabase-server.js` | anon | Server Components / Server Actions |
| `lib/supabaseAdmin.js` | service role | admin/bypass RLS — **server-only** |
| `lib/supabaseJWT.js` | legacy JWT | `functions.invoke()` apenas |

---

## Convenções de Código

- Queries Supabase centralizadas em `src/lib/queries-client.js` (browser) e `src/lib/queries-server.js` (Server Components/Actions) — funções puras, sem hooks/state. Chamadas em `useEffect` ou Server Actions.
- Form state: objeto único, não `useState` por campo.
- Reset de form: função nomeada, não inline.
- RLS: políticas por operação (SELECT/INSERT/UPDATE/DELETE). Falta de uma → 403 só nessa op.
- Server Actions em `src/actions/`. Retornam `{ status: 200 }` ou `{ status: 500, erroMessage: '...' }`.
- Commits via extensão `vivaxy.vscode-conventional-commits` (type, scope, gitmoji, descrição).

---

## Edge Function: `gerar-parcelas`

`supabase/functions/gerar-parcelas/index.ts` · Deno · POST `{ contrato_id }` · Auth: legacy JWT via header · chamada com `supabaseJWT` client · CORS completo.

---

## Env Vars

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_JWT=        # server-only, Edge Functions
SUPABASE_ROLE_KEY=   # server-only, admin
```

**Supabase Project:** `vfymttcajeyhrmsyhrtj` · `https://vfymttcajeyhrmsyhrtj.supabase.co`

<!-- GSD:project-start source:PROJECT.md -->
## Project

**Romma**

Romma é um sistema de gerenciamento de aluguéis corporativos desenvolvido como TCC. Conecta um Proprietário único (dono de edifícios) com Locatários (PF ou PJ) pelo ciclo completo: listagem pública de Unidades disponíveis → Contratos → Parcelas mensais. O sistema precisa estar deployed na Vercel e demonstrável ao vivo na banca em 18/06/2026.

**Core Value:** Proprietário gerencia edifícios, contratos e pagamentos em um único painel — Locatário acessa seu contrato e histórico via portal próprio — visitantes veem unidades disponíveis em tempo real.

### Constraints

- **Timeline:** Banca em 18/06/2026 — 28 dias para finalizar tudo
- **Deploy:** Vercel obrigatório para banca (romma-alpha.vercel.app)
- **Stack:** Next.js 16 + Supabase — sem migração de stack
- **Escopo:** Core apenas — Dream scope pós-TCC
- **Prioridade:** Portal Locatário mínimo funcional + páginas públicas polidas > refinamento do dashboard
<!-- GSD:project-end -->

<!-- GSD:stack-start source:codebase/STACK.md -->
## Technology Stack

## Summary
## Runtime & Framework
| Layer | Technology | Version |
|---|---|---|
| Runtime | Node.js | >=20 |
| Framework | Next.js App Router | ^16.2.4 |
| Language | JavaScript (no TypeScript) | — |
| Bundler (dev) | Turbopack (via `next dev`) | bundled with Next.js 16 |
| Deployment | Vercel | — |
- `middleware.js` renamed to **`proxy.js`** (Node.js runtime, not Edge). File: `src/proxy.js`. Never create `middleware.js`.
- App Router with Server Components by default — hooks/events require `'use client'`.
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
## React
| Technology | Version |
|---|---|
| react | 19.2.4 |
| react-dom | 19.2.4 |
| babel-plugin-react-compiler | 1.0.0 (devDep) |
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
## Testing & Quality
| Technology | Version |
|---|---|
| Playwright (E2E only) | ^1.60.0 |
| ESLint | ^9 |
| eslint-config-next | 16.2.0 |
| dotenv (seed scripts) | ^17.4.2 |
## Observability
- `@vercel/speed-insights` ^2.0.0 — injected in root layout
## Environment Variables
| Variable | Exposure | Purpose |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Public | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public | Supabase anon key |
| `SUPABASE_JWT` | Server-only | Legacy JWT for `functions.invoke()` only |
| `SUPABASE_ROLE_KEY` | Server-only | Service role key — bypasses RLS |
| `SITE_URL` | Server-only | Redirect target for email invites |
| `APP_URL` | Edge Function env | CORS origin for `gerar-parcelas` |
<!-- GSD:stack-end -->

<!-- GSD:conventions-start source:CONVENTIONS.md -->
## Conventions

## Summary
## Component Classification
- `src/app/dashboard/page.js`
- `src/app/dashboard/layout.js`
- `src/app/dashboard/contratos/[id]/page.js` (thin wrapper)
- `src/components/features/*.js`
- All files using hooks, event handlers, or Supabase browser client
## Form State
- Single `useState` object, never per-field: `const [form, setForm] = useState({ ... })`
- Spread-update: `setForm({ ...form, key: value })`
- Reset via named function (two variants in codebase):
## Data Fetching
| Context | Pattern |
|---------|---------|
| Client | `useEffect` → `queries-client.js` functions |
| Server | direct `await` → `queries-server.js` functions (uses `'server-only'`) |
| After mutation | re-call query function directly (no cache invalidation layer) |
| Null safety | always `?? []` on array returns |
## Server Actions (`src/actions/`)
- Return `{ status: 200 }` or `{ status: 4xx|5xx, erroMessage: '...' }`
- **`erroMessage`** (not `errorMessage`) — established project spelling
- Auth guard pattern: local `authGuard()` function declared in each file
- UUID validated with `/^[0-9a-f]{8}-.../i` regex — redeclared per file (not shared)
- Mutations use `supabaseAdmin` (server-only, never import in client components)
## Styling
- CSS vars defined in `src/app/globals.css`: `--fg-1..5`, `--border-1..3`, `--surface`, `--indigo`, `--success`, `--warning`, `--danger`, `--font-mono/body/display`
- Utility CSS classes: `eyebrow eyebrow--indigo`, `romma-page`, `romma-desktop-only`, `romma-mobile-only`
- Button reset pattern: `style={{ all: "unset", cursor: "pointer", ... }}`
## Naming Conventions
| Category | Pattern | Example |
|----------|---------|---------|
| Event handlers | `handle` prefix | `handleCriarContrato` |
| Query functions | `get` prefix | `getContratos` |
| Server Actions | Portuguese verb+noun | `criarUnidade`, `cancelarContrato` |
| Error state | `erro` (Portuguese) | `const [erro, setErro] = useState(null)` |
| Loading state | `loading` (English) | `const [loading, setLoading] = useState(false)` |
| Component files | PascalCase | `ContratosDesktop.js` |
| Action files | camelCase | `contratos.js` |
| Lib files | kebab-case | `queries-client.js` |
## Inconsistencies (do not replicate)
| Area | Canon | Exception |
|------|-------|-----------|
| Styling | Inline + CSS vars | `Locatarios.js` uses Tailwind classes |
| Quote style | Double `"` | `unidades.js`, `parcelas.js` use single `'` |
| Indentation | 2 spaces | `locatarios.js` uses 4 spaces |
| Auth guard | Local function | `gerarParcelas` inlines the check |
| Naming | Portuguese error vars | Some files mix `error`/`erro` |
<!-- GSD:conventions-end -->

<!-- GSD:architecture-start source:ARCHITECTURE.md -->
## Architecture

## Summary
## High-Level Architecture
```
```
## Data Flow
### Read (dashboard)
```
```
### Read (public page)
```
```
### Write (mutation)
```
```
### Contract creation with parcelas
```
```
## Auth & Role Architecture
```
```
- One proprietário per Romma instance (sole owner model)
- Locatários are invited via `inviteUserByEmail` — they exist in `auth.users` but have no dashboard access
- Role check: `supabase.rpc('is_proprietario')` — not JWT claim-based
## Server vs Client Component Split
| Layer | Type | Pattern |
|---|---|---|
| `src/app/*/page.js` | Server Component | Thin shell — imports one feature component |
| `src/app/dashboard/layout.js` | Server Component | Shared nav/sidebar |
| `src/components/features/*.js` | Client Component | Owns all state, data fetching, and event handling |
| `src/hooks/*.js` | Client hooks | `useUnidadesRealtime.js` for Realtime subscription |
| `src/actions/*.js` | Server Actions (`'use server'`) | All mutations |
| `src/lib/queries-*.js` | Pure functions | No hooks/state — called from useEffect or Server Actions |
## Route Structure
```
```
## Key Architectural Decisions
<!-- GSD:architecture-end -->

<!-- GSD:skills-start source:skills/ -->
## Project Skills

No project skills found. Add skills to any of: `.claude/skills/`, `.agents/skills/`, `.cursor/skills/`, `.github/skills/`, or `.codex/skills/` with a `SKILL.md` index file.
<!-- GSD:skills-end -->

<!-- GSD:workflow-start source:GSD defaults -->
## GSD Workflow Enforcement

Before using Edit, Write, or other file-changing tools, start work through a GSD command so planning artifacts and execution context stay in sync.

Use these entry points:
- `/gsd-quick` for small fixes, doc updates, and ad-hoc tasks
- `/gsd-debug` for investigation and bug fixing
- `/gsd-execute-phase` for planned phase work

Do not make direct repo edits outside a GSD workflow unless the user explicitly asks to bypass it.
<!-- GSD:workflow-end -->

<!-- GSD:profile-start -->
## Developer Profile

> Profile not yet configured. Run `/gsd-profile-user` to generate your developer profile.
> This section is managed by `generate-claude-profile` -- do not edit manually.
<!-- GSD:profile-end -->
