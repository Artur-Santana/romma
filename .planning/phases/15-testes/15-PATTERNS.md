# Phase 15: Testes - Pattern Map

**Mapped:** 2026-06-12
**Files analyzed:** 13 new/modified files
**Analogs found:** 11 / 13

---

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|---|---|---|---|---|
| `vitest.config.js` | config | — | `playwright.config.js` | role-match (different framework, same purpose) |
| `test/unit/helpers/server-only-stub.js` | utility | — | `e2e/fixtures.js` | partial (both are shared test support files) |
| `test/unit/helpers/supabaseMock.js` | utility | — | `e2e/helpers.js` | partial (both are shared test helpers) |
| `test/unit/actions/auth.test.js` | test | request-response | `e2e/server-actions.spec.js` | role-match |
| `test/unit/actions/locatarios.test.js` | test | request-response | `e2e/server-actions.spec.js` | role-match |
| `test/unit/actions/unidades.test.js` | test | request-response | `e2e/server-actions.spec.js` | role-match |
| `test/unit/actions/contratos.test.js` | test | request-response | `e2e/server-actions.spec.js` | role-match |
| `package.json` (modified) | config | — | existing `package.json` | exact |
| `.github/workflows/e2e.yml` (modified) | config | — | `.github/workflows/e2e.yml` | exact |
| `e2e/crud-edificios.spec.js` | test | request-response | `e2e/crud.spec.js` lines 36-65 | exact (split source) |
| `e2e/crud-unidades.spec.js` | test | request-response | `e2e/crud.spec.js` lines 68+ | exact (split source) |
| `e2e/crud-contratos.spec.js` | test | request-response | `e2e/crud.spec.js` | exact (split source) |
| `e2e/crud-locatarios.spec.js` | test | request-response | `e2e/crud.spec.js` | exact (split source) |
| `e2e/toast-contratos.spec.js` | test | event-driven | `e2e/toast-feedback.spec.js` lines 39-100 | exact (split source) |
| `e2e/toast-unidades.spec.js` | test | event-driven | `e2e/toast-feedback.spec.js` | exact (split source) |
| `e2e/toast-locatarios.spec.js` | test | event-driven | `e2e/toast-feedback.spec.js` | exact (split source) |
| `e2e/toast-parcelas.spec.js` | test | event-driven | `e2e/toast-feedback.spec.js` | exact (split source) |

---

## Pattern Assignments

### `vitest.config.js` (config)

**Analog:** `playwright.config.js`

**Imports pattern** (`playwright.config.js` lines 1-4):
```js
import { defineConfig, devices } from '@playwright/test'
import dotenv from 'dotenv'
```
Apply: same `defineConfig` export shape. Use `defineConfig` from `vitest/config` instead.

**Core config pattern** (`playwright.config.js` lines 6-33):
```js
export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  workers: 1,
  // ...
})
```
Apply: same top-level export pattern. For Vitest:
```js
import { defineConfig } from 'vitest/config'
import path from 'path'

export default defineConfig({
  test: {
    environment: 'node',    // Server Actions: no DOM
    globals: true,          // describe/it/expect/vi without imports
    include: ['test/unit/**/*.test.js'],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      'server-only': path.resolve(__dirname, 'test/unit/helpers/server-only-stub.js'),
    },
  },
})
```

**Key constraint:** `jsconfig.json` defines `"@/*": ["./src/*"]` — the manual `resolve.alias` replicates this for Vitest without needing `vite-tsconfig-paths`. The `server-only` alias stubs the `import 'server-only'` guard in `src/lib/supabaseAdmin.js` (line 2) which would throw outside RSC context.

---

### `test/unit/helpers/server-only-stub.js` (utility)

**Analog:** `e2e/fixtures.js`

No complex pattern — empty module that satisfies `import 'server-only'` side-effect without throwing:

```js
// test/unit/helpers/server-only-stub.js
export default {}
```

---

### `test/unit/helpers/supabaseMock.js` (utility, shared factory)

**Analog:** `e2e/helpers.js` (shared test helper pattern)

