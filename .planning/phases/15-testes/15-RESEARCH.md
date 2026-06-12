# Phase 15: Testes - Research

**Researched:** 2026-06-12
**Domain:** Vitest unit testing of Next.js Server Actions + Playwright E2E audit/split
**Confidence:** HIGH (unit stack), HIGH (E2E audit)

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **D-01:** Framework = Vitest. ESM nativo, `vi.mock` built-in.
- **D-02:** Script `test:unit` no package.json. Specs em diretório dedicado (planner decide path, não misturar com `e2e/`).
- **D-03:** Job separado no GitHub Actions. Roda antes/paralelo ao job `e2e`. Falha de unit bloqueia merge.
- **D-04:** Mock total da chain — `vi.mock` de `@supabase/ssr`, `supabaseAdmin`, `next/headers`. Testa Action inteira.
- **D-05:** Factory de mock compartilhada — helper único com builder encadeável reutilizável.
- **D-06:** Actions cobertas: `auth.js` (cadastrarProprietario), `locatarios.js` (revogarConvite), `unidades.js` (editarUnidade, deletarUnidade), `contratos.js` (encerrarContrato, cancelarContrato).
- **D-07:** Profundidade = happy path + erro de validação + guard de autorização (≈3 casos cada).
- **D-08:** Multi-tenant é prioridade com asserção explícita de `.eq('proprietario_id', user.id)`.
- **D-09:** E2E = auditar + completar buracos. Não reescrever o que já passa em CI.
- **D-10:** Split por domínio de `crud.spec.js` (27KB) e `toast-feedback.spec.js` (17KB).

### Claude's Discretion
- Path/estrutura exata dos diretórios de unit test.
- Config do Vitest (vitest.config.js) — environment (node), globals.
- Forma exata do builder encadeável na factory de mock.
- Como dividir os specs grandes em arquivos (nomes, agrupamento).

### Deferred Ideas (OUT OF SCOPE)
- Playwright projects (smoke/crud/visual) para execução seletiva.
- Cobertura exaustiva (todos branches, FK constraints, edge cases de status).
- Extrair lógica pura das Actions (validarUUID, guards como funções puras).
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| TEST-01 | Testes unitários para Server Actions críticas (auth signup, revogar acesso, editar/deletar unidade, encerrar/cancelar contrato) | Vitest config, mock factory, per-Action test matrix below |
| TEST-02 | Suite E2E expandida cobrindo novos fluxos (signup flow, /unidades redesign, mobile viewport 375px, toast feedback) | E2E gap analysis + D-10 split strategy below |
</phase_requirements>

---

## Summary

Phase 15 has two independent fronts. TEST-01 introduces Vitest for the first time: `environment: 'node'` with no DOM dependency, three mock targets per Action group, and a reusable chainable builder factory. TEST-02 is an audit-and-gap-fill exercise: the E2E suite already covers most success criteria, with two concrete gaps (AUTH-02 second-signup guard, a complete mobile 375px journey) that need new specs, plus the `crud.spec.js` and `toast-feedback.spec.js` split by domain.

The most important planning constraint discovered in research: **D-08's `.eq('proprietario_id', user.id)` assertion is only valid for `locatarios.js` actions.** The schema confirms `proprietario_id` is NOT a column on `unidades` or `contratos` — tenancy for those tables flows via `edificio_id → edificios.proprietario_id` enforced by RLS functions, **but `supabaseAdmin` bypasses RLS**. The Actions for unidades and contratos only filter `.eq('id', id)` — this is a plausible IDOR gap introduced by the service-role client. The planner must decide whether to add the IDOR fix inline with the unit tests or defer it. This is surfaced in Open Questions.

**Primary recommendation:** Install only `vitest` + `vite-tsconfig-paths`. Use `environment: 'node'`, `resolve.alias` for `@/*` and `server-only`. All mocks via `vi.mock` factory — no external mock libraries needed.

---

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Server Action auth guard | API / Backend (`src/actions/`) | — | `authGuard()` + `isProprietario()` run server-side |
| Supabase mutation | API / Backend (`supabaseAdmin`) | — | Service-role client, bypasses RLS, server-only |
| Session/cookies | Frontend Server (SSR) | — | `next/headers` cookies(), `@supabase/ssr` |
| Unit test runner | Build tooling (Vitest, node env) | — | Server Actions = pure async JS functions under test |
| E2E browser automation | Browser / Client (Playwright) | Frontend Server | Tests real stack including auth cookies |

---

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| vitest | 4.1.8 [VERIFIED: npm registry] | Unit test framework | ESM-native, vi.mock built-in, Jest-compatible API |
| vite-tsconfig-paths | 5.x [ASSUMED] | Resolve `@/*` aliases from jsconfig.json | Plug-and-play, no manual alias duplication |

