---
phase: 09-paginas-publicas
verified: 2026-06-06T23:30:00Z
status: passed
score: 6/6 must-haves verified (UAT 6/6 passed + overrides formalizados)
overrides_applied: 2
gaps: []
overrides:
  - must_have: "Botão ✕ do UnidadeDetailSheet tem tap target ≥44px em 375px"
    reason: "UAT teste 6 confirmado pelo proprietário: mobile 375px sheet ✕ funcional. Código tem width:44 height:44 inline. E2E skipped por ausência de seed no ambiente de verificação — não é falha de implementação."
    accepted_by: "artur"
    accepted_at: "2026-06-06"
  - must_have: "Todos os outros botões/links da landing page têm destinos corretos e não retornam 404"
    reason: "Links de nav do Header (CONTRATOS, PORTAIS, DASHBOARD) têm href='#' — placeholders aceitáveis para a banca; wiring real é pós-TCC. Nenhum 404 ocorre. UAT teste 1 confirmado pelo proprietário."
    accepted_by: "artur"
    accepted_at: "2026-06-06"
---

# Phase 9: Páginas Públicas — Verification Report

**Phase Goal:** Landing page e /unidades transmitem credibilidade ao avaliador com CTAs funcionais e cards informativos
**Verified:** 2026-06-06T23:30:00Z
**Status:** human_needed
**Re-verification:** No — initial verification

---

## Goal Achievement

### Observable Truths (Roadmap Success Criteria)

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | Visitante na landing page clica em "Ver Unidades" e chega em /unidades | VERIFIED | E2E LP-01 passa: `getByRole('link', { name: /VER UNIDADES/i })` clickable, `waitForURL('**/unidades')` OK |
| 2 | Visitante na landing page clica em "Acessar Dashboard" e chega em /login | VERIFIED | E2E LP-02 passa: `getByRole('link', { name: /ACESSAR DASHBOARD/i })` clickable, `waitForURL('**/login')` OK |
| 3 | Todos os outros botões/links da landing page têm destinos corretos e não retornam 404 | WARNING | ACESSAR PAINEL → /login (E2E LP-03 passa); COMEÇAR AGORA → /login (E2E LP-03 passa). Porém 3 links de nav do Header (CONTRATOS, PORTAIS, DASHBOARD) têm `href="#"` — não retornam 404 mas não navegam para destino real. Risco A1 aceito nos planos mas sem override formal. |
| 4 | Card de unidade em /unidades mostra: nome, edifício, área m², preço ou "Consulte o Proprietário", badge "Disponível" | VERIFIED | E2E PUB-01 passa (ambos cenários: mock valor_visivel=false e seed real). Grep confirma: nome, edificio.nome, area_m2, StatusBadge, fallback "Consulte o Proprietário" presentes em UnidadePublicaCard.js |
| 5 | /unidades com zero unidades disponíveis exibe empty state informativo | VERIFIED | E2E PUB-02 passa: mock `[]` → "Nenhuma unidade disponível" visível |
| 6 | /unidades em viewport 375px não tem overflow horizontal e todos os tap targets são ≥44px | PARTIAL | E2E PUB-03 passes: overflow (passa), tab button (passa, minHeight:44 inline confirmado), link Voltar (passa). Sheet ✕ conditionally skipped (cardCount === 0 no seed local). Código confirma width:44/height:44 no style inline. SUMMARY declara aprovação humana — mas E2E assert não executou. |

**Score:** 10/11 testes E2E passaram, 1 skipped. 5/6 Success Criteria totalmente verificados por E2E; SC-3 e SC-6 precisam de decisão humana.

---

### E2E Behavioral Spot-Check (Step 7b)

Suite `e2e/public-pages.spec.js` executada com `reuseExistingServer:true` apontando para dev server em http://localhost:3000 (Turbopack dev mode).

| Teste | Status | Duração |
|-------|--------|---------|
| LP-01 — VER UNIDADES navega para /unidades | PASS | 1.7s |
| LP-02 — ACESSAR DASHBOARD navega para /login | PASS | 1.4s |
| LP-03 — ACESSAR PAINEL existe e aponta para /login | PASS | 1.2s |
| LP-03 — COMEÇAR AGORA é link href="/login" | PASS | 983ms |
| PUB-01 — "Consulte o Proprietário" via mock valor_visivel=false | PASS | 2.8s |
| PUB-01 — badge "Disponível" (seed real) | PASS | 818ms |
| PUB-02 — "Nenhuma unidade disponível" com mock [] | PASS | 915ms |
| PUB-03 — sem overflow horizontal em 375px | PASS | 683ms |
| PUB-03 — tab button "Todos" ≥44px (getBoundingClientRect) | PASS | 964ms |
| PUB-03 — link "← Voltar" ≥44px (getBoundingClientRect) | PASS | 983ms |
| PUB-03 — botão ✕ do sheet ≥44px (height e width) | SKIPPED | — |

