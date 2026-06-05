# Phase 8: Bug Fixes - Context

**Gathered:** 2026-06-05
**Status:** Ready for planning

<domain>
## Phase Boundary

Corrigir 4 bugs cirúrgicos que bloqueiam o demo ou confundem avaliadores: revogar acesso de Locatário (BUG-01), erro de estado compartilhado em Unidades (BUG-02), status de convite incorreto (BUG-03), link de volta em /unidades (BUG-04). Nenhuma tela nova. Todos os componentes UI pré-existentes.

</domain>

<decisions>
## Implementation Decisions

### BUG-01 — Revogar Acesso (LocatariosDesktop.js + src/actions/locatarios.js)
- **D-01:** Escopo: investigar causa raiz antes de corrigir. Pode ser guard disparando incorretamente OU FK violation se locatário tiver contratos vinculados.
- **D-02:** Se locatário pendente tiver contrato vinculado (FK), a action deve retornar erro descritivo claro: "Locatário tem contratos vinculados — encerre-os antes de revogar."
- **D-03:** UX: substituir `alert(erroMessage)` na linha 96 de `LocatariosDesktop.js` por `setErro(erroMessage)` renderizado como erro inline na tabela (conforme UI-SPEC: `font-mono text-[11px] text-danger-fg` abaixo do header da tabela).

### BUG-02 — Estado de Erro Compartilhado (Unidades.js + UnidadeCard.js)
- **D-04:** Criar dois estados separados em `Unidades.js`: `erroDelete` (erros de `handleDeletarUnidade`) e `erroEdit` (erros de `handleSalvarUnidade`).
- **D-05:** `erroEdit` é gerenciado em `Unidades.js` e passado via prop `erro` para `UnidadeCard` (mantém padrão atual de prop).
- **D-06:** `erroDelete` renderizado em `Unidades.js` no nível da lista (acima dos cards), nunca dentro de `UnidadeCard`.
- **D-07:** Limpar ambos os erros no início de cada nova ação (comportamento atual — manter).

### BUG-03 — Status de Convite (src/app/auth/confirm/route.js)
- **D-08:** Causa raiz confirmada: `/auth/confirm/route.js` nunca atualiza `status_convite` de `'pendente'` → `'aceito'` após verificar o OTP de convite.
- **D-09:** Fix: após `supabase.auth.verifyOtp({ type: 'invite', token_hash })` bem-sucedido, usar `supabaseAdmin` para executar `UPDATE locatarios SET status_convite = 'aceito' WHERE usuario_id = <user.id>`.
- **D-10:** BUG-01 e BUG-03 são relacionados: com BUG-03 corrigido, locatários ativos mostrarão `status_convite = 'aceito'` e o botão REVOGAR não aparecerá para eles. O guard da action (`status_convite !== 'pendente'`) está correto.

### BUG-04 — Link de Volta em /unidades (UnidadesPublicas.js)
- **D-11:** Substituir o `<span>` "Unidades Disponíveis" no `flex justify-between` pelo link `← Voltar`.
- **D-12:** Implementar como `<Link href="/">← Voltar</Link>` (Next.js Link), classes: `font-mono text-[11px] text-fg-4 tracking-[1px] uppercase hover:text-fg-2 transition-colors`.
- **D-13:** `RealtimeDot` permanece no lado direito do mesmo flex row.

### Claude's Discretion
- Ordem de fix no BUG-03: se `supabase.auth.getUser()` retornar o user após verifyOtp, usar diretamente; se não, fazer query em locatarios por email.
- Estratégia de limpeza de estado em BUG-02: `setErroDelete(null)` pode ser chamado no início de `handleSalvarUnidade` também para evitar exibição de erro antigo.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Arquivos principais a modificar
- `src/components/features/LocatariosDesktop.js` — BUG-01 UI, BUG-03 badge display
- `src/actions/locatarios.js` — `revogarConvite` (BUG-01 action logic)
- `src/components/features/Unidades.js` — BUG-02 state split
- `src/components/features/UnidadesPublicas.js` — BUG-04 link de volta
- `src/app/auth/confirm/route.js` — BUG-03 causa raiz (update status_convite)

### Queries e schema
- `src/lib/queries-client.js` — `getLocatarios()` (linha 15-17) — já seleciona `status_convite`
- `supabase/migrations/20260520100000_locatarios_status_convite.sql` — migration que adicionou a coluna `status_convite` com DEFAULT 'pendente'

### UI Design Contract
- `.planning/phases/08-bug-fixes/08-UI-SPEC.md` — contratos visuais completos para todos os 4 bugs (posição, classes CSS, copywriting, comportamento de erro)

### Padrões do projeto
- `CLAUDE.md` — convenções de código, terminologia, padrões de Server Actions
- `src/lib/supabaseAdmin.js` — cliente admin para bypass de RLS (necessário no route.js de confirm)

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `StatusBadge.js` — componente de badge já correto para 'pendente_convite' e 'aceito'. **Não modificar** — o bug é na query, não no componente.
- `supabaseAdmin` — importado em `src/actions/locatarios.js`; necessário também em `src/app/auth/confirm/route.js` para update de status_convite com bypass de RLS.

### Established Patterns
- Server Actions retornam `{ status: 200 }` ou `{ status: 500, erroMessage: '...' }` — manter em qualquer ajuste na action revogarConvite.
- Erros inline: `setErro(result.erroMessage)` em componentes cliente — padrão já usado em LocatariosDesktop.js para convite (linha 57).
- `'use server'` em actions, `'use client'` em feature components.

### Integration Points
- `revogarConvite` (action) ↔ `LocatariosDesktop.js` (UI) — linha 92-96.
- `handleSalvarUnidade` ↔ `UnidadeCard.js` via prop `erro` — linha 286.
- `/auth/confirm/route.js` → `supabaseAdmin` para update locatarios.

</code_context>

<specifics>
## Specific Ideas

- UI-SPEC especifica exatamente as classes CSS para cada elemento de erro e o link de volta — executor deve seguir `.planning/phases/08-bug-fixes/08-UI-SPEC.md` sem desviar.
- BUG-03 requer `supabaseAdmin` no route handler (RLS bloqueia update direto com cliente anon).
- BUG-01: verificar se há contratos ativos associados ao `locatario_id` antes de tentar delete — query em `contratos` por `locatario_id`.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 08-bug-fixes*
*Context gathered: 2026-06-05*
