# Phase 05: Testes E2E - Pattern Map

**Mapped:** 2026-05-29
**Files analyzed:** 6 (4 novos, 2 modificados)
**Analogs found:** 6 / 6

---

## File Classification

| Arquivo Novo/Modificado | Role | Data Flow | Analog Mais Próximo | Qualidade |
|-------------------------|------|-----------|----------------------|-----------|
| `src/app/dashboard/edificios/page.js` | route-wrapper | request-response | `src/app/dashboard/unidades/page.js` | exact |
| `e2e/crud.spec.js` | test | request-response | `e2e/dashboard.spec.js` + `e2e/portal.spec.js` | exact |
| `e2e/parcelas.spec.js` | test | request-response | `e2e/dashboard.spec.js` + `e2e/seed.mjs` | exact |
| `e2e/realtime.spec.js` | test | event-driven | `e2e/dashboard.spec.js` | role-match |
| `e2e/seed.mjs` (modificar) | config/setup | batch | ele mesmo (self-extension) | self |
| `e2e/global-teardown.js` (modificar) | config/teardown | batch | ele mesmo (self-extension) | self |

---

## Pattern Assignments

### `src/app/dashboard/edificios/page.js` (route-wrapper, request-response)

**Analog:** `src/app/dashboard/unidades/page.js`

**Padrão completo do analog** (arquivo inteiro — 5 linhas):
```js
import Unidades from "@/components/features/Unidades";

export default function UnidadesPage() {
  return <Unidades />;
}
```

**Aplicação:** Copiar exatamente, substituindo `Unidades` por `GestaoEdificios` e o nome da função:
```js
import GestaoEdificios from "@/components/features/GestaoEdificios";

export default function EdificiosPage() {
  return <GestaoEdificios />;
}
```

**Nota:** Nenhuma diretiva `'use client'` no wrapper — Server Component por padrão (correto, o componente filho declara `'use client'` internamente).

---

### `e2e/crud.spec.js` (test, request-response — TEST-01)

**Analog principal:** `e2e/dashboard.spec.js`
**Analog secundário:** `e2e/portal.spec.js` (padrão de `test.describe` aninhado)

**Imports pattern** (`e2e/dashboard.spec.js` linhas 10-12):
```js
import { test, expect } from '@playwright/test'
import { login } from './helpers.js'
import { PROPRIETARIO } from './fixtures.js'
```

**Padrão de describe + viewport + beforeEach** (`e2e/dashboard.spec.js` linhas 14-24):
```js
test.describe('@smoke Dashboard tiles — DASH-01/02/03', () => {
  test.use({ viewport: { width: 1440, height: 900 } })

  test.beforeEach(async ({ page }) => {
    await login(page, PROPRIETARIO)
    await page.waitForURL('**/dashboard', { timeout: 15_000 })
    await page.goto('/dashboard')
    await page.waitForURL('**/dashboard', { timeout: 10_000 })
    // Aguardar carregamento do grid de métricas desktop
    await page.locator('.romma-desktop-only').waitFor({ state: 'visible', timeout: 10_000 })
  })
```

**Padrão de describes aninhados por feature** (`e2e/portal.spec.js` linhas 5-16):
```js
test.describe('Portal do Locatário', () => {
  test('PORT-01: ...', async ({ page }) => { ... })

  test.describe('autenticado', () => {
    test.beforeEach(async ({ page }) => {
      await login(page, LOCATARIO)
      await page.waitForURL('**/portal/dashboard', { timeout: 15_000 })
    })

    test('PORT-02: ...', async ({ page }) => { ... })
  })
})
```

**Padrão de assertion com timeout explícito** (`e2e/dashboard.spec.js` linha 32 e `e2e/portal.spec.js` linha 19):
```js
await expect(locator).toBeVisible({ timeout: 10_000 })
await expect(locator).toHaveCount(0)
```

