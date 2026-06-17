# Phase 24: Público — Unidades Disponíveis - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-06-17
**Phase:** 24-Público-Unidades-Disponíveis
**Mode:** --auto (fully autonomous — sem interação humana)
**Areas discussed:** foto_url/anon, ordenação, desktop layout, detail sheet

---

## foto_url no contexto anon (bucket PRIVATE)

| Option | Description | Selected |
|--------|-------------|----------|
| Placeholder estático para tudo | Todos os cards usam `/Detalhe_Arquitetonico.png`, ignora foto_url | |
| `resolveFotoUrl` helper async | `/` → direto; Storage path → `createSignedUrl` anon; null/falha → placeholder | ✓ |
| Bucket público | Mudar bucket para `public=true` — URLs diretas sem signing | |

**Escolha auto:** `resolveFotoUrl` helper — preserva a arquitetura de bucket privado (Phase 17), funciona para assets estáticos de demo (D-09), e lida graciosamente com falhas de signing via fallback.

---

## Ordenação (PUB-02)

| Option | Description | Selected |
|--------|-------------|----------|
| Dropdown select | `<select>` nativo com 4 opções | |
| Pills inline na barra count/sort | Pills horizontais scrolláveis na mesma linha do contador | ✓ |
| Sort separado em linha própria | Sort em row exclusivo abaixo das tabs | |

**Escolha auto:** Pills inline — exatamente como `public.jsx:152-163`; mantém a densidade visual do design.

---

## Desktop layout

| Option | Description | Selected |
|--------|-------------|----------|
| Mobile-only (status quo) | Manter lista single-column em todos os breakpoints | |
| Grid responsivo no mesmo componente | `md:grid-cols-[repeat(auto-fill,minmax(280px,1fr))]` via breakpoint Tailwind | ✓ |
| Componente separado Desktop/Mobile | `romma-desktop-only` / `romma-mobile-only` com dois componentes | |

**Escolha auto:** Grid responsivo no mesmo componente — Phase 24 é uma listagem pública simples, não um dashboard complexo. Grid responsivo com Tailwind breakpoint é suficiente sem duplicar markup.

---

## Detail sheet (PUB-04)

| Option | Description | Selected |
|--------|-------------|----------|
| Manter conteúdo atual | Sem imagem, sem valor/m², sem refs, botão "Tenho interesse" | |
| Atualizar conforme design | Imagem 160px + valor/m² + refs LOC+REF + botão "[>] Simular Aluguel" | ✓ |

**Escolha auto:** Atualizar conforme `public.jsx:57-82` — todos os campos do design (PUB-04) e botão com texto correto para Simular aluguel (PUB-05).

---

## Claude's Discretion

- Posição exata do "✕" na sheet (44×44 atual mantido)
- `simulating` state encapsulado ou no pai
- Skeleton loading para fotos durante resolução async
- Localização do helper `resolveFotoUrl` (inline vs `src/lib/utils.js`)

## Deferred Ideas

- Animação `rUnitOut` com blur+slide — polish post-banca
- "Voltar" link configurável — hardcoded `/` suficiente para TCC
