# Romma

## What This Is

Romma é um sistema completo de gerenciamento de aluguéis corporativos desenvolvido como TCC. Conecta um Proprietário único (dono de edifícios) com Locatários (PF ou PJ) pelo ciclo completo: listagem pública de Unidades disponíveis em Realtime → Portal do Locatário com auth via convite → Contratos → Parcelas mensais com rastreamento de status. Sistema deployed em produção (romma-alpha.vercel.app) e demonstrável ao vivo na banca em 18/06/2026.

## Core Value

Proprietário gerencia edifícios, contratos e pagamentos em um único painel — Locatário acessa seu contrato e histórico via portal próprio — visitantes veem unidades disponíveis em tempo real.

## Requirements

### Validated

- ✓ Autenticação do Proprietário (login, sessão persistente, logout, proxy.js protegendo /dashboard) — Fase 1
- ✓ Cadastro e gestão de Edifícios (CRUD completo) — Fase 1
- ✓ Cadastro e gestão de Unidades (CRUD, valor_visivel, status disponivel/alugada) — Fase 1
- ✓ Cadastro e gestão de Locatários via convite por email (PF/PJ, invite, revoke) — Fase 1
- ✓ Criação e gestão de Contratos (vincula Locatário + Unidade, status ativo/encerrado/cancelado) — Fase 1
- ✓ Geração automática de Parcelas via Edge Function gerar-parcelas (Deno, atômica) — Fase 1
- ✓ Marcação de Parcelas como pagas — Fase 1
- ✓ Listagem pública de Unidades disponíveis (/unidades, valor_mensal mascarado quando valor_visivel=false) — Fase 2
- ✓ Realtime na listagem pública (unidades somem quando alugadas) — Fase 2
- ✓ Landing Page estática do produto — Fase 2
- ✓ Dashboard base do Proprietário (contagens: unidades, contratos ativos, parcelas pendentes/vencidas) — Fase 2
- ✓ Segurança crítica: Edge Function com auth real, RLS locatarios restrita a authenticated, proxy.js, mascaramento valor_mensal — F3-S0
- ✓ Deploy na Vercel (romma-alpha.vercel.app) — F3-S1 parcial
- ✓ Dashboard MRR em R$ (soma valor_mensal contratos ativos) — v1.0 Phase 1
- ✓ Dashboard Receita Esperada em R$ (soma parcelas pendentes + vencidas) — v1.0 Phase 1
- ✓ Dashboard alerta contratos vencendo em 7 dias — v1.0 Phase 1
- ✓ Dashboard consistência visual Obsidian Blueprint em todas as telas — v1.0 Phase 1
- ✓ Portal do Locatário: auth via convite email + visualização contrato ativo + histórico de parcelas — v1.0 Phase 2
- ✓ Portal do Locatário: design Obsidian Blueprint consistente — v1.0 Phase 2
- ✓ Testes E2E Portal do Locatário (login, contrato, parcelas) — v1.0 Phase 2
- ✓ IDOR corrigido em cancelar/encerrarContrato — v1.0 Phase 3
- ✓ Mass assignment corrigido em editarLocatario — v1.0 Phase 3
- ✓ erroMessage padronizado, supabase-browser migrado, lint/build limpos — v1.0 Phase 3
- ✓ /unidades redesenhada Obsidian Blueprint (next/image, Manrope/Noto Sans) — v1.0 Phase 4
- ✓ Edição completa de Locatários no dashboard — v1.0 Phase 4
- ✓ Suite E2E Playwright: CRUD Proprietário + ciclo Parcelas + fluxo Realtime — v1.0 Phase 5
- ✓ Deploy produção estável: Supabase Redirect URL, env vars Vercel, APP_URL Edge Function — v1.0 Phase 6
- ✓ Seed de demo idempotente em produção — v1.0 Phase 6
- ✓ DEMO.md + cheat sheet imprimível para banca — v1.0 Phase 6
- ✓ /auth/confirm (Route Handler) para troca de token de convite — v1.0 Phase 7
- ✓ Logout no sidebar do dashboard — v1.0 Phase 7
- ✓ Skeleton loading nas 4 abas do dashboard + portal — v1.0 Phase 7
- ✓ Sidebar limpo (link "Acessar como Locatário" removido) — v1.0 Phase 7
- ✓ Bugs bloqueadores eliminados (revogar acesso, FK edit/delete, status convite, link /unidades) — v1.1 Phase 8
- ✓ Landing page + /unidades com CTAs funcionais e cards informativos — v1.1 Phase 9
- ✓ Signup do Proprietário via tela (/signup, AUTH-01) — v1.1 Phase 10
- ✓ Multi-tenant: RLS por proprietario_id + Server Actions de escrita escopeadas (MT-01, MT-02) — v1.1 Phase 11
- ✓ Dashboard escalável em desktop + sistema de temas data-theme (UX-01, THEME-01/02) — v1.1 Phase 12
- ✓ Área logada responsiva em mobile 375px (UX-02/03/04) — v1.1 Phase 13
- ✓ Animações de saída + toasts de feedback (ANIM-01/02/03) — v1.1 Phase 14
- ✓ Suite de testes: 47 unit (Vitest) + 73 E2E (Playwright) + CI job unit (TEST-01, TEST-02) — v1.1 Phase 15
- ✓ IDOR multi-tenant 100% fechado — todos os vetores de escrita escopeados por proprietario_id (MT-03) — v1.1 Phase 16

