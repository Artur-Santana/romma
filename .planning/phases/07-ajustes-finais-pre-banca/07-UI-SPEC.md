---
phase: 7
slug: ajustes-finais-pre-banca
status: draft
shadcn_initialized: true
preset: radix-lyra
created: 2026-06-02
---

# Phase 7 — UI Design Contract

> Contrato visual e de interação para a fase de gap-closure pré-banca.
> Gerado por gsd-ui-researcher, a ser verificado por gsd-ui-checker.

---

## Design System

| Property | Value | Source |
|----------|-------|--------|
| Tool | shadcn CLI | components.json — verificado |
| Preset | radix-lyra | components.json `"style": "radix-lyra"` |
| Base color | mauve | components.json `"baseColor": "mauve"` |
| Component library | radix-ui ^1.4.3 | package.json |
| Icon library | remixicon | components.json `"iconLibrary": "remixicon"` |
| Font heading | Hanken Grotesk (`--font-headline-hanken`) | globals.css |
| Font body / mono | Space Grotesk (`--font-body`, `--font-mono`) | globals.css |
| Border radius | 0 (sharp corners, sistema dark-only) | globals.css `--radius: 0` |
| Third-party registries | nenhum | components.json `"registries": {}` |

**shadcn block a adicionar nesta fase:**

| Block | Origem | Comando | Registry Safety Gate |
|-------|--------|---------|----------------------|
| skeleton | shadcn oficial | `npx shadcn@latest add skeleton` | não requerido — registry oficial |

---

## Surfaces desta Fase

Esta fase tem apenas dois tipos de superfície com contrato visual:

| Item | Superfície | Tipo | Contrato Visual |
|------|-----------|------|-----------------|
| UX-02 | Skeleton loaders (5 áreas) | Substituição de conteúdo durante carregamento | Seção Skeleton abaixo |
| D-05 | `/auth/reset-password` | Nova page cliente | Seção Reset Password abaixo |
| UX-01 | LogoutButton no OwnerSidebar | Reutilização de componente existente | Posicionamento abaixo |
| UX-03 | Remoção de link no OwnerSidebar | Deleção cirúrgica — sem contrato visual | N/A |
| FIX-01 | Route Handler `/auth/confirm` | Redirect server-side — sem UI | N/A |

---

## Spacing Scale

Escala 8-point adotada pelo projeto (Obsidian Blueprint):

| Token | Value | Uso no projeto |
|-------|-------|----------------|
| xs | 4px | Gap interno (ex.: ícone + label) |
| sm | 8px | Padding compacto |
| md | 16px | Espaçamento padrão de elementos |
| lg | 24px | Padding de seção |
| xl | 32px | Lacunas de layout |
| 2xl | 48px | Separadores de seção maior |
| 3xl | 64px | Espaçamento de nível de página |

Exceções: nenhuma para esta fase.

**Espaçamento específico por superfície:**
- PortalDashboard: `px-12 pt-12 pb-20` (padrão existente — manter)
- OwnerSidebar footer: `px-8 pt-6 pb-8 gap-[10px]` (padrão existente — manter)
- `/auth/reset-password`: `w-full max-w-[420px]` centrado (espelhar login page)

---

## Typography

Sistema usa dois pesos: **400 (regular)** e **700 (bold)**. Quatro tamanhos funcionais:

| Role | Size | Weight | Line Height | Font | CSS Token |
|------|------|--------|-------------|------|-----------|
| Display | 48px | 700 | 1.0 (leading-none) | Hanken Grotesk | `font-display font-bold text-[48px] leading-none tracking-[-2.4px]` |
| Heading | 28px | 700 | 1.2 | Hanken Grotesk | `font-display font-bold text-[28px]` |
| Body | 14–16px | 400 | 1.55 | Space Grotesk | `font-body text-sm leading-[1.55]` |
| Micro-label | 10–12px | 700 | 1.0 | Space Grotesk | `font-mono text-[12px] text-fg-4` |

**Regra:** eyebrows e labels de campo usam `font-bold text-xs tracking-[2px] uppercase`.
Tamanhos 11px e 12px (utilizados no sidebar/portal) são variantes do Micro-label — não introduzir novo tamanho.

---

## Color

Sistema dark-only. As variáveis CSS derivam de `--ds-*` em `globals.css` — não usar hex direto no código novo.

| Role | CSS Var | Hex aproximado | Uso |
|------|---------|----------------|-----|
| Dominant 60% — background | `var(--background)` | oklch(0.2393 0 0) ≈ #2A2A2A | Fundo de page, corpo |
| Secondary 30% — surface | `var(--surface)` / `var(--card)` | oklch(0.2178 0 0) ≈ #252525 | Cards, sidebar, nav, seções de dados |
| Accent 10% — primary/indigo | `var(--primary)` / `var(--indigo)` | oklch(0.339 0.1793 301.68) ≈ #370085 | Elementos reservados abaixo |
| Destructive | `var(--danger-fg)` | oklch(0.826 0.073 22.5) ≈ #D46B5A | Somente ações destrutivas |