**`e2e/helpers.js` pattern** (lines 5-10):
```js
export async function login(page, { email, password }) {
  // pure helper exported for reuse across all specs
}
```
Apply: same exported-function pattern. The mock factory exports `createSupabaseMock()`.

**Supabase chain anatomy** (from `src/actions/locatarios.js` lines 79-84):
```js
// Real chain this mock must replicate:
const { data: loc, error: fetchErr } = await supabaseAdmin
    .from('locatarios').select('usuario_id, status_convite').eq('id', id).eq('proprietario_id', user.id).single()
// ...
const { error: delErr } = await supabaseAdmin.from('locatarios').delete().eq('id', id).eq('proprietario_id', user.id)
```

**`auth.admin` namespace** (from `src/actions/locatarios.js` lines 41, 86):
```js
await supabaseAdmin.auth.admin.deleteUser(data.user.id)
await supabaseAdmin.auth.admin.inviteUserByEmail(email, { redirectTo: ... })
```

**Core mock factory pattern:**
```js
// test/unit/helpers/supabaseMock.js
import { vi } from 'vitest'

export function createSupabaseMock() {
  let _resolve = { data: null, error: null }

  const builder = {
    from: vi.fn(),
    select: vi.fn(),
    insert: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    eq: vi.fn(),
    single: vi.fn(),
    auth: {
      admin: {
        deleteUser: vi.fn(),
        inviteUserByEmail: vi.fn(),
      },
      signUp: vi.fn(),
    },
    // Thenable: makes `await builder.from(...).eq(...)` resolve correctly
    then(resolve) {
      return Promise.resolve(_resolve).then(resolve)
    },
  }

  // Wire chain methods to return builder (enables .from().select().eq() chaining)
  builder.from.mockReturnValue(builder)
  builder.select.mockReturnValue(builder)
  builder.insert.mockReturnValue(builder)
  builder.update.mockReturnValue(builder)
  builder.delete.mockReturnValue(builder)
  builder.eq.mockReturnValue(builder)
  // .single() is terminal — resolves with configured result directly
  builder.single.mockImplementation(() => Promise.resolve(_resolve))

  function configureResult(result) {
    _resolve = result
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

**Critical:** The `then()` method is required because Actions await the full chain inline (e.g., `const { error } = await supabaseAdmin.from('unidades').delete().eq('id', id)` — `src/actions/unidades.js` line 60). Without `then()`, `await` resolves with the builder object, not `{data, error}`.

---

### `test/unit/actions/auth.test.js` (test, request-response)

**Analog:** `e2e/server-actions.spec.js`

**Target Action:** `src/actions/auth.js` — `cadastrarProprietario`

**Action imports** (`src/actions/auth.js` lines 1-4):
```js
"use server"
import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
```
These are the two mock targets for this file. `supabaseAdmin` is NOT used — different from all other Actions.

**Action contract** (`src/actions/auth.js`):
- Line 8-9: validates `email` and `senha` → returns `{ status: 400, erroMessage: "Email e senha são obrigatórios." }`
- Line 33-38: calls `supabase.auth.signUp({ email, password: senha, options: { emailRedirectTo } })`
- Line 41-43: if Supabase error → `{ status: error.status ?? 500, erroMessage: error.message }`
- Line 45: success → `{ status: 200 }`

**Mock setup — `vi.hoisted` pattern** (avoids hoisting pitfall from RESEARCH.md):
```js
import { vi, describe, it, expect, beforeEach } from 'vitest'

// vi.hoisted ensures these vars are assigned before vi.mock factories run
const { mockSignUp } = vi.hoisted(() => ({ mockSignUp: vi.fn() }))

vi.mock('next/headers', () => ({
  cookies: vi.fn().mockResolvedValue({
    getAll: vi.fn().mockReturnValue([]),
    set: vi.fn(),
  }),
}))

vi.mock('@supabase/ssr', () => ({
  createServerClient: vi.fn(() => ({
    auth: { signUp: mockSignUp },
  })),
}))