### Validated (v1.5)

- ✓ Design system v1.5: escala tipográfica única (8 tokens CSS `--rt-*`) + densidade "regular" (`--rd-*`) + classes `r-*` — v1.5 Phase 17
- ✓ Scroll mobile corrigido em todas as áreas roláveis (`min-height: 0` chain) — v1.5 Phase 17
- ✓ Tela de Acesso split-panel com bracket buttons, show/hide senha, manter sessão, cadastro completo Proprietário — v1.5 Phase 18
- ✓ Unidades: modal unificado criar/editar + upload foto de capa Supabase Storage (privado, signed URLs) — v1.5 Phase 19
- ✓ Edifícios: cards 2-col com stats, barra de ocupação contígua, drill-in para modal unificado — v1.5 Phase 20
- ✓ Dashboard: bloco de ocupação destaque + gráfico fluxo de caixa (barras recebido/previsto) + atalhos rápidos — v1.5 Phase 21
- ✓ Contratos: busca/filtro vencendo, countdown, barra progresso, arquivo de encerrados, renovar contrato (append) — v1.5 Phase 22
- ✓ Locatários: busca, máscaras CPF/CNPJ/telefone, reenviar/revogar/editar, ações expostas no mobile — v1.5 Phase 23
- ✓ Listagem pública: abas por edifício, ordenação, imagem de capa, bottom-sheet, "Falar com Proprietário" — v1.5 Phase 24
- ✓ Portal Locatário: PIX modal (FauxQR), guard IDOR 3-hop test-first, comprovante PDF client-side — v1.5 Phase 25

### Active

*(Nenhum requirement ativo — v1.5 completo. Novo milestone define novos requirements.)*

**Deferido:** AUTH-02 (guard de instância única no form /signup — atualmente só DB-side, aceito p/ single-instance).

### Out of Scope

- Escopo Dream D1 (Usuário do Locatário / funcionários) — pós-TCC
- Escopo Dream D2 (Reservas de salas em Realtime) — pós-TCC
- Escopo Dream D3 (QR Code de acesso) — pós-TCC
- Integração com gateway de pagamento — explicitamente excluído no TCC
- Geração de PDF de contrato — explicitamente excluído no TCC
- Múltiplos Proprietários por instância — excluído no TCC
- Cálculo automático de multas/reajustes — excluído no TCC
- Integração física com catracas/fechaduras — excluído no TCC
- VIS-04: Landing Page Obsidian Blueprint completa — pós-banca (funcional, apenas polish)
- DEMO-02/03: Dados de demo mais ricos e validação documentada ponta a ponta — pós-banca

## Context

Projeto TCC de Artur Santana. Stack: Next.js 16 App Router (JS), Tailwind v4, shadcn/ui, Supabase (Postgres + Auth + RLS + Edge Functions Deno), Turbopack, Vercel.

**Estado atual (2026-06-17 — v1.5 SHIPPED):**
- Sistema completo e deployed em romma-alpha.vercel.app
- v1.0: 7 fases, 29 planos (shipped 2026-06-03)
- v1.1: Phases 8-16 — bug fixes, páginas públicas, signup, multi-tenant, desktop/mobile, animações, testes, IDOR closure (shipped 2026-06-13)
- v1.5: Phases 17-25 — design system v1.5, 9 telas refinadas, Storage, renovação contrato, PIX portal, PDF comprovante (shipped 2026-06-17)
- Total: 25 fases, 56+ planos — 3 milestones completos
- Multi-tenant: RLS + TODAS as Server Actions de escrita escopeadas por proprietario_id (IDOR 100% fechado)
- Testes: 47+ unit (Vitest) + 73 E2E (Playwright) + CI jobs unit/e2e
- Banca amanhã (18/06/2026) — sistema production-ready

**Codebase map:** `.planning/codebase/` (gerado 21/05/2026)

**Known technical debt:**
- criarContrato + gerarParcelas não atômicos (sem rollback se Edge Function falhar)
- Realtime UPDATE (disponivel→alugada) não propaga via RLS — card some no reload
- 8 warnings no-img-element na landing page (/) — não impacta banca

## Constraints