**Accent reservado para (lista fechada):**
- Borda esquerda do item de nav ativo no OwnerSidebar
- Eyebrows (`eyebrow--indigo`)
- Border-bottom de campo com foco no form de reset-password
- Box-shadow de foco em campo de input
- Badge de contagem no nav

**Cor de destaque dourada (`--highlight` / `--chart-2`):** reservada para gráficos e charts — não usar nos novos componentes desta fase.

**Muted fill para Skeleton:** usar `var(--muted)` como cor de preenchimento base e `var(--surface-hi)` como destaque do pulso. NÃO usar `bg-gray-200` ou qualquer valor fora do sistema de tokens.

---

## Skeleton Loading — Contrato por Superfície (UX-02)

**Regra fundamental:** skeletons têm `rounded-none` explícito (sistema usa `--radius: 0`). O shadcn Skeleton aplica `rounded-md` por padrão — sobrescrever com `className="rounded-none"` em todos os usos.

### 1. `/dashboard` — Visão Geral (Server Component → `loading.js`)

Arquivo: `src/app/dashboard/loading.js` (novo)

Layout do skeleton espelha o dashboard page existente:
- Eyebrow: `Skeleton className="h-[10px] w-32 mb-2 rounded-none"`
- Título display: `Skeleton className="h-12 w-64 mb-12 rounded-none"`
- Grid de 4 KPI cards (borda `border border-border-3`):
  - Cada card: `p-7`, label `Skeleton className="h-[10px] w-24 mb-3 rounded-none"`, valor `Skeleton className="h-12 w-32 rounded-none"`
- Bloco de lista/tabela: `Skeleton className="h-64 w-full rounded-none mt-4"`

### 2. `/dashboard/locatarios` — Locatários (Server Component → `loading.js`)

Arquivo: `src/app/dashboard/locatarios/loading.js` (novo)

Layout espelha a página de locatários:
- Eyebrow: `Skeleton className="h-[10px] w-24 mb-2 rounded-none"`
- Título: `Skeleton className="h-9 w-48 mb-8 rounded-none"`
- Tabela / lista: `Skeleton className="h-64 w-full rounded-none"`

### 3. `/dashboard/unidades` — Unidades (Client Component → flag `loadingInicial`)

Arquivo: `src/components/features/Unidades.js` (modificar)

Adicionar `const [loadingInicial, setLoadingInicial] = useState(true)` separado do `loading` existente (que cobre apenas mutations). O `useEffect` existente deve chamar `setLoadingInicial(false)` ao terminar o primeiro fetch.

Render quando `loadingInicial === true`:
- Grid de 3 cards placeholder (espelha layout de tiles de unidade):
  - `Skeleton className="h-48 w-full rounded-none"` (imagem/header area)
  - `Skeleton className="h-4 w-3/4 mt-3 rounded-none"` (nome)
  - `Skeleton className="h-3 w-1/2 mt-2 rounded-none"` (descrição)

### 4. `/dashboard/contratos` — Contratos (Client Component → flag `loadingInicial`)

Arquivo: `src/components/features/Contratos.js` (modificar)

Mesma estratégia de `Unidades.js`:
- Adicionar `loadingInicial` flag
- Render quando `loadingInicial === true`:
  - Linha de header da tabela simulada: `Skeleton className="h-[10px] w-full rounded-none mb-2"` (repetir 5×)
  - `Skeleton className="h-8 w-full rounded-none mt-1"` (repetir 4×, simulando linhas de contrato)

### 5. Portal do Locatário — PortalDashboard (aplicação direta de D-10)

Arquivo: `src/components/features/portal/PortalDashboard.js` (modificar)

O `loading` inicial já é `useState(true)`. Substituir o texto `"Carregando..."` por:
```
<div className="mt-8 flex flex-col gap-4">
  <Skeleton className="h-32 w-full rounded-none" />   {/* ContratoCard placeholder */}
  <Skeleton className="h-8 w-full rounded-none" />    {/* Cabeçalho tabela parcelas */}
  <Skeleton className="h-8 w-full rounded-none" />    {/* Linha parcela 1 */}
  <Skeleton className="h-8 w-full rounded-none" />    {/* Linha parcela 2 */}
  <Skeleton className="h-8 w-full rounded-none" />    {/* Linha parcela 3 */}
</div>
```

---

## `/auth/reset-password` — Contrato Visual (D-05)

Nova page cliente que espelha estruturalmente a `/login` existente (`src/app/login/page.js`).

