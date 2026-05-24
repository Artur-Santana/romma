# Phase 2: Portal do Locatário - Context

**Gathered:** 2026-05-22
**Status:** Ready for planning

<domain>
## Phase Boundary

Fase 2 entrega: (1) login compartilhado com roteamento por role pós-auth (Proprietário → /dashboard, Locatário → /portal/dashboard); (2) guard de autenticação em /portal/** no proxy.js com redirecionamento de Proprietário que acesse /portal; (3) portal read-only onde Locatário visualiza contrato ativo (unidade, valor mensal, data início/fim, status) e histórico de parcelas (paga, pendente, vencida — futuras excluídas na query); (4) design Obsidian Blueprint consistente com Tailwind v4 (sem inline styles); (5) testes E2E PORT-01/02/03 com seed+teardown no global-setup/teardown.

</domain>

<decisions>
## Implementation Decisions

### Login Routing
- **D-01:** Modificar `/login/page.js` existente — após `signInWithPassword` com sucesso, chamar `supabase.rpc('is_proprietario')`. Se true → `router.push('/dashboard')`. Se false → `router.push('/portal/dashboard')`.
- **D-02:** Estado `AUTENTICANDO` mantido durante toda a sequência: auth + RPC + redirect. Spinner/label não muda até redirect acontecer.
- **D-03:** Eyebrow label do /login permanece o mesmo para ambos os roles — não há como detectar role pré-auth.

### Auth Guard no proxy.js
- **D-04:** Adicionar `/portal/:path*` ao matcher do `proxy.js`. Guard duplo: proxy.js barra unauthenticated antes de renderizar (consistente com /dashboard); layout.js vira defense-in-depth.
- **D-05:** Se Proprietário autenticado acessar `/portal/**` manualmente → proxy.js checa `is_proprietario()` true → redirect para `/dashboard`.

### Queries do Portal
- **D-06:** Nova função `getContratoAtivoByLocatario(locatarioId)` em `queries-client.js`. Busca contrato com `status='ativo'`, inclui join `unidades(nome, valor_mensal)`. Não toca em `getContratosByLocatario` existente.
- **D-07:** Nova função `getParcelasPortal(contratoId)` em `queries-client.js`. Filtra `status != 'futura'` diretamente no Supabase query (`.neq('status', 'futura')`). Não toca em `getParcelasByContrato` existente.

### Testes E2E
- **D-08:** `seed.mjs` (via `global-setup.js`) cria dados de teste para o locatário: registro em `locatarios` vinculado ao `usuario_id` de `locatario@test.romma.local`, unidade + edifício, contrato ativo, e parcelas (mix de paga/pendente/vencida).
- **D-09:** `global-teardown.js` (novo) apaga os dados de domínio após testes: parcelas, contrato, locatário (tabela `locatarios`), unidade, edifício. Usuários em `auth.users` são preservados (upsert os recria na próxima execução).
- **D-10:** Testes PORT-01/02/03 usam credenciais `LOCATARIO` já declaradas em `e2e/fixtures.js` (`locatario@test.romma.local` / `Test1234!`).

### Styling
- **D-11:** Sem inline styles em nenhum arquivo novo ou modificado — Tailwind v4 exclusivamente (herda D-01 da Fase 1). `portal/layout.js` existente usa inline styles e deve ser migrado.
- **D-12:** `portal/layout.js` layout wrapper migrado para Tailwind (`flex flex-col h-screen`, `flex-1 overflow-auto bg-background`).

### Claude's Discretion
- Estrutura exata do `global-teardown.js` e ordem de deleção (respeitar FK constraints: parcelas antes de contratos, contratos antes de locatários/unidades).
- Escolha entre `maybeSingle()` vs `single()` em `getContratoAtivoByLocatario` (recomendado `maybeSingle()` — locatário pode não ter contrato ativo).
- Ordem das colunas na `ParcelsTable` (numero, data_vencimento, data_pagamento, status — conforme UI-SPEC).

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Escopo e Requisitos
- `.planning/ROADMAP.md` — escopo da Fase 2, success criteria (PORT-01, PORT-02, PORT-03, VIS-03, TEST-03)
- `.planning/REQUIREMENTS.md` — definições formais de PORT-01, PORT-02, PORT-03, VIS-03, TEST-03

### Design Contract
- `.planning/phases/02-portal-do-locat-rio/02-UI-SPEC.md` — contrato visual completo: paleta, tipografia, espaçamento, componentes novos (ContratoCard, ParcelsTable, PortalDashboard), copywriting, estados de dados. OBRIGATÓRIO ler antes de implementar qualquer UI.

### Padrão de Styling
- `src/app/login/page.js` — referência canônica de Tailwind v4 + shadcn neste projeto
- `src/app/globals.css` — tokens CSS vars mapeados para Tailwind v4 via `@theme`

### Arquivos a Modificar
- `src/app/login/page.js` — adicionar RPC check pós-auth (D-01, D-02)
- `src/proxy.js` — adicionar matcher `/portal/:path*` + guard is_proprietario (D-04, D-05)
- `src/app/portal/layout.js` — migrar inline styles para Tailwind (D-12)
- `e2e/seed.mjs` — adicionar seed de dados do locatário de teste (D-08)
- `playwright.config.js` — adicionar `globalTeardown` (D-09)

### Arquivos a Criar
- `src/app/portal/dashboard/page.js` — Server Component thin shell
- `src/components/features/portal/PortalDashboard.js` — Client Component (data fetching + state)
- `src/components/features/portal/ContratoCard.js` — exibe dados do contrato ativo
- `src/components/features/portal/ParcelsTable.js` — tabela de parcelas com StatusBadge
- `src/lib/queries-client.js` — adicionar `getContratoAtivoByLocatario` e `getParcelasPortal`
- `e2e/global-teardown.js` — cleanup de dados de teste
- `e2e/portal.spec.js` — testes PORT-01, PORT-02, PORT-03

### Utilitários e Patterns Existentes
- `src/lib/queries-client.js` — `getLocatarioByUserId(userId)` já existe (busca locatario pelo auth user)
- `src/lib/utils.js` — `fmtBRL()`, `fmtData()` para valores monetários e datas
- `src/components/ui/StatusBadge.js` — reuso em ParcelsTable (paga/pendente/vencida)
- `src/components/ui/TopStrip.js` — já usado em portal/layout.js
- `src/components/ui/PageHeader.js` — reuso no portal dashboard
- `e2e/fixtures.js` — `LOCATARIO` já declarado
- `e2e/helpers.js` — `login()` helper reutilizável

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `getLocatarioByUserId(userId)` em `queries-client.js` — busca locatario pelo `auth.uid()`. Ponto de entrada para o portal: user → locatario → contrato → parcelas.
- `getParcelasByContrato(contratoId)` em `queries-client.js` — base para `getParcelasPortal` (nova função filtra futuras).
- `StatusBadge` em `src/components/ui/StatusBadge.js` — suporta `paga`, `pendente`, `vencida` — usar diretamente em ParcelsTable.
- `fmtBRL()` e `fmtData()` em `src/lib/utils.js` — formatação de valor_mensal e datas do contrato.
- `login()` helper em `e2e/helpers.js` — reutilizável nos testes do portal.

### Established Patterns
- Client Component owna data fetching via `useEffect` → funções de `queries-client.js` (padrão dashboard).
- Null safety: `?? []` em arrays, `?? null` em objetos.
- Form state (não aplicável — portal é read-only).
- Server Component thin shell: `src/app/portal/dashboard/page.js` importa `PortalDashboard` (Client Component) sem passar props de dados — Client Component faz próprio fetch.

### Integration Points
- `proxy.js` matcher expandido para cobrir `/portal/:path*`.
- `portal/layout.js` já existe como Server Component com auth guard — manter lógica, migrar só styling.
- Login page: RPC call inserida após `signInWithPassword`, antes do `router.push`.
- `seed.mjs` + `global-teardown.js` se integram via `playwright.config.js` (`globalSetup` / `globalTeardown`).

</code_context>

<specifics>
## Specific Ideas

- Estado `AUTENTICANDO` do login deve cobrir toda a sequência auth+RPC+redirect — animação não pode parar no meio enquanto RPC resolve.
- Teardown deve respeitar FK constraints do banco: deletar na ordem correta (parcelas → contratos → locatarios → unidades → edifícios se criado pelo seed).
- `getContratoAtivoByLocatario` usa `maybeSingle()` — locatário pode ter zero contratos ativos (empty state na UI).

</specifics>

<deferred>
## Deferred Ideas

- Notificação push/email para Locatário quando parcela vence — pós-TCC (nova capability).
- Logout visível no portal — mencionado implicitamente; implementar em Fase 3 (Refatoração) ou como parte do polimento.

</deferred>

---

*Phase: 02-portal-do-locat-rio*
*Context gathered: 2026-05-22*
