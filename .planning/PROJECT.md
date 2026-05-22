# Romma

## What This Is

Romma é um sistema de gerenciamento de aluguéis corporativos desenvolvido como TCC. Conecta um Proprietário único (dono de edifícios) com Locatários (PF ou PJ) pelo ciclo completo: listagem pública de Unidades disponíveis → Contratos → Parcelas mensais. O sistema precisa estar deployed na Vercel e demonstrável ao vivo na banca em 18/06/2026.

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

### Active

- [ ] Dashboard: valores em R$ (MRR, receita esperada) + alerta contratos vencendo em 7 dias
- [ ] Portal do Locatário: autenticação via convite + visualização do contrato ativo
- [ ] Portal do Locatário: histórico de parcelas (pagas, pendentes, vencidas — sem futuras)
- [ ] Refinamento visual páginas públicas (LP + /unidades): design Obsidian Blueprint, fontes Manrope/Noto Sans, next/image
- [ ] Configurar Supabase Auth Redirect URL para domínio Vercel + testar invite em produção
- [ ] Refinamento visual dashboard: consistência Obsidian Blueprint em todas as telas
- [ ] Refatoração de estado: consolidar useState em Unidades.js, GestaoEdificios.js, Locatarios.js
- [ ] Correções médias/baixas: erroMessage vs errorMessage, supabase-browser em client components, limpeza de código morto
- [ ] Build limpo: lint + build + audit sem erros
- [ ] Dados de demo no Supabase de produção + validação do fluxo ponta a ponta
- [ ] Roteiro de demonstração para banca

### Out of Scope

- Escopo Dream D1 (Usuário do Locatário / funcionários) — pós-TCC
- Escopo Dream D2 (Reservas de salas em Realtime) — pós-TCC
- Escopo Dream D3 (QR Code de acesso) — pós-TCC
- Integração com gateway de pagamento — explicitamente excluído no TCC
- Geração de PDF de contrato — explicitamente excluído no TCC
- Múltiplos Proprietários por instância — excluído no TCC
- Cálculo automático de multas/reajustes — excluído no TCC
- Integração física com catracas/fechaduras — excluído no TCC

## Context

Projeto TCC de Artur Santana. Stack: Next.js 16 App Router (JS), Tailwind v4, shadcn/ui, Supabase (Postgres + Auth + RLS + Edge Functions Deno), Turbopack, Vercel.

**Estado atual (21/05/2026):** Core completo (Fase 1), Fase 2 completa (público + Realtime + dashboard base), segurança crítica resolvida (F3-S0), deploy básico na Vercel funcional. Restam: Portal do Locatário (zero implementação), Dashboard completions, refinamento visual (F3-S2/S3), finalização deploy, demo prep (F3-S4).

**Banca:** 18/06/2026 — 28 dias. Demo ao vivo requer sistema deployed e estável.

**Codebase map:** `.planning/codebase/` (gerado 21/05/2026) — 7 documentos cobrindo stack, integrações, arquitetura, estrutura, convenções, testes e concerns.

**Concerns críticos identificados:**
- Authorization bypass em cancelarContrato/encerrarContrato (unidade_id não validado contra contrato)
- editarLocatario passa form raw sem allowlist de campos
- criarContrato + gerarParcelas não atômicos (sem rollback se Edge Function falhar)

## Constraints

- **Timeline:** Banca em 18/06/2026 — 28 dias para finalizar tudo
- **Deploy:** Vercel obrigatório para banca (romma-alpha.vercel.app)
- **Stack:** Next.js 16 + Supabase — sem migração de stack
- **Escopo:** Core apenas — Dream scope pós-TCC
- **Prioridade:** Portal Locatário mínimo funcional + páginas públicas polidas > refinamento do dashboard

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Modelo híbrido LP (estático + Realtime em /unidades) | Entrega efeito marketplace sem complexidade de aprovação — economiza ~2 semanas | ✓ Good |
| proxy.js em vez de middleware.js | Next.js 16 renomeou o arquivo — breaking change | ✓ Good |
| 5 clientes Supabase separados por contexto | Evita service role key no browser; server-only guard em admin/JWT | ✓ Good |
| Realtime com limitação conhecida (disponivel→alugada) | RLS descarta evento UPDATE — card some só no refresh; INSERT/DELETE/reverse funcionam | ⚠️ Revisit |
| Portal do Locatário — implementação pendente | Depende de auth via convite já existente; scaffold /portal existe | — Pending |

## Evolution

Este documento evolui em transições de fase e marcos.

**Após cada fase:**
1. Requirements invalidados? → Mover para Out of Scope com razão
2. Requirements validados? → Mover para Validated com referência à fase
3. Novos requirements emergiram? → Adicionar em Active
4. Decisões a registrar? → Adicionar em Key Decisions
5. "What This Is" ainda preciso? → Atualizar se derivou

**Após milestone (banca):**
1. Revisão completa de todas as seções
2. Core Value check — ainda a prioridade certa?
3. Auditar Out of Scope — razões ainda válidas?
4. Atualizar Context com estado atual

---
*Last updated: 2026-05-21 after initialization*
