# Phase 05: Testes E2E - Research

**Researched:** 2026-05-29
**Domain:** Playwright E2E — CRUD de Proprietário, Edge Function, Realtime
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**D-01:** Dados criados pelos testes de CRUD devem usar prefixo `"E2E-"` no nome (ex: `"E2E-Edifício Teste"`, `"E2E-Sala 301"`). `global-teardown.js` deve ser estendido para deletar entidades com nome começando em `"E2E-"` (edificios, unidades, locatarios criados pelos specs).

**D-02:** Testes de editar/deletar criam a entidade no `beforeAll`/`test` com nome `"E2E-"`, editam ela no próprio teste. Não dependem de dados do seed. Isso garante isolamento mesmo se o seed for reescrito.

**D-03:** O teste de convidar Locatário verifica apenas que a UI exibe mensagem de sucesso após preencher o email e submeter o formulário. Não verifica entrega do email (responsabilidade do Supabase/InBucket).

> **CONFLICT VERIFICADO (D-03):** `Locatarios.js` não exibe toast ou mensagem de sucesso após submit do convite — verificado diretamente em `src/components/features/Locatarios.js` e `src/actions/locatarios.js`. `handleConvidarLocatario` recarrega a lista após status 200, sem emitir alerta visual explícito. O planner deve reinterpretar D-03: a "confirmação de sucesso" é a aparição do locatário convidado na lista (`e2e-${Date.now()}@test.romma.local` visível em algum elemento da lista). A restrição de não verificar entrega de email permanece inalterada.

**D-04:** Email do Locatário convidado nos testes: dinâmico com timestamp — `e2e-${Date.now()}@test.romma.local`. O `global-teardown.js` deve deletar usuários cujo email começa com `"e2e-"` via admin API.

**D-05:** TEST-02 testa via UI: criar contrato (sem parcelas pré-existentes) → interagir com botão/ação "Gerar Parcelas" na UI do contrato → verificar que a tabela de parcelas exibe parcelas. Testa o fluxo real do usuário, não a EF isoladamente.

> **CONFLICT VERIFICADO (D-05):** `handleCriarContrato` em `Contratos.js` chama `gerarParcelas` AUTOMATICAMENTE após criar o contrato — não existe botão separado "Gerar Parcelas" na UI. O planner deve reinterpretar D-05: TEST-02 verifica que ao criar um contrato via UI e navegar para `/dashboard/contratos/[id]`, as parcelas já aparecem na tabela (sem etapa intermediária de "gerar"). O teste do fluxo real do usuário está correto — apenas o passo "clicar em Gerar Parcelas" não existe.

**D-06:** O spec de TEST-02 cria sua própria cadeia de dados no `beforeAll` usando o padrão de criação via `supabaseAdmin` já presente em `seed.mjs`. Dados criados pelo spec usam prefixo `"E2E-"`. Independente do seed principal (que cria parcelas manualmente, sem EF).

**D-07:** Estrutura do teste TEST-04: login como Proprietário → abrir `/unidades` (verificar unidade disponível aparece) → criar contrato para essa unidade via dashboard → navegar de volta para `/unidades` → verificar que a unidade não aparece mais na listagem. Testa o estado final, não o evento Realtime em si.

**D-08:** O `seed.mjs` deve ser ampliado com uma segunda unidade: `"Sala E2E Disponivel"`, `status: 'disponivel'`, sem contrato associado. Esta unidade é a que TEST-04 usa.

> **CONFLICT D-08 / D-01 (NOMECLATURA):** `"Sala E2E Disponivel"` não começa com `"E2E-"` — o teardown por `like('nome', 'E2E-%')` não a limpará. A unidade do D-08 é criada pelo seed (global-setup) e destruída pelo global-teardown existente via `.e2e-state.json` (por ID). O planner tem duas opções: (a) renomear para `"E2E-Sala Disponivel"` para consistência com D-01 e garantir que o teardown por prefixo também a cubra, OU (b) manter `"Sala E2E Disponivel"` e garantir que o ID seja salvo no `.e2e-state.json` para destruição via fluxo existente. Recomendação: opção (a) — renomear para `"E2E-Sala Disponivel"` para uniformidade.

### Claude's Discretion

- Estrutura exata dos seletores para shadcn Select nos formulários de CRUD.
- Nome e organização dos spec files: um spec por entidade ou agrupado por requisito.
- Timeout values para operações com Edge Function.
- Ordem dos testes dentro de cada spec.

### Deferred Ideas (OUT OF SCOPE)

