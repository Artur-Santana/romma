---
phase: 03
slug: refatora-o-e-qualidade
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-05-24
---

# Phase 03 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Playwright ^1.60.0 (E2E only — esta fase usa lint/grep, não playwright) |
| **Config file** | `playwright.config.js` |
| **Quick run command** | `npm run lint` |
| **Full suite command** | `npm run lint && npm run build` |
| **Estimated runtime** | ~30 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npm run lint` — confirma que os errors foram resolvidos
- **After every plan wave:** Run `npm run lint && npm run build`
- **Before `/gsd:verify-work`:** `npm run lint && npm run build && npm audit --omit=dev` (critério conforme decisão checkpoint 03-04)
- **Max feedback latency:** ~30 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| T1 | 03-01 | 1 | DEPL-03 | T-03-01 (IDOR) | cancelarContrato/encerrarContrato derivam unidade_id server-side via query autenticada | grep | `grep -n "unidade_id" src/actions/contratos.js` espera resultado de query, não de parâmetro | N/A | pending |
| T2 | 03-01 | 1 | DEPL-03 | T-03-02 (mass assign) | editarLocatario usa allowlist explícita de campos permitidos | grep | `grep -n "nome_razao_social\|tipo\|documento\|email\|telefone" src/actions/locatarios.js` | N/A | pending |
| T1 | 03-02 | 1 | DEPL-03 | — | GestaoEdificios.js sem erro react-hooks/set-state-in-effect | lint | `npx eslint src/components/features/GestaoEdificios.js` exits 0 | N/A | pending |
| T2 | 03-02 | 1 | DEPL-03 | — | Unidades.js sem erro react-hooks/set-state-in-effect | lint | `npx eslint src/components/features/Unidades.js` exits 0 | N/A | pending |
| T1 | 03-03 | 1 | DEPL-03 | T-03-03 (session) | LogoutButton.js chama signOut via supabase-browser.js + router.push('/login') | grep | `grep -n "signOut\|router.push" src/components/ui/LogoutButton.js` | LogoutButton.js (novo) | pending |
| T2 | 03-03 | 1 | DEPL-03 | — | PortalDashboard.js importa e renderiza LogoutButton | grep | `grep -n "LogoutButton" src/components/features/portal/PortalDashboard.js` | N/A | pending |
| T1 | 03-04 | 2 | REF-01, REF-02, REF-03, REF-04 | — | Gates de grep confirmam cumprimento REF-01..04 | grep | Ver 03-04 Task 1 acceptance_criteria | N/A | pending |
| T2 | 03-04 | 2 | DEPL-03 | T-03-SC | lint sem errors; build passa; ROADMAP documenta decisão npm audit | lint+build | `npm run lint && npm run build` | N/A | pending |

---

## Wave 0 Gaps

Nenhum — os fixes desta fase são validáveis via lint + grep. Não são necessários novos arquivos de teste Playwright. Os testes E2E existentes (Fase 2) continuam cobrindo os fluxos de autenticação e portal.

---

## Notes

- `no-img-element` warnings em `src/app/page.js` são **esperados e deferidos** para Fase 4 (D-02). Não devem ser tratados como failures nesta fase.
- DEPL-03 npm audit: critério definitivo decidido pelo usuário via `checkpoint:decision` em 03-04-PLAN.md Task 2. As vulnerabilidades HIGH de next.js 16.x não têm fix disponível no 16.x estável.