**Padrão de ancoragem de botão por contexto** (RESEARCH.md — Pitfall 7):
```js
// CORRETO: ancorar no elemento pai para evitar clique no item errado
await page.getByText('E2E-Edifício Alpha').locator('..').getByRole('button', { name: 'Editar' }).click()
// ERRADO: botão sem âncora quando há múltiplos itens na lista
await page.getByRole('button', { name: 'Editar' }).click()
```

**Estrutura recomendada para crud.spec.js:**
```js
import { test, expect } from '@playwright/test'
import { login } from './helpers.js'
import { PROPRIETARIO } from './fixtures.js'

test.describe('TEST-01 — CRUD Proprietário', () => {
  test.use({ viewport: { width: 1440, height: 900 } })

  test.describe('Edifícios', () => {
    test.beforeEach(async ({ page }) => {
      await login(page, PROPRIETARIO)
      await page.waitForURL('**/dashboard', { timeout: 15_000 })
      await page.goto('/dashboard/edificios')
      await page.waitForURL('**/dashboard/edificios', { timeout: 10_000 })
    })
    // tests: criar, editar, deletar
  })

  test.describe('Unidades', () => { /* idem */ })
  test.describe('Locatários', () => { /* idem */ })
  test.describe('Contratos', () => { /* idem */ })
})
```

---

### `e2e/parcelas.spec.js` (test, request-response — TEST-02)

**Analog:** `e2e/dashboard.spec.js` (estrutura spec) + `e2e/seed.mjs` linhas 1-12 (supabaseAdmin para `beforeAll`)

**Imports + supabaseAdmin setup** (`e2e/seed.mjs` linhas 1-12):
```js
import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'

config({ path: '.env.test' })

const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
)
```

**Padrão de insert com FK chain e error guard** (`e2e/seed.mjs` linhas 36-56):
```js
const { data: edificio, error: errEdificio } = await admin
  .from('edificios')
  .insert({ nome: 'E2E-Edifício Parcelas', endereco: 'Rua E2E, 2' })
  .select()
  .single()
if (errEdificio) throw errEdificio

const { data: unidade, error: errUnidade } = await admin
  .from('unidades')
  .insert({
    edificio_id: edificio.id,
    nome: 'E2E-Sala Parcelas',
    area_m2: 40,
    valor_mensal: 2500,
    valor_visivel: true,
    status: 'disponivel',  // disponivel — sem contrato pré-criado (TEST-02 cria via UI)
  })
  .select()
  .single()
if (errUnidade) throw errUnidade
```

**Padrão de beforeAll com cleanup pós-suite** (RESEARCH.md Pattern 1):
```js
test.describe('TEST-02 — Parcelas', () => {
  let contratoId, edificioId, unidadeId, locatarioId

  test.beforeAll(async () => {
    // Criar cadeia FK: edificio → unidade → locatario → contrato (sem parcelas pré-criadas)
    // O spec cria contrato via UI — handleCriarContrato chama gerarParcelas automaticamente
  })

  test.afterAll(async () => {
    // Teardown específico — ou confiar no global-teardown por prefixo "E2E-"
    if (contratoId) await admin.from('parcelas').delete().eq('contrato_id', contratoId)
  })
})
```

**Padrão de verificação pós-Edge Function** (RESEARCH.md — Selector Map Parcelas):
```js
// VERIFICADO: não existe botão "Gerar Parcelas" separado na UI.
// handleCriarContrato chama gerarParcelas automaticamente ao criar o contrato.
// Navegar para a página do contrato e verificar parcelas já presentes.
await page.goto(`/dashboard/contratos/${contratoId}`)
await expect(page.getByText('futura').or(page.getByText('pendente'))).toBeVisible({ timeout: 15_000 })
```

**Nota de timeout:** Edge Function pode ser mais lenta que DB direto — usar `timeout: 15_000` nas assertions pós-criação de contrato (em vez do padrão `10_000`).

---

### `e2e/realtime.spec.js` (test, event-driven — TEST-04)

**Analog:** `e2e/dashboard.spec.js` (estrutura base)