- CI/CD pipeline (GitHub Actions) — fora do escopo do TCC.
- Visual regression testing — fora do escopo.
- Cobertura de error states (falha de DB, timeout da EF) — fora do escopo.
- TEST-03 (Portal do Locatário) — já coberto por `portal.spec.js` existente.
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| TEST-01 | Testes E2E Playwright cobrindo CRUD completo do Proprietário: Edifícios (criar/editar/deletar), Unidades (criar/editar/deletar), Locatários (convidar/editar), Contratos (criar/encerrar/cancelar) | Seletores mapeados por componente; padrões beforeAll + supabaseAdmin documentados; shadcn Select requer click pattern específico |
| TEST-02 | Testes E2E cobrindo ciclo de Parcelas: gerar parcelas via Edge Function, marcar como paga, verificar mudança de status | VERIFICADO: `handleCriarContrato` chama `gerarParcelas` automaticamente — criar contrato via UI e navegar para `/dashboard/contratos/[id]` verifica parcelas sem passo extra |
| TEST-04 | Teste E2E cobrindo fluxo Realtime: unidade visível na listagem pública desaparece após Proprietário criar contrato | Limitação RT documentada (disponivel→alugada não propaga via RLS); teste valida estado final via navegação |
</phase_requirements>

---

## Summary

Esta fase amplia a infraestrutura de testes E2E já existente (`e2e/`) para cobrir os três requisitos pendentes: CRUD completo do Proprietário (TEST-01), ciclo de Parcelas via Edge Function (TEST-02), e comportamento Realtime da listagem pública (TEST-04).

A infraestrutura já está bem estabelecida: `playwright.config.js` com `workers: 1`, `fullyParallel: false`, `timeout: 30_000`, `globalSetup`/`globalTeardown`, seed com `supabaseAdmin`. Os specs existentes (`dashboard.spec.js`, `portal.spec.js`) estabelecem padrões claros de `beforeEach` + login + `waitForURL`.

O principal trabalho da fase é: (1) mapear seletores reais dos componentes para cada formulário CRUD, (2) estender `global-teardown.js` com limpeza por prefixo `"E2E-"`, (3) ampliar `seed.mjs` com a unidade para TEST-04 (renomeada para `"E2E-Sala Disponivel"`), e (4) escrever os spec files para TEST-01, TEST-02 e TEST-04.

**Primary recommendation:** Organizar em três spec files por requisito (`crud.spec.js`, `parcelas.spec.js`, `realtime.spec.js`), todos usando os padrões já estabelecidos no codebase. TEST-02 NÃO requer botão "Gerar Parcelas" — geração é automática ao criar contrato.

---

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| CRUD de Edifícios | Browser (GestaoEdificios.js) | API (Server Actions) | Formulário sem shadcn, botões "Editar"/"Remover" puro HTML |
| CRUD de Unidades | Browser (Unidades.js + UnidadeCard.js) | API (Server Actions) | Formulário usa shadcn Select + Input — seletor de Edifício precisa de click pattern |
| Invite de Locatário | Browser (Locatarios.js) | API (convidarLocatario) | Formulário HTML nativo, `<select>` nativo para tipo pf/pj; insert em `locatarios` é atômico ao convite |
| CRUD de Locatários | Browser (Locatarios.js) | API (Server Actions) | Edição inline sem shadcn |
| Criação de Contrato | Browser (Contratos.js) | API (criarContrato + gerarParcelas) | Shadcn Select para Locatário e Unidade; gerarParcelas chamado automaticamente na criação |
| Cancelar/Encerrar Contrato | Browser (Contratos.js + ConfirmDialog) | API (cancelarContrato/encerrarContrato) | Botões CANC/ENC na tabela; ConfirmDialog modal de confirmação |
| Ciclo de Parcelas | Browser (Parcelas.js) | API (marcarParcelaComoPaga) | Botão "Marcar Paga" por linha; acesso via `/dashboard/contratos/[id]` |
| Listagem Pública | Browser (UnidadesPublicas.js) | Supabase Realtime | `/unidades` — RT via postgres_changes INSERT/DELETE (UPDATE disponivel→alugada NÃO propaga via RLS) |

---

## Standard Stack

Esta fase não instala pacotes novos. Toda a infraestrutura já existe.

### Existente (sem instalação)
| Library | Version | Purpose |
|---------|---------|---------|
| @playwright/test | ^1.60.0 | Framework E2E — já instalado |
| @supabase/supabase-js | ^2.99.2 | Cliente admin no seed/teardown — já instalado |
| dotenv | ^17.4.2 | Carrega `.env.test` nos scripts — já instalado |

**Nenhum pacote novo a instalar nesta fase.**

---

## Package Legitimacy Audit

> Não aplicável — esta fase não instala pacotes externos.

**Packages removed due to slopcheck [SLOP] verdict:** none
**Packages flagged as suspicious [SUS]:** none

---

## Architecture Patterns

