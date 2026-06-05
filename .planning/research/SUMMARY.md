# Research Summary — Romma v1.1 Polish & Completeness

*Generated 2026-06-05*

---

## Stack Additions

**Default: add nothing.** Stack existente (Next.js 16 + Supabase + Tailwind v4 + shadcn/ui + tw-animate-css) cobre todas as features v1.1.

| Library | Quando adicionar | Install |
|---------|-----------------|---------|
| `sonner` v2.0.7 | Se toast não-bloqueante for necessário | `npx shadcn add sonner` |
| `motion` v12.40.0 | Só se AnimatePresence (exit de DOM) for obrigatório | `npm install motion` |

**Não adicionar:** `next-themes`, `framer-motion` (nome antigo), qualquer CSS-in-JS, segundo UI kit.

**Animações:** usar `tw-animate-css` (`animate-in`, `fade-in`, `slide-in-from-bottom-4`) + keyframes em `globals.css` primeiro. Só usar `motion` se exit-while-unmounting for necessário.

**Temas:** editar os 5 tokens `--ds-*` OKLCH no `:root`. Cascata CSS propaga automaticamente.

---

## Feature Table Stakes

### Bugs (obrigatório primeiro — desbloqueiam tudo)
- `revogarConvite` não funciona: guard de contagem de contratos antes do delete + fix `status_convite` display
- `deletarUnidade` FK error: guard contagem contratos, mensagem 409 clara, separar estado de erro de edit vs delete em `Unidades.js`
- `/unidades` back-navigation: fix link "voltar para home" junto com redesign

### Signup Proprietário
- Forma simples email + senha em `/signup`
- Server Action com preflight: `SELECT COUNT(*) FROM proprietarios` via `supabaseAdmin` — se > 0, retorna 403 "Instância já configurada"
- Usar `supabaseAdmin.auth.admin.createUser()` — NUNCA `supabase.auth.signUp()` client-side

### Landing Page CTAs
- Primary: "Ver Unidades Disponíveis" → `/unidades`
- Secondary: "Acessar Dashboard" → `/login`

### /unidades Redesign
- Card: nome unidade, edifício, área m², preço ou "Consulte o Proprietário"
- Badge "Disponível" visualmente prominente
- Empty state quando zero unidades
- Mobile tap targets ≥44px
- Preservar: Realtime, `valor_visivel` masking, `next/image`

### Desktop Font Scale
- Body ≥14px, h1 ≥24px
- Via CSS vars e classes Tailwind — não inline scattered

### Mobile Responsive (área logada)
- `MobileTopBar` + `MobileBottomNav` existem em `MobileNav.js` mas não estão conectados ao `dashboard/layout.js`
- `romma-sidebar-wrapper` referenciado no layout mas não definido em `globals.css`
- Padrão: criar `DashboardShell.js` (Client Component) que renderiza condicionalmente sidebar vs mobile nav
- Font-size ≥16px em inputs (evita iOS zoom)

### Animações
- Saída de row/card no delete: `fade-out + height-collapse` via `tw-animate-css` ~200ms
- Feedback de ação: conectar `erroMessage` a UI visível; sonner se ConfirmDialog insuficiente
- Animações SOMENTE em Client Components (`src/components/features/*.js`) — nunca em `layout.js`

### Theme Variations
- Adicionar `[data-theme="name"]` blocks em `globals.css` sobrescrevendo os 5 tokens `--ds-*`
- Obsidian Blueprint permanece default
- Auditar `style={{ color: "var(--X)" }}` antes de qualquer mudança de var

---

## Build Order

| Fase | Conteúdo | Racional |
|------|----------|---------|
| 1 | Bug fixes | Desbloqueia demo; sem dependências |
| 2 | Landing + /unidades redesign | Face pública, impacto máximo por esforço |
| 3 | Signup Proprietário | Necessário para demo em deploy limpo |
| 4 | Desktop font scale + Theme variations | CSS-only, baixo risco |
| 5 | Mobile responsive | Maior esforço, fazer com layout estável |
| 6 | Animações + Toast feedback | Seguro por último; não desbloqueia nada |

---

## Watch Out For

1. **Signup single-instance guard (CRÍTICO)** — Nunca `supabase.auth.signUp()` client-side. Sempre preflight via `supabaseAdmin` no Server Action.

2. **`revogarConvite` FK cascade (ALTO)** — `contratos.locatario_id` sem ON DELETE CASCADE. Ordem de delete: auth user primeiro (`deleteUser`), depois locatário. Não usar `banUser` (não invalida JWTs ativos).

3. **`dashboard/layout.js` deve permanecer Server Component (ALTO)** — Mobile toggle state deve viver em `DashboardShell.js` Client Component. Não adicionar `'use client'` no layout.

4. **Tailwind v4 dark variant collision (MÉDIO)** — Usar `[data-theme="alt"]` selector, não `.dark` class. `dark:` utilities do shadcn respondem a `prefers-color-scheme` por padrão.

5. **Inline CSS var silent failures (ALTO)** — `var(--X)` ausente → fallback silencioso. Rodar `grep -r "var(--" src/` antes de qualquer mudança de theme. Exit criterion: `next build` + `npx playwright test`.

---

## Open Questions

1. **`status_convite` flip** — trigger Postgres vs derivar de `email_confirmed_at` em query-time via `supabaseAdmin.auth.admin.listUsers()`?
2. **Escopo mobile** — todas as 4 abas do dashboard + portal OU subset priorizado (sidebar collapse + LocatariosDesktop + portal)?
3. **Sonner vs ConfirmDialog** — toast de sucesso após ação ou "dialog fecha = fim"?
4. **Filter em /unidades** — client-side filter por edifício/preço ou defer pós-TCC?
5. **Paleta alternativa** — qual cor concreta para o tema alternativo?
