---
phase: 05-testes-e2e
verified: 2026-05-29T15:00:00Z
status: human_needed
score: 9/11 must-haves verified (2 requerem execução ao vivo)
overrides_applied: 0
human_verification:
  - test: "Executar suíte E2E completa com ambiente Supabase local ativo"
    expected: "14 testes verdes — 3 Edifícios, 3 Unidades, 2 Locatários, 3 Contratos (crud.spec.js), 2 Parcelas (parcelas.spec.js), 1 Realtime (realtime.spec.js)"
    why_human: "Specs requerem supabase start + supabase functions serve gerar-parcelas em 127.0.0.1:54321. Ambiente local não estava disponível durante a verificação — toda a validação de runtime foi explicitamente diferida pelos SUMMARYs de todos os 4 planos."
  - test: "Verificar teardown idempotente entre runs"
    expected: "Após execução completa, queries retornam 0 registros: 'select count(*) from edificios where nome like E2E-%'; 'select count(*) from auth.users where email like e2e-%'; 'select status from unidades where nome = E2E-Sala Disponivel' retorna 'disponivel'"
    why_human: "Requer Supabase local rodando para executar o global-teardown contra o banco real e confirmar que os três blocos (A/B/C) removem os dados E2E- corretamente."
  - test: "Confirmar seletores DOM reais dos specs"
    expected: "input[value='E2E-...'] funciona no modo de edição dos cards; âncora de dois níveis .locator('..').locator('..') alcança a linha de contrato correta; texto 'Cancelar contrato?' e 'Encerrar contrato?' aparecem no ConfirmDialog exatamente como escrito"
    why_human: "Seletores dependem da estrutura DOM renderizada em runtime — grep confirma que o código está correto mas não valida que o texto/estrutura do componente corresponde exatamente ao que o Playwright vai encontrar."
  - test: "Verificar dependência entre testes em parcelas.spec.js"
    expected: "Teste 2 (marca parcela como paga) lê contratoId definido pelo Teste 1 — devem rodar sequencialmente no mesmo worker"
    why_human: "Playwright serializa testes dentro de um describe por padrão, mas o comando npx playwright test deve ser executado sem --workers flag ou com --workers=1 para este spec. Confirmar que o arquivo playwright.config.js não define workers > 1 que quebre essa dependência implícita."
---

# Phase 05: Testes E2E — Verification Report

**Phase Goal:** Suite Playwright cobre todos os fluxos críticos do Proprietário e o comportamento Realtime
**Verified:** 2026-05-29
**Status:** HUMAN_NEEDED
**Re-verification:** Não — verificação inicial