### System Architecture Diagram

```
Test Runner (Playwright, workers:1)
  │
  ├── globalSetup → seed.mjs (supabaseAdmin) → Supabase local (127.0.0.1:54321)
  │     └── cria dados base + persiste IDs em .e2e-state.json
  │
  ├── Specs (sequential)
  │     ├── crud.spec.js         → /dashboard/edificios, /dashboard/unidades,
  │     │                           /dashboard/locatarios, /dashboard/contratos
  │     ├── parcelas.spec.js     → /dashboard/contratos/[id] (criado no beforeAll)
  │     └── realtime.spec.js     → /unidades (público) ← /dashboard/contratos (cria contrato)
  │
  ├── Next.js server (localhost:3000) ← webServer config
  │     └── Server Actions → Supabase local
  │
  └── globalTeardown → global-teardown.js (supabaseAdmin)
        └── deleta por prefixo "E2E-" + emails "e2e-"
```

### Recommended Project Structure

```
e2e/
├── crud.spec.js          # TEST-01: Edifícios, Unidades, Locatários, Contratos
├── parcelas.spec.js      # TEST-02: ciclo de Parcelas + Edge Function
├── realtime.spec.js      # TEST-04: unidade some após contrato criado
├── seed.mjs              # ampliar com "E2E-Sala Disponivel" (D-08, renomeado de D-01)
├── global-teardown.js    # ampliar com limpeza por prefixo "E2E-" e emails "e2e-"
├── helpers.js            # já existente — login()
├── fixtures.js           # já existente — PROPRIETARIO, LOCATARIO
├── global-setup.js       # já existente — não modificar
├── dashboard.spec.js     # já existente — não modificar
├── portal.spec.js        # já existente — não modificar
└── server-actions.spec.js # já existente — não modificar
```

---

## Selector Map — Por Componente

Esta seção é a mais crítica para o planejamento. Documenta os seletores reais extraídos dos componentes.

### Edifícios (`GestaoEdificios.js` — HTML nativo, sem shadcn)

> **BLOQUEANTE:** `GestaoEdificios.js` não tem rota ativa no App Router. `src/app/dashboard/` tem apenas `contratos/`, `locatarios/`, `unidades/`. O planner deve criar `src/app/dashboard/edificios/page.js` como tarefa Wave 0.

**Criar:**
```js
// Formulário simples: inputs com placeholder, button type="submit"
await page.fill('input[placeholder="Nome do edificio"]', 'E2E-Edifício Alpha')
await page.fill('input[placeholder="Endereço"]', 'Rua E2E, 1')
await page.click('button[type="submit"]')
// Verificar: texto do edifício aparece na lista
await expect(page.getByText('E2E-Edifício Alpha')).toBeVisible({ timeout: 10_000 })
```

**Editar:**
```js
// Botão texto "Editar" ao lado do item
await page.getByText('E2E-Edifício Alpha').locator('..').getByRole('button', { name: 'Editar' }).click()
// Inputs de edição (sem placeholder — value preenchido)
await page.locator('input').nth(0).fill('E2E-Edifício Alpha Editado')
await page.getByRole('button', { name: 'Salvar' }).click()
```

**Deletar:**
```js
// Botão texto "Remover" ao lado do item
await page.getByText('E2E-Edifício Alpha').locator('..').getByRole('button', { name: 'Remover' }).click()
// Verificar desaparecimento
await expect(page.getByText('E2E-Edifício Alpha')).toHaveCount(0)
```

### Unidades (`Unidades.js` + `UnidadeCard.js` — shadcn Select)

**Criar:**
```js
// Botão "Nova Unidade" abre o formulário
await page.getByRole('button', { name: 'Nova Unidade' }).click()

// shadcn Select para Edifício — clicar no SelectTrigger, depois no SelectItem
// SelectTrigger renderiza como button com role="combobox"
await page.getByRole('combobox').first().click()
await page.getByRole('option', { name: 'Edifício Teste E2E' }).click()

// Inputs normais (shadcn Input renderiza como <input>)
await page.fill('input[placeholder="Nome da unidade"]', 'E2E-Sala 301')
await page.fill('input[placeholder="Área (m²)"]', '50')
await page.fill('input[placeholder="Valor mensal (R$)"]', '3000')

// Submit
await page.getByRole('button', { name: 'Criar Unidade' }).click()
await expect(page.getByText('E2E-Sala 301')).toBeVisible({ timeout: 10_000 })
```

**Editar:**
```js
// UnidadeCard mostra botão Editar quando não está editando
await page.getByText('E2E-Sala 301').locator('..').getByRole('button', { name: 'Editar' }).click()
// Campos de edição (Input sem placeholder específico, mas tem value)
await page.fill('input[value="E2E-Sala 301"]', 'E2E-Sala 301 Editada')
// Salvar
await page.getByRole('button', { name: 'Salvar' }).click()
```

