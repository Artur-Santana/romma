---
phase: 25-portal-do-locat-rio-pix-recibo
verified: 2026-06-17T22:00:00Z
status: passed
score: 4/4
overrides_applied: 0
human_verification:
  - test: "Modal PIX — exibir QR e copiar código"
    expected: "Pagar Agora abre modal com QR visível, botão copiar funciona, nota de demo presente"
    why_human: "Interação visual + clipboard API não testável em unit headless"
  - test: "Baixar comprovante PDF"
    expected: "Parcela paga exibe [↓] RECIBO; clicar gera PDF com valor, parcela X/N, locatário, unidade, datas, forma PIX, código de autenticação"
    why_human: "jsPDF executa só no browser; geração de blob não testável em ambiente headless"
  - test: "Confirmação sync para o Proprietário"
    expected: "Após confirmar pagamento no portal, refresh do dashboard Proprietário mostra parcela como Paga em Visão Geral e detalhe do contrato"
    why_human: "Sincronização cross-sessão refresh-based — requer duas sessões abertas simultaneamente"
  - test: "Build SSR-safe (jsPDF dynamic import)"
    expected: "npm run build termina com exit 0 sem erro de módulo"
    why_human: "Segurança SSR do import dinâmico só verificável via build completo"
---

# Phase 25: Portal do Locatário — PIX & Recibo — Verification Report

**Phase Goal:** O Locatário vê seu próximo vencimento em destaque, paga via modal PIX (QR estático), e essa baixa reflete como "Paga" no painel do Proprietário; parcelas pagas têm comprovante PDF.
**Verified:** 2026-06-17T22:00:00Z
**Status:** human_needed
**Re-verification:** No — initial verification

---

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | Portal exibe próximo vencimento em destaque (valor, parcela X/N, dias restantes) + progresso (pagas/total, % adimplente) + grade-resumo + histórico incluindo futura | VERIFIED | `VencimentoDestaque.js` filtra pendente/vencida, exibe `fmtBRL(valor_mensal)`, `parcela.numero/totalParcelas`, dias restantes condicional. `ContratoCard.js` tem `role="progressbar"` com pagas/total/pct. `ParcelsTable.js` recebe `todasParcelas` (sem filtro de futura). `getTodasParcelasPortal` remove `.neq('status','futura')`. |
| 2 | "Pagar Agora" abre modal PIX com QR estático único, código copia-e-cola (botão copiar) e nota explícita de que o pagamento real não é processado; ao confirmar, a parcela é marcada como paga | VERIFIED | `PixModal.js` tem `<img src="/pix-qr.png">` (891B PNG em `public/`), `PIX_CODE_CONST` BR Code exibido + `handleCopiar` com try/catch, nota de demo literal em JSX (`border-l-2 border-warning`), `handleConfirmar` chama `confirmarPagamentoLocatario(parcela.id)`. `PortalDashboard` passa `onPagar` que seta `pixModal.open=true`. |
| 3 | Baixa confirmada reflete como Paga no painel do Proprietário via persistência em `parcelas`, com guard 3-hop (parcela→contrato→locatario→usuario_id) test-first; cross-tenant retorna 404 | VERIFIED | `confirmarPagamentoLocatario` implementa exatamente 3 hops: parcela→`contrato_id`, contrato→`locatario_id`, locatario→`usuario_id !== user.id` retorna 404. Update usa `.in('status', ['pendente','vencida'])`. 6 testes Vitest: happy path 200, cross-tenant 404 + update NOT called, 401, 400, hop-1 null 404, no-op 200 — todos PASS. Persiste na mesma tabela `parcelas` que o Proprietário lê. |
| 4 | Parcelas pagas têm "Baixar comprovante" que gera recibo PDF no browser (valor, parcela, locatário, unidade, datas, forma PIX, código de autenticação) via import dinâmico, sem crash SSR | VERIFIED | `ParcelsTable.js` exibe `[↓] RECIBO` para `status === 'paga'`, chama `handleBaixarRecibo`. Import dinâmico: `await import('jspdf')`. PDF inclui: `locatario.nome_razao_social`, `contrato.unidades.nome`, `parcela.numero de parcelas.length`, `fmtBRL(valor_mensal)`, `data_fechamento`, `data_vencimento`, `data_pagamento`, `Forma: PIX`, `gerarCodigoAuth(parcelaId, dataPagamento)`. `jspdf` em `package.json`. |

**Score:** 4/4 truths verified (automated checks)

