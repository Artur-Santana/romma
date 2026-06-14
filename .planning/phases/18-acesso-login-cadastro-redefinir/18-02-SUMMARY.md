---
phase: 18
plan: "02"
subsystem: auth-form
tags: [tdd, unit-tests, validation, phone-mask, password-policy]
dependency_graph:
  requires: []
  provides:
    - "src/lib/auth-form.js — maskPhone, soDigitos, validarSenha, validarCadastro"
  affects:
    - "src/app/signup/page.js (imports in Plan 03)"
    - "src/app/auth/reset-password/page.js (imports validarSenha in Plan 04)"
    - "Phase 23 Locatários — canonical maskPhone pattern reuse"
tech_stack:
  added: []
  patterns:
    - "Pure ES module with named exports (no framework dependencies)"
    - "Progressive phone masking without regex — slice-based for predictable partial input"
    - "Combined single-message password policy (all rules → same string)"
    - "Rule-ordered validation gate returning first failing message"
key_files:
  created:
    - src/lib/auth-form.js
    - test/unit/auth-form.test.js
  modified: []
decisions:
  - "Used progressive slice-based maskPhone instead of UI-SPEC regex — regex produced '(11) ' for 2-digit partial input but plan specifies '(11'; slice approach matches all PLAN behavior cases exactly"
  - "Single combined policy message for all validarSenha failure branches (matches UI-SPEC Validation Contract table and CONTEXT.md locked decision)"
metrics:
  duration: "~10 minutes"
  completed: "2026-06-14"
  tasks_completed: 1
  files_created: 2
  files_modified: 0
---

# Phase 18 Plan 02: Auth-Form Utilities (TDD) Summary

Pure form-logic module `src/lib/auth-form.js` with 4 tested exports (progressive BR phone mask, digit-strip, password policy gate, signup validation gate) built TDD — RED commit then GREEN implementation.

---

## What Was Built

- **`src/lib/auth-form.js`** — 4 named exports, zero dependencies (no React, Supabase, `'use client'`, or `'server-only'`). Importable by Vitest in `node` environment directly.
- **`test/unit/auth-form.test.js`** — 22 unit tests covering all exported functions, including ordering assertion (phone checked before password in `validarCadastro`).

### Export Behavior

| Export | Behavior |
|--------|----------|
| `maskPhone(value)` | Progressive BR phone mask — `(dd`, `(dd) dddddd`, `(dd) dddd-dddd` (10-digit), `(dd) ddddd-dddd` (11-digit). Strips non-digits, caps at 11. |
| `soDigitos(value)` | Strips all non-digits. `"(11) 99999-8888"` → `"11999998888"`. |
| `validarSenha(senha)` | Returns `null` when valid (≥6 chars + ≥1 uppercase + ≥1 number), else returns `"A senha deve ter no mínimo 6 caracteres, 1 letra maiúscula e 1 número."` |
| `validarCadastro(form)` | Returns `null` or first failing message in order: nome/sobrenome → email → telefone → senha → confirmarSenha. |

---

## TDD Gate Compliance

| Gate | Commit | Status |
|------|--------|--------|
| RED (failing test) | `6fff3d8` — `test(18-02): add failing unit tests for auth-form utilities` | PASS |
| GREEN (implementation) | `8cc4f70` — `feat(18-02): implement pure auth-form utilities` | PASS |
| REFACTOR | Not needed — code is already minimal and clean | SKIPPED |

---

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Deviation] Progressive slice-based maskPhone instead of UI-SPEC regex**
- **Found during:** GREEN implementation
- **Issue:** The UI-SPEC regex (`(\d{2})(\d{4})(\d{0,4})` → `($1) $2-$3`) with trailing-hyphen strip produces `"(11) "` for 2-digit input, but the PLAN `<behavior>` section specifies `maskPhone("11")` → `"(11"`. The two specs are inconsistent.
- **Fix:** Implemented progressive slice-based masking that satisfies all PLAN behavior test cases exactly. The UI-SPEC regex approach was used as inspiration for the threshold logic (≤10 vs 11 digits) but the string construction uses slice for predictable partial-input behavior.
- **Files modified:** `src/lib/auth-form.js`
- **Commit:** `8cc4f70`

---

## Verification

```
npm run test:unit
Test Files  7 passed (7)
     Tests  120 passed (120)
```

All 22 auth-form tests pass. All 98 pre-existing tests continue to pass.

---

## Known Stubs

None — this is a pure logic module with no UI rendering.

---

## Threat Flags

None — this module has no I/O, no network calls, no secret handling. All threat register items (T-18-05, T-18-06, T-18-SC) are `accept` disposition per plan.

---

## Self-Check: PASSED

- `src/lib/auth-form.js` — FOUND ✓
- `test/unit/auth-form.test.js` — FOUND ✓
- RED commit `6fff3d8` — FOUND ✓
- GREEN commit `8cc4f70` — FOUND ✓
- `npm run test:unit` — exits 0, 120 tests ✓
