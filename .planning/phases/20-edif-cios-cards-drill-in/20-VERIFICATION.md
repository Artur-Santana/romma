---
phase: 20-edif-cios-cards-drill-in
verified: 2026-06-15T15:00:00Z
status: passed
score: 6/6 must-haves verified
overrides_applied: 0
human_verification:
  - test: "Verificar layout de cards 2 colunas no desktop e colapso para 1 coluna no mobile"
    expected: "Cards em 2 colunas a 1440px; colapso automático para 1 coluna em ~375px sem overflow horizontal"
    why_human: "Comportamento de CSS grid `minmax(340px, 1fr)` requer viewport real para confirmar"
  - test: "Verificar barra de ocupação contígua (sem buracos) em edifício com unidades de status misto"
    expected: "Segmento índigo (alugadas) imediatamente seguido do segmento cinza (disponíveis), altura 6px, sem espaço entre segmentos"
    why_human: "Renderização flex proporcional requer inspeção visual; grep não confirma ausência de gap"
  - test: "Verificar accordion: 'Ver N unidade(s)' expande lista inline; segundo clique recolhe"
    expected: "Lista de unidades aparece abaixo do botão ao clicar; desaparece ao clicar novamente; botão desabilitado (opacity 0.4, cursor not-allowed) quando N=0"
    why_human: "Toggle de estado React e comportamento de interação requerem renderização real"
  - test: "Verificar drill-in: clicar linha de unidade abre UnifiedUnidadeModal com select de Edifício desabilitado"
    expected: "Modal abre em modo edit com dados da unidade; o FSelect de Edifício tem opacity 0.5, cursor default e não permite troca; somente o edifício corrente aparece na lista de opções"
    why_human: "Comportamento de lockEdificio=true e filtragem de opções requerem renderização + interação real"
  - test: "Verificar que onSaved preserva accordion aberto (expandidos não reseta)"
    expected: "Após salvar uma unidade no modal drill-in, o accordion do edifício permanece expandido e os stats recomputam"
    why_human: "Persistência de estado React entre re-renders via carregarDados() requer execução real"
---

# Phase 20: Edifícios — Cards & Drill-in Verification Report

**Phase Goal:** O Proprietário vê Edifícios em cards de 2 colunas com stats por edifício (ocupação %, MRR, área total, nº de unidades) e barra de ocupação contígua (alugadas primeiro, depois disponíveis, sem buracos) com legenda; o botão "Ver N unidade(s)" expande a lista de unidades, cada uma clicável abrindo o modal unificado de unidade da Phase 19 com o edifício travado.
**Verified:** 2026-06-15T15:00:00Z
**Status:** human_needed
**Re-verification:** No — initial verification

---

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | Edifícios aparecem em cards de 2 colunas com stats por edifício (ocupação %, MRR, área total, nº de unidades) | VERIFIED | `GestaoEdificios.js` L240-L244: `gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))"`. Stats row L344-L371: 4-cell grid with labels "Unidades", "Ocupação", "MRR" (gold `var(--highlight)`), "Área total" |
| 2 | Cada card mostra barra de ocupação contígua, alugadas-first, sem buracos, com legenda "X alugada(s) · Y disponível(is)" | VERIFIED | `OccupationBar` L36-L53: conditional segment rendering — `{alugadas > 0 && <div flex=alugadas indigo />}` then `{disponiveis > 0 && <div flex=disponiveis border-3 />}`. Legend L377-L379 matches "X alugada(s) · Y disponíve{is|l}" |
| 3 | Botão "Ver N unidade(s)" expande inline a lista de unidades; desabilitado quando N=0 | VERIFIED | L383-L400: button with `{Ver ${n} unidade${n !== 1 ? "s" : ""}}`, `disabled={n === 0}`, `opacity: n === 0 ? 0.4 : 1`, `cursor: n === 0 ? "not-allowed" : "pointer"`. `toggleExpandido` L159-L165: immutable Set update |
| 4 | Cada linha de unidade é clicável e abre o UnifiedUnidadeModal em mode=edit com lockEdificio=true | VERIFIED | L403-L446: accordion panel with `data-testid="unidade-row"`, `onClick={() => setModalState({ unidade: u })}`, `cursor: pointer`. Modal invocation L455-L464: `lockEdificio={true}` |
| 5 | Após onSaved, recarrega dados sem resetar expandidos (accordion permanece aberto) | VERIFIED | `carregarDados` L96-L103: only calls `setEdificios` and `setUnidades` — `setExpandidos` never called within it. `onSaved` L462: `carregarDados(); setModalState(null)` — no `setExpandidos` |
| 6 | Modal de unidade pode ser aberto com edifício travado (lockEdificio=false default) sem quebrar Unidades.js | VERIFIED | `UnifiedUnidadeModal` L275: `lockEdificio = false` default. `grep lockEdificio Unidades.js` → 0 matches — call-site unchanged |

