# Romma — Roadmap

**Project:** Romma TCC Finalization
**Deadline:** 2026-06-18 (28 days)
**Total phases:** 6
**Total v1 requirements:** 21

---

## Overview

| # | Phase | Goal | Requirements | Mode |
|---|-------|------|--------------|------|
| 1 | Dashboard Completions | 8/8 complete — UAT passed 2026-05-22 | DASH-01, DASH-02, DASH-03, VIS-02 | done |
| 2 | Portal do Locatário | Locatário acessa seu contrato e histórico de parcelas via portal próprio | PORT-01, PORT-02, PORT-03, VIS-03, TEST-03 | mvp |
| 3 | Refatoração e Qualidade | Codebase limpo, sem erros de lint/build, pronto para produção | REF-01, REF-02, REF-03, REF-04, DEPL-03 | mvp |
| 4 | Polimento Visual Público | Página /unidades com design Obsidian Blueprint completo e performático | VIS-01 | mvp |
| 5 | Testes E2E | Suite Playwright cobre todos os fluxos críticos do Proprietário e Realtime | TEST-01, TEST-02, TEST-04 | mvp |
| 6 | Deploy Final e Demo | Sistema estável em produção, fluxo de convite validado, demo pronto | DEPL-01, DEPL-02, DEMO-01 | mvp |

---

## Phase Details

### Phase 1: Dashboard Completions
**Goal:** Proprietário vê valores financeiros reais (MRR e receita esperada) e alerta de contratos vencendo no dashboard
**Mode:** mvp
**Depends on:** Nothing (builds on existing dashboard base)
**Requirements:** DASH-01, DASH-02, DASH-03, VIS-02
**Success Criteria:**
1. Proprietário vê o MRR em R$ no dashboard, calculado como a soma de valor_mensal de todos os contratos ativos
2. Proprietário vê a receita esperada em R$ no dashboard, calculada como a soma de parcelas com status pendente e vencida
3. Dashboard exibe um alerta com a lista de contratos cujo data_fim está dentro de 7 dias
4. Todas as telas do dashboard (Contratos, Parcelas, Unidades, Locatários) usam a paleta Obsidian Blueprint com cards, botões e badges visualmente consistentes
**Plans:** 8/8 plans complete
**UI hint**: yes

Plans:
- [x] 01-01-PLAN.md — Setup: instalar shadcn (button/input/select) + testes E2E DASH-01/02/03 em RED
- [x] 01-02-PLAN.md — Dashboard page.js: corrigir tiles MRR/Receita Esperada + migração completa para Tailwind v4
- [x] 01-03-PLAN.md — Parcelas.js: migração completa para Tailwind v4 + shadcn Button
- [x] 01-04-PLAN.md — LocatariosDesktop.js: migração completa para Tailwind v4 + shadcn
- [x] 01-05-PLAN.md — Contratos.js: migração completa para Tailwind v4 + shadcn (maior arquivo)
- [x] 01-06-PLAN.md — Unidades.js: construção de UI completa do zero com Tailwind v4 + shadcn
- [x] 01-07-PLAN.md — UI shell (RealtimeDot, TopStrip, PageHeader): migração para Tailwind v4
- [x] 01-08-PLAN.md — UI shell (ConfirmDialog, MobileNav, OwnerSidebar): migração para Tailwind v4

### Phase 2: Portal do Locatário
**Goal:** Locatário autenticado via convite acessa seu contrato ativo e histórico de parcelas no portal próprio
**Mode:** mvp
**Depends on:** Phase 1
**Requirements:** PORT-01, PORT-02, PORT-03, VIS-03, TEST-03
**Success Criteria:**
1. Locatário com convite aceito consegue fazer login com email e senha na página /portal/login
2. Locatário logado visualiza os dados do seu contrato ativo (unidade, valor mensal, data início/fim, status)
3. Locatário logado visualiza o histórico de parcelas com status paga, pendente e vencida — parcelas futuras não aparecem
4. Portal exibe design Obsidian Blueprint consistente com o restante do sistema (paleta roxo/dourado, fontes Manrope/Noto Sans)
5. Testes Playwright cobrem login via convite, visualização do contrato ativo e visualização do histórico de parcelas
**Plans:** 3 plans