---

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | Rota /dashboard/edificios carrega GestaoEdificios sem 404 | VERIFIED | `src/app/dashboard/edificios/page.js` existe, 5 linhas, sem `'use client'`, importa e renderiza `GestaoEdificios` de `@/components/features/GestaoEdificios` |
| 2 | Seed cria unidade 'E2E-Sala Disponivel' com status disponivel e sem contrato | VERIFIED | `e2e/seed.mjs` linhas 59-71: insert com `nome: 'E2E-Sala Disponivel'`, `status: 'disponivel'`, sem contrato associado |
| 3 | global-teardown remove entidades E2E- e usuários auth e2e- | VERIFIED | `e2e/global-teardown.js` linhas 74-116: Blocos A (`.like('nome', 'E2E-%')` em edificios com cascata FK), B (`.like('nome_razao_social', 'E2E-%')` em locatarios) e C (`filter(u => u.email?.startsWith('e2e-'))` + `deleteUser`) implementados e completos |
| 4 | crud.spec.js cobre CRUD de Edifícios, Unidades, Locatários e Contratos (TEST-01) | VERIFIED | 11 testes em 4 describes: `Edifícios` (criar/editar/deletar), `Unidades` (criar/editar/deletar), `Locatários` (convidar/editar), `Contratos` (criar/cancelar/encerrar) — 325 linhas, `node --check` OK |
| 5 | crud.spec.js usa shadcn Select click pattern (não page.selectOption) para comboboxes | VERIFIED | `getByRole('combobox').first().click()` + `getByRole('option', { name: ... }).click()` — linha 80-81. Nenhuma chamada `page.selectOption` aponta para combobox Radix |
| 6 | Após cancelar/encerrar contrato, spec verifica via admin que unidade volta a 'disponivel' | VERIFIED | `expect(uni.status).toBe('disponivel')` em linhas 273 (cancelar) e 322 (encerrar) de `crud.spec.js` |
| 7 | parcelas.spec.js cobre ciclo de Parcelas via Edge Function (TEST-02) | VERIFIED | `test.describe('TEST-02 — Parcelas')` com 2 testes: geração via EF (navegação para `/dashboard/contratos/${contratoId}`) e `Marcar Paga` — 189 linhas, `node --check` OK, timeout 15_000 em operações EF |
| 8 | realtime.spec.js cobre estado público após contrato (TEST-04) | VERIFIED | `test.describe('TEST-04 — Realtime/estado público')` com 1 teste: `page.goto('/unidades')` sem login → assert visível → criar contrato → `page.goto('/unidades')` → `toHaveCount(0)`. Comentário RT documenta a limitação RLS. 96 linhas, `node --check` OK |
| 9 | Todos os specs têm teardown defensivo (afterAll/global-teardown) para isolamento de dados | VERIFIED | `crud.spec.js` tem `test.afterAll` no describe Contratos; `parcelas.spec.js` tem `test.afterAll` com cascata FK por ID; `realtime.spec.js` tem `test.afterAll` com DELETE parcelas/contratos e UPDATE status='disponivel'; `global-teardown.js` tem Blocos A/B/C como safety net global |
| 10 | Suite completa executa verde (14 testes passam) | UNCERTAIN (human required) | Ambiente Supabase local não disponível durante verificação — todos os 4 SUMMARYs explicitamente diferem runtime para o desenvolvedor |
| 11 | Seletores DOM dos specs correspondem à UI renderizada real | UNCERTAIN (human required) | Seletores verificados via leitura de código e confirmados contra os componentes (`GestaoEdificios.js` tem `placeholder="Nome do edificio"`, `Enviar`, etc.) — mas correspondência DOM real requer execução |

**Score:** 9/11 truths verified (2 requerem execução ao vivo)

---

### Required Artifacts

| Artifact | Esperado | Status | Detalhes |
|----------|----------|--------|----------|
| `src/app/dashboard/edificios/page.js` | Server Component thin wrapper com GestaoEdificios | VERIFIED | 5 linhas, sem `'use client'`, `export default function EdificiosPage()` retorna `<GestaoEdificios />` |
| `e2e/seed.mjs` | Seed com E2E-Sala Disponivel status=disponivel | VERIFIED | Linhas 59-71 adicionadas, insert após Sala 101, `status: 'disponivel'`, 162 linhas totais |
| `e2e/global-teardown.js` | Teardown com limpeza E2E- por prefixo e emails e2e- | VERIFIED | Blocos A/B/C implementados, 117 linhas, bloco original por locatario@test.romma.local preservado |
| `e2e/crud.spec.js` | CRUD completo TEST-01 — 4 entidades, min 200 linhas | VERIFIED | 325 linhas, 4 describes, 11 testes, `node --check` exit 0 |
| `e2e/parcelas.spec.js` | Ciclo Parcelas TEST-02 — min 80 linhas | VERIFIED | 189 linhas, beforeAll com cadeia FK E2E-, afterAll com cascata por ID, `node --check` exit 0 |
| `e2e/realtime.spec.js` | Estado público TEST-04 — min 60 linhas | VERIFIED | 96 linhas, 1 teste sequencial, afterAll restaura status='disponivel', `node --check` exit 0 |

---

### Key Link Verification