**Score:** 6/6 truths verified

---

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `src/components/features/GestaoEdificios.js` | Grade de cards 2-col com stats, barra de ocupação, accordion drill-in e reuso do modal travado | VERIFIED | Contains `OccupationBar`, `computeStats`, `fmtBRLk`, `Promise.all`, `toggleExpandido`, `lockEdificio={true}`, `minmax(340px, 1fr)` — all substantive, all wired |
| `src/components/ui/UnifiedUnidadeModal.js` | Prop lockEdificio que desabilita o FSelect de edifício | VERIFIED | L275 signature with `lockEdificio = false`; L40 `FSelect` accepts `disabled`; L438 `disabled={lockEdificio}`; L440-441 `edificios.filter(ed => ed.id === form.edificio_id)` when locked; L437 `!lockEdificio` guard on onChange |
| `e2e/crud-edificios.spec.js` | Asserções E2E para EDIF-01..03 (Wave 0 scaffold) | VERIFIED | 3 original CRUD tests preserved (criar/editar/deletar). 6 new tests added in 3 `test.describe` blocks: EDIF-01 (card grid + stats labels), EDIF-02 (legend regex), EDIF-03 (accordion + drill-in + lockEdificio toBeDisabled). `data-testid="unidade-row"` aligned with component |

---

### Key Link Verification

| From | To | Via | Status | Details |
|------|-----|-----|--------|---------|
| `GestaoEdificios.js` | `getUnidades` | `Promise.all` in `carregarDados` | WIRED | L5: import; L97-L99: `Promise.all([getEdificios(), getUnidades()])` |
| `GestaoEdificios.js` | `UnifiedUnidadeModal` | drill-in row click with `lockEdificio={true}` | WIRED | L11: import; L455-L464: `<UnifiedUnidadeModal mode="edit" lockEdificio={true} ...>` rendered when `modalState != null` |
| `GestaoEdificios.js` | `criarEdificio / editarEdificio / deletarEdificio` | Server Actions preserved | WIRED | L4: import; L117, L138, L151: all three called in respective handlers |
| `UnifiedUnidadeModal.js` | `FSelect` | `disabled={lockEdificio}` | WIRED | L40: `FSelect` accepts `disabled`; L49: forwarded to `<select>`; L438: `disabled={lockEdificio}` passed at field site |

---

### Data-Flow Trace (Level 4)

| Artifact | Data Variable | Source | Produces Real Data | Status |
|----------|--------------|--------|-------------------|--------|
| `GestaoEdificios.js` | `unidades` (for stats/bar/accordion) | `getUnidades()` via `Promise.all` in `carregarDados` | Yes — `getUnidades()` queries Supabase `unidades` table with RLS filter; result drives `unidadesPorEdificio` reduce, `computeStats`, `OccupationBar`, and accordion list | FLOWING |
| `GestaoEdificios.js` | `edificios` | `getEdificios()` via `Promise.all` | Yes — queries Supabase `edificios` table | FLOWING |
| `computeStats` output | `mrr`, `areaTotal` | `parseFloat(u.valor_mensal)`, `parseFloat(u.area_m2)` | Yes — numeric coercion applied (CR-01 fix in commit `bbde451`) | FLOWING |

---

### Behavioral Spot-Checks

Step 7b: SKIPPED — verifying against a running dev server is not feasible in this environment. E2E tests require a browser + Next.js server. See Human Verification section.

---

### Probe Execution

Step 7c: No probe scripts found for Phase 20 (`find scripts -path '*/tests/probe-*.sh'` — no results). SKIPPED.

---

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|-------------|-------------|--------|----------|
| EDIF-01 | 20-02-PLAN.md | Edifícios em cards 2 colunas com stats (ocupação %, MRR, área total, nº unidades) | SATISFIED | `GestaoEdificios.js`: grid `minmax(340px,1fr)`, 4-cell stats row with all 4 metrics |
| EDIF-02 | 20-02-PLAN.md | Barra de ocupação contígua (alugadas-first, sem buracos) com legenda | SATISFIED | `OccupationBar` conditional segments; legend string in component |
| EDIF-03 | 20-01-PLAN.md, 20-02-PLAN.md | Botão "Ver N unidade(s)" + drill-in abrindo modal unificado com edifício travado | SATISFIED | `toggleExpandido`, `data-testid="unidade-row"` rows, `lockEdificio={true}` on `UnifiedUnidadeModal` |

All 3 requirement IDs declared across the phase plans are accounted for. No orphaned requirements for Phase 20 detected in REQUIREMENTS.md.

---

### Anti-Patterns Found

| File | Pattern | Severity | Assessment |
|------|---------|----------|-----------|
| (none) | No TBD/FIXME/XXX markers found in phase-modified files | — | Clean |