import { cadastrarProprietario } from '@/actions/auth'
```

**Test structure** (copy from `e2e/server-actions.spec.js` describe/beforeEach shape):
```js
describe('cadastrarProprietario', () => {
  beforeEach(() => { vi.clearAllMocks() })

  it('happy path — retorna status 200', async () => {
    mockSignUp.mockResolvedValue({ error: null })
    const result = await cadastrarProprietario({ email: 'a@b.com', senha: 'pass123' })
    expect(result).toEqual({ status: 200 })
  })

  it('erro de validação — email ou senha ausentes retorna 400', async () => {
    const result = await cadastrarProprietario({ email: '', senha: '' })
    expect(result.status).toBe(400)
    expect(result.erroMessage).toBeTruthy()
  })

  it('erro do Supabase — signUp error repassa status e erroMessage', async () => {
    mockSignUp.mockResolvedValue({ error: { status: 422, message: 'Email rate limit exceeded' } })
    const result = await cadastrarProprietario({ email: 'a@b.com', senha: 'pass123' })
    expect(result.status).toBe(422)
    expect(result.erroMessage).toBe('Email rate limit exceeded')
  })
})
```

**Note:** AUTH-02 "instância única" guard does NOT exist in JS code — `cadastrarProprietario` calls `signUp` unconditionally. Guard is DB-side. Unit tests cover only JS-layer validation and signUp error pass-through.

---

### `test/unit/actions/locatarios.test.js` (test, request-response)

**Analog:** `e2e/server-actions.spec.js`

**Target Actions:** `src/actions/locatarios.js` — `revogarConvite`

**Action imports** (`src/actions/locatarios.js` lines 1-6):
```js
"use server"
import supabaseAdmin from "@/lib/supabaseAdmin"
import { createServer } from "@/lib/supabase-server"
import { isProprietario } from "@/lib/auth"
```
Three mock targets: `@/lib/supabaseAdmin`, `@/lib/supabase-server`, `@/lib/auth`.

**Auth guard pattern** (`src/actions/locatarios.js` lines 92-97) — note: locatarios.js does NOT use `authGuard()` — each function calls `createServer()` inline:
```js
export async function revogarConvite(id) {
    const supabase = await createServer()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { status: 401, erroMessage: 'Não autenticado.' }
    if (!await isProprietario(supabase)) return { status: 403, erroMessage: 'Sem permissão.' }
    if (!UUID_RE.test(id)) return { status: 400, erroMessage: 'ID inválido.' }
```

**D-08 IDOR assertion** (`src/actions/locatarios.js` lines 98-99, 108):
```js
// These lines are what D-08 tests must assert are called:
const { data: loc, error: fetchErr } = await supabaseAdmin
    .from('locatarios').select('usuario_id, status_convite').eq('id', id).eq('proprietario_id', user.id).single()
// ...
const { error: delErr } = await supabaseAdmin.from('locatarios').delete().eq('id', id).eq('proprietario_id', user.id)
```

**UUID validation** (`src/actions/locatarios.js` line 7):
```js
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
```

**Mock setup:**
```js
const { mockUser, mockIsProprietario, mockGetUser } = vi.hoisted(() => ({
  mockUser: { id: 'proprietario-uuid-1234-5678-abcd' },
  mockIsProprietario: vi.fn(),
  mockGetUser: vi.fn(),
}))

vi.mock('@/lib/supabase-server', () => ({
  createServer: vi.fn().mockResolvedValue({
    auth: { getUser: mockGetUser },
  }),
}))

vi.mock('@/lib/auth', () => ({
  isProprietario: mockIsProprietario,
}))

// Use createSupabaseMock() from supabaseMock.js for admin client
import { createSupabaseMock } from '../helpers/supabaseMock.js'
const { mockAdmin, configureResult, resetAll } = createSupabaseMock()

vi.mock('@/lib/supabaseAdmin', () => ({ default: mockAdmin }))

import { revogarConvite } from '@/actions/locatarios'

describe('revogarConvite', () => {
  const validId = '00000000-0000-0000-0000-000000000001'

  beforeEach(() => {
    resetAll()
    mockGetUser.mockResolvedValue({ data: { user: mockUser } })
    mockIsProprietario.mockResolvedValue(true)
  })

  it('happy path — revoga convite pendente', async () => { ... })

  it('erro de validação — UUID inválido retorna 400', async () => {
    const result = await revogarConvite('not-a-uuid')
    expect(result).toEqual({ status: 400, erroMessage: 'ID inválido.' })
  })

  it('guard de autorização — não autenticado retorna 401', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } })
    const result = await revogarConvite(validId)
    expect(result.status).toBe(401)
  })

  it('D-08 — filtra select e delete por proprietario_id do usuário', async () => {
    // setup mock to allow full execution...
    await revogarConvite(validId)
    expect(mockAdmin.eq).toHaveBeenCalledWith('proprietario_id', mockUser.id)
  })
})
```

**Style note:** `locatarios.js` uses 4-space indentation and single quotes (`'`) — the project CLAUDE.md flags this as a known inconsistency. Unit test files should use 2-space indentation per project canon.

