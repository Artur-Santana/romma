# Romma — Roadmap

**Project:** Romma TCC Finalization + Polish & Completeness
**Status:** v1.1 in progress

---

## Milestones

- ✅ **v1.0 TCC Finalization** — Phases 1-7 (shipped 2026-06-03)
- 🔄 **v1.1 Polish & Completeness** — Phases 8-16 (started 2026-06-05)

---

## Phases

<details>
<summary>✅ v1.0 TCC Finalization (Phases 1-7) — SHIPPED 2026-06-03</summary>

- [x] Phase 1: Dashboard Completions (8/8 planos) — DASH-01, DASH-02, DASH-03, VIS-02
- [x] Phase 2: Portal do Locatário (3/3 planos) — PORT-01, PORT-02, PORT-03, VIS-03, TEST-03
- [x] Phase 3: Refatoração e Qualidade (4/4 planos) — REF-01..04, DEPL-03
- [x] Phase 4: Polimento Visual Público (4/4 planos) — VIS-01
- [x] Phase 5: Testes E2E (4/4 planos) — TEST-01, TEST-02, TEST-04
- [x] Phase 6: Deploy Final e Demo (3/3 planos) — DEPL-01, DEPL-02, DEMO-01
- [x] Phase 7: Ajustes Finais Pré-Banca (3/3 planos) — FIX-01, UX-01, UX-02, UX-03

</details>

### v1.1 Polish & Completeness

- [x] **Phase 8: Bug Fixes** — Bugs bloqueadores eliminados, demo pode rodar sem erros (completed 2026-06-06)
- [x] **Phase 9: Páginas Públicas** — Landing page e /unidades prontas para banca (completed 2026-06-06)
- [x] **Phase 10: Signup Proprietário** — Primeiro acesso ao sistema configurável via tela (completed 2026-06-09)
- [x] **Phase 11: Multi-Tenant Proprietários** — Isolamento multi-tenant implementado: cada Proprietário só vê e muta seus próprios dados (completed 2026-06-09)
- [x] **Phase 12: Escala Desktop + Tema** — Dashboard visualmente adequado em monitores e com paleta alternativa (completed 2026-06-12)
- [x] **Phase 13: Mobile Responsivo** — Área logada navegável e utilizável em celular (completed 2026-06-12)
- [x] **Phase 14: Animações & Feedback** — Ações têm resposta visual clara e não-bloqueante (completed 2026-06-12)
- [x] **Phase 15: Testes** — Suite de testes cobre novos fluxos e Actions críticas (completed 2026-06-12)
- [ ] **Phase 16: Fechamento IDOR MT-02** — Closure: escopar criarUnidade/criarContrato/editarContrato/marcarParcelaComoPaga por proprietario_id (gap achado no milestone audit)

> **Cross-cutting (todos os planos, Phases 8-16):**
> - **AUDIT-01**: cada fase inclui deep-dive isolado das telas trabalhadas antes de fechar
> - **FIX-01**: correções emergentes descobertas durante a fase são registradas e incorporadas

---

## Phase Details

### Phase 8: Bug Fixes
**Goal**: Bugs críticos que bloqueiam o demo ou confundem avaliadores são eliminados antes de qualquer polimento
**Depends on**: Nothing (first v1.1 phase)
**Requirements**: BUG-01, BUG-02, BUG-03, BUG-04
**Success Criteria** (what must be TRUE):
  1. Proprietário clica em "Revogar acesso" de um Locatário e a ação completa sem erro — o Locatário some da lista
  2. Proprietário edita uma unidade sem ver erro de FK constraint; mensagem de erro de delete aparece separada da de edição
  3. Card de Locatário exibe "Convite pendente" ou "Ativo" conforme o estado real do convite
  4. Visitante em /unidades clica no link de voltar e navega para a home (/)
