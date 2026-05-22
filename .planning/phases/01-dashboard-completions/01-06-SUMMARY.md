---
phase: 01-dashboard-completions
plan: 06
subsystem: dashboard
tags: [tailwind-v4, shadcn, unidades, ui-migration, select-fix]
dependency_graph:
  requires:
    - 01-03 (padrão de migração Tailwind v4 estabelecido)
    - 01-04 (padrão PageHeader + shadcn Button estabelecido)
  provides:
    - Unidades.js com UI completa em Tailwind v4 + shadcn
    - Fix de select.jsx removendo dependência @remixicon/react ausente
  affects:
    - src/app/dashboard/unidades/page.js (usa Unidades.js via import)
tech_stack:
  added: []
  patterns:
    - shadcn Select com onValueChange (não onChange) para selects controlados
    - Checkbox customizado cn() para estado checked/unchecked (padrão login/page.js)
    - PageHeader com eyebrow + title + subtitle calculado + cta toggle
    - SVGs inline como fallback para ícones (substitui dependência ausente)
key_files:
  created: []
  modified:
    - src/components/features/Unidades.js
    - src/components/ui/select.jsx
decisions:
  - "shadcn Select usado com onValueChange (API correta do Radix Select) — não onChange que quebraria silenciosamente"
  - "@remixicon/react substituído por SVGs inline em select.jsx — pacote declarado ausente em package.json e pasta vazia em node_modules"
  - "showForm state adicionado para toggle do formulário via CTA no PageHeader — comportamento consistente com Contratos.js"
  - "loading state adicionado a insertUnidade — botão submit mostra feedback visual durante operação"
metrics:
  duration: ~25 minutos
  completed_date: "2026-05-22"
  tasks_completed: 1
  tasks_total: 1
  files_created: 0
  files_modified: 2
---

# Phase 01 Plan 06: Construção UI Unidades.js com Tailwind v4 + shadcn Summary

UI completa de Unidades.js construída do zero sobre HTML puro sem estilo — PageHeader com eyebrow "U.LIST · UNIDADES", formulário colapsável com shadcn Input/Select, checkbox customizado `valor_visivel` via `cn()`, banner de erro com tokens danger, e lista de UnidadeCard com empty state, tudo em Tailwind v4.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Construir UI de Unidades.js com Tailwind v4 + shadcn | fec95c5 | src/components/features/Unidades.js, src/components/ui/select.jsx |

## Verification

- `grep -c "style={{" src/components/features/Unidades.js` → **0** (zero inline styles)
- `grep "PageHeader\|eyebrow" src/components/features/Unidades.js` → **4 linhas** (import + uso + eyebrow class)
- `grep "Select\b" src/components/features/Unidades.js` → **9 linhas** (import + 5 componentes Select usados × 2 instâncias)
- `grep "Input\b" src/components/features/Unidades.js` → **9 linhas** (import + 4 usos + 4 placeholders)
- `grep "valor_visivel" src/components/features/Unidades.js` → **34 linhas** (checkbox funcional, form state, props para UnidadeCard)
- `npm run build` → `✓ Compiled successfully in 8.5s`

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Bloqueante] Fix de @remixicon/react ausente em select.jsx**
- **Encontrado durante:** Task 1 — verificação de build
- **Problema:** `src/components/ui/select.jsx` importa `{ RiArrowDownSLine, RiCheckLine, RiArrowUpSLine }` de `@remixicon/react`. O pacote está ausente do `package.json` e a pasta `node_modules/@remixicon` está vazia — dependência transitiva de shadcn que nunca foi materializada. O build passava antes porque nenhum componente em `features/` importava `select.jsx`. Ao importar em Unidades.js, o erro se tornou visível.
- **Correção:** Substituir o import de `@remixicon/react` por três componentes SVG inline equivalentes (chevron down, chevron up, check) diretamente em `select.jsx`. Comportamento e aparência visual preservados.
- **Arquivos modificados:** src/components/ui/select.jsx
- **Commit:** fec95c5

**2. [Rule 2 - Completude] Estado loading adicionado a insertUnidade**
- **Encontrado durante:** Task 1 — análise do código original
- **Problema:** O `insertUnidade` original não tinha `loading` state — botão ficava ativo durante a operação, risco de double-submit.
- **Correção:** `setLoading(true)` antes da operação, `setLoading(false)` no finally, botão desabilitado com `disabled={loading}` e feedback visual "Salvando...".
- **Arquivos modificados:** src/components/features/Unidades.js
- **Commit:** fec95c5

**3. [Rule 2 - Completude] showForm state adicionado**
- **Encontrado durante:** Task 1 — formulário original era sempre visível
- **Problema:** O formulário original era sempre visível, sem toggle. O plano especifica CTA no PageHeader com toggle `showForm ? "Fechar" : "Nova Unidade"`.
- **Correção:** Estado `showForm` adicionado, CTA no PageHeader controla visibilidade, formulário colapsável com `{showForm && (...)}`.
- **Arquivos modificados:** src/components/features/Unidades.js
- **Commit:** fec95c5

## Follow-up Necessário

**UnidadeCard.js permanece HTML puro sem estilo** — o plano 01-06 explicitamente instrui a não migrar UnidadeCard agora. O componente de edição inline (edit mode dentro do card) usa `<input>` e `<button>` nativos sem className. A tela de Unidades ficará semi-estilizada: formulário de criação polido + lista de cards sem estilo visual. Migração de UnidadeCard deve ser task futura.

**select.jsx ainda usa `@remixicon/react` como documentação** — o import foi substituído por SVGs inline mas o `package.json` ainda não declara `@remixicon/react` como dependência. Se o projeto no futuro instalar shadcn components adicionais que dependam de ícones Remixicon, a mesma solução SVG inline precisará ser aplicada ou a dependência deve ser instalada formalmente.

## Known Stubs

Nenhum stub introduzido. Todos os campos do formulário vinculados a `form` state que persiste para Server Action `criarUnidade`. UnidadeCard exibe dados reais de unidades do Supabase.

## Threat Flags

Nenhuma nova superfície de segurança introduzida. A migração é cosmética (estilos). A funcionalidade de CRUD (`criarUnidade`, `editarUnidade`, `deletarUnidade`) preserva Server Actions com validação server-side. O campo `valor_visivel` controla apenas form state — Server Action aplica a visibilidade. Autorização via RLS não alterada.

## Self-Check: PASSED

- src/components/features/Unidades.js: FOUND no worktree
- src/components/ui/select.jsx: FOUND no worktree
- Commit fec95c5: FOUND
- `grep -c "style={{" Unidades.js` → 0
- `grep "PageHeader" Unidades.js` → presente (import + uso)
- `grep "Select\b" Unidades.js` → 9 linhas (> 3)
- `grep "Input\b" Unidades.js` → 9 linhas (> 2)
- `grep "valor_visivel" Unidades.js` → 34 linhas (> 3)
- Build compila com sucesso (✓ Compiled successfully in 8.5s)
