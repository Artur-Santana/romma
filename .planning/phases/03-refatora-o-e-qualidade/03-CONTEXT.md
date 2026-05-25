# Phase 3: Refatoração e Qualidade - Context

**Gathered:** 2026-05-24
**Status:** Ready for planning

<domain>
## Phase Boundary

Fase 3 entrega: (1) correção dos 2 erros lint `set-state-in-effect` em GestaoEdificios.js e Unidades.js; (2) dois fixes de segurança HIGH — auth bypass em cancelarContrato/encerrarContrato e allowlist em editarLocatario; (3) logout visível no portal do Locatário; (4) build + lint passam sem erros (warnings `no-img-element` da landing page são não-críticos e deferidos para Fase 4 VIS-01); (5) auditoria confirma REF-01/02/03/04 — o que não estiver feito, corrigir.

**Fora de escopo nesta fase:** redesenho visual de qualquer página, novos flows de negócio, testes E2E.

</domain>

<decisions>
## Implementation Decisions

### Lint e Build (DEPL-03)
- **D-01:** Os 2 erros `react-hooks/set-state-in-effect` em GestaoEdificios.js (linha 27-29) e Unidades.js (linha 85-87) DEVEM ser corrigidos — são `errors`, não warnings.
- **D-02:** Os 8 warnings `@next/next/no-img-element` em `src/app/page.js` são deferidos para Fase 4 (VIS-01 redesenha a landing). DEPL-03 considera "sem warnings críticos" — performance/img é não-crítico. Documentar como exceção conhecida no plano.
- **D-03:** `npm run build` já passa. Objetivo: lint sem errors antes de concluir a fase.

### Segurança HIGH (adicionado ao escopo)
- **D-04:** `cancelarContrato` e `encerrarContrato` em `src/actions/contratos.js` — derivar `unidade_id` server-side via query ao contrato em vez de aceitar do cliente. Pattern: `SELECT unidade_id FROM contratos WHERE id = $contrato_id` antes de atualizar a unidade.
- **D-05:** `editarLocatario` em `src/actions/locatarios.js` — aplicar allowlist explícita nos campos do update: `{ nome_razao_social, tipo, documento, email, telefone }`. Nunca passar o form raw ao Supabase.

### Logout no Portal
- **D-06:** Adicionar botão/link de logout no portal do Locatário. Localização: TopStrip (já usado em `portal/layout.js`) ou canto da tela principal do PortalDashboard. Implementação: `signOut()` via `supabase-browser.js` + `router.push('/login')`. Usar Client Component separado ou wrapper em PortalDashboard.

### REF-01 a REF-04 (auditoria prévia)
- **D-07:** REF-01 (código morto em dashboard/page.js) — grep confirma que não há `useEffect` guard duplicado nem `useState(null)` de `usuario` não-consumido. Já resolvido nas fases anteriores. Verificar rapidamente antes de marcar como done.
- **D-08:** REF-02 (supabase-browser em Client Components) — grep confirma que nenhum Client Component importa `supabase.js` diretamente. Já resolvido.
- **D-09:** REF-03 (erroMessage typo) — grep confirma `erroMessage` consistente em todos os actions. Já resolvido.
- **D-10:** REF-04 (consolidar useState em form objects) — auditoria mostra que `form` e `formEdit` já são objetos em GestaoEdificios.js, Unidades.js e Locatarios.js. O que resta são estados legítimos separados (data arrays, `editandoId`, `erro`, `loading`) que NÃO devem ser consolidados em form objects — são UI/data state, não form state. REF-04 está essencialmente cumprido; confirmar no plano e marcar como done.

### Claude's Discretion
- Localização exata do botão de logout no portal (TopStrip ou dentro do PortalDashboard) — escolher o que for menos invasivo e mais consistente com o padrão existente.
- Fix exato do `set-state-in-effect` — opções: mover lógica para fora do useEffect body, usar `useCallback`, ou reestruturar para que o efeito não chame diretamente uma fn que faz setState. Escolher o mais simples que elimina o error.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Escopo e Requisitos
- `.planning/ROADMAP.md` — escopo da Fase 3, success criteria (REF-01..04, DEPL-03)
- `.planning/REQUIREMENTS.md` — definições formais de REF-01, REF-02, REF-03, REF-04, DEPL-03