- **Timeline:** Banca em 18/06/2026 — 15 dias
- **Deploy:** Vercel obrigatório para banca ✅ romma-alpha.vercel.app funcionando
- **Stack:** Next.js 16 + Supabase — sem migração de stack
- **Escopo:** Core apenas — Dream scope pós-TCC

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Modelo híbrido LP (estático + Realtime em /unidades) | Entrega efeito marketplace sem complexidade de aprovação — economiza ~2 semanas | ✓ Good |
| proxy.js em vez de middleware.js | Next.js 16 renomeou o arquivo — breaking change | ✓ Good |
| 5 clientes Supabase separados por contexto | Evita service role key no browser; server-only guard em admin/JWT | ✓ Good |
| Realtime com limitação conhecida (disponivel→alugada) | RLS descarta evento UPDATE — card some só no refresh; INSERT/DELETE/reverse funcionam | ⚠️ Revisit |
| /auth/confirm como Route Handler | Next.js 16 App Router pattern — Pages Router não disponível no App Router | ✓ Good |
| seed-prod-demo.mjs idempotente | Permite re-rodar sem poluir DB de produção antes da banca | ✓ Good |
| Design system Obsidian Blueprint (roxo/dourado) | Identidade visual forte para banca; implementado com CSS vars + Tailwind v4 | ✓ Good |
| Skeleton loading via shadcn + loading.js | Next.js App Router Suspense boundary + shadcn Skeleton — padrão sem overhead | ✓ Good |
| getTodayLocal vs toISOString | UTC-3 causava alerta contratos vencendo com 1 dia de atraso — fix necessário | ✓ Good |

## Current Milestone: v1.5 System Improvement & Design Augmentation

**Goal:** Recriar no codebase Next.js o refino completo de UI/UX (escala tipográfica única + sistema de densidade) somado a novas funcionalidades por tela do design handoff, mantendo o design system Obsidian Blueprint, com alta fidelidade aos screenshots hifi (variantes escolhidas, accent gold).

**Fonte:** Design handoff em `.planning/design/` (README + screenshots desktop/mobile + protótipo HTML/React de referência).

**Eixo A — Refino global (todas as telas):**
- Escala tipográfica única (8 tokens: metric/title/section/subhead/body/data/label/meta)
- Sistema de densidade (nível "regular" padrão; reduzir espaço negativo)
- Fix scroll mobile (`min-height:0` em flex containers roláveis) — bug real
- Modais centralizados no mobile (`position:fixed; inset:0`)

**Eixo B — Funcionalidades por tela (variantes escolhidas, accent gold):**
- Acesso (A): split-panel foto, show/hide senha, manter sessão, máscara telefone, bracket buttons; **Cadastro de Proprietário completo** (nome, sobrenome, email, telefone, senha, confirmar)
- Dashboard (B): bloco ocupação destaque + gráfico de fluxo de caixa + atalhos rápidos
- Unidades (B): barra de métricas-resumo, busca + filtros (status + edifício), modal unificado criar/editar, **foto de capa (Supabase Storage)**, confirmação de remover
- Edifícios (B): cards 2 colunas, stats por edifício, barra de ocupação contígua, drill-in clicável → modal de unidade
- Contratos (B): busca, filtro "vencendo" (≤7d), contagem regressiva, barra de progresso, **arquivo de encerrados**
- Parcelas (B): resumo financeiro, registrar pagamento, **renovar contrato (+6/12/24m + valor personalizado de meses)**, timeline vertical
- Locatários (B): busca, máscaras CPF/CNPJ/telefone, reenviar/revogar/editar, ações expostas no mobile
- Público (A): abas por edifício, ordenação, ficha bottom-sheet, simular aluguel (realtime existente)
- Portal (B): próximo vencimento em destaque, modal **PIX + QR estático único**, **comprovante/recibo PDF**, sync da baixa proprietário↔locatário via Supabase

**Backend novo:** Supabase Storage (upload foto capa), Server Action renovar contrato, geração de recibo PDF no browser, sync de baixa de pagamento via Supabase.

**Fora de escopo (cortado a pedido):** geração de QR PIX real (BR Code) — usa QR estático único; **expandir contrato**; processamento real de pagamento; favoritar/viewers na pública; medidor de adimplência por locatário; "falar com o proprietário"; reajuste IGP-M.

## Evolution

**v1.0 shipped 2026-06-03.** Sistema demonstrável ao vivo para banca em 18/06/2026.
**v1.1 shipped 2026-06-13.** Polish & Completeness — gaps de UX, signup, multi-tenant, mobile, testes.
**v1.5 shipped 2026-06-17.** System Improvement & Design Augmentation — design system v1.5, 9 telas refinadas com fidelidade ao design handoff, novas capacidades de escrita.

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd-transition`):
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone** (via `/gsd-complete-milestone`):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-06-17 — v1.5 System Improvement & Design Augmentation milestone complete*
