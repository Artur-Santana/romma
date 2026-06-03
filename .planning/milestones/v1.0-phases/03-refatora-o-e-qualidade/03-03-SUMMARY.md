---
phase: 03-refatora-o-e-qualidade
plan: 03
subsystem: ui
tags: [supabase-auth, next-js, logout, portal-locatario]

requires:
  - phase: 02-portal-do-locatario
    provides: PortalDashboard.js e layout do portal com auth guard

provides:
  - LogoutButton Client Component com signOut + redirect /login
  - Botão "Sair" renderizado no header do PortalDashboard (D-06)

affects: [portal-do-locatario, auth]

tech-stack:
  added: []
  patterns: [client component com supabase-browser, loading/error inline state]

key-files:
  created:
    - src/components/ui/LogoutButton.js
  modified:
    - src/components/features/portal/PortalDashboard.js

key-decisions:
  - "Label 'Sair' (não Logout/Desconectar) — terminologia UI-SPEC respeitada"
  - "supabase-browser client instanciado no escopo do módulo (padrão login/page.js)"
  - "Erro inline em --danger-fg abaixo do botão, sem modal de confirmação (logout não destrutivo)"

patterns-established:
  - "LogoutButton: 'use client' + createClient() módulo-scoped + useState loading/erro + handleLogout async"

requirements-completed: [DEPL-03]

duration: ~15min
completed: 2026-05-25
---

# Phase 03-03: Logout Button Summary

**Botão "Sair" no portal do Locatário via LogoutButton.js: signOut Supabase + redirect /login, com loading state e erro inline**

## Performance

- **Duration:** ~15 min
- **Completed:** 2026-05-25
- **Tasks:** 2 auto + 1 checkpoint (human-verify)
- **Files modified:** 2

## Accomplishments
- `LogoutButton.js` criado como Client Component com `supabase.auth.signOut()` e `router.push('/login')`
- Botão renderizado no header top-right do PortalDashboard, alinhado com eyebrow row
- Loading state "Saindo..." durante signOut; erro inline "Erro ao sair. Recarregue a página." em `--danger-fg`
- Checkpoint humano confirmado: botão visível, click redireciona, sessão encerrada impede volta ao portal

## Task Commits

1. **Task 1: Criar LogoutButton.js** - `da259dc` (feat)
2. **Task 2: Renderizar LogoutButton no PortalDashboard** - `6e777f5` (feat)

## Files Created/Modified
- `src/components/ui/LogoutButton.js` — Client Component de logout (novo)
- `src/components/features/portal/PortalDashboard.js` — import + render de LogoutButton no header

## Decisions Made
- Label "Sair" conforme UI-SPEC (não Logout/Desconectar/Encerrar sessão)
- `createClient()` instanciado no escopo do módulo, igual ao padrão de `login/page.js`
- Sem modal de confirmação — logout não é destrutivo de dados (UI-SPEC)

## Deviations from Plan
Nenhum — plano executado conforme especificado.

## Issues Encountered
Nenhum.

## Next Phase Readiness
- D-06 completo. Portal do Locatário tem fluxo de saída funcional.
- 03-04 pode prosseguir: audit gate REF-01..04 + decisão npm audit DEPL-03.

---
*Phase: 03-refatora-o-e-qualidade*
*Completed: 2026-05-25*
