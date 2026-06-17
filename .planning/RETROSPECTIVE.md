# Project Retrospective — Romma

*Documento vivo, atualizado após cada milestone. Lições alimentam o planejamento futuro.*

---

## Milestone: v1.0 — TCC Finalization

**Shipped:** 2026-06-03
**Phases:** 7 | **Plans:** 29 | **Timeline:** 78 dias (2026-03-18 → 2026-06-03)

### What Was Built

- Dashboard do Proprietário com valores financeiros reais (MRR, Receita Esperada) + alerta contratos vencendo + migração completa Tailwind v4/shadcn
- Portal do Locatário com auth via convite email, contrato ativo, histórico de parcelas — do zero em 3 planos
- /unidades redesenhada com design Obsidian Blueprint (next/image, Manrope/Noto Sans, cards com detail sheet)
- Suite E2E Playwright cobrindo CRUD Proprietário completo, ciclo de Parcelas e fluxo Realtime
- Deploy estável em produção (romma-alpha.vercel.app) com /auth/confirm, seed de demo, DEMO.md e cheat sheet
- Correções de segurança: IDOR em cancelar/encerrarContrato, mass assignment em editarLocatario

### What Worked

- **Fases curtas e focadas** — 3-4 planos por fase manteve escopo gerenciável; fases maiores (Phase 1 com 8 planos) foram as mais complicadas de rastrear
- **Design system com CSS vars** — Obsidian Blueprint implementado via `--indigo`, `--success`, `--warning`, `--danger` permitiu consistência sem overhead de configuração
- **Slices verticais no Portal** — Plan 02 (auth/routing) + Plan 03 (queries/components/wire) foi eficiente; evitou paralisação por dependências
- **seed idempotente em produção** — seed-prod-demo.mjs com select-before-insert evitou poluição do DB antes da banca

### What Was Inefficient

- **REQUIREMENTS.md nunca atualizado durante execução** — tracking ficou como "Pending" em todos os 21 requisitos mesmo com phases completas; tornou o close mais trabalhoso
- **Bugs de UTC-3 descobertos tarde** — `toISOString()` causava alerta com offset de 1 dia; deveria ter sido testado mais cedo
- **Phase 7 foi corretiva** — /auth/confirm, logout sidebar e skeleton deveriam ter sido identificados e planejados durante Phase 6 ao invés de virarem uma fase de ajustes

### Patterns Established

- **getTodayLocal** para comparações de data no Brasil (evita UTC offset)
- **loading.js como Suspense boundary** para skeleton em Server Components (Next.js App Router)
- **Route Handler `/auth/confirm`** para troca de token de convite Supabase (não middleware)
- **maybeSingle()** para queries que retornam 0 ou 1 registro sem lançar erro
- **neq('status', 'futura')** para filtrar parcelas no portal (mais robusto que listar status visíveis)

### Key Lessons

1. **Track requirements durante execução** — marcar `[x]` no REQUIREMENTS.md quando cada plano completa poupa trabalho no close
2. **Testar em produção antes de finalizar fase de deploy** — convite quebrado em produção só foi descoberto após Phase 6 estar "completa"
3. **Phase de ajustes pré-demo é normal mas deve ser planejada** — incluir um buffer de ~2 planos de "fix/polish" no roadmap antes da data de entrega
4. **Design system primeiro** — ter os CSS vars e tokens definidos antes de começar a migração de componentes economizou retrabalho

### Cost Observations

- Todas as fases executadas com Claude Sonnet 4.6
- 78 dias de desenvolvimento (incluindo projeto base pré-GSD)
- Fases mais longas: Phase 1 (8 planos), Phase 5 (4 planos + seed infra)
- Phase mais rápida: Phase 7 (3 planos diretos, pouca incerteza)

---

## Milestone: v1.5 — System Improvement & Design Augmentation

**Shipped:** 2026-06-17
**Phases:** 9 | **Plans:** 27 | **Timeline:** 5 dias (2026-06-13 → 2026-06-17)
**Commits:** 255 | **Files:** 372 | **LOC net:** +16,843

### What Was Built

- Design system v1.5 completo: 8 tokens tipográficos `--rt-*` + tokens de densidade `--rd-*` + classes `r-*` aplicadas em 9 telas sem regressão
- Tela de Acesso split-panel com bracket buttons, show/hide senha, cadastro Proprietário completo (6 campos, máscaras, validações)
- Unidades: modal unificado criar/editar + upload foto de capa (Supabase Storage privado, signed URLs, MIME/<2MB)
- Edifícios: cards 2-col com stats, barra de ocupação contígua, drill-in reutilizando modal de unidade
- Dashboard: bloco de ocupação destaque + gráfico fluxo de caixa (barras recebido/previsto) + atalhos rápidos
- Contratos: busca/filtro vencendo/countdown/progresso/arquivo + renovar contrato com append de parcelas
- Locatários: busca, máscaras CPF/CNPJ/telefone, reenviar/revogar/editar, ações expostas no mobile
- Listagem pública: abas por edifício, ordenação, imagem de capa, bottom-sheet, "Falar com Proprietário" (pivot correto)
- Portal Locatário: PIX modal com FauxQR determinístico, guard IDOR 3-hop test-first, comprovante PDF client-side (jsPDF)

### What Worked

