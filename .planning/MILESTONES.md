# Milestones — Romma

## v1.1 Polish & Completeness (Shipped: 2026-06-13)

**Phases completed:** 9 phases, 30 plans, 24 tasks

**Key accomplishments:**

- Escrita atômica (Tasks 1+2 em um commit)
- Task 1 — page.js (D-01, D-02, D-04):
- One-liner:
- Task 1 — Suite E2E:
- One-liner:
- One-liner:
- One-liner:
- One-liner:
- One-liner:
- One-liner:
- Commit:
- One-liner:
- 1. [Rule 2 - Missing critical functionality] Elevação de h3 "Enviar Convite" para 24px
- One-liner:
- One-liner:
- One-liner:
- One-liner:
- Playwright E2E spec with 7 RED tests covering UX-02/03/04 at 375px viewport, establishing objective done-criteria before any production code is touched
- DashboardShell Client Component with CSS render-both pattern wires dashboard layout to mobile chrome (MobileTopBar + MobileBottomNav) via globals.css visibility classes, eliminating double chrome from dashboard/page.js
- Responsive overflow fix across all 4 dashboard tabs — table grids wrapped in overflowX:auto containers, romma-desktop-only removed from Locatarios, forms collapsed for 375px
- Padding, tipografia e overflow corrigidos nos 3 componentes do portal — 375px sem overflow horizontal
- One-liner:
- One-liner:
- Task 1 — Unidades.js:
- One-liner:
- One-liner:
- One-liner:
- One-liner:
- One-liner:
- 1. [Rule 2 - Pattern] Fixture names namespaced per split file
- One-liner:
- Fechado IDOR em criarUnidade (1-hop), criarContrato (2-hop), editarContrato (3-hop) via ownership pre-check por proprietario_id
- marcarParcelaComoPaga gains 4-hop ownership pre-check (parcela→contrato→unidade→edificio→proprietario_id) and authGuard now returns { user }, closing MT-03 cross-tenant IDOR write vector
- Commit:

---

---

## v1.0 — TCC Finalization ✅

**Shipped:** 2026-06-03
**Phases:** 1-7 (7 fases, 29 planos)
**Files changed:** 258 (+40,470 / -399)
**LOC:** ~5,643 JS
**Timeline:** 78 dias (2026-03-18 → 2026-06-03)
**Known deferred items at close:** 7 (ver STATE.md Deferred Items)

### Delivered

Sistema completo de gerenciamento de aluguéis corporativos para TCC, deployed em romma-alpha.vercel.app. Ciclo completo: Dashboard do Proprietário com MRR/Receita Esperada em tempo real → Portal do Locatário com auth via convite → Listagem pública com Realtime → Suite E2E Playwright → Roteiro de banca.

### Accomplishments

1. **Dashboard MRR/Receita** — Tiles financeiros com valores R$ reais (soma de contratos ativos + parcelas pendentes/vencidas) + alerta contratos vencendo em 7 dias
2. **Portal do Locatário** — Auth via convite email, visualização de contrato ativo, histórico de parcelas filtrado (sem futuras), design Obsidian Blueprint
3. **Segurança** — IDOR corrigido em cancelar/encerrarContrato, mass assignment em editarLocatario, erroMessage padronizado
4. **Polimento Visual** — /unidades redesenhada Obsidian Blueprint (roxo/dourado, Manrope/Noto Sans, next/image), sidebar e cards consistentes
5. **Suite E2E** — Playwright cobrindo CRUD Proprietário completo, ciclo de Parcelas (gerar+pagar), fluxo Realtime
6. **Deploy Produção** — romma-alpha.vercel.app estável, /auth/confirm funcionando, seed de demo idempotente, DEMO.md + cheat sheet
7. **UX Pré-Banca** — Skeleton loading em 5 telas, logout sidebar, sidebar limpo

### Requirements

- v1: 21/21 ✅ | Gap-closure: 4/4 ✅
- Archive: `.planning/milestones/v1.0-REQUIREMENTS.md`
- Roadmap archive: `.planning/milestones/v1.0-ROADMAP.md`
