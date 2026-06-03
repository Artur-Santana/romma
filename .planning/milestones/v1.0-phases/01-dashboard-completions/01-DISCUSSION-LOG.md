# Phase 1: Dashboard Completions - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-05-21
**Phase:** 01-dashboard-completions
**Areas discussed:** Tile de Receita Esperada, Styling/Tailwind, VIS-02 Escopo de Migração, CSS vars + Tailwind, shadcn/ui, Responsividade mobile

---

## Styling — Inline Styles vs Tailwind

| Option | Description | Selected |
|--------|-------------|----------|
| Inline styles + CSS vars (padrão atual do CLAUDE.md) | Manter o padrão existente nos feature components | |
| Tailwind v4 everywhere | Tailwind em absolutamente tudo — nenhum inline style permitido | ✓ |

**User's choice:** Tailwind v4 obrigatório em todo o projeto. Inline styles são PROIBIDOS.
**Notes:** O usuário foi enfático: "ESTRITAMENTE PROIBIDO USAR INLINE STYLES!!!!! SEMPRE USE TAILWIND!!!!!". Esta decisão override completamente o CLAUDE.md e a UI-SPEC que dizem o contrário.

---

## VIS-02 — Escopo da Migração

| Option | Description | Selected |
|--------|-------------|----------|
| Só o que a Fase 1 toca | Código novo/alterado usa Tailwind; existente fica como está | |
| Migrar tudo | Todos os feature components do dashboard migram para Tailwind agora | ✓ |

**User's choice:** Migração completa de todos os feature components do dashboard.
**Notes:** ContratosDesktop.js, GestaoEdificios.js, LocatariosDesktop.js (ou Locatarios.js), Parcelas.js, dashboard/page.js — todos migram.

---

## CSS vars + Tailwind

| Option | Description | Selected |
|--------|-------------|----------|
| Arbitrary values (bg-[var(--surface)]) | Manter CSS vars e usar como arbitrary values no Tailwind | |
| Tokens Tailwind v4 nativos | CSS vars já mapeados via @theme — usar como classes nativas | ✓ |

**User's choice:** Tokens já mapeados no globals.css. Usar como classes nativas Tailwind.
**Notes:** O usuário confirmou que o mapeamento já existe. Referência: `src/app/login/page.js` e `globals.css`.

---

## shadcn/ui components

| Option | Description | Selected |
|--------|-------------|----------|
| Tailwind puro, sem shadcn | Tudo customizado em Tailwind | |
| Usar shadcn onde fizer sentido | Table, Badge, Button, Card substituem implementações customizadas | ✓ |

**User's choice:** shadcn/ui onde fizer sentido.

---

## Responsividade Mobile

| Option | Description | Selected |
|--------|-------------|----------|
| Manter classes CSS customizadas (.romma-mobile-only etc.) | Menos mudança, menos risco | |
| Tailwind breakpoints (md:hidden, md:block) | Consistente com migração geral | ✓ |

**User's choice:** Breakpoints Tailwind substituem as classes CSS customizadas.

---

## Tile de Receita Esperada (DASH-02)

| Option | Description | Selected |
|--------|-------------|----------|
| Substituir tile 03 "Parcelas Pendentes" | Receita Esperada assume o tile; grid de 4 mantido | |
| Adicionar como 5º tile | Grid passa para 5 tiles | |
| Renomear e reaproveitar | Mesmo tile, novo label e fórmula | |
| Nenhuma mudança de layout | Tile existente já mostra o valor correto | ✓ |

**User's choice:** Layout inalterado. "Contratos Ativos já mostra o valor a ser recebido do mês, mesma coisa para Parcelas Pendentes." DASH-01/02 são verificação de fórmula e label, não novos tiles.

---

## Claude's Discretion

- Qual componente está ativo em `/dashboard/locatarios`: `Locatarios.js` ou `LocatariosDesktop.js`
- Escolha específica de componentes shadcn para cada elemento
- Estrutura de queries para MRR/Receita Esperada

## Deferred Ideas

- Migração de `src/app/unidades/` para Tailwind → Fase 4 (VIS-01)
- Migração de `src/app/page.js` (homepage pública) → Fase 4
- Deletar componentes legacy `Contratos.js` e `Unidades.js` se não estiverem em uso → Fase 3