**Plans**: 5 plans
- [x] 08-01-PLAN.md — Wave 0: cenários RED de teste para os 4 bugs (crud/dashboard-smoke/auth-confirm specs)
- [x] 08-02-PLAN.md — BUG-01: revogar acesso com checagem de FK + erro inline na tabela
- [x] 08-03-PLAN.md — BUG-02 + BUG-04: split de erro delete/edit em Unidades + link ← Voltar em /unidades
- [x] 08-04-PLAN.md — BUG-03: UPDATE status_convite='aceito' após aceite de convite em /auth/confirm
- [x] 08-05-PLAN.md — Wave 3: auditoria visual dos 4 fixes (AUDIT-01) + suite E2E completa
**UI hint**: yes

### Phase 9: Páginas Públicas
**Goal**: Landing page e /unidades transmitem credibilidade ao avaliador com CTAs funcionais e cards informativos
**Depends on**: Phase 8
**Requirements**: LP-01, LP-02, LP-03, PUB-01, PUB-02, PUB-03
**Success Criteria** (what must be TRUE):
  1. Visitante na landing page clica em "Ver Unidades" e chega em /unidades
  2. Visitante na landing page clica em "Acessar Dashboard" e chega em /login
  3. Todos os outros botões/links da landing page têm destinos corretos e não retornam 404
  4. Card de unidade em /unidades mostra: nome, edifício, área m², preço ou "Consulte o Proprietário", badge "Disponível"
  5. /unidades com zero unidades disponíveis exibe empty state informativo (não tela em branco)
  6. /unidades em viewport 375px não tem overflow horizontal e todos os tap targets são ≥44px
**Plans**: TBD
**UI hint**: yes

### Phase 10: Signup Proprietário
**Goal**: Primeiro acesso ao sistema pode ser configurado via tela de signup sem intervenção no banco
**Depends on**: Phase 8
**Requirements**: AUTH-01, AUTH-02
**Success Criteria** (what must be TRUE):
  1. Visitante em /signup preenche email + senha e cria conta de Proprietário; é redirecionado ao dashboard autenticado
  2. Segunda tentativa de signup (instância já configurada) exibe mensagem "Instância já configurada" e não cria um segundo Proprietário
**Plans**: TBD
**UI hint**: yes

### Phase 11: Multi-Tenant Proprietários
**Goal**: Isolamento multi-tenant implementado — cada Proprietário só vê e muta seus próprios dados (edificios, locatarios, contratos, parcelas, unidades). Todas as Server Actions de escrita escopeadas por proprietario_id.
**Depends on**: Phase 10
**Requirements**: MT-01, MT-02
**Success Criteria** (what must be TRUE):
  1. RLS policies em todas as tabelas filtram por proprietario_id — Proprietário A não vê dados de Proprietário B
  2. Server Actions criarEdificio e convidarLocatario gravam proprietario_id no insert
  3. Server Actions editarEdificio, deletarEdificio, editarLocatario, deletarLocatario e revogarConvite filtram por .eq('proprietario_id', user.id) — IDOR fechado
  4. Página pública /unidades continua acessível a visitantes anon
**Plans**: 4 plans
- [x] 11-01-PLAN.md — Migration multi-tenant: adicionar proprietario_id + RLS policies por Proprietário
- [x] 11-02-PLAN.md — Server Actions de create escopeadas (criarEdificio, convidarLocatario)
- [x] 11-03-PLAN.md — Verificação E2E isolamento A↔B
- [x] 11-04-PLAN.md — Gap closure: IDOR write-path (edit/delete em edificios + locatarios)
**UI hint**: no

### Phase 12: Escala Desktop + Tema
**Goal**: Dashboard é visualmente legível em monitores comuns e pode exibir uma paleta de cores alternativa
**Depends on**: Phase 11
**Requirements**: UX-01, THEME-01, THEME-02
**Success Criteria** (what must be TRUE):
  1. Em viewport desktop (1280px+), corpo de texto do dashboard tem no mínimo 14px e títulos de seção no mínimo 24px
  2. Elementos do dashboard sem excesso de espaço negativo — cards e tabelas preenchem a área útil adequadamente
  3. Sistema de temas via `[data-theme]` + CSS vars está implementado e uma paleta alternativa ao Obsidian Blueprint está disponível
