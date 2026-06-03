---
phase: 7
slug: ajustes-finais-pre-banca
status: draft
nyquist_compliant: true
wave_0_complete: true
created: 2026-06-02
---

# Phase 7 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Playwright 1.60.0 |
| **Config file** | `playwright.config.js` |
| **Quick run command** | `npx playwright test e2e/auth-confirm.spec.js e2e/dashboard-smoke.spec.js` |
| **Full suite command** | `npm run test:e2e` |
| **Estimated runtime** | ~30 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npx playwright test e2e/dashboard-smoke.spec.js`
- **After every plan wave:** Run `npm run test:e2e`
- **Before `/gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** 60 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 7-01-01 | 01 | 1 | FIX-01 | T-7-token-expiry | verifyOtp verifica `error` antes de redirecionar | Manual (email real) + smoke | `npx playwright test e2e/auth-confirm.spec.js` | ❌ W0 | ⬜ pending |
| 7-01-02 | 01 | 1 | UX-01 | — | N/A | E2E smoke | `npx playwright test e2e/dashboard-smoke.spec.js` | ✅ | ⬜ pending |
| 7-01-03 | 01 | 1 | UX-02 | — | N/A | Manual/visual | — | N/A | ⬜ pending |
| 7-01-04 | 01 | 1 | UX-03 | — | N/A | E2E smoke | `npx playwright test e2e/dashboard-smoke.spec.js` | ✅ | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `e2e/dashboard-smoke.spec.js` — extender com: verificar ausência de "Acessar como Locatário" + presença do botão "Sair"
- [ ] `e2e/auth-confirm.spec.js` — smoke básico: GET `/auth/confirm` sem params → redirect para `/login`, não 500

*Frameworks já instalados — sem instalação adicional necessária.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| `/auth/confirm` aceita token_hash real e cria sessão | FIX-01 | Requer envio de email real de convite (Supabase) | Convidar locatário de teste, clicar no link do email, verificar redirect para `/portal/dashboard` e sessão ativa |
| Skeleton aparece antes dos dados carregarem | UX-02 | Visual/timing — difícil automatizar de forma confiável | Abrir dashboard com network throttling (Chrome DevTools → Slow 3G), confirmar skeleton visível |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 60s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
