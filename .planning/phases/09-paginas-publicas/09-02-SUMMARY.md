---
phase: 09-paginas-publicas
plan: "02"
subsystem: public-pages
tags: [cta, navigation, landing-page, header, link]
dependency_graph:
  requires: ["09-01"]
  provides: ["LP-01", "LP-02", "LP-03"]
  affects: ["src/app/page.js", "src/components/ui/Header.js"]
tech_stack:
  added: []
  patterns: ["<button> → <Link> para navegação", "text-center em <a> inline"]
key_files:
  modified:
    - src/app/page.js
    - src/components/ui/Header.js
decisions:
  - "Adicionar text-center ao converter <button> → <Link> (elementos <a> são inline por padrão)"
  - "Não tocar nos href=# dos links de nav (CONTRATOS, PORTAIS, DASHBOARD) — placeholders aceitáveis per UI-SPEC"
metrics:
  duration: "73s"
  completed: "2026-06-06T22:47:24Z"
  tasks_completed: 2
  tasks_total: 2
---

# Phase 09 Plan 02: CTAs de Navegação — Summary

CTAs mortos da landing page e Header convertidos para `<Link>` com destinos reais — 5 botões corrigidos em 2 arquivos, fechando LP-01, LP-02 e LP-03.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | page.js — converter hero CTAs e botão SISTEMA.04 | 95262a7 | src/app/page.js |
| 2 | Header.js — converter COMEÇAR AGORA em Link | 48db820 | src/components/ui/Header.js |

## What Was Built

**Task 1 — page.js (D-01, D-02, D-04):**
- `INICIE GRATUITAMENTE` (`<button>`) → `ACESSAR DASHBOARD` (`<Link href="/login">`) com gradiente — CTA primário (D-01)
- `VER PROJETOS` → `VER UNIDADES` com href `/unidades` intacto — label correto (D-02)
- `ACESSE ANALITYCS` (`<button>`) → `ACESSAR PAINEL` (`<Link href="/login">`) — corrige typo e ativa botão (D-04)

**Task 2 — Header.js (D-07):**
- Desktop: `<button type="button">COMEÇAR AGORA</button>` → `<Link href="/login">COMEÇAR AGORA</Link>` com className idêntico
- Mobile: idem + adicionado `text-center` (elemento `<a>` é inline, diferente de `<button>`)
- Links de nav `href="#"` (CONTRATOS, PORTAIS, DASHBOARD) preservados intactos

## Deviations from Plan

None — plano executado exatamente como escrito.

## Known Stubs

None. Todos os CTAs convertidos apontam para destinos reais (`/login`, `/unidades`).

## Threat Flags

None. Navegação client-side para páginas públicas `/login` e `/unidades` — sem nova superfície de ataque.

## Self-Check: PASSED

- [x] `src/app/page.js` modificado — commit 95262a7
- [x] `src/components/ui/Header.js` modificado — commit 48db820
- [x] `grep -c 'href="/login"' src/app/page.js` retorna 2 (D-01 + D-04)
- [x] page.js contém ACESSAR DASHBOARD, VER UNIDADES, ACESSAR PAINEL
- [x] page.js NÃO contém INICIE GRATUITAMENTE, VER PROJETOS, ACESSE ANALITYCS
- [x] Header.js contém 2 instâncias de COMEÇAR AGORA como `<Link href="/login">`
- [x] Nenhum import de Link adicionado (já existia em ambos os arquivos)
