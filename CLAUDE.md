# CLAUDE.md — Romma

This file provides context for Claude Code to work effectively in this codebase.

---

## Project Overview

**Romma** is a corporate space rental management system built as an undergraduate thesis (TCC). It connects property owners (Proprietários) with tenants (Locatários) who rent commercial spaces. The system manages the full lifecycle of a corporate lease: from public unit listings to contracts and installment tracking.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router) |      // IMPORTANT: TROW EVERY PRIOR KNOLEGDGE ABOU NEXT. NEXT 16 INTRODUCED A LOT OF BREAKING PRIOR VERSIONS FEATURES!!
| Language | JavaScript (no TypeScript) |
| Styling | Tailwind CSS v4 |
| UI Components | shadcn/ui |
| Database | Supabase (PostgreSQL) |
| Auth | Supabase Auth |
| Row-Level Security | Supabase RLS (per-operation policies) |
| Edge Functions | Supabase Edge Functions (Deno/TypeScript) |
| Dev server | Turbopack (`next dev --turbopack`) |
| Deployment | Vercel |

---

## Project Structure

```
src/
  app/
    layout.js                        # Root layout
    globals.css                      # Global styles (Tailwind v4)
    page.js                          # Landing page (public, /)
    login/
      page.js                        # Login page
    dashboard/
      page.js                        # Dashboard home (Proprietário)
      unidades/
        page.js                      # Unit management
      locatarios/
        page.js                      # Tenant management
      contratos/
        page.js                      # Contract management
  components/
    features/
      GestaoEdificios.js             # Buildings CRUD feature component
      Unidades.js                    # Units CRUD feature component
      Locatarios.js                  # Tenants CRUD feature component
      Contratos.js                   # Contracts CRUD feature component
    ui/
      EdificioCard.js                # Building card (view/edit modes)
      UnidadeCard.js                 # Unit card (view/edit modes)
  actions/
    locatarios.js                    # Server Actions for tenant operations
  lib/
    supabase.js                      # Supabase client (anon key, singleton)
    supabase-browser.js              # Supabase browser client
    supabase-server.js               # Supabase server client
    supabaseAdmin.js                 # Supabase admin client (service role, server-only)
    supabaseJWT.js                   # Supabase client with legacy JWT (Edge Function calls only)
    queries.js                       # Centralized pure query functions (no hooks, no state)

supabase/
  config.toml
  functions/
    gerar-parcelas/
      index.ts                       # Edge Function: generates all installments for a contract
```

---

## Standardized Terminology

These terms are used consistently across code, UI, and documentation. Never use synonyms.

| Concept | Portuguese Term | Notes |
|---|---|---|
| Building owner | **Proprietário** | Single user per instance |
| Tenant | **Locatário** | Company or individual renting a unit |
| Building | **Edifício** | Main physical structure |
| Rentable space | **Unidade** | Any space offered for rent (floor, room, etc.) |
| Lease | **Contrato** | Formal agreement between Proprietário and Locatário |
| Monthly installment | **Parcela** | Each monthly payment within a Contrato |

---

## Database Schema

### `edificios`
| Column | Type | Notes |
|---|---|---|
| id | UUID | PK |
| nome | TEXT | |
| endereco | TEXT | |
| created_at | TIMESTAMP | |

### `unidades`
| Column | Type | Notes |
|---|---|---|
| id | UUID | PK |
| edificio_id | UUID | FK → edificios |
| nome | TEXT | e.g. "Andar 3", "Sala 301" |
| descricao | TEXT | |
| area_m2 | NUMERIC | |
| valor_mensal | NUMERIC | |
| valor_visivel | BOOLEAN | If false, show "Consulte o Proprietário" publicly |
| status | ENUM | `disponivel`, `alugada` |
| created_at | TIMESTAMP | |

### `locatarios`
| Column | Type | Notes |
|---|---|---|
| id | UUID | PK |
| usuario_id | UUID | FK → Supabase Auth users |
| nome_razao_social | TEXT | |
| tipo | ENUM | `pf`, `pj` |
| documento | TEXT | CPF or CNPJ, digits only |
| email | TEXT | Contact email (may differ from login) |
| telefone | TEXT | |
| created_at | TIMESTAMP | |

### `contratos`
| Column | Type | Notes |
|---|---|---|
| id | UUID | PK |
| unidade_id | UUID | FK → unidades |
| locatario_id | UUID | FK → locatarios |
| data_inicio | DATE | |
| data_fim | DATE | |
| status | ENUM (`status_contrato`) | `ativo`, `encerrado`, `cancelado` |
| observacoes | TEXT | |
| created_at | TIMESTAMP | |

Constraint: partial unique index — only one `ativo` contract per `unidade_id` at a time.