Plans:
- [ ] 02-01-PLAN.md — Infra de testes E2E (RED): seed expandido, global-teardown, portal.spec.js, auth-redirect fix
- [ ] 02-02-PLAN.md — Slice vertical 1: login routing + proxy guard + portal shell visual (PORT-01)
- [ ] 02-03-PLAN.md — Slice vertical 2: queries portal + ContratoCard + ParcelsTable + wire PortalDashboard (PORT-02/PORT-03)
**UI hint**: yes

### Phase 3: Refatoração e Qualidade
**Goal:** Código sem dívida técnica prioritária, clientes Supabase corretos em cada contexto, e build sem erros
**Mode:** mvp
**Depends on:** Phase 2
**Requirements:** REF-01, REF-02, REF-03, REF-04, DEPL-03
**Success Criteria:**
1. `npm run lint` e `npm run build` passam sem erros ou warnings críticos
2. `npm audit --omit=dev` passa sem vulnerabilidades de alta/crítica severidade
3. Client Components do dashboard usam supabase-browser.js (não supabase.js) em todas as instâncias restantes
4. Todos os Server Actions retornam `erroMessage` (sem typos) e consumidores recebem a mensagem corretamente
5. useState em Unidades.js, GestaoEdificios.js e Locatarios.js consolidados em objetos form
**Plans:** TBD

### Phase 4: Polimento Visual Público
**Goal:** Página /unidades entrega a experiência visual Obsidian Blueprint com performance de imagem adequada
**Mode:** mvp
**Depends on:** Phase 3
**Requirements:** VIS-01
**Success Criteria:**
1. /unidades usa a paleta Romma (roxo #370085, dourado #C5A059) com fontes Manrope/Noto Sans carregadas via next/font
2. Imagens na página /unidades usam next/image (sem tags `<img>` nativas)
3. Layout de cards de unidades reflete o design Obsidian Blueprint visualmente consistente com o portal e dashboard
**Plans:** TBD
**UI hint**: yes

### Phase 5: Testes E2E
**Goal:** Suite Playwright cobre todos os fluxos críticos do Proprietário e o comportamento Realtime
**Mode:** mvp
**Depends on:** Phase 4
**Requirements:** TEST-01, TEST-02, TEST-04
**Success Criteria:**
1. Testes Playwright passam para CRUD completo do Proprietário: criar/editar/deletar Edifícios, Unidades, Locatários (convidar/editar), Contratos (criar/encerrar/cancelar)
2. Testes Playwright cobrem ciclo de Parcelas: geração via Edge Function, marcação como paga e verificação de mudança de status
3. Teste Playwright cobre o fluxo Realtime: unidade visível na listagem pública desaparece após Proprietário criar contrato ativo
**Plans:** TBD

### Phase 6: Deploy Final e Demo
**Goal:** Sistema deployed, estável e demonstrável ao vivo na banca com roteiro de apresentação
**Mode:** mvp
**Depends on:** Phase 5
**Requirements:** DEPL-01, DEPL-02, DEMO-01
**Success Criteria:**
1. Supabase Auth Redirect URL aceita o domínio romma-alpha.vercel.app — email de convite abre corretamente em produção
2. Fluxo completo de convite de Locatário testado e funcional no ambiente de produção Vercel de ponta a ponta
3. Roteiro de demonstração da banca existe com sequência de ações, pontos de destaque e fallback documentado para falha do Realtime
**Plans:** TBD

---

## Requirement Coverage

| Requirement | Phase | Status |
|-------------|-------|--------|
| DASH-01 | Phase 1 | Done |
| DASH-02 | Phase 1 | Done |
| DASH-03 | Phase 1 | Done |
| VIS-02 | Phase 1 | Done |
| PORT-01 | Phase 2 | Pending |
| PORT-02 | Phase 2 | Pending |
| PORT-03 | Phase 2 | Pending |
| VIS-03 | Phase 2 | Pending |
| TEST-03 | Phase 2 | Pending |
| REF-01 | Phase 3 | Pending |
| REF-02 | Phase 3 | Pending |
| REF-03 | Phase 3 | Pending |
| REF-04 | Phase 3 | Pending |
| DEPL-03 | Phase 3 | Pending |
| VIS-01 | Phase 4 | Pending |
| TEST-01 | Phase 5 | Pending |
| TEST-02 | Phase 5 | Pending |
| TEST-04 | Phase 5 | Pending |
| DEPL-01 | Phase 6 | Pending |
| DEPL-02 | Phase 6 | Pending |
| DEMO-01 | Phase 6 | Pending |

**Coverage:** 21/21 v1 requirements mapped ✓
