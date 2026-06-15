---
gsd_state_version: 1.0
milestone: v1.5
milestone_name: System Improvement & Design Augmentation
status: executing
last_updated: "2026-06-15T10:37:14.924Z"
last_activity: 2026-06-15 -- Phase 20 execution started
progress:
  total_phases: 9
  completed_phases: 3
  total_plans: 13
  completed_plans: 11
  percent: 33
---

# Project State — Romma

## Project Reference

See: .planning/PROJECT.md (updated 2026-06-03)

**Core value:** Proprietário gerencia edifícios, contratos e pagamentos em um único painel — Locatário acessa seu contrato e histórico via portal próprio — visitantes veem unidades disponíveis em tempo real.
**Current focus:** Phase 20 — edif-cios-cards-drill-in

---

## Deferred Items

Items acknowledged and deferred at milestone close on 2026-06-03:

| Category | Item | Status |
|----------|------|--------|
| uat_gaps | Phase 04: 04-HUMAN-UAT.md — 3 cenários de UI pendentes (polimento visual /unidades) | partial |
| uat_gaps | Phase 05: 05-HUMAN-UAT.md — 4 cenários de UI pendentes (testes E2E manuais) | partial |
| verification_gaps | Phase 01: 01-VERIFICATION.md — validações visuais do dashboard precisam de revisão humana | human_needed |
| verification_gaps | Phase 02: 02-VERIFICATION.md — gaps identificados no portal (já corrigidos nas fases 6-7) | gaps_found |
| verification_gaps | Phase 04: 04-VERIFICATION.md — validações visuais de /unidades precisam de revisão humana | human_needed |
| verification_gaps | Phase 05: 05-VERIFICATION.md — validações de E2E precisam de revisão humana pós-deploy | human_needed |
| feature_gap | Phase 10 SC2 (AUTH-02): segundo signup NÃO exibe "Instância já configurada" no formulário — guard é só DB-side (no /auth/confirm). Descoberto na Phase 15. Fix (guard JS em cadastrarProprietario) deferido pós-banca | deferred |

---

## Phases

| # | Phase | Milestone | Status |
|---|-------|-----------|--------|
| 1 | Dashboard Completions | v1.0 | ✅ Complete |
| 2 | Portal do Locatário | v1.0 | ✅ Complete |
| 3 | Refatoração e Qualidade | v1.0 | ✅ Complete |
| 4 | Polimento Visual Público | v1.0 | ✅ Complete |
| 5 | Testes E2E | v1.0 | ✅ Complete |
| 6 | Deploy Final e Demo | v1.0 | ✅ Complete |
| 7 | Ajustes Finais Pré-Banca | v1.0 | ✅ Complete |
| 8 | Bug Fixes | v1.1 | ✅ Complete — PR #27 |
| 9 | Páginas Públicas | v1.1 | ✅ Complete — PR #28 |
| 10 | Signup Proprietário | v1.1 | ✅ Complete |
| 11 | Multi-Tenant Proprietários | v1.1 | ✅ Complete |
| 12 | Escala Desktop + Tema | v1.1 | ✅ Complete — commit 82460a5 |
| 13 | Mobile Responsivo | v1.1 | ✅ Complete |
| 14 | Animações & Feedback | v1.1 | ✅ Complete — PR #33 merged |
| 15 | Testes | v1.1 | ✅ Complete — PR #34 merged |
| 16 | Fechamento IDOR MT-02 | v1.1 | ✅ Complete |
| 17 | Fundação — Tokens, Mobile/Modal Fixes & Infra | v1.5 | ⬜ Not started |
| 18 | Acesso — Login / Cadastro / Redefinir | v1.5 | ⬜ Not started |
| 19 | Unidades — Modal Unificado & Foto de Capa | v1.5 | ⬜ Not started |
| 20 | Edifícios — Cards & Drill-in | v1.5 | ⬜ Not started |
| 21 | Dashboard — Visão Geral Editorial | v1.5 | ⬜ Not started |
| 22 | Contratos & Parcelas — Renovação | v1.5 | ⬜ Not started |
| 23 | Locatários — Busca & Máscaras | v1.5 | ⬜ Not started |
| 24 | Público — Unidades Disponíveis | v1.5 | ⬜ Not started |
| 25 | Portal do Locatário — PIX & Recibo | v1.5 | ⬜ Not started |

---

## Quick Tasks Completed

| # | Description | Date | Commit | Directory |
|---|-------------|------|--------|-----------|
| 260603-o6t | corrija os bugs dos testes agora | 2026-06-03 | 170e6e1 | [260603-o6t-corrija-os-bugs-dos-testes-agora](./quick/260603-o6t-corrija-os-bugs-dos-testes-agora/) |

---

## Activity Log

