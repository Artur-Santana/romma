# Romma — Roadmap

**Project:** Romma TCC Finalization + Polish & Completeness + System Improvement
**Status:** v1.5 in progress — System Improvement & Design Augmentation (banca 18/06/2026)

---

## Milestones

- ✅ **v1.0 TCC Finalization** — Phases 1-7 (shipped 2026-06-03)
- ✅ **v1.1 Polish & Completeness** — Phases 8-16 (shipped 2026-06-13)
- 🚧 **v1.5 System Improvement & Design Augmentation** — Phases 17-25 (started 2026-06-13)

---

## Overview (v1.5)

v1.5 recria no codebase Next.js o refino completo de UI/UX do design handoff (escala tipográfica única de 8 tokens + sistema de densidade "regular") somado a novas funcionalidades por tela (variantes escolhidas, accent gold, Obsidian Blueprint mantido). A jornada segue a ordem de build dependency-aware na qual os 4 agentes de research convergiram: **tokens de design primeiro** (raiz de dependência que toda tela consome), seguidos das migrações de schema + Storage bucket, depois passes por área de tela — cada um entregando uma fatia demonstrável. Novos caminhos de escrita (upload de foto de capa, renovar contrato, pagamento no portal) preservam o escopo multi-tenant por `proprietario_id`/cadeia de propriedade, sem regredir o fechamento de IDOR entregue em v1.1.

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
- [x] Phase 10: Signup Proprietário (3/3) — AUTH-01 (AUTH-02 form-guard deferido)
- [x] Phase 11: Multi-Tenant Proprietários (4/4) — MT-01, MT-02
- [x] Phase 12: Escala Desktop + Tema (6/6) — UX-01, THEME-01/02
- [x] Phase 13: Mobile Responsivo (4/4) — UX-02/03/04
- [x] Phase 14: Animações & Feedback (4/4) — ANIM-01/02/03
- [x] Phase 15: Testes (6/6) — TEST-01, TEST-02 (47 unit + 73 E2E)
- [x] Phase 16: Fechamento IDOR MT-02 (3/3) — MT-03 (todos vetores IDOR fechados)

*Detalhes: `.planning/milestones/v1.1-ROADMAP.md` · Audit: `.planning/milestones/v1.1-MILESTONE-AUDIT.md`*

</details>

### 🚧 v1.5 System Improvement & Design Augmentation (Phases 17-25)

**Phase Numbering:** integers continuam de v1.1 (terminou na Phase 16). v1.5 começa na **Phase 17**. Decimais (17.1...) marcam inserções urgentes (INSERTED).

- [x] **Phase 17: Fundação — Tokens, Mobile/Modal Fixes & Infra** - Escala tipográfica + densidade em globals.css, fixes cross-cutting de scroll/modal/animação nas cascas base, migrações de schema, Storage bucket privado, remotePatterns (completed 2026-06-13)
- [x] **Phase 18: Acesso — Login / Cadastro / Redefinir** - Split-panel, show/hide senha, manter sessão, máscara telefone, cadastro completo de Proprietário, redefinir senha (completed 2026-06-14)
- [x] **Phase 19: Unidades — Modal Unificado & Foto de Capa** - Métricas-resumo, busca/filtros, modal único criar/editar, upload de foto via Storage, confirmação de remoção com cleanup (completed 2026-06-14)
- [x] **Phase 20: Edifícios — Cards & Drill-in** - Cards 2 colunas, stats por edifício, barra de ocupação contígua, drill-in clicável reusando o modal de unidade (completed 2026-06-15)
- [ ] **Phase 21: Dashboard — Visão Geral Editorial** - Bloco de ocupação em destaque, gráfico de fluxo de caixa, contratos recentes/parcelas + atalhos rápidos
- [ ] **Phase 22: Contratos & Parcelas — Renovação** - Busca/filtro vencendo, countdown, progresso, arquivo de encerrados, timeline de parcelas, registrar pagamento, renovar contrato (append)
- [ ] **Phase 23: Locatários — Busca & Máscaras** - Busca, convidar/editar com máscaras CPF/CNPJ/telefone, reenviar/revogar, ações expostas no mobile
- [ ] **Phase 24: Público — Unidades Disponíveis** - Abas por edifício, ordenação, cards com imagem de capa, ficha bottom-sheet, simular aluguel (realtime existente)
- [ ] **Phase 25: Portal do Locatário — PIX & Recibo** - Próximo vencimento em destaque, modal PIX + QR estático, confirmação de pagamento (sync proprietário↔locatário), comprovante PDF

