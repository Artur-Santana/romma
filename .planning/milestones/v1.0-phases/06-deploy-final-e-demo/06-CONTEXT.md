# Phase 6: Deploy Final e Demo - Context

**Gathered:** 2026-06-01
**Status:** Ready for planning

<domain>
## Phase Boundary

Validar e estabilizar o deploy existente na Vercel (`romma-alpha.vercel.app`), garantir que o fluxo de convite de Locatário funcione em produção, popular dados de demonstração, e produzir roteiro completo para a banca em 18/06/2026.

</domain>

<decisions>
## Implementation Decisions

### Estado atual do deploy
- **D-01:** App já está deployado e rodando em `romma-alpha.vercel.app` — o trabalho é validação e ajustes, não deploy from scratch.

### Fluxo de convite (DEPL-01 + DEPL-02)
- **D-02:** Fluxo de convite NÃO foi testado em produção — precisa de validação completa: SITE_URL correto, Supabase Auth Redirect URL aceita `romma-alpha.vercel.app`, email chega, link redireciona para `/dashboard`.

### Env vars na Vercel
- **D-03:** Estado das env vars em produção é desconhecido — planner deve incluir passo de verificação/configuração de todas as variáveis obrigatórias:
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - `SUPABASE_JWT`
  - `SUPABASE_ROLE_KEY`
  - `SITE_URL` → deve ser `https://romma-alpha.vercel.app`
  - `APP_URL` (Edge Function CORS) → deve incluir `https://romma-alpha.vercel.app`

### Dados de demonstração
- **D-04:** Estratégia mix — base pré-carregada + ação ao vivo durante a demo.
  - Base: 1-2 edifícios com múltiplas unidades, contratos ativos com parcelas em diferentes status (futura, pendente, paga, vencida), ao menos 1 locatário já cadastrado.
  - Ao vivo: criar novo contrato durante a demo para mostrar fluxo completo (unidade some de `/unidades`).

### Roteiro de demonstração (DEMO-01)
- **D-05:** Formato duplo:
  1. `DEMO.md` no repo, **adicionado ao `.gitignore`** (não commitar — dado sensível de banca).
  2. Versão cheat sheet imprimível (HTML ou PDF compacto) — passos numerados, tempos estimados, fallbacks visíveis.
- **D-06:** Conteúdo mínimo do roteiro: sequência de ações, pontos de destaque técnico para mencionar à banca, tempo estimado por seção, fallback para Realtime.

### Fallback Realtime na demo
- **D-07:** Se card não sumir de `/unidades` após criar contrato: fazer refresh manual (F5) e explicar verbalmente a limitação conhecida — "RLS do Supabase filtra eventos UPDATE de disponível→alugada; workaround conhecida, solução seria webhook ou polling".

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Requisitos da fase
- `.planning/REQUIREMENTS.md` — DEPL-01, DEPL-02, DEMO-01 (seção Deploy + Demo)

### Fluxo de auth e convite
- `src/actions/locatarios.js` — `convidarLocatario()` — usa `SITE_URL` + `supabaseAdmin.auth.admin.inviteUserByEmail()`
- `src/proxy.js` — middleware de autenticação, redirect para `/dashboard`
- `.planning/codebase/INTEGRATIONS.md` §Supabase Auth — documentação do fluxo de invite

### Edge Function (CORS em prod)
- `supabase/functions/gerar-parcelas/index.ts` — usa `APP_URL` env var para CORS; precisa incluir domínio de produção

### Env vars
- `.env.example` — lista completa de variáveis necessárias
- `CLAUDE.md` §Env Vars — mapeamento de variáveis e seus usos

### Limitação Realtime conhecida
- `.planning/codebase/INTEGRATIONS.md` §Realtime — documentação da limitação `disponível→alugada`
- `.planning/PROJECT.md` §Key Decisions — "Realtime com limitação conhecida (disponivel→alugada)"

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `e2e/seed.mjs` — script de seed para testes; pode servir de base para seed de dados de demo em produção (adaptar para Supabase prod)
- `src/actions/locatarios.js:convidarLocatario()` — fluxo de convite que precisa ser testado em prod

### Established Patterns
- Env vars server-only (`SUPABASE_JWT`, `SUPABASE_ROLE_KEY`) nunca devem aparecer em variáveis `NEXT_PUBLIC_*`
- `SITE_URL` lido em `src/actions/locatarios.js:13` — crítico que aponte para domínio de prod

### Integration Points
- Supabase Dashboard → Authentication → URL Configuration → precisa adicionar `https://romma-alpha.vercel.app/**` como Redirect URL permitida
- Vercel Dashboard → Environment Variables → configurar todas as vars de produção
- Edge Function `gerar-parcelas` → `APP_URL` precisa de `https://romma-alpha.vercel.app` para CORS funcionar

</code_context>

<specifics>
## Specific Ideas

- `DEMO.md` deve ser adicionado ao `.gitignore` — não commitar conteúdo sensível de apresentação
- Demo data script separado do `e2e/seed.mjs` (que aponta para Supabase local) — criar `scripts/seed-prod-demo.mjs` ou instrução manual
- Cheat sheet: formato que caiba em 1 página A4 impressa

</specifics>

<deferred>
## Deferred Ideas

- Dados realistas mais elaborados (DEMO-02, DEMO-03) — classificados como v2 em REQUIREMENTS.md
- Validação ponta a ponta documentada LP→listagem→login→dashboard (DEMO-03) — v2

</deferred>

---

*Phase: 6-deploy-final-e-demo*
*Context gathered: 2026-06-01*