**Plans**: TBD
**UI hint**: yes

### Phase 13: Mobile Responsivo
**Goal**: Proprietário e Locatário podem usar o sistema em celular sem layout quebrado ou navegação inacessível
**Depends on**: Phase 12
**Requirements**: UX-02, UX-03, UX-04
**Success Criteria** (what must be TRUE):
  1. Dashboard em viewport 375px exibe MobileTopBar + MobileBottomNav no lugar da sidebar — sidebar não vaza ou sobrepõe o conteúdo
  2. As 4 abas do dashboard (Unidades, Contratos, Parcelas, Locatários) são utilizáveis em 375px — sem overflow horizontal, scroll funciona, botões clicáveis
  3. Portal do Locatário em 375px exibe contrato ativo e histórico de parcelas sem overflow horizontal
**Plans**: 4 plans
- [ ] 13-01-PLAN.md — Wave 0: spec E2E RED (UX-02/03/04) em viewport 375px
- [ ] 13-02-PLAN.md — Wave 1: DashboardShell + data-testid + fix double-chrome (UX-02)
- [ ] 13-03-PLAN.md — Wave 2: fix overflow/tap targets nas 4 abas do dashboard (UX-03)
- [ ] 13-04-PLAN.md — Wave 3: fix responsivo do Portal do Locatário (UX-04)
**UI hint**: yes

### Phase 14: Animações & Feedback
**Goal**: Ações principais têm resposta visual imediata — o usuário sabe que a ação ocorreu sem precisar recarregar a página
**Depends on**: Phase 13
**Requirements**: ANIM-01, ANIM-02, ANIM-03
**Success Criteria** (what must be TRUE):
  1. Ao encerrar ou cancelar um contrato, o item sai da lista com animação de fade-out (~200ms) em vez de desaparecer abruptamente
  2. Ao deletar uma unidade ou revogar acesso de Locatário, o item sai da lista com animação de saída visível
  3. Toast Sonner aparece na tela confirmando sucesso após: criar contrato, encerrar/cancelar contrato, revogar acesso, pagar parcela
**Plans**: 4 plans
- [x] 14-00-PLAN.md — Wave 0: install sonner + mount Toaster (root layout) + RED toast-feedback.spec.js (ANIM-03)
- [x] 14-01-PLAN.md — Wave 1: Contratos exit anim (optimistic filter) + 3 toasts + D-07 ativo-only listing (ANIM-01/03)
- [x] 14-02-PLAN.md — Wave 1: Unidades exit anim (wrapper div) + "Unidade removida" toast; Parcelas toast-only (ANIM-02/03)
- [x] 14-03-PLAN.md — Wave 1: LocatariosDesktop + Locatarios exit anim + "Acesso revogado" toast (ANIM-02/03)
**UI hint**: yes

### Phase 15: Testes
**Goal**: Novos fluxos do v1.1 têm cobertura automatizada e Server Actions críticas têm testes unitários
**Depends on**: Phase 14
**Requirements**: TEST-01, TEST-02
**Success Criteria** (what must be TRUE):
  1. Testes unitários existem e passam para: signup (instância única guard), revogar acesso, editar/deletar unidade, encerrar/cancelar contrato
  2. Suite E2E cobre: fluxo de signup, /unidades redesenhado, viewport mobile 375px (pelo menos uma jornada completa), feedback de toast
  3. `npx playwright test` passa sem falhas em CI