---

### `test/unit/actions/unidades.test.js` (test, request-response)

**Analog:** `e2e/server-actions.spec.js`

**Target Actions:** `src/actions/unidades.js` — `editarUnidade`, `deletarUnidade`

**Action imports** (`src/actions/unidades.js` lines 1-6):
```js
'use server'
import supabaseAdmin from '@/lib/supabaseAdmin'
import { createServer } from '@/lib/supabase-server'
import { isProprietario } from '@/lib/auth'
```

**`authGuard()` pattern** (`src/actions/unidades.js` lines 10-16) — critical: returns `{}` NOT `{ user }`:
```js
async function authGuard() {
  const supabase = await createServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { err: { status: 401, erroMessage: 'Não autenticado.' } }
  if (!await isProprietario(supabase)) return { err: { status: 403, erroMessage: 'Sem permissão.' } }
  return {}
}
```

**Action usage** (`src/actions/unidades.js` lines 37-52 for `editarUnidade`):
```js
export async function editarUnidade(id, form) {
  const { err } = await authGuard()
  if (err) return err
  if (!UUID_RE.test(id)) return { status: 400, erroMessage: 'ID inválido.' }
  // ...
  const { error } = await supabaseAdmin.from('unidades').update(patch).eq('id', id)
  if (error) return { status: 500, erroMessage: error.message }
  return { status: 200 }
}
```

**IDOR note for D-08:** `editarUnidade` and `deletarUnidade` filter only `.eq('id', id)` — NOT `.eq('proprietario_id', user.id)`. The `authGuard()` returns `{}`, so `user` is unavailable to the caller. This is the IDOR gap from the critical finding in RESEARCH.md. The unit tests must account for this:

- If IDOR fix is deferred: D-08 assertion for these Actions is limited to confirming `authGuard` fires (test 401 path) and `.eq('id', id)` is called.
- If IDOR fix is applied: change `authGuard()` to `return { user }`, update callers to `const { err, user } = await authGuard()`, then add `.eq('edificio_id', ownedId)` or a prior ownership fetch+check.

**Mock targets:** same three as locatarios (`@/lib/supabaseAdmin`, `@/lib/supabase-server`, `@/lib/auth`). Use `createSupabaseMock()`.

**Test structure per action (3 cases each):**
```js
describe('editarUnidade', () => {
  const validId = '00000000-0000-0000-0000-000000000001'
  const validForm = { nome: 'Sala Teste', area_m2: 50, valor_mensal: 1000 }

  it('happy path — retorna status 200', async () => { ... })
  it('erro de validação — UUID inválido retorna 400', async () => {
    const result = await editarUnidade('not-uuid', validForm)
    expect(result).toEqual({ status: 400, erroMessage: 'ID inválido.' })
  })
  it('guard — não autenticado retorna 401', async () => {
    // override mockGetUser to return null user
    const result = await editarUnidade(validId, validForm)
    expect(result.status).toBe(401)
  })
})
```

---

### `test/unit/actions/contratos.test.js` (test, request-response)

**Analog:** `e2e/server-actions.spec.js`

**Target Actions:** `src/actions/contratos.js` — `encerrarContrato`, `cancelarContrato`

**Action imports** (`src/actions/contratos.js` lines 1-7):
```js
"use server"
import supabaseJWT from "@/lib/supabaseJWT"
import supabaseAdmin from "@/lib/supabaseAdmin"
import { createServer } from "@/lib/supabase-server"
import { isProprietario } from "@/lib/auth"
```