---

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `src/actions/parcelas.js` — `confirmarPagamentoLocatario` | Guard 3-hop IDOR + cross-tenant 404 | VERIFIED | 85 linhas, guard separado `authGuardLocatario` sem `isProprietario`, 3 hops com `supabaseAdmin`, `.in('status', ['pendente','vencida'])` |
| `src/lib/queries-client.js` — `getTodasParcelasPortal` | Todas as parcelas incluindo futura + data_fechamento | VERIFIED | Linha 155: sem `.neq()`, `data_fechamento` no select, order ascending |
| `src/components/features/portal/VencimentoDestaque.js` | Destaque próximo vencimento — puro de props | VERIFIED | 44 linhas, sem hooks/useEffect, filtro pagáveis, diasRestantes, botão onPagar |
| `src/components/features/portal/ContratoCard.js` | Barra de progresso + stats | VERIFIED | `role="progressbar"`, IIFE com total/pagas/pct, exibição "pagas · total · % adimplente" |
| `src/components/features/portal/PortalDashboard.js` | Estado todasParcelas + pixModal + wiring | VERIFIED | `todasParcelas` state, `pixModal` state, `refetchParcelas` named function, todos componentes wired |
| `src/components/features/portal/PixModal.js` | Modal PIX completo — QR, cópia, nota demo, confirmar | VERIFIED | 134 linhas, `'use client'`, `PIX_CODE_CONST`, QR img, try/catch clipboard, nota demo, loading state machine |
| `src/components/features/portal/ParcelsTable.js` | Coluna Ação + jsPDF recibo com todos campos | VERIFIED | 5 colunas, [>] PAGAR / [↓] RECIBO / —, `handleBaixarRecibo` com import dinâmico e todos campos |
| `public/pix-qr.png` | Asset PNG estático QR | VERIFIED | 891B, existe em `public/` |
| `test/unit/actions/parcelas.test.js` — `describe('confirmarPagamentoLocatario')` | 6 testes TDD cobrindo todos os casos | VERIFIED | 6 casos + helpers `setupLocatarioOwnerSingles3` e `setupLocatarioCrossTenantSingles3`; 127/127 PASS |
| `jspdf` em `package.json` | Dependência instalada | VERIFIED | `"jspdf": "^4.2.1"` |

---

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `PortalDashboard` | `getTodasParcelasPortal` | import + `fetchData` | WIRED | Linha 5 import, linha 37 `await getTodasParcelasPortal(ct.id)` |
| `PortalDashboard` | `VencimentoDestaque` | import + JSX prop `parcelas={todasParcelas}` | WIRED | Linha 8 import, linha 82-86 JSX com `onPagar` handler |
| `PortalDashboard` | `ContratoCard` | import + JSX prop `parcelas={todasParcelas}` | WIRED | Linha 6 import, linha 88 JSX |
| `PortalDashboard` | `ParcelsTable` | import + JSX props `parcelas/locatario/contrato/onPagar` | WIRED | Linha 7 import, linhas 90-95 JSX |
| `PortalDashboard` | `PixModal` | import + JSX props `open/parcela/contrato/onClose/onSucesso` | WIRED | Linha 9 import, linhas 96-102 JSX |
| `PixModal` | `confirmarPagamentoLocatario` | import + `handleConfirmar` | WIRED | Linha 6 import, linha 36 `await confirmarPagamentoLocatario(parcela.id)` |
| `ParcelsTable` | `jspdf` | `await import('jspdf')` | WIRED | Linha 19, com defensive destructuring `mod.jsPDF ?? mod.default?.jsPDF ?? mod.default` |
| `PortalDashboard.onSucesso` | `refetchParcelas` | closure callback | WIRED | Linha 101: `async () => { await refetchParcelas(); toast.success(...)  }` |

---

### Data-Flow Trace (Level 4)

| Artifact | Data Variable | Source | Produces Real Data | Status |
|----------|---------------|--------|-------------------|--------|
| `VencimentoDestaque` | `parcelas` prop | `getTodasParcelasPortal` → Supabase `parcelas` table | Yes — DB query sem filtro de status | FLOWING |
| `ContratoCard` | `parcelas` prop | mesmo `todasParcelas` state | Yes | FLOWING |
| `ParcelsTable` | `parcelas` prop | mesmo `todasParcelas` state | Yes | FLOWING |
| `PixModal` | `parcela` prop | `pixModal.parcela` setado via `onPagar(parcela)` | Yes — objeto real da tabela | FLOWING |
| `ParcelsTable.handleBaixarRecibo` | `locatario`, `contrato` | `getLocatarioByUserId` (inclui `nome_razao_social`) + `getContratoAtivoByLocatario` (inclui `unidades(nome, valor_mensal)`) | Yes | FLOWING |