**Deletar:**
```js
await page.getByText('E2E-Sala 301').locator('..').getByRole('button', { name: 'Deletar' }).click()
await expect(page.getByText('E2E-Sala 301')).toHaveCount(0)
```

### Locatários (`Locatarios.js` — HTML nativo, `<select>` nativo)

**Convidar:**
```js
// Formulário com inputs de placeholder e select nativo
await page.fill('input[placeholder="Nome"]', 'E2E-Locatário Teste')
await page.selectOption('select', 'pf')   // <select> nativo → page.selectOption funciona
await page.fill('input[placeholder="Documento"]', '12345678901')
const email = `e2e-${Date.now()}@test.romma.local`
await page.fill('input[type="email"]', email)
await page.fill('input[placeholder="Telefone "]', '11999999999')  // note: placeholder tem espaço extra
await page.click('button[type="submit"]')
// VERIFICADO: convidarLocatario insere em locatarios atomicamente ao criar auth user
// Não aguardar aceite de convite — o locatário aparece na lista imediatamente após submit
await expect(page.getByText('E2E-Locatário Teste')).toBeVisible({ timeout: 10_000 })
```

**Editar:**
```js
await page.getByText('E2E-Locatário Teste').locator('..').getByRole('button', { name: 'Editar' }).click()
await page.fill('input[value="E2E-Locatário Teste"]', 'E2E-Locatário Editado')
await page.getByRole('button', { name: 'Salvar' }).click()
```

### Contratos (`Contratos.js` — shadcn Select)

**Criar:**
```js
await page.getByRole('button', { name: 'Novo Contrato' }).click()

// Locatário — shadcn Select (combobox)
await page.getByRole('combobox').nth(0).click()
await page.getByRole('option', { name: 'E2E-Locatário Teste' }).click()

// Unidade disponível — shadcn Select (combobox)
await page.getByRole('combobox').nth(1).click()
await page.getByRole('option', { name: 'E2E-Sala 301' }).click()

// Datas — input type="date"
await page.fill('input[type="date"]', '2026-06-01')   // data_inicio
// Para data_fim — segundo input date
await page.locator('input[type="date"]').nth(1).fill('2027-06-01')

await page.getByRole('button', { name: 'Criar Contrato' }).click()
// handleCriarContrato chama gerarParcelas automaticamente — aguardar mais (EF call)
await expect(page.getByText('E2E-Locatário Teste')).toBeVisible({ timeout: 15_000 })
```

**Cancelar (TEST-01):**
```js
// Botão "CANC" visível apenas para contratos ativos não-vencidos
await page.getByRole('button', { name: 'CANC' }).first().click()
// ConfirmDialog aparece — botão "Cancelar Contrato"
await page.getByText('Cancelar contrato?').waitFor({ timeout: 5_000 })
await page.getByRole('button', { name: 'Cancelar Contrato' }).click()
// Verificar status mudou para "cancelado"
await expect(page.getByText('cancelado')).toBeVisible({ timeout: 10_000 })
```

**Encerrar (TEST-01):**
```js
// Botão "ENC" visível apenas para contratos ativos vencidos (data_fim < hoje)
// → Criar contrato com data_fim no passado via supabaseAdmin após criar contrato pela UI
// Ou criar direto via supabaseAdmin com data passada
await page.getByRole('button', { name: 'ENC' }).first().click()
await page.getByText('Encerrar contrato?').waitFor({ timeout: 5_000 })
await page.getByRole('button', { name: 'Encerrar' }).click()
await expect(page.getByText('encerrado')).toBeVisible({ timeout: 10_000 })
```

### Parcelas (`Parcelas.js` — `/dashboard/contratos/[id]`)

**TEST-02 — Verificar parcelas geradas automaticamente:**
```js
// VERIFICADO: criar contrato via UI já chama gerarParcelas (handleCriarContrato automático)
// Não existe botão "Gerar Parcelas" separado na UI
// Navegar para a página do contrato e verificar parcelas já existem
await page.goto(`/dashboard/contratos/${contratoId}`)
await expect(page.getByText('futura').or(page.getByText('pendente'))).toBeVisible({ timeout: 15_000 })
```

**Marcar como paga:**
```js
// Botão "Marcar Paga" existe apenas para status pendente ou vencida
await page.getByRole('button', { name: 'Marcar Paga' }).first().click()
await expect(page.getByText('paga').first()).toBeVisible({ timeout: 10_000 })
```

---

## Architecture Patterns

### Pattern 1: beforeAll com supabaseAdmin (para TEST-02 e TEST-04)