### Concerns de Segurança
- `.planning/codebase/CONCERNS.md` §HIGH #2 — auth bypass em cancelarContrato/encerrarContrato (detalhes do fix)
- `.planning/codebase/CONCERNS.md` §HIGH #3 — editarLocatario raw form (detalhes do fix)

### Arquivos a Modificar
- `src/actions/contratos.js` — D-04: derivar unidade_id server-side em cancelarContrato e encerrarContrato
- `src/actions/locatarios.js` — D-05: allowlist em editarLocatario
- `src/components/features/GestaoEdificios.js` — D-01: corrigir set-state-in-effect
- `src/components/features/Unidades.js` — D-01: corrigir set-state-in-effect
- `src/app/portal/layout.js` ou `src/components/features/portal/PortalDashboard.js` — D-06: logout

### Padrões Existentes
- `.planning/codebase/CONVENTIONS.md` — convenções de naming, form state, Server Actions
- `src/actions/edificios.js` — referência canônica de Server Action com authGuard + erroMessage

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `supabase-browser.js` — cliente correto para signOut() em Client Components do portal
- `authGuard()` pattern em `src/actions/*.js` — cada action declara localmente; manter padrão ao modificar contratos.js e locatarios.js
- `supabase.rpc('is_proprietario')` — já usado nos guards; não adicionar nova dependência

### Established Patterns
- Server Actions retornam `{ status: 200 }` ou `{ status: 4xx|5xx, erroMessage: '...' }` — manter ao modificar
- `editandoId`, `erro`, `loading` como useState separados são o padrão do projeto — NÃO consolidar em form objects
- `form` e `formEdit` como objetos únicos são o padrão de form state — já aplicado nos 3 arquivos REF-04

### Integration Points
- `src/app/portal/layout.js` usa `TopStrip` — logout pode ser adicionado como prop ou slot no TopStrip
- `src/components/features/portal/PortalDashboard.js` — alternativa para adicionar logout inline
- lint errors em GestaoEdificios.js e Unidades.js vêm do padrão `useEffect(() => { fn(); }, [])` onde fn chama setState — fix padrão é usar `useEffect(() => { let ignore = false; fn().then(...); return () => { ignore = true } }, [])` ou simplesmente chamar a função assíncrona inline no effect

</code_context>

<specifics>
## Specific Ideas

- Fix de `set-state-in-effect`: o padrão atual é `useEffect(() => { carregarDados(); }, [])` — solução mais simples é chamar a função assíncrona diretamente no body do effect sem wrapper: `useEffect(() => { (async () => { /* fetch + setState */ })() }, [])`. Mas o linter pode ainda reclamar. A solução clean é ignorar a regra com `// eslint-disable-next-line` apenas se o fix real aumentar complexidade desnecessária dado o escopo.
- Auth bypass fix: a query para obter unidade_id deve usar `supabaseAdmin` (já importado nas actions) para garantir acesso ao contrato independente de RLS.
- Logout: usar `supabase.auth.signOut()` do cliente browser, não uma Server Action — o redirecionamento via `router.push` é client-side. Se TopStrip for Server Component, criar um `LogoutButton.js` Client Component mínimo.

</specifics>

<deferred>
## Deferred Ideas

- `@next/next/no-img-element` warnings (8x em `src/app/page.js`) — deferidos para Fase 4 VIS-01 (redesenho completo da landing inclui migração para next/image).
- Outros issues HIGH do CONCERNS.md não incluídos: `criarContrato + gerarParcelas` não-atômicos (#5) — requer Postgres function/RPC, escopo maior, fica fora da Fase 3.
- Issues MEDIUM do CONCERNS.md (#6 query error swallowing, #7 getSession vs getUser, etc.) — fora do escopo das phases atuais.

</deferred>

---

*Phase: 03-refatora-o-e-qualidade*
*Context gathered: 2026-05-24*