- 2026-05-21: Project initialized. 21 v1 requirements defined. Roadmap created. 6 phases mapped.
- 2026-05-21: Phase 1 planned. 8 planos em 5 waves. Research + Pattern Mapping + Verification completos.
- 2026-06-03: Milestone v1.0 shipped. 7 fases, 29 planos. Deployed em romma-alpha.vercel.app. Banca em 15 dias.
- 2026-06-03: Completed quick task 260603-o6t: corrija os bugs dos testes agora
- 2026-06-05: Extracted learnings from quick task 260603-o6t
- 2026-06-05: Milestone v1.1 roadmap created. 7 phases (8-14), 25 requirements. Banca em 13 dias.
- 2026-06-06: Phase 08 complete. 4 bugs eliminados (BUG-01/02/03/04). PR #27 aberto.
- 2026-06-06: Phase 09 complete. UAT 6/6 passed. LP-01/02/03 + PUB-01/02/03 verificados ao vivo. PR #28 aberto.
- 2026-06-12: Phase 12 complete. 6 planos, escala desktop UX-01 pass, tema Obsidian hardcoded, ThemeToggle removido. Commit 82460a5.
- 2026-06-12: Phase 13 plan 04 complete. Portal do Locatario responsivo em 375px: PortalDashboard padding/tipografia responsivos, ParcelsTable overflow-x-auto, ContratoCard grid-cols-1 sm:grid-cols-2. Commit 1373979.
- 2026-06-12: Phase 13 complete. UX-02/03/04 verificados. 7/7 E2E passed. DashboardShell implementado, 4 abas sem overflow, portal responsivo.
- 2026-06-12: Phase 14 plan 01 complete. Contratos.js: removingIds exit animation, sonner toasts (criado/encerrado/cancelado), optimistic filter, ativo-only main listing. Commits 225ec08+0fd3a12.
- 2026-06-12: Phase 14 plan 02 complete. Unidades.js: exit animation (opacity+scale 200ms) + toast "Unidade removida" + re-fetch-after-timeout; Parcelas.js: toast "Parcela marcada como paga" (no animation). Commits 461a1ff+58b8d4d.
- 2026-06-12: Phase 15 plan 05 complete. E2E audit+gap-fill (TEST-02 D-09): AUTH-02 second-signup guard test added to signup.spec.js; complete mobile 375px interactive journey added to mobile-responsive.spec.js. D-10 split: crud.spec.js → 4 domain files (14/14 tests), toast-feedback.spec.js → 4 domain files (5/5 tests). 74 tests discoverable via --list; live run pending CI. Commits 71dfb5b+cf78b5f+ad681e5.
- 2026-06-12: Phase 15 plan 02 complete. IDOR fix (T-15-01): authGuard() returns { user } in unidades.js + contratos.js; editarUnidade/deletarUnidade add edificio_id ownership pre-check; cancelarContrato/encerrarContrato add 3-hop chain (unidade_id → edificio_id → proprietario_id). Commits db637de+b72e904.
- 2026-06-12: Phase 15 plan 03 complete. Unit tests for auth.js (cadastrarProprietario, 3 cases D-06/D-07) and locatarios.js (revogarConvite, 4 cases D-06/D-07/D-08). D-08 asserts .eq('proprietario_id', user.id) regression guard. 7 tests, exit 0. Commits 5aa8283+e3ee878.
- 2026-06-12: Phase 16 plan 02 complete. MT-03 IDOR closed: authGuard in parcelas.js returns { user }; marcarParcelaComoPaga adds 4-hop ownership pre-check (parcela→contrato→unidade→edificio→proprietario_id); cross-tenant → 404 before update. ESLint clean. Commit 3df8a4c.
- 2026-06-13: Milestone v1.5 roadmap criado. 9 fases (17-25), 42 requirements mapeados 100% (sem órfãos). Ordem dependency-aware: tokens+infra primeiro (Phase 17), depois passes por área de tela. Novos write paths (foto capa, renovar contrato, portal PIX) com cadeia de propriedade.
- 2026-06-13: Phase 17 plan 03 complete. 20260601000000_v15_foundation.sql applied to remote vfymttcajeyhrmsyhrtj: proprietarios.nome/sobrenome/telefone + unidades.foto_url + private bucket unidades-fotos + SECURITY DEFINER ownership-chain RLS. next.config.mjs remotePatterns added. Commits c9cad75+188d194+69465a4.
- 2026-06-14: Phase 18 complete. 4 planos: shared auth components (AuthFrame/AuthAside/CornerBrackets/AuthField/AuthBanner/SubmitButton), auth-form utilities (TDD), /login + /signup redesign, /auth/reset-password redesign + dual sub-flow + role-aware redirect bug-fix + e2e/auth-screens.spec.js (13 tests). ACESSO-01/02/03/04 verified.

## Key Decisions

- Private bucket (public=false) with SECURITY DEFINER ownership-chain RLS enforces IDOR-safe storage access for unidades-fotos (Phase 17 plan 03)
- search key omitted from next.config.mjs remotePatterns to allow signed URL ?token= query params (Phase 17 plan 03)
- Session-based sub-flow detection in reset-password via getSession() on mount — avoids reliance on query params since /auth/confirm already sets recovery session before redirecting (Phase 18 plan 04)
- Role-aware redirect post-password-reset via rpc(is_proprietario) branch — fixes unconditional /portal/dashboard bug in original reset-password, T-18-12 mitigated (Phase 18 plan 04)

## Current Position

Phase: 20 (edif-cios-cards-drill-in) — EXECUTING
Plan: 1 of 2
Status: Executing Phase 20
Last activity: 2026-06-15 -- Phase 20 execution started
Last session: 2026-06-15T10:22:49.014Z

## Operator Next Steps

- Phase 18 complete — verify auth screens UAT (login, signup, reset-password visual + flow)
- Phase 19: Unidades — Modal Unificado & Foto de Capa