**Layout:**
- Full-height, dark background (`bg-background`)
- TopStrip no topo: `h-7 bg-[rgba(18,18,18,0.95)] border-b border-[rgba(255,255,255,0.08)]` com texto mono `ROMMA · RESET_PASSWORD`
- Conteúdo centrado: `flex items-center justify-center` com `max-w-[420px]`

**EyebrowRail:** `AUTENTICAÇÃO · NOVA SENHA` (padrão do projeto: `primary-accent`, peso 700, tracking 3px uppercase)

**Heading:** `Definir Nova Senha.` — 48px, Hanken Grotesk 700, `leading-none tracking-[-2.4px] text-fg-1`

**Campo de senha:**
- Label: `NOVA SENHA` — `font-body font-bold text-xs tracking-[2px] uppercase`
- Input com `style={{ all: "unset" }}`, `padding: "14px 0"`, `fontSize: 16`, border-bottom que ativa cor `var(--primary)` no foco
- Campo de confirmação de senha idêntico com label `CONFIRMAR SENHA`

**CTA — botão submit:**
- Texto: `Definir nova senha`
- Estado loading: `Definindo...`
- Estado padrão: texto `DEFINIR NOVA SENHA`, `font-body font-bold text-xs tracking-[2px] uppercase`

**Banners de estado (espelhar padrão `ErrorBanner`/`ResetBanner` do login):**

| Estado | Cor borda/texto | Título | Corpo |
|--------|-----------------|--------|-------|
| Erro — senhas não coincidem | `var(--danger-fg)` | `ERRO · SENHAS_DIVERGENTES` | `As senhas não coincidem. Verifique e tente novamente.` |
| Erro — token inválido (via `?error=`) | `var(--danger-fg)` | `ERRO_AUTH · TOKEN_INVÁLIDO` | `Link expirado ou inválido. Solicite um novo convite ao proprietário.` |
| Sucesso | `var(--success)` | `SENHA_DEFINIDA · 200` | `Senha definida com sucesso. Redirecionando...` |

**Comportamento:** após sucesso, redirecionar para `/portal/dashboard` (não `/portal` — sem rota index).

---

## UX-01 — LogoutButton no OwnerSidebar

**Posicionamento:** no footer de `OwnerSidebar.js`, após o `{email && <span>}`, dentro do `flex flex-col gap-[10px]` existente.

**Componente:** `<LogoutButton />` importado de `@/components/ui/LogoutButton` — sem modificações no componente.

**Aspecto visual já definido no componente existente:**
- `font-mono text-[10px] text-fg-4 tracking-[1px] uppercase`
- Hover: `text-fg-2`
- Estado loading: texto `Saindo...`
- Erro: `var(--danger-fg)`, 10px, abaixo do botão

---

## Copywriting Contract

| Elemento | Cópia | Superfície |
|----------|-------|-----------|
| CTA reset-password | `Definir nova senha` | `/auth/reset-password` submit |
| Loading state CTA | `Definindo...` | `/auth/reset-password` durante submit |
| Sucesso reset | `SENHA_DEFINIDA · 200` / `Senha definida com sucesso. Redirecionando...` | `/auth/reset-password` banner |
| Erro token inválido | `ERRO_AUTH · TOKEN_INVÁLIDO` / `Link expirado ou inválido. Solicite um novo convite ao proprietário.` | `/auth/reset-password` via `?error=invite_invalid` |
| Erro senhas divergentes | `ERRO · SENHAS_DIVERGENTES` / `As senhas não coincidem. Verifique e tente novamente.` | `/auth/reset-password` validação client |
| Logout sidebar | `Sair` / `Saindo...` | `LogoutButton` (existente — não alterar) |
| Skeleton PortalDashboard | (visual apenas — sem texto) | `PortalDashboard.js` |
| Ações destrutivas | nenhuma nesta fase | — |

**Nota de tom:** seguir o padrão já estabelecido no projeto — títulos de banner em `ALL_CAPS_COM_UNDERLINE · STATUS_CODE`, corpo em português coloquial, font-mono.

---

## Registry Safety

| Registry | Blocks usados nesta fase | Safety Gate |
|----------|--------------------------|-------------|
| shadcn oficial | skeleton | não requerido — registry oficial |

Terceiros: nenhum declarado. `components.json "registries": {}` confirma ausência de registries customizados.

---

## Checker Sign-Off

- [ ] Dimension 1 Copywriting: PASS
- [ ] Dimension 2 Visuals: PASS
- [ ] Dimension 3 Color: PASS
- [ ] Dimension 4 Typography: PASS
- [ ] Dimension 5 Spacing: PASS
- [ ] Dimension 6 Registry Safety: PASS

**Approval:** pending