**`authGuard()` pattern** (`src/actions/contratos.js` lines 11-17) — identical to `unidades.js`, returns `{}` not `{ user }`:
```js
async function authGuard() {
  const supabase = await createServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { err: { status: 401, erroMessage: 'Não autenticado.' } }
  if (!await isProprietario(supabase)) return { err: { status: 403, erroMessage: 'Sem permissão.' } }
  return {}
}
```

**Multi-step chain** (`src/actions/contratos.js` lines 63-90 for `cancelarContrato`):
```js
// Step 1: fetch contrato to get unidade_id
const { data: contrato, error: fetchErr } = await supabaseAdmin
    .from('contratos').select('unidade_id').eq('id', id).single()
if (fetchErr || !contrato) return { status: 404, erroMessage: 'Contrato não encontrado.' }

// Step 2: update status
const { error } = await supabaseAdmin.from('contratos').update({ status: 'cancelado' }).eq('id', id)

// Step 3: update unidade status
const { error: errUnidade } = await supabaseAdmin.from('unidades').update({ status: 'disponivel' }).eq('id', contrato.unidade_id)

// Step 4: delete parcelas futuras
await supabaseAdmin.from('parcelas').delete().eq('contrato_id', id).eq('status', 'futura')
```

**Mock consideration:** `configureResult` applies to all awaited chains — for multi-step sequences, may need `builder.single.mockImplementationOnce(...)` to return different results per call.

**Mock targets:** `@/lib/supabaseAdmin`, `@/lib/supabase-server`, `@/lib/auth`. Note: `supabaseJWT` is only used by `gerarParcelas` (not under test) — no need to mock it.

**Test structure:**
```js
describe('cancelarContrato', () => {
  const validId = '00000000-0000-0000-0000-000000000001'

  it('happy path — retorna status 200', async () => {
    // configureResult for .single() to return { data: { unidade_id: 'u-id' }, error: null }
    // configureResult for subsequent .update() chains to return { error: null }
    expect(result).toEqual({ status: 200 })
  })
  it('erro de validação — UUID inválido retorna 400', async () => { ... })
  it('guard — não autenticado retorna 401', async () => { ... })
})
```

---

### `package.json` (modified)

**Analog:** existing `package.json`

**Scripts section** (`package.json` lines 8-17):
```json
"scripts": {
  "dev": "next dev",
  "build": "next build",
  "start": "next start",
  "lint": "eslint",
  "test:e2e": "playwright test",
  "test:e2e:ui": "playwright test --ui",
  "db:test:reset": "supabase db reset",
  "db:test:seed": "node e2e/seed.mjs"
}
```
Add after `"test:e2e:ui"`:
```json
"test:unit": "vitest run",
"test:unit:watch": "vitest"
```

**Critical:** Must be `vitest run` not `vitest` alone — `vitest` without `run` starts watch mode and hangs CI (RESEARCH.md pitfall 3).

**devDependencies section** (`package.json` lines 34-43):
Add `"vitest": "^4.1.8"` to devDependencies. No other new packages needed — `@vitejs/plugin-react` is already in dependencies (not needed for node-env unit tests but already present; `vite` is a peer dep of `vitest`).

---

### `.github/workflows/e2e.yml` (modified — add unit job)

**Analog:** existing `.github/workflows/e2e.yml`

**Full existing structure** (lines 1-56) — new `unit` job mirrors the `e2e` job structure but without Supabase/Playwright steps:
```yaml
name: E2E Tests

on:
  pull_request:
    branches: [main]

jobs:
  e2e:
    runs-on: ubuntu-latest
    timeout-minutes: 25
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      # ... Supabase setup, playwright install ...
      - name: Run E2E tests
        run: npm run test:e2e
```