| From | To | Via | Status | Detalhes |
|------|----|----|--------|----------|
| `src/app/dashboard/edificios/page.js` | `src/components/features/GestaoEdificios.js` | `import GestaoEdificios` (default import) | VERIFIED | Linha 1 do arquivo — `import GestaoEdificios from "@/components/features/GestaoEdificios"` |
| `e2e/crud.spec.js` | `/dashboard/edificios` | `page.goto` | VERIFIED | Linha 40: `await page.goto('/dashboard/edificios')` |
| `e2e/crud.spec.js` | shadcn Select Radix | `getByRole('combobox') + getByRole('option')` | VERIFIED | Linhas 80-81, 241-242, 245-246, 280-286 |
| `e2e/crud.spec.js` | ConfirmDialog Contratos | `waitFor text 'Cancelar contrato?'` | VERIFIED | Linha 267: `await page.getByText('Cancelar contrato?').waitFor({ timeout: 5_000 })` |
| `e2e/crud.spec.js` | ConfirmDialog Encerrar | `waitFor text 'Encerrar contrato?'` | VERIFIED | Linha 316: `await page.getByText('Encerrar contrato?').waitFor({ timeout: 5_000 })` |
| `e2e/parcelas.spec.js` | `/dashboard/contratos/[id]` | `page.goto após capturar contratoId via admin` | VERIFIED | Linha 157: `await page.goto(\`/dashboard/contratos/${contratoId}\`)` |
| `e2e/parcelas.spec.js` | Edge Function gerar-parcelas | criação de contrato via UI dispara handleCriarContrato | VERIFIED | Linha 138: `page.getByRole('button', { name: 'Criar Contrato' }).click()` + timeout 15_000 |
| `e2e/realtime.spec.js` | `/unidades` (listagem pública) | `page.goto` antes e depois | VERIFIED | Linhas 58 e 93: dois `page.goto('/unidades')` com assertions opostas |
| `e2e/realtime.spec.js` | seed.mjs unidade E2E-Sala Disponivel | `getByRole('option', { name: 'E2E-Sala Disponivel' })` | VERIFIED | Linha 77 usa a unidade criada pelo seed via ação de seleção |
| `e2e/global-teardown.js` | `supabase.auth.admin.listUsers` | filter por email começando em 'e2e-' | VERIFIED | Linha 113: `authList?.users.filter(u => u.email?.startsWith('e2e-'))` |

---

### Behavioral Spot-Checks

Step 7b: SKIPPED — Specs requerem Supabase local + Edge Function ativos. Não há entry point runnable no ambiente do verificador sem esses serviços externos.

---

### Probe Execution

Step 7c: Sem probes convencionais identificados (`scripts/*/tests/probe-*.sh` não existem). Verificações de sintaxe executadas como substituto:

| Arquivo | Comando | Resultado | Status |
|---------|---------|-----------|--------|
| `e2e/crud.spec.js` | `node --check` | exit 0 | PASS |
| `e2e/parcelas.spec.js` | `node --check` | exit 0 | PASS |
| `e2e/realtime.spec.js` | `node --check` | exit 0 | PASS |
| `e2e/seed.mjs` | `node --check` | exit 0 | PASS |
| `e2e/global-teardown.js` | `node --check` | exit 0 | PASS |

---

### Requirements Coverage

| Requirement | Plano Fonte | Descrição | Status | Evidência |
|-------------|------------|-----------|--------|-----------|
| TEST-01 | 05-01, 05-02 | CRUD completo Proprietário: Edifícios/Unidades/Locatários/Contratos | SATISFIED (estrutural) | `crud.spec.js` linha 32: `test.describe('TEST-01 — CRUD Proprietário')` — 11 testes, 4 entidades, regra de negócio de `disponivel` verificada via admin |
| TEST-02 | 05-01, 05-03 | Ciclo de Parcelas: gerar via EF, marcar paga, mudança de status | SATISFIED (estrutural) | `parcelas.spec.js` linha 30: `test.describe('TEST-02 — Parcelas')` — 2 testes, beforeAll com cadeia FK E2E-, timeout 15_000 para EF |
| TEST-04 | 05-01, 05-04 | Fluxo Realtime: unidade desaparece da listagem pública após contrato | SATISFIED (estrutural) | `realtime.spec.js` linha 24: `test.describe('TEST-04 — Realtime/estado público')` — 1 teste sequencial via reload, afterAll restaura estado |
| TEST-03 | — (fora de escopo) | Portal Locatário: fora da Fase 5 | NOT IN SCOPE | REQUIREMENTS.md mapeia TEST-03 para Phase 2 — não é responsabilidade desta fase |

**Nota sobre requisitos:** Os 3 IDs declarados nos PLANs (TEST-01, TEST-02, TEST-04) estão cobertos estruturalmente. A cobertura funcional (testes passando ao vivo) requer execução humana conforme Human Verification abaixo.

---

### Anti-Patterns Found

