---
plan: 08-01
phase: 08-bug-fixes
status: complete
executor: orchestrator-inline
completed: 2026-06-06
---

# Plan 08-01 Summary — Red-Phase E2E Tests (Wave 0)

## What Was Built

Added RED-phase E2E test scenarios to 3 spec files. These scenarios prove each of the 4 bugs exists before fixes are applied, preventing false-green verification.

## Files Changed

- `e2e/crud.spec.js` — Added BUG-01 (revogar) and BUG-02 (split erro delete/edit) test suites
- `e2e/dashboard-smoke.spec.js` — Added BUG-04 (← Voltar link) test describe
- `e2e/auth-confirm.spec.js` — Added BUG-03 (status_convite transition) test describe

## Key Details

### BUG-01 Tests (crud.spec.js)
- `BUG-01 — revogar locatário pendente sem contrato remove a linha` — Creates real auth user + locatarios row without contract, clicks REVOGAR, asserts row disappears. Status: RED in current code (action still needs fix but happy path should work once BUG-03 is fixed).
- `BUG-01 — erro inline ao revogar locatário com contrato vinculado` — Creates real auth user + locatarios row WITH active contract (FK), clicks REVOGAR, asserts inline error message appears. **Status: RED** — current code uses `alert()` not inline error, action doesn't check FK.

### BUG-02 Test (crud.spec.js)
- `BUG-02 — erro de delete não vaza para o form de edição` — Attempts to delete 'Sala 101' (FK blocks), then opens edit form for another unit and asserts no error appears inside the card. **Status: RED** — shared `erro` state leaks into card via `erro={erro}` prop.

### BUG-03 Test (auth-confirm.spec.js)
- `BUG-03 — status_convite vira "aceito" após verifyOtp com token real de invite` — Creates user with `email_confirm: false`, generates real invite token via `admin.auth.admin.generateLink({ type: 'invite', email })`, navigates to `/auth/confirm?token_hash=...&type=invite`, queries `locatarios.status_convite` after redirect. **Status: RED** — `route.js` never executes the UPDATE.
- If `generateLink` fails explicitly throws with message noting manual verification needed (no trivial-pass masking).

### BUG-04 Test (dashboard-smoke.spec.js)
- `BUG-04 — /unidades tem link "← Voltar" que navega para home` — Navigates to `/unidades` without auth, looks for `<Link>` element matching "Voltar", clicks it, asserts URL navigates to "/". **Status: RED** — current code has only a `<span>` without a link.

## Self-Check

- [x] All test titles contain the literal bug ID (BUG-01, BUG-02, BUG-03, BUG-04)
- [x] `--list` shows all 4 bug scenarios: 2 for BUG-01, 1 for BUG-02, 1 for BUG-03, 1 for BUG-04
- [x] BUG-01 (erro inline) and BUG-02 scenarios are RED against current code (proven by code inspection: alert() and shared erro state)
- [x] BUG-04 scenario is RED against current code (proven: only a `<span>` exists, no `<Link>`)
- [x] BUG-03 uses real admin generateLink token (not trivial/mocked)
- [x] BUG-01 fixture for revogar success uses real auth user via createUser (email_confirm: true)
- [x] Plans 02/03/04 can now reference these scenarios by `-g "BUG-01"` / `-g "BUG-02"` etc.

## Issues / Deviations

None. All scenarios implemented as specified in the plan.

## key-files

### created
- `e2e/crud.spec.js` (modified — BUG-01 and BUG-02 suites added)
- `e2e/dashboard-smoke.spec.js` (modified — BUG-04 suite added)
- `e2e/auth-confirm.spec.js` (modified — BUG-03 suite added with admin client)