---

## Phase Details (v1.5)

### Phase 17: Fundação — Tokens, Mobile/Modal Fixes & Infra

**Goal**: A base de design e infraestrutura está pronta para todas as telas — tokens tipográficos e de densidade existem em globals.css, os fixes cross-cutting de scroll/modal/animação estão nas cascas de layout, e o schema + Storage + next.config suportam as features novas.
**Depends on**: Nothing (raiz de dependência da milestone)
**Requirements**: REFINO-01, REFINO-02, REFINO-03, REFINO-04, REFINO-05
**Success Criteria** (what must be TRUE):

  1. Os 8 tokens tipográficos (`--rt-metric/title/section/subhead/body/data/label/meta`) e os tokens de densidade "regular" (`--rd-*`) existem em globals.css e são consumíveis via `var()` em qualquer tela (mudança aditiva, zero regressão visual nas telas ainda não refatoradas)
  2. As áreas roláveis das cascas (dashboard layout, portal layout, listagem pública) rolam corretamente no mobile 375px sem estourar (cadeia `min-height:0` + altura definida em html/body/root); a barra inferior do mobile permanece visível ao rolar
  3. Modais usam `position:fixed; inset:0` e centralizam na viewport inteira no mobile (utility `romma-modal-backdrop` disponível)
  4. Animações de entrada partem do estado oculto sem deixar `opacity:0` como fill final (visíveis em render pausado/print/projetor), respeitam `prefers-reduced-motion` e têm safeguard `@media print`
  5. A migração `unidades.foto_url TEXT` e os campos `proprietarios.nome/sobrenome/telefone` (condicional) estão aplicados; o bucket Storage `unidades-fotos` existe como **PRIVATE** com RLS por cadeia de propriedade; `next.config.mjs` tem `images.remotePatterns` para `vfymttcajeyhrmsyhrtj.supabase.co`

**Plans**: TBD

### Phase 18: Acesso — Login / Cadastro / Redefinir

**Goal**: O Proprietário acessa e se cadastra através de telas de Acesso polidas (variante A), com cadastro completo (nome, sobrenome, telefone com máscara, confirmar senha) e fluxo de redefinição de senha.
**Depends on**: Phase 17 (tokens + schema proprietarios)
**Requirements**: ACESSO-01, ACESSO-02, ACESSO-03, ACESSO-04
**Success Criteria** (what must be TRUE):

  1. A tela de acesso usa layout split-panel (foto dessaturada + cantoneiras douradas à esquerda, formulário à direita) e faz stack para só-formulário no mobile
  2. O login tem senha com alternância exibir/ocultar, checkbox "manter sessão", link "esqueci minha senha" e botão bracket que transiciona `[>] ACESSAR SISTEMA → [···] AUTENTICANDO → [OK] 200`
  3. O Proprietário se cadastra preenchendo nome, sobrenome, e-mail, telefone (máscara), senha e confirmar senha; validações bloqueiam envio inválido (obrigatórios, e-mail, telefone ≥10 dígitos, senha ≥6, senhas coincidem) e o sucesso mostra banner "Verifique seu e-mail"; `sobrenome` e `telefone` persistem em `proprietarios`
  4. A tela de Redefinir senha envia link por e-mail e mostra confirmação de sucesso

**Plans**: 4 plans

  - [x] 18-01-PLAN.md — Componentes compartilhados de Acesso + extensão de metadata (signUp/confirm)
  - [x] 18-02-PLAN.md — TDD: utilitários puros de formulário (máscara telefone, política de senha, gate de validação) + testes unitários
  - [x] 18-03-PLAN.md — Redesign Login + extensão/redesign Cadastro (6 campos)
  - [x] 18-04-PLAN.md — Redesign Redefinir senha (duplo sub-fluxo) + specs E2E

**UI hint**: yes

### Phase 19: Unidades — Modal Unificado & Foto de Capa