Usado quando o spec precisa criar sua própria cadeia de dados sem depender do seed.

```js
// Source: padrão extraído de e2e/seed.mjs
import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'
config({ path: '.env.test' })

const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

test.describe('TEST-02 — Parcelas', () => {
  let contratoId, edificioId, unidadeId, locatarioId

  test.beforeAll(async () => {
    // Criar cadeia FK: edificio → unidade → locatario → contrato (sem parcelas pré-criadas)
    const { data: edificio } = await admin.from('edificios')
      .insert({ nome: 'E2E-Edifício Parcelas', endereco: 'Rua E2E, 2' })
      .select().single()
    // ... etc — contrato criado com status ativo, sem parcelas
    contratoId = contrato.id
  })

  test.afterAll(async () => {
    // Teardown específico — ou confiar no global-teardown por prefixo "E2E-"
    if (contratoId) await admin.from('parcelas').delete().eq('contrato_id', contratoId)
    // ...
  })
})
```

### Pattern 2: shadcn Select — click pattern

shadcn Select **não** funciona com `page.selectOption()`. Usar clique no `combobox` + clique na opção.

```js
// O SelectTrigger renderiza com role="combobox"
// O SelectContent renderiza com role="listbox" e options com role="option" [ASSUMED: padrão Radix]
await page.getByRole('combobox').nth(indexDoSelect).click()
await page.getByRole('option', { name: 'texto da opção' }).click()
```

### Pattern 3: ConfirmDialog — aguardar modal

```js
// ConfirmDialog usa estado React — aguardar texto antes de interagir
await page.getByRole('button', { name: 'CANC' }).first().click()
await page.getByText('Cancelar contrato?').waitFor({ timeout: 5_000 })
await page.getByRole('button', { name: 'Cancelar Contrato' }).click()
```

### Pattern 4: TEST-04 — verificação de estado final

```js
// Abre /unidades e verifica que unidade aparece (seed cria "E2E-Sala Disponivel")
await page.goto('/unidades')
await expect(page.getByText('E2E-Sala Disponivel')).toBeVisible({ timeout: 10_000 })

// Cria contrato via dashboard (página separada)
await page.goto('/dashboard/contratos')
// ... criar contrato para "E2E-Sala Disponivel"

// Retorna para /unidades e verifica ausência
await page.goto('/unidades')
await expect(page.getByText('E2E-Sala Disponivel')).toHaveCount(0)
```

### Anti-Patterns to Avoid

- **`page.selectOption()` em shadcn Select:** Não funciona. `Unidades.js` e `Contratos.js` usam shadcn `<Select>` com `role="combobox"` — usar click pattern.
- **Depender de ordem de elementos sem âncora:** Sempre usar contexto (`locator('..').getByRole(...)`) para associar botão Editar/Remover ao item correto.
- **Testes de CRUD dependendo de dados do seed principal:** O seed cria `"Edifício Teste E2E"` e `"Sala 101"` — não criar specs que dependam desses nomes (violação de D-02).
- **Não aguardar network idle após mutations:** Server Actions são assíncronas — sempre usar `toBeVisible({ timeout: 10_000 })` após submit.
- **Encerrar contrato pela UI com data futura:** O botão "ENC" só aparece quando `data_fim < hoje`. Usar `supabaseAdmin` para setar `data_fim` no passado após criar contrato.
- **Esperar botão "Gerar Parcelas" em TEST-02:** Não existe. `handleCriarContrato` chama `gerarParcelas` automaticamente — navegar para `/dashboard/contratos/[id]` após criar contrato e verificar parcelas já presentes.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead |
|---------|-------------|-------------|
| Criar dados de teste | Formulários UI no beforeAll | `supabaseAdmin` diretamente (padrão de `seed.mjs`) |
| Limpar dados E2E | Queries manuais por ID | Estender `global-teardown.js` com filtro por prefixo `"E2E-"` |
| Verificar email de convite | SMTP mock / InBucket | D-03: verificar que locatário aparece na lista (insert atômico confirma sucesso) |
| Testar Edge Function isolada | Chamada HTTP direta | Criar contrato via UI → navegar para `/dashboard/contratos/[id]` → verificar parcelas |

---

## Common Pitfalls

### Pitfall 1: shadcn Select não responde a `selectOption`
**What goes wrong:** `page.selectOption()` não encontra o elemento; teste trava.
**Why it happens:** shadcn Select usa componentes Radix UI customizados, não `<select>` HTML nativo.
**How to avoid:** Usar `page.getByRole('combobox').nth(n).click()` + `page.getByRole('option', { name: '...' }).click()`.
**Warning signs:** Erro "Element is not a `<select>` element" ou timeout no `selectOption`.