> **Note on `vite-tsconfig-paths`:** Official Next.js docs list it for TS projects. This project uses `jsconfig.json` with `"paths": {"@/*": ["./src/*"]}`. The plugin reads `jsconfig.json` identically. If the plugin doesn't resolve correctly, fall back to manual `resolve.alias: { '@': path.resolve(__dirname, './src') }` — this requires no extra package.

### What NOT to install
| Package | Why Skip |
|---------|----------|
| `@vitejs/plugin-react` | Server Action tests have no JSX or DOM |
| `jsdom` / `happy-dom` | `environment: 'node'` — no browser needed |
| `@testing-library/react` | Not testing React components |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `@playwright/test` | already installed ^1.60.0 | E2E (TEST-02) | Already present — no install needed |

### Package Legitimacy Audit

> slopcheck installation was denied by the auto-mode classifier. Fallback: all packages marked status per npm registry check + official docs cross-reference.

| Package | Registry | Evidence | slopcheck | Disposition |
|---------|----------|----------|-----------|-------------|
| vitest | npm | v4.1.8 confirmed via `npm view`, homepage vitest.dev, repo vitest-dev/vitest. Listed in official Next.js testing docs. | unavailable | Approved [CITED: nextjs.org/docs] |
| vite-tsconfig-paths | npm | v6.1.1 confirmed via `npm view`. Used in official Next.js Vitest guide for TS. | unavailable | Approved [CITED: nextjs.org/docs] |

**Packages removed due to slopcheck [SLOP] verdict:** none
**Packages flagged as suspicious [SUS]:** none

*slopcheck was unavailable at research time (auto-mode denial). Both packages are approved via official documentation cross-reference.*

---

## Architecture Patterns

### System Architecture Diagram

```
test/unit/actions/          vitest.config.js
     │                           │
     │  vi.mock('@/lib/supabaseAdmin')  →  supabaseMock (chainable builder)
     │  vi.mock('@/lib/supabase-server')  →  mockUser / isProprietario
     │  vi.mock('next/headers')   →  mockCookies (for auth.js only)
     │  vi.mock('@supabase/ssr')  →  createServerClient mock (for auth.js only)
     │
     ▼
 import { editarUnidade } from '@/actions/unidades'
     │
     ▼
 Server Action executes in node env
  ├─ authGuard() → mocked supabase-server → returns fake user
  ├─ supabaseAdmin.from().update().eq() → mocked builder → {data, error}
  └─ returns { status: 200 } | { status, erroMessage }
     │
     ▼
 expect(result).toEqual({ status: 200 })
 expect(mockEq).toHaveBeenCalledWith('id', validId)
```

### Recommended Project Structure
```
test/
├── unit/
│   ├── actions/
│   │   ├── auth.test.js           # cadastrarProprietario
│   │   ├── locatarios.test.js     # revogarConvite
│   │   ├── unidades.test.js       # editarUnidade, deletarUnidade
│   │   └── contratos.test.js      # encerrarContrato, cancelarContrato
│   └── helpers/
│       └── supabaseMock.js        # shared chainable builder factory (D-05)
vitest.config.js
```

E2E split (existing `e2e/` dir):
```
e2e/
├── crud-edificios.spec.js     # split from crud.spec.js
├── crud-unidades.spec.js
├── crud-contratos.spec.js
├── crud-locatarios.spec.js
├── toast-contratos.spec.js    # split from toast-feedback.spec.js
├── toast-unidades.spec.js
├── toast-locatarios.spec.js
├── toast-parcelas.spec.js
└── [existing files unchanged]
```

---

## Pattern 1: vitest.config.js

**What:** Minimal config — node environment, `@/*` alias, empty `server-only` stub.
**When to use:** All unit tests in `test/unit/`.

```js
// vitest.config.js
// Source: Next.js official Vitest guide + advisor recommendation for node env
import { defineConfig } from 'vitest/config'
import path from 'path'

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    include: ['test/unit/**/*.test.js'],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      // 'server-only' throws outside RSC. Redirect to empty stub as insurance.
      // Factory mocks of supabaseAdmin/supabase-server prevent the real modules
      // from executing, so this alias is cheap backstop, not primary fix.
      'server-only': path.resolve(__dirname, 'test/unit/helpers/server-only-stub.js'),
    },
  },
})
```

```js
// test/unit/helpers/server-only-stub.js
export default {}
```

**`globals: true`** enables `describe/it/expect/vi` without explicit imports — matches Jest muscle memory and reduces boilerplate in test files.

---

## Pattern 2: Chainable Supabase Mock Builder (D-05)

