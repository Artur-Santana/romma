---
phase: 18
slug: acesso-login-cadastro-redefinir
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-06-13
---

# Phase 18 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest (unit) + Playwright (E2E) |
| **Config file** | vitest.config / playwright.config |
| **Quick run command** | `npx vitest run` |
| **Full suite command** | `npm run build && npx vitest run` |
| **Estimated runtime** | ~60 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npx vitest run`
- **After every plan wave:** Run `npm run build && npx vitest run`
- **Before `/gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** 60 seconds

---

## Per-Task Verification Map

*(Planner fills task IDs from PLAN.md. Auth-form logic — phone mask digit-strip, password policy regex, validation gate — are unit-testable pure functions. Visual layout/redesign is manual UAT.)*

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 18-XX-XX | XX | 1 | ACESSO-03 | — | password policy rejects weak | unit | `npx vitest run` | ❌ W0 | ⬜ pending |

---

## Wave 0 Requirements

- [ ] Unit test file for phone mask formatter (format + strip-to-digits)
- [ ] Unit test file for password policy validator (≥6 + uppercase + number)
- [ ] Unit test for signup validation gate (required, email, phone ≥10 digits, passwords match)

*Vitest + Playwright already configured (v1.1 Phase 15).*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Split-panel layout variante A (desktop) + stack mobile | ACESSO-01 | Visual layout | Abrir /login, /signup, /auth/reset-password em desktop e 375px |
| Bracket button state machine ([>]→[···]→[OK] 200) | ACESSO-02 | Animated UI state | Login com credenciais válidas, observar transição do botão |
| Cadastro completo + banner "Verifique seu e-mail" + persiste sobrenome/telefone | ACESSO-03 | E2E auth + DB write | Cadastrar, confirmar banner, verificar proprietarios row tem nome/sobrenome/telefone |
| Redefinir senha envia link + confirmação | ACESSO-04 | Email flow | Solicitar reset, confirmar mensagem de sucesso |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 60s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