- **Fases dependency-aware** — "tokens primeiro" (Phase 17 raiz) permitiu que todas as 8 fases seguintes consumissem `var(--rt-*)` sem retrabalho; sequência correta de build
- **Design handoff como referência** — `.planning/design/js/portal.jsx` como arquivo JSX vivo permitiu extrair inline styles exatos (oklch, CSS vars) e portar o FauxQR diretamente
- **TDD no caminho de escrita do Locatário** — RED→GREEN para `confirmarPagamentoLocatario` detectou bugs de guard antes de qualquer UI; segurança não deixada para depois
- **jsPDF import dinâmico** — padrão `await import('jspdf')` no click handler eliminou problemas de SSR sem nenhuma configuração adicional
- **5 dias de execução eficiente** — ritmo de 2-3 fases/dia com GSD workflow (plan→execute→verify→ship) funcionou bem para refinos de UI + novas features
- **Branch de correção pós-execução** — fix/25-portal-design-ref após feedback de screenshot foi a abordagem certa; não reescreveu branches já merged

### What Was Inefficient

- **REQUIREMENTS.md não atualizado durante execução** — repete o mesmo padrão de v1.0; DASH-04/06, LOC-01..06 e PORT-07 ficaram como "Pending" mesmo implementados; corrigido no close mas desperdiça tempo
- **Phase 21 plan 02 sem SUMMARY** — 21-02-PLAN.md foi executado e verificado mas a SUMMARY ficou para trás; VERIFICATION.md salvou o estado mas cria inconsistência no arquivo
- **Design corrections necessárias em Phase 25** — VERIFICATION automatizada não detectou divergência visual com referência portal.jsx; precisou de screenshot + nova branch (fix/25-portal-design-ref)
- **PR #47 duplicado** — execution branch gerou PR aberto que ficou sem fechar (commits já em main via PR #48)

### Patterns Established

- **r-* classes** (`r-metric`, `r-label`, `r-meta`, `r-data`, `r-section`, `r-title`, `r-eyebrow`) — sistema de componentes CSS que reduz inline styles repetidos
- **FauxQR determinístico** — QR 25×25 LCG-seeded do código PIX como alternativa a imagem estática; sem assets externos, visual varia por parcela
- **guard 3-hop Locatário** — `parcela → contrato → locatario → usuario_id` como padrão de escrita segura para o portal; espelha 4-hop do Proprietário; retorna 404 cross-tenant
- **renovarContrato sem Edge Function** — INSERT direto de parcelas via supabaseAdmin é mais simples que re-chamar gerar-parcelas quando as datas são calculadas no SA
- **`animation-fill-mode: none`** nos keyframes — evita `opacity: 0` residual que torna conteúdo invisível em projetor/print

### Key Lessons

1. **Atualizar REQUIREMENTS.md ao fechar cada plano** — 3 milestones seguidos com o mesmo gap; criar hábito de `[x]` imediato após SUMMARY
2. **Screenshots como gate de VERIFICATION para telas** — VERIFICATION automatizada não valida fidelidade visual; adicionar screenshot comparison ou revisão de referência como gate explícito
3. **Fechar PRs supersedidos imediatamente** — PR duplicado (#47) ficou aberto; quando branch de fix cobre tudo, fechar o original no mesmo momento
4. **Design handoff em formato JSX é ideal** — poder copiar inline styles exatos (oklch, CSS vars) e algoritmos (FauxQR LCG) diretamente do arquivo de referência eliminou adivinhação

### Cost Observations

- 5 dias de execução intensiva (2026-06-13 → 2026-06-17)
- 255 commits, média de 51 commits/dia
- Todas as fases executadas com Claude Sonnet 4.6
- Wave-based execution (2-3 waves/fase) funcionou bem para isolamento de dependências

---

## Cross-Milestone Trends

### Process Evolution

| Milestone | Phases | Plans | Days | Key Change |
|-----------|--------|-------|------|------------|
| v1.0 | 7 | 29 | 78 | Primeiro milestone — baseline estabelecido |
| v1.1 | 9 | 25 | 10 | GSD workflow consolidado; multi-tenant + testes |
| v1.5 | 9 | 27 | 5 | Design system primeiro; wave-based execution; 51 commits/dia |

### Cumulative Quality

| Milestone | E2E Tests | Requirements | Security Fixes |
|-----------|-----------|--------------|----------------|
| v1.0 | Playwright: CRUD + Parcelas + Realtime | 21/21 + 4/4 gap | IDOR + mass assignment |
| v1.1 | 47 unit + 73 E2E Playwright | 25/25 + 6/6 gap | MT-03: todos vetores IDOR fechados |
| v1.5 | Mantidos (47 unit + 73 E2E) | 42/42 completos | IDOR 3-hop Locatário (test-first) |

### Top Lessons (Verified Across Milestones)

1. **Track requirements em tempo real** — v1.0, v1.1 e v1.5 tiveram o mesmo gap; criar hábito de `[x]` imediato
2. **Testar fluxo de produção antes de marcar fase de deploy como completa** — convite quebrado em v1.0 descoberto tarde
3. **Design handoff em formato executável (JSX/tokens)** — v1.5 provou que arquivo de referência como código elimina adivinhação
4. **Screenshots como gate de VERIFICATION visual** — automatização não valida fidelidade; fix/25-portal-design-ref mostrou a necessidade
