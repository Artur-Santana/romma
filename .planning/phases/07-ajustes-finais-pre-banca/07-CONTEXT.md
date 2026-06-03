# Phase 7: Ajustes Finais Pré-Banca - Context

**Gathered:** 2026-06-01
**Status:** Ready for planning

<domain>
## Phase Boundary

Fase de gap-closure: corrigir os 4 itens identificados após a Fase 6 que impactam a demo na banca em 18/06/2026. Escopo fixo — não adicionar novas funcionalidades.

1. **FIX-01** — `/auth/confirm`: rota que troca o token Supabase do email de convite, habilitando o fluxo completo sem intervenção manual
2. **UX-01** — Logout no dashboard do Proprietário: botão no footer do OwnerSidebar
3. **UX-02** — Skeleton loading: todas as 4 abas do dashboard + portal do Locatário
4. **UX-03** — Remover "Acessar como Locatário" do sidebar (link inútil — proxy já bloqueia)

</domain>

<decisions>
## Implementation Decisions

### FIX-01: /auth/confirm (invite flow)
- **D-01:** Criar `src/app/auth/confirm/route.js` como Route Handler (server-side). Usa `supabase.auth.verifyOtp({ token_hash, type: 'invite' })` para trocar o token do email invite. Fallback: se `code` presente em vez de `token_hash`, usar `exchangeCodeForSession(code)`. *(Ratificado 2026-06-02: verifyOtp é o método correto para email invite links com token_hash; exchangeCodeForSession é para PKCE/OAuth)*
- **D-02:** Após troca bem-sucedida, redireciona para `/portal/dashboard`. *(Ratificado 2026-06-02: /portal/page.js não existe — 404; /portal/dashboard é a rota real do portal do locatário)*
- **D-03:** Atualizar `redirectTo` em `src/actions/locatarios.js` linha 20: de `${siteUrl}/dashboard` para `${siteUrl}/auth/confirm`.
- **D-04:** A rota `/auth/confirm` deve ser pública (fora do matcher do proxy). Verificar `src/proxy.js` — o matcher atual inclui `/dashboard/:path*` e `/portal/:path*` mas não `/auth/:path*`, então já é pública por omissão.
- **D-05:** `/auth/reset-password` — também criar como page cliente em `src/app/auth/reset-password/page.js`. Permite ao locatário definir nova senha após primeiro acesso. Usa `supabase.auth.updateUser({ password })`. Redireciona para `/portal/dashboard` após sucesso. *(Ratificado 2026-06-02: mesma correção de D-02 por consistência)* Estilo visual consistente com `/portal/login`.

### UX-01: Logout no dashboard do Proprietário
- **D-06:** Adicionar `LogoutButton` no footer de `src/components/ui/OwnerSidebar.js`, abaixo do email do proprietário. Reutilizar o componente já existente em `src/components/ui/LogoutButton.js` (sem modificações no componente).
- **D-07:** Comportamento idêntico ao do portal: `supabase.auth.signOut()` → `router.push("/login")`.

### UX-02: Skeleton loading
- **D-08:** Usar o componente `Skeleton` do shadcn/ui (já disponível via shadcn CLI — adicionar se não instalado).
- **D-09:** Cobertura: 4 abas do dashboard (Visão Geral, Unidades, Contratos, Locatários — `src/components/features/`) + portal do Locatário (`src/components/features/PortalDashboard.js`).
- **D-10:** Granularidade por componente: enquanto o estado `loading` é `true`, renderizar skeleton no lugar do conteúdo principal. Não é full-page skeleton — é skeleton por seção de dados (cards, tabelas, tiles).

### UX-03: Remover "Acessar como Locatário"
- **D-11:** Remover o bloco `<Link href="/portal" ...>→ Acessar como Locatário</Link>` do footer de `src/components/ui/OwnerSidebar.js`. Nenhum link substituto (o link "Ver Página Pública" já existe logo acima).

### Claude's Discretion
- Estrutura exata dos skeletons (quantas linhas, proporções) — seguir o layout visual de cada componente
- Tratamento de erro no `/auth/confirm` (token inválido/expirado) — redirecionar para `/portal/login` com parâmetro de erro

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Auth flow
- `src/actions/locatarios.js` — `inviteUserByEmail` com `redirectTo` atual (linha 19-21); precisa ser atualizado para `/auth/confirm`
- `src/proxy.js` — matcher atual de rotas protegidas; confirmar que `/auth/*` não está no matcher (pública por omissão)
- `src/app/portal/login/page.js` — referência visual para `/auth/reset-password`

### Sidebar / UX
- `src/components/ui/OwnerSidebar.js` — componente a modificar (UX-01 e UX-03)
- `src/components/ui/LogoutButton.js` — componente reutilizável; NÃO modificar

### Skeleton targets (ler antes de implementar UX-02)
- `src/components/features/` — listar todos os arquivos para identificar os 4 do dashboard + PortalDashboard

### Supabase Auth docs pattern
- `src/lib/supabase-server.js` — client server-side para use no Route Handler de `/auth/confirm`

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/components/ui/LogoutButton.js` — botão de logout pronto, redireciona para `/login`. Import direto em OwnerSidebar.
- shadcn `Skeleton` component — se não instalado: `npx shadcn@latest add skeleton`
- `src/lib/supabase-server.js` — factory para client server-side; usar no Route Handler de `/auth/confirm`

### Established Patterns
- Route Handlers em Next.js 16 App Router ficam em `src/app/*/route.js` (não page.js)
- Server Actions retornam `{ status, erroMessage }` — `/auth/confirm` é Route Handler, não Server Action
- Loading state pattern existente: `const [loading, setLoading] = useState(true)` → fetch → `setLoading(false)`
- Skeleton deve substituir conteúdo quando `loading === true`, não adicionar spinner sobre ele

### Integration Points
- `src/proxy.js` matcher: `['/dashboard', '/dashboard/:path*', '/portal', '/portal/:path*']` — `/auth/*` já está fora, nenhuma mudança necessária
- `src/actions/locatarios.js` linha 20: único ponto que precisa trocar `redirectTo` de `/dashboard` para `/auth/confirm`

</code_context>

<specifics>
## Specific Ideas

- Skeleton loading deve cobrir as 4 abas do dashboard + portal do Locatário — não apenas as "mais lentas"
- `/auth/confirm` redireciona para `/portal` (não `/portal/login`) — o proxy decide o destino final
- Remover "Acessar como Locatário" silenciosamente, sem link substituto

</specifics>

<deferred>
## Deferred Ideas

- WR-01: Tratamento de erro nas queries de verificação do `seed-prod-demo.mjs` — baixo risco, fora do escopo desta fase
- WR-02: Race condition estrutural no seed — inofensivo na prática, fora do escopo
- Botão "Mudar senha" no portal do Locatário (pós-banca)

</deferred>

---

*Phase: 7-Ajustes Finais Pré-Banca*
*Context gathered: 2026-06-01*