### `parcelas`
| Column | Type | Notes |
|---|---|---|
| id | UUID | PK |
| contrato_id | UUID | FK → contratos |
| numero | INTEGER | Sequential number (1, 2, 3...) |
| data_fechamento | DATE | Date the installment becomes visible |
| data_vencimento | DATE | 7 days after data_fechamento |
| data_pagamento | DATE | Nullable, filled when marked as paid |
| status | ENUM (`status_parcela`) | `futura`, `pendente`, `paga`, `vencida` |
| created_at | TIMESTAMP | |

---

## Business Rules

### Unit status
- A unit's status changes to `alugada` when an `ativo` contract is created for it.
- It reverts to `disponivel` when that contract is closed (`encerrado`) or cancelled (`cancelado`).
- Both transitions are handled in the frontend at the moment of contract creation/deletion.

### Contract constraints
- Only one `ativo` contract per unit at a time (enforced by partial unique index in the DB).
- `valor_mensal` is always taken from the unit — there is no separate value field in the contract.

### Parcela generation rules
- All parcelas for a contract's full duration are generated atomically at contract creation time via the `gerar-parcelas` Edge Function.
- **Parcela 1:** If `data_inicio + 7 days` falls in the same month as `data_inicio`, then `data_fechamento` = `data_inicio` and `data_vencimento` = `data_inicio + 7 days`. If it falls in a different month, `data_fechamento` is pushed to the 1st day of the following month and `data_vencimento` = `data_fechamento + 7 days`.
- **Parcelas 2+:** `data_fechamento` = 1st day of each subsequent month after parcela 1's `data_fechamento`, `data_vencimento` = `data_fechamento + 7 days`.
- All parcelas are created with status `futura`.
- Status transitions are date-driven: `futura` → `pendente` when `data_fechamento <= today`; `pendente` → `vencida` when `data_vencimento < today` and still unpaid.

### Tenant invite flow
- The Proprietário registers a tenant's email. Supabase sends a magic link via `inviteUserByEmail` (admin API).
- This must run server-side via a Next.js Server Action — never import `supabaseAdmin` in client components.

---

## Code Conventions

### Supabase clients — use the right one for the right context

| File | Key used | When to use |
|---|---|---|
| `lib/supabase.js` | anon key | General client-side queries |
| `lib/supabase-browser.js` | anon key | Browser-specific client |
| `lib/supabase-server.js` | anon key | Server Components / Server Actions |
| `lib/supabaseAdmin.js` | service role key | Admin operations (invite, bypass RLS) — **server-only** |
| `lib/supabaseJWT.js` | legacy JWT | Calling Edge Functions via `functions.invoke()` only |

Never import `supabaseAdmin` or `supabaseJWT` in client components — they use server-only env vars.

### Query centralization
All Supabase read queries live in `src/lib/queries.js` as pure functions with no hooks and no state. Example functions: `getEdificios()`, `getUnidades()`, `getLocatarios()`, `getContratos()`. Pages call these functions inside `useEffect`.

### Form state pattern
Use a single object for form/edit state, not separate `useState` calls per field:

```js
// Correct
const [editForm, setEditForm] = useState({ nome: '', endereco: '' })
setEditForm({ ...editForm, nome: value })

// Avoid
const [nome, setNome] = useState('')
const [endereco, setEndereco] = useState('')
```

### Reset pattern
Extract form reset as a named function rather than inlining the state reset:

```js
function resetForm() {
  setForm({ nome: '', endereco: '' })
  setEditandoId(null)
}
```

### RLS policies
Policies are per-operation. Missing a policy for one operation (SELECT / INSERT / UPDATE / DELETE) returns 403 only for that operation. Always verify all four operations when debugging permission errors.

### Server Actions
Placed in `src/actions/`. Return a standardized object: `{ status: 200 }` on success or `{ status: 500, erroMessage: '...' }` on failure.

### Commits
Uses `vivaxy.vscode-conventional-commits` VSCode extension. Always provide type, scope, gitmoji, and description as separate fields.

---

## Edge Functions

### `gerar-parcelas`
- **Location:** `supabase/functions/gerar-parcelas/index.ts`
- **Runtime:** Deno (TypeScript)
- **Trigger:** Called from the frontend after a contract is successfully inserted.
- **Input:** `{ contrato_id: string }` via POST body.
- **Responsibility:** Fetch the contract, calculate all parcelas for its full duration, insert them atomically.
- **Auth:** Legacy Supabase JWT (`eyJ...`) passed via Authorization header. Called via `supabase.functions.invoke()` using `supabaseJWT` client.
- **CORS:** Full CORS headers configured, including preflight OPTIONS handler.

---

## Environment Variables

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
NEXT_PUBLIC_SUPABASE_JWT=        # Legacy JWT for Edge Function auth
SUPABASE_ROLE_KEY=               # Server-only, never exposed to client
```

---

## Supabase Project

- **Project ID:** `vfymttcajeyhrmsyhrtj`
- **URL:** `https://vfymttcajeyhrmsyhrtj.supabase.co`