# Phase 13: Mobile Responsivo - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-06-12
**Phase:** 13-mobile-responsivo
**Mode:** --auto (fully autonomous — no user interaction)
**Areas discussed:** DashboardShell arquitetura, Conteúdo das abas, Portal mobile, MobileBottomNav items

---

## DashboardShell — Arquitetura

| Option | Description | Selected |
|--------|-------------|----------|
| Converter layout.js em Client Component | Adicionar "use client" no dashboard/layout.js | |
| DashboardShell como Client Component filho | layout.js permanece Server Component, novo DashboardShell wrappeia children | ✓ |
| CSS-only (sem novo componente) | Usar apenas romma-desktop-only/romma-mobile-only sem lógica JS | |

**Auto-seleção:** DashboardShell como Client Component filho
**Notas:** MobileTopBar e MobileBottomNav já existem em MobileNav.js prontos para uso. Manter layout.js como Server Component preserva o padrão do projeto.

---

## Conteúdo das abas — Abordagem mobile

| Option | Description | Selected |
|--------|-------------|----------|
| Variantes *Mobile.js separadas | Criar ContratosDesktop.js + ContratosMobile.js | |
| Fixes inline responsivos | Modificar os *Desktop.js existentes para funcionar em 375px | ✓ |
| Nova estrutura de lista para mobile | Substituir tabelas por cards em mobile | |

**Auto-seleção:** Fixes inline responsivos
**Notas:** UX-03 exige "usáveis", não redesenhadas. overflow-x: auto em tabelas + tap targets ≥44px é suficiente.

---

## Portal Locatário — Responsive fixes

| Option | Description | Selected |
|--------|-------------|----------|
| Inline style mobile | Adicionar media queries via style={{}} | |
| Tailwind responsive classes | sm: prefixes nos Tailwind classes existentes | ✓ |
| Componente mobile separado | PortalMobile.js | |

**Auto-seleção:** Tailwind responsive classes
**Notas:** Portal já usa Tailwind — consistência com o arquivo existente.

---

## MobileBottomNav — Itens de navegação

| Option | Description | Selected |
|--------|-------------|----------|
| 3 abas (Overview, Contratos, Locatários) | Sem Unidades | |
| 4 abas: Overview, Unidades, Contratos, Locatários | Cobertura completa das seções do dashboard | ✓ |
| 5 abas incluindo Edifícios | Muito apertado em 375px | |

**Auto-seleção:** 4 abas completas
**Notas:** Mapeamento: /dashboard (OVW), /dashboard/unidades (UNI), /dashboard/contratos (CTR), /dashboard/locatarios (LOC)

---

## Claude's Discretion

- Detecção de mobile no DashboardShell: hook useMediaQuery(768) vs CSS blocks duplos com romma-desktop-only/romma-mobile-only
- Prioridade dos fixes nos *Desktop.js: ContratosDesktop provavelmente tem maior overflow issue

## Deferred Ideas

- Animações de transição entre abas → Phase 14
- Drawer/menu hambúrguer lateral → pós-banca
- Dark mode toggle no mobile → fora de escopo (tema fixo desde Phase 12)