**New `unit` job to add** (parallel to `e2e`, no `needs:` dependency):
```yaml
  unit:
    runs-on: ubuntu-latest
    timeout-minutes: 5       # no browser, no DB — fast

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

**Placement:** add `unit:` block inside the existing `jobs:` section, alongside `e2e:`. No Supabase CLI, no `.env.test`, no `playwright install`. Merge-blocking behavior is automatic when `unit` is added to `on.pull_request` — same trigger as the existing `e2e` job.

---

### E2E Split Files: `crud-*.spec.js` (4 files)

**Analog:** `e2e/crud.spec.js` (exact split source)

**Shared header pattern** (`e2e/crud.spec.js` lines 18-31) — copy verbatim to each split file:
```js
import { test, expect } from '@playwright/test'
import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'
import { login } from './helpers.js'
import { PROPRIETARIO } from './fixtures.js'

config({ path: '.env.test' })

const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
)
```

**Per-domain describe+beforeEach** (`e2e/crud.spec.js` lines 35-65 for Edifícios):
```js
test.describe('Edifícios', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, PROPRIETARIO)
    await page.waitForURL('**/dashboard', { timeout: 15_000 })
    await page.goto('/dashboard/edificios')
    await page.waitForURL('**/dashboard/edificios', { timeout: 10_000 })
  })
  // tests here...
})
```

**Split mapping:**
- `crud-edificios.spec.js` → `test.describe('Edifícios', ...)` block from `crud.spec.js`
- `crud-unidades.spec.js` → `test.describe('Unidades', ...)` block
- `crud-contratos.spec.js` → `test.describe('Contratos', ...)` block
- `crud-locatarios.spec.js` → `test.describe('Locatários', ...)` block

Each split file wraps the extracted describe block in a top-level `test.describe('TEST-01 — CRUD [Domain]', () => { test.use({ viewport: { width: 1440, height: 900 } }) ... })` to preserve the original test.use viewport from `crud.spec.js` line 33.

---

### E2E Split Files: `toast-*.spec.js` (4 files)

**Analog:** `e2e/toast-feedback.spec.js` (exact split source)

**Shared header pattern** (`e2e/toast-feedback.spec.js` lines 19-31) — copy verbatim:
```js
import { test, expect } from '@playwright/test'
import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'
import { login } from './helpers.js'
import { PROPRIETARIO } from './fixtures.js'

config({ path: '.env.test' })

const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
)
```

**beforeAll fixture pattern** (`e2e/toast-feedback.spec.js` lines 33-100) — the critical pattern to replicate in each split file with SCOPED variables:
```js
// ORIGINAL: shared let vars at module scope — must be scoped per-file when split
let edificioId, unidadeParaContratoId, unidadeParaDeletarId
let locatarioId, locatarioUserId
let contratoId