**Goal**: O Proprietário gerencia Unidades em uma grade de cards com métricas-resumo, busca e filtros, criando/editando por um único modal unificado que inclui upload de foto de capa persistida no Storage.
**Depends on**: Phase 17 (tokens, schema foto_url, Storage bucket, remotePatterns)
**Requirements**: UNID-01, UNID-02, UNID-03, UNID-04, UNID-05
**Success Criteria** (what must be TRUE):

  1. A tela exibe barra de métricas-resumo (área total m², MRR realizado, potencial em aberto em dourado, contagem de valores ocultos)
  2. O Proprietário busca por nome e filtra por status (todos/disponível/alugada) e por edifício, com resultados atualizando ao vivo
  3. O Proprietário cria e edita unidade pelo mesmo modal unificado (edifício, nome, área, valor mensal, status, descrição, checkbox "exibir valor publicamente")
  4. O Proprietário adiciona foto de capa (arrastar/clicar → preview, "usar foto de exemplo", trocar/remover); o upload persiste no bucket privado via supabase-browser e a URL é salva em `unidades.foto_url` (Server Action grava só a string; cadeia de propriedade por `edificio.proprietario_id` mantida; validação de MIME image/* e tamanho <2MB)
  5. Remover unidade exige modal de confirmação e a foto órfã é removida do Storage antes do delete no banco (DB delete não bloqueia por falha de cleanup)

**Plans**: 4 plans

  - [x] 19-01-PLAN.md — Server-action + query layer: criarUnidade retorna id, editar/deletar foto_url, cleanup best-effort, getUnidades SELECT
  - [x] 19-02-PLAN.md — Wave-0 E2E scaffold (modal flow, métricas/busca/ConfirmDialog) + asset /public/images/unidade-exemplo.jpg
  - [x] 19-03-PLAN.md — UnifiedUnidadeModal + CoverPhotoField: campos, upload 3-step, signed-URL preview, validação MIME/<2MB
  - [x] 19-04-PLAN.md — Refactor Unidades.js (métricas + filtros + modal + ConfirmDialog) + UnidadeCard Variant-B signed-URL

**UI hint**: yes

### Phase 20: Edifícios — Cards & Drill-in

**Goal**: O Proprietário vê Edifícios em cards de 2 colunas com stats e barra de ocupação contígua, e faz drill-in nas unidades de cada edifício — abrindo o modal unificado de unidade da Phase 19.
**Depends on**: Phase 19 (UnifiedUnidadeModal deve existir para reuso no drill-in)
**Requirements**: EDIF-01, EDIF-02, EDIF-03
**Success Criteria** (what must be TRUE):

  1. Edifícios aparecem em cards de 2 colunas com stats por edifício (ocupação %, MRR, área total, nº de unidades)
  2. Cada edifício mostra barra de ocupação contígua (alugadas renderizadas primeiro, depois disponíveis, sem buracos) com legenda "X alugada(s) · Y disponível(is)"
  3. O botão "Ver N unidade(s)" expande a lista de unidades; cada unidade é clicável e abre o modal unificado de edição (mesmo componente, com edifício travado)

**Plans**: 2 plans
Plans:
**Wave 1**

- [x] 20-01-PLAN.md — Estender UnifiedUnidadeModal com lockEdificio + scaffold E2E (EDIF-03)

**Wave 2** *(blocked on Wave 1 completion)*

- [x] 20-02-PLAN.md — GestaoEdificios cards 2-col, stats, barra de ocupação, accordion drill-in (EDIF-01/02/03)

**UI hint**: yes

### Phase 21: Dashboard — Visão Geral Editorial

**Goal**: O Proprietário tem uma Visão Geral editorial (variante B) com bloco de ocupação em destaque, gráfico de fluxo de caixa e atalhos rápidos que navegam para as seções.
**Depends on**: Phase 17 (tokens; sem backend novo — queries já existem)
**Requirements**: DASH-04, DASH-05, DASH-06
**Success Criteria** (what must be TRUE):

  1. O Dashboard exibe bloco de ocupação em destaque (numeral grande de % + barra dividida por unidade) e métricas empilhadas (ocupação, MRR, receita esperada, contratos vencendo em 7 dias)
  2. O Dashboard exibe gráfico de fluxo de caixa (barras recebido sólido vs. previsto fantasma, pico em dourado) alimentado por agregação mensal de parcelas
  3. O Dashboard tem tabela de contratos recentes, painel de parcelas e atalhos rápidos que navegam para as seções correspondentes

**Plans**: 3 plans
Plans:
**Wave 1**

- [x] 21-01-PLAN.md — Foundation: getParcelasFluxo() query + src/lib/fluxo.js aggregation (+ unit test) + rGrowY keyframe/motion guards + Wave-0 E2E scaffold (DASH-05)

**Wave 2** *(blocked on Wave 1)*

- [ ] 21-02-PLAN.md — Desktop reorganization: inline OccupancyBar/CashFlowChart, Promise.all extension, Variant B hero grid replacing 4-col metrics (DASH-04/05/06)

**Wave 3** *(blocked on Wave 2 — same file)*

- [ ] 21-03-PLAN.md — Mobile parity: compact OccupancyBar + compact CashFlowChart blocks (DASH-04/05)

**UI hint**: yes

### Phase 22: Contratos & Parcelas — Renovação

**Goal**: O Proprietário gerencia Contratos (board de cards com busca, filtro vencendo, countdown, progresso, arquivo de encerrados) e o detalhe de Parcelas (timeline, resumo financeiro, registrar pagamento) e renova contratos estendendo prazo + cronograma sem sobrescrever parcelas pagas.
**Depends on**: Phase 17 (tokens). Renovar contrato é caminho de escrita novo.
**Requirements**: CONTR-01, CONTR-02, CONTR-03, CONTR-04, CONTR-05, PARC-01, PARC-02, PARC-03, PARC-04
**Success Criteria** (what must be TRUE):

  1. O Proprietário busca contratos por locatário/unidade e filtra por "vencendo" (≤7 dias); cada contrato mostra countdown de dias restantes (card e tabela) e barra de progresso decorrida início→término
  2. Cancelar contrato exige confirmação e muda status para "encerrado" preservando histórico; uma seção alternável de "arquivo de encerrados" lista os arquivados com contagem; novo contrato mostra o valor da unidade selecionada
  3. O detalhe do contrato exibe grade-resumo + resumo financeiro (total do contrato, recebido, em aberto, inadimplência em vermelho se houver vencidas) e parcelas em timeline vertical com barra de progresso (pagas/total)
  4. Registrar pagamento em parcela pendente/vencida marca como paga (data=hoje), atualiza os números do resumo financeiro ao vivo e mostra toast
  5. Renovar contrato via modal (+6/+12/+24 meses + campo personalizado) estende `data_fim` e faz **append** de novas parcelas futuras via Server Action (datas parseadas com `T12:00:00`, cadeia de propriedade verificada, parcelas já pagas preservadas — sem re-chamar a Edge Function gerar-parcelas)

**Plans**: TBD
**UI hint**: yes

### Phase 23: Locatários — Busca & Máscaras

**Goal**: O Proprietário gerencia Locatários em grade de cards com busca, máscaras de documento/telefone que armazenam só dígitos, e ações de reenviar/revogar/editar expostas inclusive no mobile.
**Depends on**: Phase 17 (tokens)
**Requirements**: LOC-01, LOC-02, LOC-03, LOC-04, LOC-05, LOC-06
**Success Criteria** (what must be TRUE):

  1. O Proprietário busca locatário por nome, e-mail ou documento
  2. Convidar locatário via modal com tipo PF/PJ (segmented), documento com máscara CPF/CNPJ que re-formata ao trocar o tipo (strip → re-mask, sem digit-jumble) e telefone com máscara; valor armazenado só com dígitos
  3. Editar locatário via modal (nome, e-mail, telefone com máscara) funciona e persiste
  4. Reenviar convite para pendentes dá feedback "✓ Reenviado"; revogar acesso exige modal de confirmação
  5. No mobile, cards/linhas de locatário expõem as ações (Reenviar / Revogar / Editar)

**Plans**: TBD
**UI hint**: yes

### Phase 24: Público — Unidades Disponíveis

**Goal**: Visitantes navegam as Unidades disponíveis (variante A) com abas por edifício, ordenação, cards com imagem de capa, ficha bottom-sheet e simular aluguel — refletindo a saída em tempo real via realtime existente.
**Depends on**: Phase 17 (foto_url no DB + remotePatterns) e Phase 19 (fotos de capa sendo gravadas)
**Requirements**: PUB-01, PUB-02, PUB-03, PUB-04, PUB-05
**Success Criteria** (what must be TRUE):

  1. A listagem pública tem abas por edifício (com contadores) + aba "Todos" e permite ordenação (relevância / menor valor / maior valor / maior área)
  2. Os cards exibem imagem de capa (`foto_url`), área, valor (ou "Consulte o proprietário" quando oculto) e status "Disponível"
  3. A ficha da unidade abre em bottom sheet com imagem, descrição, área, valor mensal, valor/m² e refs
  4. "Simular aluguel" remove a unidade da lista com animação, representando a saída de "disponível" via Supabase realtime existente

**Plans**: TBD
**UI hint**: yes

### Phase 25: Portal do Locatário — PIX & Recibo

**Goal**: O Locatário vê seu próximo vencimento em destaque, paga via modal PIX (QR estático), e essa baixa reflete como "Paga" no painel do Proprietário; parcelas pagas têm comprovante PDF.
**Depends on**: Phase 17 (tokens). Primeiro caminho de escrita do Locatário — guard de IDOR fresco, test-first.
**Requirements**: PORT-04, PORT-05, PORT-06, PORT-07
**Success Criteria** (what must be TRUE):

  1. O portal exibe próximo vencimento em destaque (valor, parcela X/N, dias restantes) + progresso do contrato (pagas/total, % adimplente) + grade-resumo + histórico de parcelas
  2. "Pagar Agora" abre modal PIX com QR estático único, código copia-e-cola (botão copiar) e nota explícita de que o pagamento real não é processado; ao confirmar, a parcela é marcada como paga
  3. A baixa confirmada no portal reflete como "Paga" no painel do Proprietário (Visão Geral e detalhe do contrato) via persistência na mesma tabela `parcelas`, com guard de propriedade fresco (parcela → contrato → locatário → usuário autenticado) escrito test-first; tentativa cross-tenant retorna 404
  4. Parcelas pagas têm "Baixar comprovante" que gera recibo PDF no browser (valor, parcela, locatário, unidade, datas, forma PIX, código de autenticação) via import dinâmico, funcionando em produção sem crash SSR

**Plans**: TBD
**UI hint**: yes

---

## Progress (v1.5)

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 17. Fundação — Tokens, Mobile/Modal Fixes & Infra | 3/3 | Complete   | 2026-06-13 |
| 18. Acesso — Login / Cadastro / Redefinir | 4/4 | Complete    | 2026-06-14 |
| 19. Unidades — Modal Unificado & Foto de Capa | 4/4 | Complete   | 2026-06-15 |
| 20. Edifícios — Cards & Drill-in | 2/2 | Complete    | 2026-06-15 |
| 21. Dashboard — Visão Geral Editorial | 1/3 | In Progress|  |
| 22. Contratos & Parcelas — Renovação | 0/TBD | Not started | - |
| 23. Locatários — Busca & Máscaras | 0/TBD | Not started | - |
| 24. Público — Unidades Disponíveis | 0/TBD | Not started | - |
| 25. Portal do Locatário — PIX & Recibo | 0/TBD | Not started | - |

---

## Deferred (pós-banca / pós-v1.5)

- **AUTH-02**: guard de instância única no formulário `/signup` (atualmente só DB-side). Aceito para premissa single-instance do TCC.
- **REFINO-F1**: variantes de densidade compact/comfy alternáveis (v1.5 usa só "regular").
- **PORT-F1**: processamento real de pagamento PIX (gateway).
- **PIX-F1**: geração de QR Code PIX real (BR Code) — v1.5 usa QR estático único.
- THEME-02: paletas alternativas existem em CSS mas sem toggle de UI.

---

*v1.0 archive: `.planning/milestones/v1.0-ROADMAP.md`*
*v1.1 archive: `.planning/milestones/v1.1-ROADMAP.md`*