**Imports pattern** (idêntico a dashboard.spec.js linhas 10-12):
```js
import { test, expect } from '@playwright/test'
import { login } from './helpers.js'
import { PROPRIETARIO } from './fixtures.js'
```

**Padrão de verificação de estado final** (RESEARCH.md Pattern 4):
```js
// Abre /unidades e verifica que unidade aparece (seed cria "E2E-Sala Disponivel")
await page.goto('/unidades')
await expect(page.getByText('E2E-Sala Disponivel')).toBeVisible({ timeout: 10_000 })

// Cria contrato via dashboard (página separada)
await page.goto('/dashboard/contratos')
// ... criar contrato para "E2E-Sala Disponivel" via UI

// Retorna para /unidades e verifica ausência — estado final, não evento RT
await page.goto('/unidades')
await expect(page.getByText('E2E-Sala Disponivel')).toHaveCount(0)
```

**Nota crítica:** A limitação `disponivel → alugada` não propaga via Realtime (RLS descarta o evento UPDATE). TEST-04 testa estado final via navegação explícita (`page.goto('/unidades')`), não aguarda evento RT. Documentado em CLAUDE.md.

**Nota de supabaseAdmin no beforeAll:** TEST-04 pode precisar de dados próprios (locatário E2E- para criar o contrato). Usar o mesmo padrão de import supabaseAdmin de `seed.mjs` linhas 1-12.

---

### `e2e/seed.mjs` (modificar — adicionar unidade para TEST-04)

**Analog:** ele mesmo — extensão após linha 56 (após insert da `Sala 101`)

**Ponto de inserção:** após a inserção da `Sala 101` (linhas 44-56), antes do insert do locatário (linha 59).

**Padrão de insert a replicar** (`e2e/seed.mjs` linhas 44-56):
```js
const { data: unidade, error: errUnidade } = await admin
  .from('unidades')
  .insert({
    edificio_id: edificio.id,
    nome: 'Sala 101',
    area_m2: 40,
    valor_mensal: 2500,
    valor_visivel: true,
    status: 'alugada',
  })
  .select()
  .single()
if (errUnidade) throw errUnidade
```

**Novo insert a adicionar** (nome com prefixo `"E2E-"` — consistência com D-01 e teardown automático):
```js
const { data: unidadeE2E, error: errUniE2E } = await admin
  .from('unidades')
  .insert({
    edificio_id: edificio.id,
    nome: 'E2E-Sala Disponivel',
    area_m2: 30,
    valor_mensal: 1500,
    valor_visivel: true,
    status: 'disponivel',
    // sem contrato — mantida disponível para TEST-04
  })
  .select()
  .single()
if (errUniE2E) throw errUniE2E
```

**Return value:** a função `seed()` retorna `{ edificioId, unidadeId }` (linha 136). O `unidadeId` da `E2E-Sala Disponivel` pode ser incluído no return para garantir teardown por ID como fallback:
```js
return { edificioId: edificio.id, unidadeId: unidade.id, unidadeE2EId: unidadeE2E.id }
```

---

### `e2e/global-teardown.js` (modificar — adicionar limpeza por prefixo "E2E-")

**Analog:** ele mesmo — extensão após linha 72 (após cleanup por ID)

**Padrão de cascata FK existente** (`e2e/global-teardown.js` linhas 36-45):
```js
// Ordem obrigatória: parcelas → contratos → locatarios → unidades → edificios
if (contratoIds.length) {
  await admin.from('parcelas').delete().in('contrato_id', contratoIds)
  await admin.from('contratos').delete().in('id', contratoIds)
}
await admin.from('locatarios').delete().in('id', locatarioIds)
```

**Padrão de lookup por nome existente** (`e2e/global-teardown.js` linhas 62-72):
```js
const { data: unidades } = await admin
  .from('unidades')
  .select('id, edificio_id')
  .eq('nome', 'Sala 101')
if (unidades?.length) {
  const edificioIds = [...new Set(unidades.map(u => u.edificio_id))]
  await admin.from('unidades').delete().in('id', unidades.map(u => u.id))
  await admin.from('edificios').delete().in('id', edificioIds)
}
```