test.describe('ANIM-03 — ...', () => {
  test.use({ viewport: { width: 1440, height: 900 } })

  test.beforeAll(async () => {
    const { data: prop } = await admin.from('proprietarios').select('usuario_id').limit(1).single()
    const proprietarioId = prop.usuario_id

    // Idempotência: limpar artefatos stale
    const { data: staleUnidades } = await admin.from('unidades').select('id').in('nome', ['E2E-Toast Sala Contrato', ...])
    // ... cleanup logic ...

    // Create edificio
    const { data: edif } = await admin.from('edificios').insert({
      nome: 'E2E-Toast Edifício',
      endereco: 'Rua Toast, 1',
      proprietario_id: proprietarioId,
    }).select().single()
    edificioId = edif.id
    // ... create other fixtures ...
  })

  test.afterAll(async () => {
    // cleanup: delete created fixtures in reverse dependency order
  })
```

**Split mapping:**
- `toast-contratos.spec.js` → "Contrato criado", "Contrato cancelado", "Contrato encerrado" tests — needs full edificio+unidade+locatario+contrato fixture setup
- `toast-unidades.spec.js` → "Unidade removida" test — needs edificio+unidade fixtures only
- `toast-locatarios.spec.js` → "Acesso revogado" test — needs locatario fixture
- `toast-parcelas.spec.js` → "Parcela marcada como paga" test — needs contrato+parcela fixture

**Key gotcha:** Each split file declares its own `let` vars scoped to the module (not shared across files). The idempotent cleanup block from the original `beforeAll` should be preserved in each file, scoped to that domain's fixture names. `playwright.config.js` uses `fullyParallel: false, workers: 1` — no race conditions from file split.

---

## Shared Patterns

### Server Action Return Contract
**Source:** All `src/actions/*.js` files
**Apply to:** All `test/unit/actions/*.test.js` assertion lines
```js
// Success
return { status: 200 }

// Validation error
return { status: 400, erroMessage: 'ID inválido.' }

// Unauthorized
return { status: 401, erroMessage: 'Não autenticado.' }

// Forbidden
return { status: 403, erroMessage: 'Sem permissão.' }

// DB error
return { status: 500, erroMessage: error.message }
```
Note: `erroMessage` (not `errorMessage`) — established project spelling from CLAUDE.md.

### UUID Validation Pattern
**Source:** All action files (each declares locally)
```js
// From src/actions/unidades.js line 8 and src/actions/locatarios.js line 7:
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
```
Apply: use `'not-a-uuid'` to trigger 400 path in tests. Use `'00000000-0000-0000-0000-000000000001'` as valid test UUID (passes UUID_RE).

### vi.hoisted Pattern (avoids mock hoisting pitfall)
**Source:** RESEARCH.md pitfall 1
**Apply to:** All `test/unit/actions/*.test.js` files
```js
// CORRECT: hoisted variables available inside vi.mock factories
const { mockSignUp } = vi.hoisted(() => ({ mockSignUp: vi.fn() }))
vi.mock('@supabase/ssr', () => ({
  createServerClient: vi.fn(() => ({ auth: { signUp: mockSignUp } })),
}))

// WRONG: module-scope var not yet assigned when factory runs
const mockSignUp = vi.fn()
vi.mock('@supabase/ssr', () => ({ createServerClient: () => ({ auth: { signUp: mockSignUp } }) }))
```

### Playwright Admin Client Pattern
**Source:** `e2e/crud.spec.js` lines 26-30, `e2e/toast-feedback.spec.js` lines 27-31
**Apply to:** All E2E split spec files
```js
const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
)
```

### E2E Login + waitForURL Pattern
**Source:** `e2e/crud.spec.js` lines 37-40, `e2e/server-actions.spec.js` lines 7-9
**Apply to:** All E2E split spec files that require auth
```js
test.beforeEach(async ({ page }) => {
  await login(page, PROPRIETARIO)
  await page.waitForURL('**/dashboard', { timeout: 15_000 })
  await page.goto('/dashboard/unidades')
  await page.waitForURL('**/dashboard/unidades', { timeout: 10_000 })
})
```

### authGuard() Difference by Action File
**Source:** Direct code inspection
**Apply to:** All unit test files — determines which mocks to set up for auth path tests

| Action File | Auth Pattern | Mock Targets for 401 path |
|---|---|---|
| `auth.js` | inline cookies() + createServerClient | `next/headers` cookies, `@supabase/ssr` createServerClient |
| `locatarios.js` | inline `createServer()` per function | `@/lib/supabase-server` createServer, `@/lib/auth` isProprietario |
| `unidades.js` | `authGuard()` helper → `createServer()` | `@/lib/supabase-server` createServer, `@/lib/auth` isProprietario |
| `contratos.js` | `authGuard()` helper → `createServer()` | `@/lib/supabase-server` createServer, `@/lib/auth` isProprietario |

---

## No Analog Found

| File | Role | Data Flow | Reason |
|---|---|---|---|
| `test/unit/helpers/server-only-stub.js` | utility | — | No precedent in codebase for Vitest node-env stubs; pattern comes from RESEARCH.md + Vitest docs |
| `test/unit/helpers/supabaseMock.js` | utility | — | No unit test infrastructure exists yet; the chainable builder pattern is novel for this codebase (E2E uses real Supabase via admin client, not mocks) |

---

## Metadata

**Analog search scope:** `e2e/`, `src/actions/`, `src/lib/`, `.github/workflows/`, root config files
**Files scanned:** 14
**Key constraint found:** `authGuard()` in `unidades.js` and `contratos.js` returns `{}` not `{ user }` — callers have no `user.id` available, which is the root cause of the IDOR gap for those Actions. Planner must decide: fix inline (change `authGuard` to `return { user }` + add ownership filter) or defer and assert only auth-guard firing + `.eq('id', id)`.
**Pattern extraction date:** 2026-06-12
