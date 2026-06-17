# Romma — Roadmap

**Project:** Romma TCC Finalization + Polish & Completeness + System Improvement
**Status:** ✅ v1.5 SHIPPED — banca 18/06/2026

---

## Milestones

- ✅ **v1.0 TCC Finalization** — Phases 1-7 (shipped 2026-06-03)
- ✅ **v1.1 Polish & Completeness** — Phases 8-16 (shipped 2026-06-13)
- ✅ **v1.5 System Improvement & Design Augmentation** — Phases 17-25 (shipped 2026-06-17)

---

## Phases

<details>
<summary>✅ v1.0 TCC Finalization (Phases 1-7) — SHIPPED 2026-06-03</summary>

- [x] Phase 1: Dashboard Completions (8/8 planos)
- [x] Phase 2: Portal do Locatário (3/3 planos)
- [x] Phase 3: Refatoração e Qualidade (4/4 planos)
- [x] Phase 4: Polimento Visual Público (4/4 planos)
- [x] Phase 5: Testes E2E (4/4 planos)
- [x] Phase 6: Deploy Final e Demo (3/3 planos)
- [x] Phase 7: Ajustes Finais Pré-Banca (3/3 planos)

*Detalhes: `.planning/milestones/v1.0-ROADMAP.md`*

</details>

<details>
<summary>✅ v1.1 Polish & Completeness (Phases 8-16) — SHIPPED 2026-06-13</summary>

- [x] Phase 8: Bug Fixes (5/5) — BUG-01..04
- [x] Phase 9: Páginas Públicas (4/4) — LP-01..03, PUB-01..03
- [x] Phase 10: Signup Proprietário (3/3) — AUTH-01
- [x] Phase 11: Multi-Tenant Proprietários (4/4) — MT-01, MT-02
- [x] Phase 12: Escala Desktop + Tema (6/6) — UX-01, THEME-01/02
- [x] Phase 13: Mobile Responsivo (4/4) — UX-02/03/04
- [x] Phase 14: Animações & Feedback (4/4) — ANIM-01/02/03
- [x] Phase 15: Testes (6/6) — TEST-01, TEST-02 (47 unit + 73 E2E)
- [x] Phase 16: Fechamento IDOR MT-02 (3/3) — MT-03

*Detalhes: `.planning/milestones/v1.1-ROADMAP.md` · Audit: `.planning/milestones/v1.1-MILESTONE-AUDIT.md`*

</details>

<details>
<summary>✅ v1.5 System Improvement & Design Augmentation (Phases 17-25) — SHIPPED 2026-06-17</summary>

- [x] Phase 17: Fundação — Tokens, Mobile/Modal Fixes & Infra (3/3 planos) — completed 2026-06-13
- [x] Phase 18: Acesso — Login / Cadastro / Redefinir (4/4 planos) — completed 2026-06-14
- [x] Phase 19: Unidades — Modal Unificado & Foto de Capa (4/4 planos) — completed 2026-06-14
- [x] Phase 20: Edifícios — Cards & Drill-in (2/2 planos) — completed 2026-06-15
- [x] Phase 21: Dashboard — Visão Geral Editorial (3/3 planos) — completed 2026-06-16
- [x] Phase 22: Contratos & Parcelas — Renovação (3/3 planos) — completed 2026-06-16
- [x] Phase 23: Locatários — Busca & Máscaras (2/2 planos) — completed 2026-06-16
- [x] Phase 24: Público — Unidades Disponíveis (2/2 planos) — completed 2026-06-17
- [x] Phase 25: Portal do Locatário — PIX & Recibo (4/4 planos) — completed 2026-06-17

*Detalhes: `.planning/milestones/v1.5-ROADMAP.md`*

</details>

---

## Deferred (pós-banca / pós-v1.5)

- **AUTH-02**: guard de instância única no formulário `/signup` (atualmente só DB-side). Aceito para premissa single-instance do TCC.
- **REFINO-F1**: variantes de densidade compact/comfy alternáveis (v1.5 usa só "regular").
- **PORT-F1**: processamento real de pagamento PIX (gateway).
- **PIX-F1**: geração de QR Code PIX real (BR Code) — v1.5 usa QR determinístico único.
- **THEME-02**: paletas alternativas existem em CSS mas sem toggle de UI.

---

*v1.0 archive: `.planning/milestones/v1.0-ROADMAP.md`*
*v1.1 archive: `.planning/milestones/v1.1-ROADMAP.md`*
*v1.5 archive: `.planning/milestones/v1.5-ROADMAP.md`*
