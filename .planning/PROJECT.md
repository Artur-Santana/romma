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

### Active

*(Sem requirements ativos — v1.0 shipped. Próximo milestone após banca.)*

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

**Estado atual (2026-06-03 — v1.0 shipped):**
- Sistema completo e deployed em romma-alpha.vercel.app
- 7 fases, 29 planos executados
- ~5,643 LOC JS, 258 arquivos modificados
- Suite E2E Playwright: CRUD Proprietário + Parcelas + Realtime
- Banca em 15 dias (18/06/2026)
- DEMO.md + cheat sheet imprimível prontos

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

## Evolution

**v1.0 shipped 2026-06-03.** Sistema demonstrável ao vivo para banca em 18/06/2026.

Próximos passos pós-banca:
1. Requirements deferred (VIS-04, DEMO-02, DEMO-03)
2. Tech debt: atomicidade criarContrato+gerarParcelas
3. Dream scope (D1, D2, D3) se projeto continuar

---
*Last updated: 2026-06-03 after v1.0 milestone*