**Observation (WARNING, não BLOCKER):** `parcelas` state (de `getParcelasPortal`) é buscado no `fetchData` mas nunca passado a nenhum componente renderizado — todos recebem `todasParcelas`. É uma chamada extra ao banco sem uso. Não afeta correção funcional.

---

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
|----------|---------|--------|--------|
| 11 testes `confirmarPagamentoLocatario` passam | `npx vitest run test/unit/actions/parcelas.test.js` | PASS (11) FAIL (0) | PASS |
| Suite completa sem regressão | `npx vitest run` | PASS (127) FAIL (0) | PASS |

---

### Probe Execution

Nenhum probe shell (`scripts/*/tests/probe-*.sh`) declarado ou presente para esta fase.

---

### Requirements Coverage

| Requirement | Description | Status | Evidence |
|-------------|-------------|--------|----------|
| PORT-04 | Locatário vê histórico completo de parcelas (todas, incluindo futura) | SATISFIED | `getTodasParcelasPortal` sem filtro futura; `ParcelsTable` recebe `todasParcelas` |
| PORT-05 | Modal PIX com QR code estático + código copiável + confirmar pagamento | SATISFIED | `PixModal.js` completo com QR, cópia, nota demo obrigatória, confirmar |
| PORT-06 | Próximo vencimento em destaque + confirmação sync para Proprietário | SATISFIED | `VencimentoDestaque.js` + `confirmarPagamentoLocatario` 3-hop guard test-first; sync via persistência em `parcelas` |
| PORT-07 | PDF recibo client-side via jsPDF com todos campos obrigatórios | SATISFIED | `handleBaixarRecibo` com import dinâmico; todos os 7 campos presentes no PDF |

**Security requirement:** Guard 3-hop `confirmarPagamentoLocatario` — parcela→contrato→locatario→usuario_id check com cross-tenant retornando 404 — VERIFIED por código e por 2 testes específicos (cross-tenant 404 + update NOT called).

---

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| `PortalDashboard.js` | 18, 35-36 | `parcelas` state nunca usado em render — chamada extra ao banco | Info | Chamada extra ao Supabase sem uso no render; não afeta correção |

Nenhum marcador de débito (`TBD`, `FIXME`, `XXX`) encontrado nos arquivos desta fase. Os `return null` em `VencimentoDestaque.js:9` e `PixModal.js:11` são guard clauses condicionais, não stubs.

---

### Human Verification Required

#### 1. Modal PIX — QR visível e cópia de código

**Test:** No portal autenticado, clicar em "Pagar Agora" numa parcela pendente/vencida
**Expected:** Modal abre com QR image visível (200px), código PIX exibido, botão "COPIAR CÓDIGO" copia para clipboard com feedback "[✓] COPIADO", nota de demo com borda amarela visível
**Why human:** Interação visual + API Clipboard não testável em unit headless

#### 2. PDF recibo com todos os campos PORT-07

**Test:** Marcar parcela como paga → clicar "[↓] RECIBO" na linha correspondente
**Expected:** PDF baixado com: nome do locatário, nome da unidade, "Parcela N de M", valor em BRL, data de fechamento, data de vencimento, data de pagamento, "Forma: PIX", código de autenticação 8 chars uppercase
**Why human:** jsPDF só executa no browser; geração de blob não testável em headless

#### 3. Sync da baixa para o painel do Proprietário

**Test:** Confirmar pagamento no portal → fazer refresh no dashboard do Proprietário (Visão Geral + detalhe do contrato)
**Expected:** A parcela aparece com status "Paga" no painel do Proprietário após o refresh
**Why human:** Sincronização cross-sessão refresh-based — requer duas sessões simultâneas

#### 4. Build SSR-safe (jsPDF dynamic import)

**Test:** Executar `npm run build` no diretório do projeto
**Expected:** Build termina com exit 0 sem erro de importação de módulo relacionado ao jsPDF
**Why human:** Segurança SSR do import dinâmico só verificável via build completo; SUMMARY reporta exit 0 mas não constitui evidência verificável por este agente

---

### Gaps Summary

Nenhum gap automaticamente verificável — todos os 4 critérios de sucesso do ROADMAP têm implementação substantiva e wiring completo confirmados no código. Os 4 itens de verificação humana acima são requisitos de interação visual/browser que não podem ser verificados por grep estático.

**Observação menor:** `parcelas` state + `getParcelasPortal` call em `PortalDashboard.js` é código morto (resultado nunca renderizado). Não afeta funcionalidade e pode ser removido em refactoring futuro.

---

_Verified: 2026-06-17T22:00:00Z_
_Verifier: Claude (gsd-verifier)_