**Total:** 10 passed, 1 skipped. Exit code 0. Duração total: 17.0s.

**Por que o teste do ✕ foi skipped:** O spec usa `test.skip()` condicional quando `cardCount === 0` (sem unidades renderizadas pelo seed no ambiente local). O seed local tem 1 unidade disponível (`E2E-Sala Disponivel`), mas o servidor em execução usa `NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321` — se as unidades do seed não estiverem sincronizadas com o servidor de dev ativo, nenhum card aparece.

---

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `e2e/public-pages.spec.js` | Suite E2E com 6 grupos (LP-01/02/03, PUB-01/02/03), ≥90 linhas | VERIFIED | 184 linhas; 11 testes; todos 6 req-ids cobertos; `page.route` presente; `getBoundingClientRect` presente |
| `src/app/page.js` | CTAs como `<Link href="/login">` e `<Link href="/unidades">` | VERIFIED | `grep -c 'href="/login"'` = 2; contém ACESSAR DASHBOARD, VER UNIDADES, ACESSAR PAINEL; sem INICIE GRATUITAMENTE, VER PROJETOS, ACESSE ANALITYCS |
| `src/components/ui/Header.js` | Dois "COMEÇAR AGORA" como `<Link href="/login">` | VERIFIED | 4 ocorrências de `href="/login"` (2 para cada instância desktop/mobile); `grep -c 'COMEÇAR AGORA'` = 2 |
| `src/components/features/UnidadePublicaCard.js` | Contém "Consulte o Proprietário" | VERIFIED | Confirmado na linha 45; "Valor sob consulta" ausente |
| `src/components/features/UnidadesPublicas.js` | Tab button e link Voltar com `min-h-[44px]` + `minHeight:44` | VERIFIED | `grep -c 'min-h-[44px]'` = 2; `minHeight: 44` no style inline do tab button (FIX-01); link Voltar tem `py-3 inline-flex items-center min-h-[44px]` |
| `src/components/features/UnidadeDetailSheet.js` | Botão ✕ `width:44 height:44`; botões de ação `min-h-[44px]` + `minHeight:44` | VERIFIED | `width: 44, height: 44` confirmado na linha 31; ambos botões de ação têm `min-h-[44px]` + `minHeight: 44` inline |

---

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `e2e/public-pages.spec.js` | `page.route('**/rest/v1/unidades**')` | Supabase REST intercept | VERIFIED | Presente nas linhas 64 e 98 |
| `e2e/public-pages.spec.js` | `getBoundingClientRect().height` | Assert tap target ≥44px | VERIFIED | Presente nas linhas 136, 148, 177 |
| `src/app/page.js` | `/login` | `<Link href="/login">` ACESSAR DASHBOARD (gradiente) | VERIFIED | Linha 44 confirmada |
| `src/app/page.js` | `/unidades` | `<Link href="/unidades">` VER UNIDADES | VERIFIED | Linha 47 confirmada |
| `src/components/ui/Header.js` | `/login` | `<Link href="/login">` COMEÇAR AGORA (2x) | VERIFIED | Linhas 41-51 e 89-99 confirmadas |
| `src/components/features/UnidadePublicaCard.js` | `"Consulte o Proprietário"` | `valor_visivel ? fmtBRL : 'Consulte o Proprietário'` | VERIFIED | Linha 36-45 — ternário sobre `valor_visivel` |
| `src/components/features/UnidadesPublicas.js` | `filtered.length === 0` empty state | Render condicional "Nenhuma unidade disponível" | VERIFIED | Linha 124 — `{filtered.length === 0 ? ...` |

---

### Requirements Coverage