Anti-pattern scan of `GestaoEdificios.js` and `UnifiedUnidadeModal.js`: no unreferenced debt markers, no `return null` / `return {}` / placeholder stubs. `OccupationBar` empty-state returns a real neutral bar (not null). `computeStats` with `parseFloat` coercion is substantive (CR-01 fix verified in commit `bbde451`).

---

### Deferred Code Review Findings (from 20-REVIEW.md)

The post-execution code review identified 4 findings. All were resolved before this verification:

| Finding | Disposition | Evidence |
|---------|-------------|---------|
| CR-01: stat numeric coercion (string values from Supabase yielded NaN) | FIXED in commit `bbde451` — `parseFloat()` applied to `valor_mensal` and `area_m2` | `GestaoEdificios.js` L31-L32 |
| WR-02: `data-testid="edificio-card"` added for E2E resilience | FIXED in `bbde451` | `GestaoEdificios.js` L258 |
| WR-03: `data-testid="unidade-row"` added for E2E resilience | FIXED in `bbde451` | `GestaoEdificios.js` L408 |
| WR-04: accordion borderTop on container | FIXED in `bbde451` | `GestaoEdificios.js` L404 area |
| CR-02: orphan-unit-on-upload-failure in UnifiedUnidadeModal | DEFERRED — Phase 19 pre-existing bug; out-of-scope for Phase 20 | No Phase 20 obligation |
| WR-01: delete-without-confirm in GestaoEdificios | DEFERRED — pre-existing behavior preserved per decision D-09 | No regression; scope decision |

---

### Human Verification Required

#### 1. Layout de cards 2 colunas (desktop) e colapso mobile

**Test:** Acesse `/dashboard/edificios` autenticado como proprietário em viewport 1440px. Confirme que edifícios aparecem em 2 colunas. Reduza a janela para ~375px e confirme que colapsa para 1 coluna sem overflow.
**Expected:** 2 colunas em desktop; 1 coluna em mobile (~375px); sem scroll horizontal.
**Why human:** CSS `repeat(auto-fill, minmax(340px, 1fr))` requer viewport real para confirmar comportamento de colapso.

#### 2. Barra de ocupação contígua sem buracos

**Test:** Em um edifício com unidades de status misto (algumas alugadas, algumas disponíveis), inspecione visualmente a barra de ocupação.
**Expected:** Segmento índigo (alugadas) imediatamente adjacente ao segmento cinza (disponíveis) — altura 6px, nenhum espaço ou gap visível entre segmentos. Legenda "X alugada(s) · Y disponível(is)" abaixo.
**Why human:** Renderização flex proporcional só é confirmável visualmente; grep verifica o código mas não o resultado renderizado.

#### 3. Accordion "Ver N unidade(s)" expande e recolhe

**Test:** Clique no botão "Ver N unidade(s)" de um edifício com unidades. Confirme que a lista expande inline. Clique novamente e confirme que recolhe. Em edifício com 0 unidades, confirme que o botão está desabilitado (opacity reduzida, cursor proibido).
**Expected:** Toggle funcional; botão desabilitado quando N=0.
**Why human:** Estado React e interação requerem execução real.

#### 4. Drill-in abre modal com edifício travado

**Test:** Com o accordion aberto, clique em uma linha de unidade. Confirme que o `UnifiedUnidadeModal` abre em modo edição. Confirme que o campo Edifício está desabilitado (opacity 0.5, cursor default, somente o edifício corrente na lista).
**Expected:** Modal abre com dados da unidade; FSelect de Edifício inacessível mostrando apenas o edifício do card.
**Why human:** lockEdificio=true é prop passada em runtime; verificar comportamento visual e ausência de outros edifícios na lista requer renderização.

#### 5. Accordion permanece aberto após onSaved

**Test:** Abrir accordion, abrir modal via drill-in, salvar uma alteração na unidade. Confirme que o accordion permanece expandido após o save e que os stats do card se atualizam.
**Expected:** Accordion não fecha; stats recomputados (ex.: MRR, ocupação atualizam se status mudou).
**Why human:** Persistência de `expandidos` Set entre re-renders via `carregarDados()` requer execução real.

---

### Gaps Summary

No automated gaps found. All 6 must-have truths are VERIFIED in the codebase. Status is `human_needed` because 5 visual/interactive behaviors require a running dev server for final confirmation.

The E2E spec (`crud-edificios.spec.js`) covers these behaviors programmatically but requires a browser + Next.js server to run — not feasible in this verification environment. Running `npx playwright test e2e/crud-edificios.spec.js` against a live dev or staging server will provide automated confirmation of the human checks above.

---

_Verified: 2026-06-15T15:00:00Z_
_Verifier: Claude (gsd-verifier)_