### Pitfall 2: Encerrar contrato — botão "ENC" não aparece
**What goes wrong:** Teste cria contrato com `data_fim` futura e não encontra botão "ENC".
**Why it happens:** O componente mostra "ENC" apenas quando `contrato.data_fim < hoje` (vencido).
**How to avoid:** Após criar o contrato via UI, usar `supabaseAdmin` para setar `data_fim = ontem` antes de testar encerramento.

### Pitfall 3: Edge Function `gerar-parcelas` requer `supabase functions serve`
**What goes wrong:** TEST-02 falha porque a Edge Function não está rodando.
**Why it happens:** EF roda em `http://127.0.0.1:54321/functions/v1/gerar-parcelas` — serviço separado do Next.js.
**How to avoid:** `supabase start` + `supabase functions serve` devem estar rodando antes de `npx playwright test`. O planner deve incluir step de verificação de pré-condições.
**Warning signs:** Erro 404 ou "Connection refused" ao criar contrato (que chama a EF automaticamente).

### Pitfall 4: TEST-04 — `disponivel → alugada` não propaga via Realtime
**What goes wrong:** Teste aguarda evento Realtime de UPDATE que nunca chega.
**Why it happens:** RLS descarta o evento de UPDATE para clientes anônimos (limitação documentada no CLAUDE.md).
**How to avoid:** D-07 já endereça isso — navegar de volta para `/unidades` e verificar estado após reload, não esperar evento RT.

### Pitfall 5: Usuários `e2e-*` acumulam em auth.users entre execuções
**What goes wrong:** Usuários `e2e-*@test.romma.local` acumulam em auth.users entre execuções.
**Why it happens:** `global-teardown.js` atual deleta apenas `locatario@test.romma.local`.
**How to avoid:** Estender `global-teardown.js` para fazer `listUsers()` e deletar todos com email começando em `"e2e-"`.

### Pitfall 6: Esperar aceite de convite para que Locatário apareça na lista
**What goes wrong:** Teste aguarda interação do Locatário convidado antes de prosseguir.
**Why it happens:** Confusão sobre quando o locatário fica disponível no sistema.
**How to avoid:** VERIFICADO (`src/actions/locatarios.js`): `convidarLocatario` chama `inviteUserByEmail` e IMEDIATAMENTE insere em `locatarios`. O locatário aparece na lista e no Select de Contratos sem aguardar aceite do convite. Sem delay necessário.

### Pitfall 7: Seletores de botão ambíguos quando múltiplos itens na lista
**What goes wrong:** `page.getByRole('button', { name: 'Editar' }).click()` clica no item errado.
**Why it happens:** Múltiplos edifícios/unidades na lista — seed já cria alguns.
**How to avoid:** Sempre usar `page.getByText('E2E-...').locator('..').getByRole('button', { name: 'Editar' })` para ancorar no elemento pai do item correto.

### Pitfall 8: Nome da unidade TEST-04 não segue prefixo D-01
**What goes wrong:** `"Sala E2E Disponivel"` não é limpa pelo teardown por prefixo `"E2E-%"`.
**Why it happens:** D-08 especificou nome sem prefixo `"E2E-"` na frente.
**How to avoid:** Renomear para `"E2E-Sala Disponivel"` (recomendado) ou garantir que o ID seja salvo no `.e2e-state.json`. O planner deve resolver esta inconsistência.

---

## Runtime State Inventory

> Não aplicável — fase de escrita de testes, não renomeia/refatora artefatos de runtime.

---

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | Playwright runner | ✓ | >=20 (assumido do stack) | — |
| @playwright/test | Todos os specs | ✓ | ^1.60.0 | — |
| Supabase local (127.0.0.1:54321) | seed, teardown, Server Actions | Requer `supabase start` | — | Sem fallback — pré-condição obrigatória |
| supabase functions serve | TEST-02 (Edge Function gerar-parcelas) | Requer comando separado | — | Sem fallback — TEST-02 falha sem isso |
| Next.js em localhost:3000 | Todos os specs | webServer config faz build+start | — | — |

**Missing dependencies with no fallback:**
- `supabase start` deve estar rodando antes de `npx playwright test` — o `playwright.config.js` não sobe o Supabase local, apenas o Next.js.
- `supabase functions serve` deve estar rodando para TEST-02.

**Missing dependencies with fallback:**
- Nenhum.

