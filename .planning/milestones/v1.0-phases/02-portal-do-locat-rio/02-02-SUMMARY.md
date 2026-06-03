---
phase: 02-portal-do-locat-rio
plan: "02"
subsystem: auth-routing-portal-shell
tags: [auth, routing, portal, proxy, tailwind, shell]
dependency_graph:
  requires:
    - 02-01 (e2e/portal.spec.js PORT-01/02/03 em RED)
  provides:
    - src/app/login/page.js (RPC is_proprietario + routing por role)
    - src/proxy.js (guard /portal/* + matcher expandido)
    - src/app/portal/layout.js (migrado para Tailwind, sem inline styles)
    - src/app/portal/dashboard/page.js (thin Server Component shell)
    - src/components/features/portal/PortalDashboard.js (shell visual Obsidian Blueprint)
  affects:
    - Fluxo de autenticação de Locatários (redirect para /portal/dashboard)
    - Proteção de rota /portal/** no proxy.js
tech_stack:
  added: []
  patterns:
    - "RPC is_proprietario() chamado client-side pós signInWithPassword para routing por role"
    - "Guard duplo /portal: proxy.js (unauthenticated→/login, proprietário→/dashboard) + layout.js (defense-in-depth)"
    - "Thin Server Component shell: page.js importa Client Component sem passar props de dados"
key_files:
  created:
    - src/app/portal/dashboard/page.js
    - src/components/features/portal/PortalDashboard.js
  modified:
    - src/app/login/page.js
    - src/proxy.js
    - src/app/portal/layout.js
decisions:
  - "D-01/D-02: Estado AUTENTICANDO mantido durante toda sequência signInWithPassword+RPC+redirect"
  - "D-04/D-05: Guard duplo /portal no proxy.js espelha padrão do guard /dashboard"
  - "D-11/D-12: portal/layout.js migrado para Tailwind; PortalDashboard.js criado sem inline styles"
  - "PortalDashboard.js é shell-only (Plan 03 adiciona ContratoCard + ParcelsTable com dados reais)"
metrics:
  duration: "~15 min"
  completed_date: "2026-05-23"
  tasks_completed: 3
  tasks_total: 3
  files_created: 2
  files_modified: 3
requirements:
  - PORT-01
  - VIS-03
---

# Phase 02 Plan 02: Login Routing por Role + Proxy Guard + Portal Shell Summary

Slice vertical end-to-end do portal: login redireciona Locatário para /portal/dashboard via RPC is_proprietario, proxy.js guarda /portal/** com matcher expandido, e shell visual mínimo Obsidian Blueprint renderiza eyebrow + título sem inline styles.

## What Was Built

**src/app/login/page.js (modificado):** Inserção cirúrgica de 3 linhas na função `handleSubmit`. Após `signInWithPassword` bem-sucedido, chama `supabase.rpc('is_proprietario')` antes de `setStatus("success")`. Estado AUTENTICANDO mantido durante toda a sequência (D-02). Redirect final usa ternário: `isProprietario ? '/dashboard' : '/portal/dashboard'`. Componente `Field` existente preservado sem modificação (Assumption A3 do RESEARCH).

**src/proxy.js (modificado):** Dois novos blocos guard após o guard /dashboard existente. (1) `/portal` sem user → redirect `/login`; (2) `/portal` com user e `is_proprietario()=true` → redirect `/dashboard`. Matcher expandido de `['/dashboard/:path*']` para `['/dashboard/:path*', '/portal/:path*']`. Guard /dashboard preservado integralmente.

**src/app/portal/layout.js (modificado):** Inline styles removidos e substituídos por Tailwind. `style={{ display: "flex", flexDirection: "column", height: "100vh" }}` → `className="flex flex-col h-screen bg-background"`. `style={{ flex: 1, overflow: "auto", background: "var(--background)" }}` → `className="flex-1 overflow-auto"`. Auth guard server-side (`getUser()` → redirect `/login`) preservado.

**src/app/portal/dashboard/page.js (novo):** Server Component thin shell de 5 linhas. Importa `PortalDashboard` e retorna `<PortalDashboard />` sem props de dados. Sem `'use client'`.

**src/components/features/portal/PortalDashboard.js (novo — shell):** Client Component com `'use client'` na linha 1. Renderiza wrapper `romma-page`, eyebrow `PORTAL DO LOCATÁRIO` com classe `eyebrow eyebrow--indigo`, título `Seu Contrato.` com tipografia display, subtítulo mono, e placeholder `data-testid="parcelas-table-region"` com "Carregando...". Zero inline styles. Sem imports de supabase ou queries (dados virão no Plan 03).

## Verification Results

- `grep -c "rpc('is_proprietario')" src/app/login/page.js` → 1
- `grep -c 'router.push("/dashboard")' src/app/login/page.js` → 0 (substituído pelo ternário)
- `grep -c "startsWith('/portal')" src/proxy.js` → 2
- `grep "'/portal/:path\*'" src/proxy.js` → presente no matcher
- `grep -L 'style={' layout.js page.js PortalDashboard.js | wc -l` → 3 (todos sem inline styles)
- `ls src/middleware.js` → No such file (nunca criado — CLAUDE.md)
- Commits: f2fd4e5, 928a485, 7d4f7d0

## Deviations from Plan

Nenhuma — plano executado exatamente como escrito. As tasks 1 e 2 têm `tdd="true"` mas os testes RED já foram criados no Plan 01 (commit ef7370a). Esta wave é a fase GREEN da sequência TDD — os testes existentes validarão a implementação.

## Known Stubs

**PortalDashboard.js — placeholder de dados:**
- `src/components/features/portal/PortalDashboard.js`, div `data-testid="parcelas-table-region"`, texto "Carregando..."
- Razão: intencional — Plan 03 substituirá com ContratoCard + ParcelsTable com dados reais via queries-client.js
- PORT-02 e PORT-03 continuam em RED até Plan 03 (esperado)

## Threat Surface Scan

Implementações cobrem as mitigações T-02-04 e T-02-05 do threat register do plano:
- **T-02-04 (Elevation of Privilege):** proxy.js chama `is_proprietario()` server-side antes de renderizar /portal — Proprietário redirecionado para /dashboard
- **T-02-05 (Spoofing):** proxy.js redireciona unauthenticated para /login antes de renderizar layout; layout.js valida `getUser()` como defense-in-depth

Sem novos endpoints, auth paths, ou trust boundaries além dos mapeados no threat model do plano.

## Commits

| Task | Commit | Tipo | Descrição |
|------|--------|------|-----------|
| Task 1 — login routing | f2fd4e5 | feat | Login routing por role via RPC is_proprietario |
| Task 2 — proxy guard | 928a485 | feat | proxy.js guard /portal com matcher expandido |
| Task 3 — portal shell | 7d4f7d0 | feat | Portal layout Tailwind + rota /portal/dashboard shell visual |

## Self-Check: PASSED

- `src/app/login/page.js`: FOUND
- `src/proxy.js`: FOUND
- `src/app/portal/layout.js`: FOUND
- `src/app/portal/dashboard/page.js`: FOUND
- `src/components/features/portal/PortalDashboard.js`: FOUND
- Commit f2fd4e5: FOUND
- Commit 928a485: FOUND
- Commit 7d4f7d0: FOUND
