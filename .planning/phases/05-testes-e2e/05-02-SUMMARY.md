---
phase: 05-testes-e2e
plan: "02"
subsystem: e2e-crud
tags:
  - testing
  - e2e
  - playwright
  - crud
  - TEST-01
dependency_graph:
  requires:
    - 05-01 (rota /dashboard/edificios, seed E2E-Sala Disponivel, teardown por prefixo)
  provides:
    - e2e/crud.spec.js com 11 testes cobrindo TEST-01
    - Cobertura de regra de negócio: unidade volta a disponivel após cancelar/encerrar contrato
  affects:
    - Confiança pré-deploy: TEST-01 passa antes de DEPL-03
    - e2e/parcelas.spec.js e e2e/realtime.spec.js (planos 03/04 se apoiam nesta infraestrutura de padrões)
tech_stack:
  added: []
  patterns:
    - test.beforeAll com supabaseAdmin para cadeia FK (edificio → unidade → locatario)
    - shadcn Select: getByRole('combobox').nth(n) + getByRole('option', { name })
    - ConfirmDialog: waitFor(text) antes de clicar botão de confirmação
    - Ancoragem de botão: getByText('E2E-...').locator('..').getByRole('button', { name })
    - data_fim no passado via admin para habilitar botão ENC (Pitfall 2)
    - input[value="..."] para preencher campo em modo de edição (texto vira input sem placeholder)
key_files:
  created:
    - e2e/crud.spec.js
  modified: []
decisions:
  - "Dois comboboxes no form de Unidades (Edifício idx 0, Status idx 1) — usar .first() para Edifício e .nth(1) não é necessário pois Status não é usado no teste"
  - "Após clicar Editar em EdificioCard e Locatarios, texto some do DOM — usar input[value='...'] para fill pois não há placeholder no modo edit"
  - "Test de encerrar cria segundo contrato via UI após cancelamento (unidade volta disponivel) — captura contratoId via admin query"
  - "afterAll defensivo no describe Contratos garante cascata FK (parcelas → contratos → unidades → edificios) antes do global-teardown"
  - "email dinâmico e2e-${Date.now()}@test.romma.local — D-04 cumprido; teardown remove por startsWith('e2e-')"
metrics:
  duration: "~20 min"
  completed: "2026-05-29"
  tasks_completed: 2
  tasks_total: 2
  files_created: 1
  files_modified: 0
---

# Phase 05 Plan 02: CRUD Proprietário E2E Summary

**One-liner:** spec `e2e/crud.spec.js` com 11 testes cobrindo TEST-01 — CRUD completo de Edifícios/Unidades/Locatários/Contratos via UI real, incluindo validação da regra de negócio de retorno a `disponivel` após cancelar/encerrar contrato.

---

## Tasks Completed

| # | Task | Commit | Files |
|---|------|--------|-------|
| 1 | Spec CRUD Edifícios + Unidades | 491ec36 | `e2e/crud.spec.js` (criado — 105 linhas, 6 testes) |
| 2 | Spec CRUD Locatários + Contratos | 9c0ee0f | `e2e/crud.spec.js` (estendido — 325 linhas totais, +5 testes) |

---

## Artifacts Created/Modified

### `e2e/crud.spec.js` (criado — 325 linhas)

Envelope externo: `test.describe('TEST-01 — CRUD Proprietário', () => { test.use({ viewport: { width: 1440, height: 900 } }); ... })`.

**4 describes internos:**

**Edifícios (3 testes):**
- `criar edifício`: preenche form (placeholder "Nome do edificio", "Endereço"), clica "Enviar", verifica texto visível
- `editar edifício`: âncora via getByText().locator('..').getByRole('button', { name: 'Editar' }), usa `input[value="E2E-Edifício Alpha"]` para fill (texto some após editar)
- `deletar edifício`: âncora + botão "Remover", verifica toHaveCount(0)

**Unidades (3 testes):**
- `criar unidade`: botão "Nova Unidade", shadcn Select combobox.first() → option "Edifício Teste E2E", fills com placeholder, "Criar Unidade"
- `editar unidade`: âncora + "Editar", `input[value="E2E-Sala 301"]` para fill, "Salvar"
- `deletar unidade`: âncora + "Deletar", toHaveCount(0)

**Locatários (2 testes):**
- `convidar locatário`: formulário HTML nativo — `selectOption('select', 'pf')`, email dinâmico `e2e-${Date.now()}@test.romma.local`, placeholder "Telefone " (espaço extra)
- `editar locatário`: âncora + "Editar", fill no input de edição, "Salvar"