---

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Playwright 1.60.0 |
| Config file | `playwright.config.js` (raiz do projeto) |
| Quick run command | `npx playwright test --grep "TEST-01"` |
| Full suite command | `npx playwright test` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| TEST-01 | CRUD Edifícios (criar/editar/deletar) | E2E | `npx playwright test crud.spec.js --grep "edificio"` | ❌ Wave 0 |
| TEST-01 | CRUD Unidades (criar/editar/deletar) | E2E | `npx playwright test crud.spec.js --grep "unidade"` | ❌ Wave 0 |
| TEST-01 | Invite Locatário + editar | E2E | `npx playwright test crud.spec.js --grep "locatario"` | ❌ Wave 0 |
| TEST-01 | Contrato criar/cancelar/encerrar | E2E | `npx playwright test crud.spec.js --grep "contrato"` | ❌ Wave 0 |
| TEST-02 | Parcelas geradas após criar contrato (automático) | E2E | `npx playwright test parcelas.spec.js` | ❌ Wave 0 |
| TEST-02 | Marcar parcela como paga | E2E | `npx playwright test parcelas.spec.js --grep "paga"` | ❌ Wave 0 |
| TEST-04 | Unidade some da listagem após contrato | E2E | `npx playwright test realtime.spec.js` | ❌ Wave 0 |

### Sampling Rate

- **Per task commit:** `npx playwright test --grep "@smoke"` (specs existentes passam)
- **Per wave merge:** `npx playwright test` (suíte completa)
- **Phase gate:** Suíte completa verde antes do `/gsd:verify-work`

### Wave 0 Gaps

- [ ] `src/app/dashboard/edificios/page.js` — rota BLOQUEANTE para TEST-01 Edifícios (componente existe, rota não)
- [ ] `e2e/crud.spec.js` — cobre TEST-01 (Edifícios, Unidades, Locatários, Contratos)
- [ ] `e2e/parcelas.spec.js` — cobre TEST-02 (ciclo Parcelas + Edge Function automática)
- [ ] `e2e/realtime.spec.js` — cobre TEST-04 (Realtime / estado final)
- [ ] `e2e/seed.mjs` — adicionar `"E2E-Sala Disponivel"` (D-08, renomeado para consistência com D-01)
- [ ] `e2e/global-teardown.js` — adicionar limpeza por prefixo `"E2E-"` e emails `"e2e-"` (D-01, D-04)

---

## Project Constraints (from CLAUDE.md)

| Diretiva | Impacto nesta fase |
|----------|--------------------|
| Terminologia: usar "Edifício", "Unidade", "Locatário", "Contrato", "Parcela" | Nomes de variáveis, comentários e strings de seletor |
| Server Actions em `src/actions/` | Specs testam via UI — não chamar Server Actions diretamente |
| `supabaseAdmin` server-only | Uso no seed/teardown/beforeAll (Node.js context) é correto |
| `.env.test` aponta para Supabase local | Todos os clientes supabase nos specs usam vars de `.env.test` |
| Commits via branch — nunca em main | Planner deve criar branch para esta fase |
| `erroMessage` (não `errorMessage`) | Não relevante para specs, mas manter se ler responses de Server Actions |
| `proxy.js` em vez de `middleware.js` | Não cria middleware — não impacta esta fase |
| Realtime — limitação conhecida: `disponivel → alugada` não propaga | TEST-04 testa estado final via navegação, não evento RT |

---

## Code Examples

### Ampliar global-teardown.js com limpeza E2E-

```js
// Adicionar ao final do globalTeardown existente, após a limpeza por ID:

// Limpar entidades E2E- por prefixo de nome
const { data: edificiosE2E } = await admin
  .from('edificios')
  .select('id')
  .like('nome', 'E2E-%')
const edificioIdsE2E = edificiosE2E?.map(e => e.id) ?? []

if (edificioIdsE2E.length) {
  // Cascata: parcelas → contratos → unidades → edificios
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

// Limpar locatarios com prefixo E2E- em nome_razao_social
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

// Limpar usuários auth com email "e2e-*"
const { data: authList } = await admin.auth.admin.listUsers()
const e2eUsers = authList?.users.filter(u => u.email?.startsWith('e2e-')) ?? []
for (const u of e2eUsers) {
  await admin.auth.admin.deleteUser(u.id)
}
```

### Adicionar "E2E-Sala Disponivel" ao seed.mjs (renomeado de D-08)

```js
// Adicionar após criar a unidade "Sala 101" existente:
// Nome usa prefixo "E2E-" para consistência com D-01 e teardown automático
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
// Salvar ID no .e2e-state.json para teardown por ID (redundante com prefixo, mas safe)
```

---

## State of the Art

| Old Approach | Current Approach | Impact |
|--------------|------------------|--------|
| `page.selectOption()` em qualquer select | Distinguir `<select>` nativo vs shadcn Select: `selectOption` para nativo, click+option para shadcn | Seletores corretos na primeira tentativa |
| Depender de dados seed para testes de mutação | Criar dados com prefixo `"E2E-"` no `beforeAll` via supabaseAdmin | Isolamento real, sem dependência frágil de seed |
| Botão "Gerar Parcelas" separado | `handleCriarContrato` chama `gerarParcelas` automaticamente | TEST-02 não tem passo "clicar em Gerar" — verificar parcelas ao navegar para a página do contrato |