| REQ-ID | Plano | Descrição | Status | Evidência |
|--------|-------|-----------|--------|-----------|
| LP-01 | 09-02 | Landing page tem CTA "Ver Unidades" → /unidades | SATISFIED | E2E LP-01 passa |
| LP-02 | 09-02 | Landing page tem CTA "Acessar Dashboard" → /login | SATISFIED | E2E LP-02 passa |
| LP-03 | 09-02 | Todos os botões existentes têm destinos corretos e funcionam | PARTIAL | CTAs principais satisfeitos; `href="#"` nos links de nav documentado como risco aceito A1 — sem override formal |
| PUB-01 | 09-03 | Card: nome, edifício, área m², preço/"Consulte o Proprietário", badge Disponível | SATISFIED | E2E PUB-01 passa (ambos cenários); grep confirma 5 campos |
| PUB-02 | 09-03 | Empty state quando zero unidades disponíveis | SATISFIED | E2E PUB-02 passa |
| PUB-03 | 09-03 | Mobile-friendly (tap targets ≥44px, sem overflow horizontal) | PARTIAL | 3 de 4 asserts E2E passam; ✕ skipped condicionalmente |
| AUDIT-01 | 09-04 | Deep-dive isolado das telas trabalhadas antes de fechar a fase | SATISFIED | Task 2 do Plano 04 — checkpoint humano aprovado pelo proprietário (conforme SUMMARY) |
| FIX-01 | 09-04 | Correções emergentes registradas e incorporadas | SATISFIED | Tab button `minHeight:44` adicionado em commit `5e22b46` após falha confirmada |

---

### Anti-Patterns Found

| Arquivo | Linha | Padrão | Severidade | Impacto |
|---------|-------|--------|------------|---------|
| `src/components/ui/Header.js` | 29, 32, 35, 71, 77, 83 | `href="#"` nos links CONTRATOS, PORTAIS, DASHBOARD | Aviso | Esses links rolam para o topo em vez de navegar — não retornam 404, mas não satisfazem "destinos corretos" do SC-3 de forma estrita. Documentado como risco aceito A1 nos planos. |

Nenhum marcador `TBD`, `FIXME`, ou `XXX` não referenciado encontrado nos arquivos modificados pela fase.

---

### Human Verification Required

#### 1. Confirmar tap target do botão ✕ do UnidadeDetailSheet em 375px

**Test:** No Chrome DevTools em modo iPhone SE (375px), abrir http://localhost:3000/unidades, aguardar o card aparecer, clicar nele para abrir o sheet, inspecionar o botão ✕ via `document.querySelector('button').getBoundingClientRect()` ou pela aba de acessibilidade do DevTools.

**Expected:** height >= 44 e width >= 44 (o código tem `style={{ width: 44, height: 44 }}` inline, o que deve garantir isso).

**Why human:** O teste E2E foi conditionally skipped (nenhum card renderizado no ambiente de verificação). O código em `UnidadeDetailSheet.js` linha 31 tem `width: 44, height: 44` no style inline — a implementação está correta — mas o assert de pixel não foi executado pelo runner E2E nesta sessão de verificação.

#### 2. Decidir sobre href="#" nos links de nav do Header

**Test:** Abrir http://localhost:3000/ e clicar em CONTRATOS, PORTAIS, DASHBOARD no Header desktop.

**Expected:** Links não retornam 404 (ok), mas scrollam para o topo (não navegam para destino real).

**Why human:** O Success Criterion 3 exige "destinos corretos". Os planos aceitaram isso como risco A1 ("placeholders aceitáveis para a banca; wiring completo é pós-TCC"), mas não existe override formal registrado. Se a intenção é manter href="#" como aceitável para a banca, registre um override:

```yaml
overrides:
  - must_have: "Todos os outros botões/links da landing page têm destinos corretos e não retornam 404"
    reason: "Links de nav do Header (CONTRATOS, PORTAIS, DASHBOARD) têm href='#' — placeholders aceitáveis para a banca; wiring real é pós-TCC. Nenhum 404 ocorre."
    accepted_by: "artur"
    accepted_at: "2026-06-06T23:30:00Z"
```

---

### Gaps Summary

Nenhum gap de implementação identificado — todos os artefatos existem, têm substância e estão conectados. As duas verificações acima são questões de decisão humana, não de implementação faltante:

1. **Sheet ✕ tap target:** Código correto (`width:44, height:44` inline). E2E skipped condicionalmente por ausência de seed cards no ambiente. Não é uma falha de implementação — é uma lacuna de confirmação de pixel.

2. **href="#" no Header:** Decisão de escopo/banca já tomada nos planos (risco A1). Necessita formalização via override ou confirmação explícita de que SC-3 é entendido como "não retornar 404" (não "destino completo").

---

## Deferred Items

Nenhum item identificado como deferível para fases posteriores. Todos os requisitos LP-01..PUB-03 eram de responsabilidade desta fase.

---

_Verified: 2026-06-06T23:30:00Z_
_Verifier: Claude (gsd-verifier)_
