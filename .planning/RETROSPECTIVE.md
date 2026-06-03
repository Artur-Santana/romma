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

## Cross-Milestone Trends

### Process Evolution

| Milestone | Phases | Plans | Key Change |
|-----------|--------|-------|------------|
| v1.0 | 7 | 29 | Primeiro milestone — baseline estabelecido |

### Cumulative Quality

| Milestone | E2E Tests | Requirements | Security Fixes |
|-----------|-----------|--------------|----------------|
| v1.0 | Playwright: CRUD + Parcelas + Realtime | 21/21 + 4/4 gap | IDOR + mass assignment |

### Top Lessons (Verified Across Milestones)

1. Track requirements em tempo real — não deixar para o close
2. Testar fluxo de produção antes de marcar fase de deploy como completa
