# Phase 11: Multi-tenant Proprietários — Context

**Gathered:** 2026-06-08
**Status:** Ready for planning
**Source:** PRD Express Path (.planning/multi-tenant-scope-change.md)

<domain>
## Phase Boundary

Romma migra do modelo single-tenant (1 Proprietário por instância) para multi-tenant real: cada Proprietário gerencia seus próprios edifícios, unidades, locatários e contratos — isolados via `proprietario_id` em schema + RLS. O signup permanece aberto (guard de instância única foi removido na Phase 10).

Esta fase não muda UI — a filtragem acontece automaticamente via RLS correto. A fase entrega infraestrutura de dados, não features visíveis.

</domain>

<decisions>
## Implementation Decisions

### D-01: Schema — edificios
- Adicionar coluna `proprietario_id UUID REFERENCES auth.users(id) NOT NULL` na tabela `edificios`
- Migration deve ser compatível com dados existentes (setar `proprietario_id` de rows existentes antes do NOT NULL constraint)

### D-02: Schema — locatarios
- Adicionar coluna `proprietario_id UUID REFERENCES auth.users(id) NOT NULL` na tabela `locatarios`
- Mesma estratégia de migration segura (data-first, constraint-after)

### D-03: Dados existentes (migration de seed)
- Identificar o `usuario_id` do Proprietário existente em `proprietarios`
- Usar esse ID como `proprietario_id` em todas as rows atuais de `edificios` e `locatarios`
- Migration deve ser atômica e reversível (rollback viável)

### D-04: RLS — edificios
- Substituir política atual por: `auth.uid() = proprietario_id`
- Aplicar para SELECT, INSERT, UPDATE, DELETE

### D-05: RLS — unidades
- SELECT via JOIN: `exists(select 1 from edificios e where e.id = edificio_id and e.proprietario_id = auth.uid())`
- INSERT/UPDATE/DELETE: mesma condição via JOIN

### D-06: RLS — locatarios
- Substituir política atual por: `auth.uid() = proprietario_id`
- Aplicar para SELECT, INSERT, UPDATE, DELETE

### D-07: RLS — contratos
- SELECT/INSERT/UPDATE/DELETE via JOIN: `unidade_id → unidades → edificios` onde `proprietario_id = auth.uid()`

### D-08: RLS — parcelas
- SELECT/INSERT/UPDATE/DELETE via JOIN: `contrato_id → contratos → unidades → edificios` onde `proprietario_id = auth.uid()`

### D-09: Server Action — criarEdificio
- Incluir `proprietario_id: userId` no objeto inserido
- `userId` obtido do `supabaseAdmin` ou da session do usuário autenticado no Server Action

### D-10: Server Action — criarLocatario
- Incluir `proprietario_id: userId` no objeto inserido
- Mesma fonte de `userId` que D-09

### D-11: Função RPC is_proprietario
- Continua verificando se o usuário tem row em `proprietarios` — não muda
- Não precisa de atualização

### D-12: Queries de leitura (getEdificios, etc.)
- Não precisam de mudança explícita — RLS correto filtra automaticamente no Supabase
- Confirmar que nenhuma query usa `.from('edificios')` com bypass de RLS incorreto

### D-13: Dashboard UI
- Sem mudança de UI necessária — com RLS correto, cada Proprietário vê só seus dados automaticamente
- Nenhum componente precisa de prop `proprietario_id` explícita

### Claude's Discretion
- Ordem das migrations (data-primeiro vs constraint-primeiro) — implementador decide baseado no Supabase migration flow
- Estratégia de teste da migration em dev (dados de seed existentes devem ser preservados)
- Se usar `supabase db push` ou migration file numerada para o deploy

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Scope Change
- `.planning/multi-tenant-scope-change.md` — Decisão original, contexto completo, esforço estimado por área

### Schema atual (referência de estado antes da migration)
- `CLAUDE.md` (seção "Schema") — colunas existentes de todas as tabelas

### Server Actions (onde proprietario_id será adicionado)
- `src/actions/edificios.js` — criarEdificio action
- `src/actions/locatarios.js` — criarLocatario action
- `src/actions/contratos.js` — criarContrato action (referência, pode precisar de revisão)

### Queries
- `src/lib/queries-client.js` — queries client-side (getEdificios, etc.)
- `src/lib/queries-server.js` — queries server-side

### Supabase migrations existentes
- `supabase/migrations/` — ver última migration aplicada como referência de padrão

### RLS atual (ponto de partida para substituição)
- Verificar policies atuais via `supabase/migrations/` ou dashboard Supabase

</canonical_refs>

<specifics>
## Specific Ideas

- A migration deve usar o padrão: (1) ADD COLUMN nullable, (2) UPDATE com valor do seed, (3) ALTER COLUMN SET NOT NULL
- RLS de `unidades` via JOIN com `edificios` é o padrão correto — unidades não têm `proprietario_id` direto
- RLS de `parcelas` é a cadeia mais longa: `parcelas → contratos → unidades → edificios`
- Testar com 2 usuários diferentes para confirmar isolamento real (não apenas compilação)

</specifics>

<deferred>
## Deferred Ideas

- Convite de Locatário associado a Proprietário específico (fluxo de invite já implementado, mas `locatarios.proprietario_id` cover isso)
- UI de "trocar Proprietário" ou transferência de edifício — pós-TCC
- Dashboard unificado para ver todos os Proprietários — fora do escopo TCC

</deferred>

---

*Phase: 11-multi-tenant-proprietarios*
*Context gathered: 2026-06-08 via PRD Express Path (.planning/multi-tenant-scope-change.md)*