**Extensão a adicionar** (após linha 72, seguindo a mesma cascata FK da RESEARCH.md Code Examples):
```js
// Limpar entidades E2E- por prefixo de nome (D-01)
const { data: edificiosE2E } = await admin
  .from('edificios')
  .select('id')
  .like('nome', 'E2E-%')
const edificioIdsE2E = edificiosE2E?.map(e => e.id) ?? []

if (edificioIdsE2E.length) {
  const { data: unidadesE2E } = await admin.from('unidades').select('id').in('edificio_id', edificioIdsE2E)
  const unidadeIdsE2E = unidadesE2E?.map(u => u.id) ?? []
  if (unidadeIdsE2E.length) {
    const { data: contratosE2E } = await admin.from('contratos').select('id').in('unidade_id', unidadeIdsE2E)
    const contratoIdsE2E = contratosE2E?.map(c => c.id) ?? []
    if (contratoIdsE2E.length) {
      await admin.from('parcelas').delete().in('contrato_id', contratoIdsE2E)
      await admin.from('contratos').delete().in('id', contratoIdsE2E)
    }
    await admin.from('unidades').delete().in('id', unidadeIdsE2E)
  }
  await admin.from('edificios').delete().in('id', edificioIdsE2E)
}

// Limpar locatarios com prefixo E2E- em nome_razao_social (D-01)
const { data: locatariosE2E } = await admin
  .from('locatarios')
  .select('id')
  .like('nome_razao_social', 'E2E-%')
if (locatariosE2E?.length) {
  const locIdE2E = locatariosE2E.map(l => l.id)
  const { data: contE2E } = await admin.from('contratos').select('id').in('locatario_id', locIdE2E)
  if (contE2E?.length) {
    await admin.from('parcelas').delete().in('contrato_id', contE2E.map(c => c.id))
    await admin.from('contratos').delete().in('id', contE2E.map(c => c.id))
  }
  await admin.from('locatarios').delete().in('id', locIdE2E)
}

// Limpar usuários auth com email "e2e-*" (D-04)
const { data: authList } = await admin.auth.admin.listUsers()
const e2eUsers = authList?.users.filter(u => u.email?.startsWith('e2e-')) ?? []
for (const u of e2eUsers) {
  await admin.auth.admin.deleteUser(u.id)
}
```

---

## Shared Patterns

### Autenticação — Login via helper
**Fonte:** `e2e/helpers.js` linhas 1-10 + `e2e/fixtures.js`
**Aplicar a:** todos os spec files (`crud.spec.js`, `parcelas.spec.js`, `realtime.spec.js`)
```js
// Import padrão
import { login } from './helpers.js'
import { PROPRIETARIO } from './fixtures.js'

// Uso no beforeEach
test.beforeEach(async ({ page }) => {
  await login(page, PROPRIETARIO)
  await page.waitForURL('**/dashboard', { timeout: 15_000 })
})
```

### Viewport Desktop
**Fonte:** `e2e/dashboard.spec.js` linha 15
**Aplicar a:** `crud.spec.js`, qualquer spec que interaja com `.romma-desktop-only`
```js
test.use({ viewport: { width: 1440, height: 900 } })
```

### supabaseAdmin Client (Node.js context)
**Fonte:** `e2e/seed.mjs` linhas 1-12 + `e2e/global-teardown.js` linhas 1-12
**Aplicar a:** `parcelas.spec.js` e `realtime.spec.js` (quando precisam de `beforeAll` com dados próprios)
```js
import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'

config({ path: '.env.test' })

const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
)
```

### Cascata FK para Teardown
**Fonte:** `e2e/global-teardown.js` linhas 36-45
**Aplicar a:** `global-teardown.js` (extensão) e qualquer `afterAll` em specs com dados próprios
**Ordem obrigatória:** `parcelas → contratos → locatarios → unidades → edificios`