| Arquivo | Linha | Pattern | Severidade | Impacto |
|---------|-------|---------|------------|---------|
| `crud.spec.js` | 263 | `locator('..').locator('..')` — dois níveis de âncora para linha de contrato | Aviso | Frágil se o DOM mudar; depende de estrutura específica de grid do componente Contratos. Documentado no SUMMARY 02 como adaptação necessária. Não é bloqueador — é padrão intencional. |
| `parcelas.spec.js` | 163-188 | Teste 2 lê `contratoId` definido pelo Teste 1 (variável de escopo compartilhado do describe) | Aviso | Dependência implícita de ordem: se Teste 1 falhar, Teste 2 falha com `contratoId` undefined. Playwright serializa dentro de describe por default — seguro com configuração padrão, mas frágil com `--workers > 1` por arquivo. |
| SUMMARYs 02/03/04 | — | Hashes de commit incorretos | Info | SUMMARY 02 lista `491ec36/9c0ee0f`, SUMMARY 03 lista `6dd2a88`, SUMMARY 04 lista `2711b9d`. Hashes reais no git: `860578b`, `4c4e694`, `9502ca4`, `63174c4`. Arquivos corretos — apenas documentação misdocumenta. |

Nenhum marcador de dívida (`TBD`, `FIXME`, `XXX`) encontrado em nenhum dos 5 arquivos modificados pela fase.

---

### Human Verification Required

#### 1. Executar suíte E2E completa

**Teste:** Com `supabase start` e `supabase functions serve gerar-parcelas` ativos, executar `npx playwright test`

**Expected:** 14 testes verdes:
- `crud.spec.js`: 11 testes (3 Edifícios + 3 Unidades + 2 Locatários + 3 Contratos)
- `parcelas.spec.js`: 2 testes (gera parcelas via EF + marca paga)
- `realtime.spec.js`: 1 teste (unidade some da listagem pública após contrato)

**Why human:** Specs requerem Supabase local + Edge Function. Todos os 4 SUMMARYs documentaram explicitamente: "Runtime Verification Deferred — ambiente Supabase local DOWN." O ambiente não estava disponível durante a verificação estática.

**Comando exato:**
```bash
# Pré-requisitos
supabase start
supabase functions serve gerar-parcelas &

# Rodar suíte completa
npx playwright test --reporter=line

# Verificar limpeza pós-execução
npx supabase db execute --local -c "select count(*) from edificios where nome like 'E2E-%';"
npx supabase db execute --local -c "select count(*) from auth.users where email like 'e2e-%';"
npx supabase db execute --local -c "select status from unidades where nome = 'E2E-Sala Disponivel';"
```

---

#### 2. Confirmar isolamento de teardown entre runs

**Teste:** Executar `npx playwright test` duas vezes consecutivas sem `supabase db reset` entre elas

**Expected:** Segunda execução também passa 100% — o teardown (global + afterAlls) garante idempotência

**Why human:** Detectaria qualquer problema de idempotência no seed (insert puro em `edificios` — sem upsert — criaria duplicatas se o teardown não limpou corretamente na primeira run)

---

#### 3. Verificar dependência de ordem em parcelas.spec.js

**Teste:** Executar `npx playwright test e2e/parcelas.spec.js` e confirmar que o Teste 2 ("marca parcela como paga") acessa o `contratoId` definido pelo Teste 1

**Expected:** Ambos os testes passam em sequência; se Teste 1 falhar, Teste 2 deve falhar com mensagem clara de `contratoId` undefined (não com erro obscuro de DOM)

**Why human:** Dependência implícita de variável de escopo entre testes — comportamento em runtime determina se é real problema ou funciona confiavelmente com a serialização do Playwright

---

#### 4. Verificar seletor de âncora de contrato em crud.spec.js

**Teste:** Executar apenas os testes de Contratos: `npx playwright test e2e/crud.spec.js --grep "Contratos"`

**Expected:** Os 3 testes passam — em especial, `getByText('E2E-Locatário Contratos').locator('..').locator('..')` sobe dois níveis corretamente e encontra os botões CANC/ENC na linha certa

**Why human:** Âncora de dois níveis depende da estrutura DOM renderizada do componente `Contratos.js` — o número correto de níveis foi determinado durante implementação (SUMMARY 02, desvio 2) mas precisa de confirmação ao vivo

---

### Gaps Summary

Nenhum gap bloqueador identificado. Todos os artefatos existem, são substantivos, e estão conectados corretamente. Os itens `UNCERTAIN` refletem validação de runtime que não pode ser feita sem Supabase local — não há implementação faltante, apenas execução ausente.

**Situação:** A fase produziu uma suíte E2E estruturalmente completa e sintaticamente correta que aguarda validação de runtime pelo desenvolvedor.

---

_Verified: 2026-05-29_
_Verifier: Claude (gsd-verifier)_