---

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A2 | shadcn Select renderiza `SelectTrigger` com `role="combobox"` e `SelectItem` com `role="option"` | Selector Map (shadcn) | [ASSUMED] — padrão Radix UI; se componente sobrescrever roles, seletores falham |
| A3 | `ConfirmDialog` renderiza modal com texto do `title` prop visível na página | Selector Map (Contratos) | Se modal usa portal fora da árvore, `page.getByText(...)` ainda funciona; comportamento esperado do Playwright |

**Verificados durante a pesquisa (removidos das assumptions):**
- ~~A1~~ VERIFICADO: `handleCriarContrato` em `Contratos.js` (linhas 63-84) chama `gerarParcelas` automaticamente após `criarContrato` — não existe botão separado. [VERIFIED: src/components/features/Contratos.js]
- ~~A4~~ CONFIRMADO BLOQUEANTE: `GestaoEdificios.js` não importado em nenhuma página. `src/app/dashboard/` tem apenas `contratos/`, `locatarios/`, `unidades/`. [VERIFIED: src/app/dashboard/page.js + listagem de diretório]
- ~~A6~~ VERIFICADO: `convidarLocatario` em `src/actions/locatarios.js` insere em `locatarios` atomicamente ao criar auth user — locatário aparece na lista sem aguardar aceite. [VERIFIED: src/actions/locatarios.js]

---

## Open Questions (RESOLVED)

1. **Rota de Edifícios no dashboard — BLOQUEANTE CONFIRMADO**
   - O que sabemos: `GestaoEdificios.js` não está importado em nenhuma página. O diretório `src/app/dashboard/` tem apenas `contratos/`, `locatarios/`, `unidades/` — sem `edificios/`.
   - Impacto: Sem rota `/dashboard/edificios`, o spec de Edifícios (TEST-01) não pode navegar para testar o CRUD.
   - RESOLVED: Plano 05-01 Task 1 cria `src/app/dashboard/edificios/page.js` como Wave 0 bloqueante.

2. **Mensagem de sucesso do convite de Locatário (D-03)**
   - O que sabemos: `handleConvidarLocatario` reseta o form após status 200 e recarrega a lista. Não há toast/alert de sucesso explícito — a evidência de sucesso é o locatário aparecer na lista.
   - RESOLVED: CONFLICT VERIFICADO adicionado ao RESEARCH.md. Plano 05-02 Task 2 verifica aparição do locatário na lista (email dinâmico visível) como confirmação implícita de sucesso.

3. **Nome da unidade TEST-04 — D-08 vs D-01**
   - Decisão recomendada: renomear para `"E2E-Sala Disponivel"` (prefixo `"E2E-"` no início).
   - RESOLVED: Plano 05-01 Task 2 adiciona `"E2E-Sala Disponivel"` ao seed.mjs; todos os planos usam este nome consistentemente.

---

## Sources

### Primary (HIGH confidence)
- Código-fonte dos componentes: `GestaoEdificios.js`, `Unidades.js`, `UnidadeCard.js`, `Contratos.js`, `Locatarios.js`, `Parcelas.js`, `UnidadesPublicas.js` — seletores extraídos diretamente
- `src/actions/locatarios.js` — comportamento de `convidarLocatario` verificado diretamente
- `e2e/seed.mjs`, `e2e/global-teardown.js`, `e2e/helpers.js`, `e2e/fixtures.js` — padrões de infraestrutura existentes
- `playwright.config.js` — config completa verificada
- `05-CONTEXT.md` — decisões bloqueadas do usuário

### Secondary (MEDIUM confidence)
- Padrão Radix UI para `role="combobox"` em SelectTrigger e `role="option"` em SelectItem [ASSUMED] — padrão de mercado bem estabelecido para bibliotecas acessíveis baseadas em Radix

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — infraestrutura existente verificada, sem pacotes novos
- Selector Map: HIGH (Locatários, Contratos, Parcelas, Unidades — componentes verificados) / MEDIUM (shadcn Select roles — padrão Radix assumido) / BLOQUEANTE CONFIRMADO: rota `/dashboard/edificios` não existe — Wave 0 deve criar antes dos specs
- Architecture: HIGH — extraída do código existente
- Pitfalls: HIGH — baseados em limitações reais documentadas no CLAUDE.md e componentes verificados

**Research date:** 2026-05-29
**Valid until:** 2026-06-18 (banca — código não deve mudar significativamente)