**Plans**: 6 plans
- [x] 15-01-PLAN.md — Wave 0: Vitest infra (install + vitest.config.mjs + server-only stub + shared supabaseMock factory + test:unit script)
- [x] 15-02-PLAN.md — Wave 1: [BLOCKING] IDOR fix — authGuard {} → {user} + ownership scoping em unidades.js + contratos.js (prereq D-08)
- [x] 15-03-PLAN.md — Wave 1: unit specs auth.js + locatarios.js (happy+erro+guard, D-08 em revogarConvite)
- [x] 15-04-PLAN.md — Wave 2: unit specs unidades.js + contratos.js (happy+erro+guard + D-08 cross-tenant)
- [x] 15-05-PLAN.md — Wave 0: E2E gap-fill (AUTH-02 + jornada mobile 375px) + split crud/toast por domínio (D-10)
- [x] 15-06-PLAN.md — Wave 1: job unit separado no GitHub Actions e2e.yml (D-03)

### Phase 16: Fechamento IDOR MT-02
**Goal**: TODAS as Server Actions de escrita escopeadas por proprietario_id — fechar os 4 vetores IDOR restantes achados no milestone audit v1.1
**Depends on**: Phase 15
**Requirements**: MT-03
**Success Criteria** (what must be TRUE):
  1. criarUnidade valida que edificio_id pertence ao Proprietário autenticado antes do insert
  2. criarContrato valida ownership da unidade (unidade→edificio→proprietario_id) antes do insert
  3. editarContrato valida ownership do contrato antes do update (pré-check 3-hop como cancelar/encerrar)
  4. marcarParcelaComoPaga: authGuard retorna {user} + valida ownership (parcela→contrato→unidade→edificio→proprietario_id)
  5. Testes unitários cobrem cada Action: happy + erro + cross-tenant block (espelha 15-04)
  6. `npx vitest run` e `npx playwright test --list` passam
**Plans**: 3 plans
- [ ] 16-01-PLAN.md — Owner pre-checks: criarUnidade + criarContrato + editarContrato (mirror 15-02)
- [ ] 16-02-PLAN.md — parcelas.js authGuard {user} + marcarParcelaComoPaga 4-hop ownership
- [ ] 16-03-PLAN.md — Unit tests for all 4 fixed Actions + full vitest/playwright gate (mirror 15-04)

---

## Progress

| Phase | Milestone | Plans Complete | Status | Completed |
|-------|-----------|----------------|--------|-----------|
| 1. Dashboard Completions | v1.0 | 8/8 | Complete | 2026-05-22 |
| 2. Portal do Locatário | v1.0 | 3/3 | Complete | 2026-05-23 |
| 3. Refatoração e Qualidade | v1.0 | 4/4 | Complete | 2026-05-25 |
| 4. Polimento Visual Público | v1.0 | 4/4 | Complete | 2026-05-27 |
| 5. Testes E2E | v1.0 | 4/4 | Complete | 2026-05-29 |
| 6. Deploy Final e Demo | v1.0 | 3/3 | Complete | 2026-06-01 |
| 7. Ajustes Finais Pré-Banca | v1.0 | 3/3 | Complete | 2026-06-03 |
| 8. Bug Fixes | v1.1 | 5/5 | Complete   | 2026-06-06 |
| 9. Páginas Públicas | v1.1 | 4/4 | Complete   | 2026-06-06 |
| 10. Signup Proprietário | v1.1 | 3/0 | Complete    | 2026-06-09 |
| 11. Multi-Tenant Proprietários | v1.1 | 4/4 | Complete    | 2026-06-09 |
| 12. Escala Desktop + Tema | v1.1 | 0/? | Not started | — |
| 13. Mobile Responsivo | v1.1 | 0/? | Not started | — |
| 14. Animações & Feedback | v1.1 | 4/4 | Complete   | 2026-06-12 |
| 15. Testes | v1.1 | 6/6 | Complete   | 2026-06-12 |

**v1.0 Total:** 29/29 planos completos ✅
**v1.1 Total:** Em planejamento

---

*v1.0 phase details: .planning/milestones/v1.0-ROADMAP.md*