**The problem:** `supabaseAdmin.from('x').update(y).eq('id', id)` is awaited inline — the builder must be **thenable** (or the chain's terminal method must resolve). `mockReturnThis()` alone is not enough because `await chainBuilder` calls `chainBuilder.then`, which doesn't exist unless explicitly provided.

**Pattern:** Make the builder a shared object with `vi.fn()` methods and a `then` that resolves with the configured `{data, error}`. Each test configures the outcome once; spies track calls.

```js
// test/unit/helpers/supabaseMock.js
// [ASSUMED] — based on Vitest vi.fn() API + thenable pattern

import { vi } from 'vitest'

/**
 * Creates a reusable chainable Supabase mock builder.
 *
 * Usage:
 *   const { mockAdmin, configureResult } = createSupabaseMock()
 *   vi.mock('@/lib/supabaseAdmin', () => ({ default: mockAdmin }))
 *
 *   configureResult({ data: null, error: null })  // in test or beforeEach
 *   const result = await editarUnidade(validId, form)
 *   expect(mockAdmin.from).toHaveBeenCalledWith('unidades')
 *   expect(mockAdmin._eq).toHaveBeenCalledWith('id', validId)
 */
export function createSupabaseMock() {
  let _resolve = { data: null, error: null }

  // Thenable builder: when awaited, resolves with configured result
  const builder = {
    from: vi.fn(),
    select: vi.fn(),
    insert: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    eq: vi.fn(),
    single: vi.fn(),
    // auth.admin namespace
    auth: {
      admin: {
        deleteUser: vi.fn(),
        inviteUserByEmail: vi.fn(),
      },
      signUp: vi.fn(),
    },
    // Make the builder itself thenable so `await builder.from(...).eq(...)` works
    then(resolve) {
      return Promise.resolve(_resolve).then(resolve)
    },
  }

  // Wire all chain methods to return builder (for chaining)
  builder.from.mockReturnValue(builder)
  builder.select.mockReturnValue(builder)
  builder.insert.mockReturnValue(builder)
  builder.update.mockReturnValue(builder)
  builder.delete.mockReturnValue(builder)
  builder.eq.mockReturnValue(builder)
  // .single() is terminal — resolves immediately
  builder.single.mockImplementation(() => Promise.resolve(_resolve))

  function configureResult(result) {
    _resolve = result
    // Also patch single() to match
    builder.single.mockImplementation(() => Promise.resolve(result))
  }

  function resetAll() {
    vi.clearAllMocks()
    _resolve = { data: null, error: null }
    builder.from.mockReturnValue(builder)
    builder.select.mockReturnValue(builder)
    builder.insert.mockReturnValue(builder)
    builder.update.mockReturnValue(builder)
    builder.delete.mockReturnValue(builder)
    builder.eq.mockReturnValue(builder)
    builder.single.mockImplementation(() => Promise.resolve(_resolve))
  }

  return { mockAdmin: builder, configureResult, resetAll }
}
```

**Spy assertion for D-08:**
```js
// For locatarios.js actions (where proprietario_id IS a column and the Actions filter it):
expect(mockAdmin.eq).toHaveBeenCalledWith('proprietario_id', fakeUser.id)
// Note: eq is called multiple times in a chain — use toHaveBeenNthCalledWith if order matters
```

---

## Pattern 3: Per-Action Mock Setup

### auth.js (cadastrarProprietario)

This Action uses `@supabase/ssr createServerClient` + `next/headers cookies()` directly — different mock targets than other Actions.

```js
// test/unit/actions/auth.test.js
import { vi, describe, it, expect, beforeEach } from 'vitest'

// Mock BEFORE imports (vi.mock is hoisted by Vitest)
vi.mock('next/headers', () => ({
  cookies: vi.fn().mockResolvedValue({
    getAll: vi.fn().mockReturnValue([]),
    set: vi.fn(),
  }),
}))

const mockSignUp = vi.fn()
vi.mock('@supabase/ssr', () => ({
  createServerClient: vi.fn(() => ({
    auth: { signUp: mockSignUp },
  })),
}))

import { cadastrarProprietario } from '@/actions/auth'

describe('cadastrarProprietario', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('happy path — retorna status 200 com email e senha válidos', async () => {
    mockSignUp.mockResolvedValue({ error: null })
    const result = await cadastrarProprietario({ email: 'a@b.com', senha: 'pass123' })
    expect(result).toEqual({ status: 200 })
  })

  it('erro de validação — email ou senha ausentes retorna 400', async () => {
    const result = await cadastrarProprietario({ email: '', senha: '' })
    expect(result.status).toBe(400)
    expect(result.erroMessage).toBeTruthy()
  })

  it('erro do Supabase — signUp retorna error repassa erroMessage', async () => {
    mockSignUp.mockResolvedValue({ error: { status: 422, message: 'Email rate limit exceeded' } })
    const result = await cadastrarProprietario({ email: 'a@b.com', senha: 'pass123' })
    expect(result.status).toBe(422)
    expect(result.erroMessage).toBe('Email rate limit exceeded')
  })

  // NOTE: D-06 mentions "instância única" guard for auth.js.
  // This guard does NOT exist in the JS code — cadastrarProprietario calls signUp
  // unconditionally. The uniqueness is enforced by DB (proprietarios table trigger/RLS).
  // A unit test cannot assert this guard without mocking DB-side behavior.
  // See Open Questions — this test scope is limited to signUp error pass-through.
})
```

### locatarios.js (revogarConvite) — uses supabaseAdmin + supabase-server

```js
// test/unit/actions/locatarios.test.js
import { vi, describe, it, expect, beforeEach } from 'vitest'

const mockUser = { id: 'proprietario-uuid-1234-5678' }
const mockIsProprietario = vi.fn()

vi.mock('@/lib/supabase-server', () => ({
  createServer: vi.fn().mockResolvedValue({
    auth: { getUser: vi.fn().mockResolvedValue({ data: { user: mockUser } }) },
  }),
}))

vi.mock('@/lib/auth', () => ({
  isProprietario: mockIsProprietario,
}))

// supabaseAdmin mock — see D-05 factory above; inline here for clarity
const mockEq = vi.fn()
const mockSingle = vi.fn()
const mockDelete = vi.fn()
const mockSelect = vi.fn()
const mockFrom = vi.fn()
const builder = { eq: mockEq, single: mockSingle, delete: mockDelete, select: mockSelect }
mockFrom.mockReturnValue(builder)
mockEq.mockReturnValue(builder)
mockSelect.mockReturnValue(builder)
mockDelete.mockReturnValue(builder)
const mockAuthAdmin = { deleteUser: vi.fn() }
vi.mock('@/lib/supabaseAdmin', () => ({
  default: {
    from: mockFrom,
    auth: { admin: mockAuthAdmin },
  },
}))

import { revogarConvite } from '@/actions/locatarios'

describe('revogarConvite', () => {
  const validId = '00000000-0000-0000-0000-000000000001'

  beforeEach(() => { vi.clearAllMocks(); mockIsProprietario.mockResolvedValue(true) })

  it('happy path — revoga convite pendente sem contratos', async () => {
    mockSingle.mockResolvedValue({ data: { usuario_id: 'u-id', status_convite: 'pendente' }, error: null })
    // count query returns 0
    // delete returns no error
    // auth.admin.deleteUser returns no error
    // ... configure full chain
    // expect result.status === 200
  })

  it('erro de validação — UUID inválido retorna 400', async () => {
    const result = await revogarConvite('not-a-uuid')
    expect(result).toEqual({ status: 400, erroMessage: 'ID inválido.' })
  })

  it('guard de autorização — não autenticado retorna 401', async () => {
    // Override supabase-server mock to return null user
    // expect result.status === 401
  })

  it('D-08 — filtra por proprietario_id do usuário autenticado', async () => {
    // After calling revogarConvite(validId):
    expect(mockEq).toHaveBeenCalledWith('proprietario_id', mockUser.id)
  })
})
```

### unidades.js / contratos.js — IDOR gap note

See **Critical Finding: D-08 Scope Mismatch** below.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Chainable mock builder | Custom proxy/class | `vi.fn().mockReturnValue(builder)` + thenable | Vitest spy API covers this cleanly |
| Module alias resolution | Manual path rewriting | `resolve.alias` in vitest.config.js | Vite-native, zero runtime cost |
| CI job structure | Custom orchestration | GitHub Actions `needs:` + separate job | Standard pattern, already in e2e.yml |

---

## Critical Finding: D-08 Scope Mismatch

**What was discovered:** D-08 requires asserting `.eq('proprietario_id', user.id)` on every mutation Action. Research into the schema and Action code reveals this is only possible for `locatarios.js` actions.

**Schema evidence:**
- Migration `20260521000000_multi_tenant_proprietario_id.sql` adds `proprietario_id` to `edificios` and `locatarios` only — NOT to `unidades` or `contratos`. [VERIFIED: migration file]
- Tenancy for `unidades`/`contratos` flows via `edificio_id → edificios.proprietario_id` through RLS helper functions (not a direct column on the table).

**Action code evidence:**
- `editarUnidade`: `.update(patch).eq('id', id)` — no `proprietario_id` filter [VERIFIED: src/actions/unidades.js:50]
- `deletarUnidade`: `.delete().eq('id', id)` — no `proprietario_id` filter [VERIFIED: src/actions/unidades.js:60]
- `cancelarContrato`: `.eq('id', id)` — no `proprietario_id` filter [VERIFIED: src/actions/contratos.js:74]
- `encerrarContrato`: `.eq('id', id)` — no `proprietario_id` filter [VERIFIED: src/actions/contratos.js:98]

**The IDOR risk:** `supabaseAdmin` uses the service-role key — it **bypasses RLS**. The `authGuard()` confirms the user is a Proprietário, but any authenticated Proprietário could edit/delete unidades or contratos belonging to another Proprietário because the Action filters only by `id`, not `proprietario_id`. RLS would catch anon queries, but service-role bypasses it.

**MT-02 context:** The Phase 11 MT-02 checklist closed IDOR for `editarEdificio`, `deletarEdificio`, `editarLocatario`, `deletarLocatario`, `revogarConvite` — but NOT for `editarUnidade`, `deletarUnidade`, `editarContrato`, `cancelarContrato`, `encerrarContrato`.

**Planning options (user decision in Open Questions):**

1. **Fix inline (recommended for banca):** Add `.eq('edificio_id', owned_edificio_id_subquery)` or restructure with a prior ownership check. Small change, closes real security gap. Then D-08 assertion works.
2. **Fix inline, simpler:** Add a preliminary query to confirm ownership (like the `revogarConvite` pattern — fetch first, check proprietario_id, then update). Adds one round-trip.
3. **Defer:** Assert only what exists — `authGuard()` firing (401/403) and `.eq('id', id)`. Document the gap. Test what's there; fix post-banca.

---

## Common Pitfalls

### Pitfall 1: vi.mock hoisting vs. import order
**What goes wrong:** Writing `vi.mock(...)` after an `import` statement — Vitest hoists `vi.mock` to the top automatically, but using variables defined at module scope inside the factory fails because they haven't been assigned yet.
**Why it happens:** Hoisting is static; closures over module-scope `let` see the uninitialized value.
**How to avoid:** Keep mock factories self-contained (use `vi.fn()` inline), or use `vi.hoisted()` to declare variables that need to be referenced inside factories.
**Example of the failure:**
```js
// WRONG — `mockSignUp` is not yet assigned when factory runs
const mockSignUp = vi.fn()
vi.mock('@supabase/ssr', () => ({ createServerClient: () => ({ auth: { signUp: mockSignUp } }) }))
// CORRECT — use vi.hoisted
const { mockSignUp } = vi.hoisted(() => ({ mockSignUp: vi.fn() }))
vi.mock('@supabase/ssr', () => ({ createServerClient: () => ({ auth: { signUp: mockSignUp } }) }))
```

### Pitfall 2: Awaiting a non-thenable chain
**What goes wrong:** `await supabaseAdmin.from('x').update(y).eq('id', id)` returns `undefined` or the builder object instead of `{data, error}`.
**Why it happens:** If the builder has no `then()` method, `await` resolves immediately with the builder.
**How to avoid:** Add `then(resolve) { return Promise.resolve(_resolve).then(resolve) }` to the builder object.

### Pitfall 3: `test:unit` as watch mode hangs CI
**What goes wrong:** `"test:unit": "vitest"` (without `run`) starts Vitest in watch mode — CI job never exits.
**How to avoid:** Script must be `"test:unit": "vitest run"`. Use `"test:unit:watch": "vitest"` for local dev if desired.

### Pitfall 4: `server-only` throws before factory mock can intercept
**What goes wrong:** Even with a factory `vi.mock('@/lib/supabaseAdmin')`, if `supabaseAdmin.js` is **evaluated** before the mock, the `import 'server-only'` throws.
**Why it happens:** Vitest mocks prevent the real module's exports from being used, but `server-only` is a side-effect import — it throws on evaluation, before exports matter.
**How to avoid:** The `resolve.alias: { 'server-only': './test/unit/helpers/server-only-stub.js' }` in vitest.config.js prevents the real `server-only` from executing in the test environment. The factory mock also prevents supabaseAdmin.js from running, so this is belt-and-suspenders.

### Pitfall 5: `auth.js` mock targets differ from other Actions
**What goes wrong:** Applying the same `vi.mock('@/lib/supabaseAdmin')` pattern to `auth.js` — `auth.js` doesn't import `supabaseAdmin` at all.
**Why it happens:** `auth.js` uses `@supabase/ssr createServerClient` directly + `next/headers cookies()`.
**How to avoid:** For `auth.test.js`, mock `@supabase/ssr` and `next/headers` instead. For all other Action tests, mock `@/lib/supabaseAdmin` and `@/lib/supabase-server`.

### Pitfall 6: E2E toast-feedback.spec.js split — intertwined beforeAll fixtures
**What goes wrong:** Splitting `toast-feedback.spec.js` by domain breaks fixture sharing — the `beforeAll` in the original creates edificio→unidade→contrato→locatario as a single setup block.
**How to avoid:** When splitting, extract a per-domain fixture helper in each new file. Each domain file creates its own minimal fixtures in `beforeAll` and cleans in `afterAll`. The `workers:1` + `fullyParallel:false` Playwright config means file ordering and global seed/teardown are unaffected by the split.

### Pitfall 7: AUTH-02 guard is DB-side, not JS-side
**What goes wrong:** Writing a unit test that asserts cadastrarProprietario returns "Instância já configurada" — the JS code has no such check; signUp always proceeds.
**Why it happens:** The single-Proprietário guard is enforced by a DB trigger or Supabase Auth policy, not JS code.
**How to avoid:** AUTH-02 E2E test (signup.spec.js) can mock Supabase signUp to return an appropriate error and assert the UI displays the message. The unit test for cadastrarProprietario can only assert error pass-through from a mocked signUp.

---

## E2E Gap Analysis (TEST-02)

### Existing Coverage vs. Success Criteria

| Success Criteria | Spec File | Coverage | Gap |
|-----------------|-----------|----------|-----|
| Signup flow (AUTH-01 happy path) | `signup.spec.js` | COVERED — email_sent state verified | None |
| AUTH-02: second signup blocked ("Instância já configurada") | `signup.spec.js` | NOT COVERED — only happy path | **GAP: new test needed** |
| /unidades redesign (PUB-01 card: nome, edifício, área, preço/Consulte, badge) | `public-pages.spec.js` | COVERED — PUB-01/02/03 verified | None |
| Mobile 375px — no overflow | `mobile-responsive.spec.js` | COVERED — static overflow checks | Partial — not a journey |
| Mobile 375px — ≥1 complete journey | `mobile-responsive.spec.js` | PARTIAL — visibility/overflow only, not full interaction journey | **GAP: complete one flow on 375px** |
| Toast feedback (ANIM-03) | `toast-feedback.spec.js` | COVERED — 5 main actions verified | None |

**Concrete gaps to fill:**

1. **AUTH-02 spec:** New test in `signup.spec.js` (or new `signup-guard.spec.js`) that calls `cadastrarProprietario` with a second email after instance is configured and asserts the UI shows a "Instância já configurada" or similar rejection message. Needs to mock the signUp response since the guard is DB-side — or use a real Supabase call in E2E context where the DB trigger fires.

2. **Mobile journey spec:** At least one complete user journey (e.g., login → navigate to /dashboard/unidades on 375px → interact with a list item → confirm action succeeds) in `mobile-responsive.spec.js` or a new `mobile-journey.spec.js`. Current spec only checks layout — not that UI is actually operable.

### D-10 Split Strategy

**`crud.spec.js` (27KB) — split by domain:**

| New file | Content from original | Shared setup |
|----------|----------------------|--------------|
| `crud-edificios.spec.js` | `test.describe('Edifícios', ...)` (criar/editar/deletar) | Own beforeEach login |
| `crud-unidades.spec.js` | `test.describe('Unidades', ...)` (criar/editar/deletar) | Own beforeEach login |
| `crud-locatarios.spec.js` | `test.describe('Locatários', ...)` (convidar/editar) | Own beforeAll fixture |
| `crud-contratos.spec.js` | `test.describe('Contratos', ...)` (criar/cancelar/encerrar) | Own beforeAll fixture |

**`toast-feedback.spec.js` (17KB) — split by domain:**

| New file | Tests | Setup required |
|----------|-------|----------------|
| `toast-contratos.spec.js` | "Contrato criado", "Contrato cancelado", "Contrato encerrado" | Own edificio+unidade+locatario+contrato fixtures |
| `toast-unidades.spec.js` | "Unidade removida" | Own edificio+unidade fixture |
| `toast-locatarios.spec.js` | "Acesso revogado" | Own locatario fixture |
| `toast-parcelas.spec.js` | "Parcela marcada como paga" | Own contrato+parcela fixture |

**Safe split pattern:** Move the `beforeAll`/`afterAll` from the monolith into each domain file, scoping fixture creation to only what that domain needs. The single `admin` client and the idempotent cleanup pattern remain the same.

**Key gotcha:** The original `toast-feedback.spec.js` has shared `let edificioId, contratoId, ...` at module scope, all created in one `beforeAll`. When split, each file must create its own scoped vars. The intertwined setup is the main work — the tests themselves are straightforward moves.

**Ordering safety:** `playwright.config.js` sets `fullyParallel: false`, `workers: 1`. The `globalSetup`/`globalTeardown` (`seed.mjs`) operates at process level before/after all spec files — splitting files does not affect seed/teardown behavior.

---

## GitHub Actions: Unit Job

**Current workflow:** `.github/workflows/e2e.yml` — single `e2e` job with full Supabase setup + Playwright.

**New `unit` job to add (parallel to `e2e`, much lighter):**

```yaml
# Add inside jobs: (alongside e2e)
unit:
  runs-on: ubuntu-latest
  timeout-minutes: 5          # unit tests are fast — no browser, no DB

  steps:
    - uses: actions/checkout@v4

    - uses: actions/setup-node@v4
      with:
        node-version: '20'
        cache: 'npm'

    - name: Install dependencies
      run: npm ci

    - name: Run unit tests
      run: npm run test:unit
```

**No Supabase CLI needed.** No `supabase start`. No `.env.test`. No Playwright install. The unit job exercises only mocked code.

**For D-03 "blocks merge":** In a PR context, GitHub Actions PR checks are required checks. Adding the `unit` job to `on.pull_request` is sufficient — a failing job blocks merge via branch protection rules. No `needs:` dependency is required (parallel is fine).

---

## Validation Architecture

> `workflow.nyquist_validation: true` in config.json — section included.

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest 4.1.8 |
| Config file | `vitest.config.js` (Wave 0 — create) |
| Quick run command | `npx vitest run test/unit/actions/<file>.test.js` |
| Full suite command | `npm run test:unit` (→ `vitest run`) |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| TEST-01 | cadastrarProprietario happy/error/guard | unit | `npm run test:unit` | ❌ Wave 0 |
| TEST-01 | revogarConvite happy/error/guard + D-08 | unit | `npm run test:unit` | ❌ Wave 0 |
| TEST-01 | editarUnidade/deletarUnidade happy/error/guard | unit | `npm run test:unit` | ❌ Wave 0 |
| TEST-01 | encerrarContrato/cancelarContrato happy/error/guard | unit | `npm run test:unit` | ❌ Wave 0 |
| TEST-02 | AUTH-02 second signup guard | E2E | `npm run test:e2e -- --grep AUTH-02` | ❌ Wave 0 |
| TEST-02 | Mobile 375px complete journey | E2E | `npm run test:e2e -- --grep mobile-journey` | ❌ Wave 0 |
| TEST-02 | crud.spec.js split by domain | E2E (refactor) | `npm run test:e2e` | Existing (split) |
| TEST-02 | toast-feedback.spec.js split by domain | E2E (refactor) | `npm run test:e2e` | Existing (split) |

### Sampling Rate
- **Per task commit:** `npx vitest run test/unit/actions/<relevant file>.test.js`
- **Per wave merge:** `npm run test:unit` (full unit suite, must exit 0)
- **Phase gate:** `npm run test:unit` green + `npm run test:e2e` green before `/gsd-verify-work`

### Wave 0 Gaps
- [ ] `vitest.config.js` — root config file
- [ ] `test/unit/helpers/server-only-stub.js` — empty module stub
- [ ] `test/unit/helpers/supabaseMock.js` — chainable builder factory (D-05)
- [ ] `test/unit/actions/auth.test.js` — cadastrarProprietario (3 cases)
- [ ] `test/unit/actions/locatarios.test.js` — revogarConvite (3 cases + D-08)
- [ ] `test/unit/actions/unidades.test.js` — editarUnidade + deletarUnidade (pending D-08 decision)
- [ ] `test/unit/actions/contratos.test.js` — encerrarContrato + cancelarContrato (pending D-08 decision)
- [ ] `package.json` — add `"test:unit": "vitest run"`
- [ ] `.github/workflows/e2e.yml` — add `unit` job

---

## Security Domain

> `security_enforcement` absent in config — treated as enabled.

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V4 Access Control | YES | `authGuard()` — unit tests verify 401/403 paths |
| V5 Input Validation | YES | UUID_RE, email/document regex — unit tests verify 400 paths |
| V6 Cryptography | NO | No crypto in these Actions |

### Known Threat Patterns for this stack

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| IDOR via service-role client | Elevation of Privilege | `.eq('proprietario_id', user.id)` or prior ownership check — PARTIALLY MISSING (see Critical Finding) |
| Auth bypass (no guard) | Spoofing | `authGuard()` — unit tests verify 401 path |
| UUID injection | Tampering | `UUID_RE` regex — unit tests verify 400 path |

---

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | `vite-tsconfig-paths` resolves `jsconfig.json` the same as `tsconfig.json` for `@/*` aliases | Standard Stack | If wrong, use manual `resolve.alias: { '@': path.resolve(__dirname, './src') }` — trivial fix |
| A2 | `vite-tsconfig-paths` v5.x is current stable (confirmed v6.1.1 via `npm view`, but official docs cite it for TS — JS behavior assumed equivalent) | Standard Stack | If wrong, pin `5.x` or use manual alias |
| A3 | The chainable builder `then()` pattern causes the builder to be thenable when awaited | Code Examples | If wrong, restructure terminal methods (`.eq`, `.delete`) to return `Promise.resolve()` directly instead of `builder` |
| A4 | AUTH-02 "Instância já configurada" message is surfaced in the UI from an error returned by `signUp` | E2E Gap Analysis | If the message comes from a different source (Supabase error body vs. custom JS), the E2E test assertion needs adjustment |

---

## Open Questions

1. **D-08 IDOR gap: fix inline or defer?**
   - What we know: `editarUnidade`, `deletarUnidade`, `cancelarContrato`, `encerrarContrato` do not filter by `proprietario_id` — `supabaseAdmin` bypasses RLS, so cross-tenant mutations are possible.
   - What's unclear: Whether this gap was knowingly accepted (single-Proprietário TCC context, low risk) or was missed in Phase 11.
   - Recommendation: Fix inline. Add a preliminary ownership check (fetch edificio_id, verify it belongs to user) before the mutation. Small, testable, closes a real gap. If timeline is too tight (6 days to banca), accept the gap and document it; assert only authGuard firing.

2. **AUTH-02 E2E approach: mock or real DB?**
   - What we know: The "instância única" guard is DB-side. In E2E context, Supabase is running locally (via `supabase start`) with seed data.
   - What's unclear: Whether the DB trigger/policy actually returns a catchable error when a second signup is attempted.
   - Recommendation: Write the E2E test to attempt a real second signup (with a different email) while the proprietário already exists, and assert the UI shows a rejection message. This tests the real constraint without mocking.

---

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | Vitest | ✓ | ≥20 (engines field) | — |
| npm | package install | ✓ | bundled with Node | — |
| vitest | TEST-01 | ✗ | — | Install via `npm install -D vitest` |
| vite-tsconfig-paths | TEST-01 alias resolution | ✗ | — | Manual `resolve.alias` in vitest.config.js |
| @playwright/test | TEST-02 | ✓ | ^1.60.0 (installed) | — |
| Supabase local | E2E execution | not verified in CI context | — | GitHub Actions CI has Supabase setup step |

**Missing dependencies with no fallback:** vitest (required for TEST-01) — Wave 0 install task.
**Missing dependencies with fallback:** vite-tsconfig-paths (fallback: manual alias).

---

## Sources

### Primary (HIGH confidence)
- [CITED: nextjs.org/docs/app/guides/testing/vitest] — Official Next.js Vitest guide. Confirms: vitest + @vitejs/plugin-react + jsdom for component tests. Research notes that Server Action tests use `environment: 'node'` instead (no JSX/DOM).
- [VERIFIED: src/actions/unidades.js, contratos.js, locatarios.js, auth.js] — Direct Action code inspection for mock targets, return contract, and D-08 scope.
- [VERIFIED: supabase/migrations/20260521000000_multi_tenant_proprietario_id.sql] — Confirms `proprietario_id` column exists on `edificios` + `locatarios` only, not `unidades`/`contratos`.
- [VERIFIED: npm registry] — `vitest` v4.1.8 confirmed via `npm view vitest`, homepage vitest.dev, official GitHub vitest-dev/vitest.
- [VERIFIED: npm registry] — `vite-tsconfig-paths` v6.1.1 confirmed via `npm view vite-tsconfig-paths`.

### Secondary (MEDIUM confidence)
- [WebSearch verified] — `vi.fn().mockReturnThis()` pattern for Supabase chainable mocks confirmed via Vitest docs + community examples.
- [WebFetch: vitest.dev/guide/mocking.html] — vi.mock hoisting behavior confirmed.
- [WebFetch: vitest.dev/config/] — `resolve.alias` placement confirmed (top-level, not inside `test:`).

### Tertiary (LOW confidence)
- [ASSUMED] — `then()` on builder makes it thenable when awaited. Based on JavaScript Promise protocol; no Vitest-specific doc confirmed this pattern.

---

## Metadata

**Confidence breakdown:**
- Standard Stack: HIGH — vitest confirmed on npm + official Next.js docs
- Architecture: HIGH — based on direct Action code inspection
- Mock Patterns: MEDIUM — hoisting confirmed; thenable builder is ASSUMED
- Pitfalls: HIGH — D-08 mismatch is VERIFIED from migration + Action source
- E2E Gap Analysis: HIGH — based on direct spec file inspection (cannot run suite without Supabase + build)

**Research date:** 2026-06-12
**Valid until:** 2026-06-19 (stable ecosystem; 7 days adequate for TCC banca timeline)