### Assertion com Timeout Explícito
**Fonte:** `e2e/dashboard.spec.js` linha 32 + `e2e/portal.spec.js` linha 19
**Aplicar a:** todas as assertions em todos os specs
```js
// Padrão default — operações DB diretas
await expect(locator).toBeVisible({ timeout: 10_000 })

// Edge Function ou criação de contrato (gerarParcelas automático)
await expect(locator).toBeVisible({ timeout: 15_000 })
```

### shadcn Select — Click Pattern
**Fonte:** RESEARCH.md Pattern 2 (confirmado: Radix UI padrão de mercado)
**Aplicar a:** `crud.spec.js` (Contratos — selects de Locatário e Unidade) + `crud.spec.js` (Unidades — select de Edifício)
```js
// NÃO usar page.selectOption() em shadcn Select — não funciona com Radix UI
// USAR: click no combobox + click na opção
await page.getByRole('combobox').nth(indexDoSelect).click()
await page.getByRole('option', { name: 'texto da opção' }).click()

// page.selectOption() só funciona em <select> HTML nativo (ex: Locatários — tipo pf/pj)
await page.selectOption('select', 'pf')
```

### ConfirmDialog — Aguardar Modal
**Fonte:** RESEARCH.md Pattern 3
**Aplicar a:** `crud.spec.js` (cancelar/encerrar Contrato)
```js
await page.getByRole('button', { name: 'CANC' }).first().click()
await page.getByText('Cancelar contrato?').waitFor({ timeout: 5_000 })
await page.getByRole('button', { name: 'Cancelar Contrato' }).click()
await expect(page.getByText('cancelado')).toBeVisible({ timeout: 10_000 })
```

### Prefixo "E2E-" em Dados de Teste
**Fonte:** D-01 / D-02 (CONTEXT.md)
**Aplicar a:** todos os specs que criam dados (crud.spec.js, parcelas.spec.js, realtime.spec.js)
- Nomes de Edifícios: `"E2E-Edifício [Sufixo]"`
- Nomes de Unidades: `"E2E-Sala [Sufixo]"`
- Nomes de Locatários: `"E2E-Locatário [Sufixo]"` (campo `nome_razao_social`)
- Emails de Locatários convidados: `` `e2e-${Date.now()}@test.romma.local` `` (D-04)

---

## Sem Analog Encontrado

Nenhum arquivo desta fase ficou sem analog. Todos os 6 arquivos têm correspondência direta ou extensão de si mesmos.

---

## Decisões e Conflitos Resolvidos pelo RESEARCH.md

| Conflito | Resolução | Fonte |
|----------|-----------|-------|
| D-05: botão "Gerar Parcelas" não existe | `handleCriarContrato` chama `gerarParcelas` automaticamente; TEST-02 verifica parcelas ao navegar para `/dashboard/contratos/[id]` | RESEARCH.md linha 24 |
| D-08: `"Sala E2E Disponivel"` não segue prefixo D-01 | Renomear para `"E2E-Sala Disponivel"` para consistência com teardown por prefixo | RESEARCH.md linha 32 |
| D-03: mensagem de sucesso do convite | Não há toast/alert explícito no componente; verificar que locatário aparece na lista após submit | RESEARCH.md linha 649 |
| Rota `/dashboard/edificios` não existe | Criar `src/app/dashboard/edificios/page.js` como Wave 0 bloqueante | RESEARCH.md linha 162 |

---

## Metadata

**Escopo de busca de analogs:** `e2e/`, `src/app/dashboard/`
**Arquivos lidos:** `dashboard.spec.js`, `portal.spec.js`, `global-teardown.js`, `seed.mjs`, `helpers.js`, `fixtures.js`, `global-setup.js`, `playwright.config.js`, `src/app/dashboard/unidades/page.js`
**Data de mapeamento:** 2026-05-29