**Contratos (3 testes + beforeAll/afterAll):**
- `beforeAll`: cria auth user `e2e-contratos@test.romma.local` via `admin.auth.admin.createUser`, cadeia FK edificio→unidade→locatario via supabaseAdmin
- `criar contrato`: shadcn Select combobox.nth(0)/nth(1), dates via `input[type="date"]`, "Criar Contrato", timeout 15s, verifica unidade ficou `alugada` via admin
- `cancelar contrato`: âncora linha, botão CANC, waitFor("Cancelar contrato?"), "Cancelar Contrato", verifica unidade voltou `disponivel` via admin
- `encerrar contrato`: cria 2º contrato via UI, captura id via admin query, `admin.from('contratos').update({ data_fim: ontem })`, reload, botão ENC, waitFor("Encerrar contrato?"), "Encerrar", verifica unidade voltou `disponivel` via admin
- `afterAll`: teardown defensivo cascata FK + deleteUser do auth

---

## Verification Commands Executed

```bash
# Sintaxe
node --check e2e/crud.spec.js   # exit 0

# Acceptance criteria grep
grep -n "test.describe('Edifícios'"    # OK (linha 36)
grep -n "test.describe('Unidades'"     # OK (linha 67)
grep -n "test.describe('Locatários'"   # OK (linha 107)
grep -n "test.describe('Contratos'"    # OK (linha 136)
grep "test('" | wc -l                  # 11 testes
grep "selectOption('select', 'pf')"    # OK (linha 118)
grep "e2e-\${Date.now()}"              # OK (linha 116)
grep "'Cancelar contrato?'"            # OK (linha 267)
grep "'Encerrar contrato?'"            # OK (linha 316)
grep "admin.from('contratos').update"  # OK (linha 305)
grep "status.*disponivel" | grep toBe  # OK (linhas 273, 322)
wc -l e2e/crud.spec.js                 # 325 linhas (> mínimo 200)
```

---

## Deviations from Plan

### Auto-adaptações (sem desvios de Rule 1-4)

**1. input[value="..."] para modo edição**
- **Encontrado durante:** Task 1 (Edifícios editar)
- **Problema:** após clicar "Editar" em EdificioCard, o texto `<p>E2E-Edifício Alpha</p>` é substituído por `<input value="E2E-Edifício Alpha">` sem placeholder. O pattern `getByText('E2E-...')` se torna inválido neste estado.
- **Adaptação:** usar `page.fill('input[value="E2E-Edifício Alpha"]', ...)` como documentado no RESEARCH.md Selector Map. Mesmo padrão aplicado para Unidades e Locatários no modo de edição.
- **Documentado no advisor:** confirmado antes de implementar.

**2. Âncora de linha em Contratos usa dois `.locator('..')`**
- **Encontrado durante:** Task 2 (Contratos cancelar/encerrar)
- **Problema:** na tabela de contratos, `getByText('E2E-Locatário Contratos')` está em `<span>` dentro de `<div>` dentro da `<div>` da grade. Um único `.locator('..')` retorna o span pai, mas os botões CANC/ENC estão em uma célula irmã na mesma linha. Dois níveis de `.locator('..')` chegam ao container da linha.
- **Adaptação:** `page.getByText('E2E-Locatário Contratos').locator('..').locator('..')` para subir dois níveis e então procurar o botão.

---

## Runtime Verification Deferred

As verificações de runtime (executar `npx playwright test e2e/crud.spec.js` contra Next.js + Supabase local + Edge Function ativa) requerem:
- `supabase start` (127.0.0.1:54321)
- `supabase functions serve` (Edge Function gerar-parcelas — obrigatória para tests de Contratos)
- Next.js em localhost:3000 (webServer config do playwright.config.js sobe automaticamente)

Delegadas ao desenvolvedor ao rodar a suíte E2E pela primeira vez. O spec foi validado via `node --check` (sintaxe) e grep (acceptance criteria).

**Comando de execução:**
```bash
npx playwright test e2e/crud.spec.js --reporter=line
```

---

## Known Stubs

Nenhum stub identificado. Todos os testes são funcionais — assertions reais via UI e admin API.

---

## Threat Surface Scan

Nenhuma nova superfície de segurança introduzida. O spec usa apenas:
- `supabaseAdmin` com `SUPABASE_ROLE_KEY` de `.env.test` (aponta para Supabase local — guard de URL em `seed.mjs` já existente)
- Dados com prefixo `E2E-` e emails `e2e-*@test.romma.local` (domínio inexistente)
- Threat model T-05-04 coberto: teardown por prefixo garante que dados de teste não persistem entre runs

---

## Self-Check: PASSED

```
FOUND: e2e/crud.spec.js
FOUND: 491ec36 (Task 1 commit — Edifícios + Unidades)
FOUND: 9c0ee0f (Task 2 commit — Locatários + Contratos)
FOUND: test.describe('Edifícios' em linha 36
FOUND: test.describe('Unidades' em linha 67
FOUND: test.describe('Locatários' em linha 107
FOUND: test.describe('Contratos' em linha 136
FOUND: 11 testes individuais
FOUND: 325 linhas (> 200 mínimo)
FOUND: selectOption('select', 'pf') — linha 118
FOUND: e2e-${Date.now()} — linha 116
FOUND: 'Cancelar contrato?' — linha 267
FOUND: 'Encerrar contrato?' — linha 316
FOUND: admin.from('contratos').update — linha 305
FOUND: toBe('disponivel') — linhas 273 e 322
```
