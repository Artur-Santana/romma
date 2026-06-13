---
phase: 17
slug: funda-o-tokens-mobile-modal-fixes-infra
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-06-13
---

# Phase 17 — Validation Strategy

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

*(Planner fills this from PLAN.md task IDs. Note: most Phase 17 deliverables are CSS tokens, layout-shell CSS, migrations, and config — many verify via `grep`/`build`/SQL assertions rather than unit tests.)*

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 17-01-01 | 01 | 1 | REFINO-01 | — | N/A | source | `grep -- '--rt-metric' src/app/globals.css` | ✅ | ⬜ pending |

---

## Wave 0 Requirements

*Existing infrastructure covers all phase requirements.* (Vitest + Playwright already configured from v1.1 Phase 15.)

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Scroll mobile 375px sem estourar nas 3 cascas | REFINO-03 | Comportamento visual de viewport | Abrir dashboard/portal/`/unidades` em 375px, rolar, conferir que barra inferior fica visível e conteúdo não estoura |
| Modal centralizado full-viewport no mobile | REFINO-04 | Posicionamento visual | Abrir modal de Locatários/ConfirmDialog em 375px, conferir centralização |
| Animação visível em render pausado/print | REFINO-05 | Render estático | Print/screenshot de página com `.romma-page`, conferir conteúdo visível (sem opacity:0) |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 60s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
