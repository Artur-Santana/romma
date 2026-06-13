---
phase: 16-fechamento-idor-mt02
verified: 2026-06-12T00:00:00Z
status: passed
score: 6/6 must-haves verified
overrides_applied: 0
re_verification: false
---

# Phase 16: Fechamento IDOR MT-02 — Verification Report

**Phase Goal:** TODAS as Server Actions de escrita escopeadas por proprietario_id — fechar os 4 vetores IDOR restantes achados no milestone audit v1.1.
**Verified:** 2026-06-12
**Status:** passed
**Re-verification:** No — initial verification

---

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | criarUnidade rejects (404) an edificio_id not owned by the authenticated Proprietário before any insert | VERIFIED | `unidades.js` line 29-31: `.eq('edificio_id', edificio_id).eq('proprietario_id', user.id).single()` followed by `return { status: 404 }` if no row; `insert` never reached on cross-tenant |
| 2 | criarContrato rejects (404) a unidade_id whose edificio is not owned by the authenticated Proprietário before any insert | VERIFIED | `contratos.js` lines 30-36: 2-hop fetch (unidades → edificios) with `.eq('proprietario_id', user.id)` gating the insert at line 38 |
| 3 | editarContrato rejects (404) a contrato not owned by the authenticated Proprietário before any update | VERIFIED | `contratos.js` lines 62-72: 3-hop fetch (contratos → unidades → edificios) with `.eq('proprietario_id', user.id)` gating the update at line 74 |
| 4 | marcarParcelaComoPaga authGuard returns {user} + validates ownership (parcela → contrato → unidade → edificio → proprietario_id) | VERIFIED | `parcelas.js` lines 9-15: authGuard `return { user }`; lines 23-37: 4-hop fetch chain scoping the update at line 39 |
| 5 | Unit tests cover each Action: happy + erro + cross-tenant block (D-08 assertion included) | VERIFIED | `unidades.test.js` criarUnidade describe: 5 cases; `contratos.test.js` criarContrato + editarContrato describes: 5 cases each; `parcelas.test.js` marcarParcelaComoPaga describe: 5 cases |
| 6 | `npx vitest run` and `npx playwright test --list` pass | VERIFIED | vitest: PASS (47) FAIL (0) exit 0; playwright --list: exit 0 |

**Score:** 6/6 truths verified

---

## Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `src/actions/unidades.js` | criarUnidade ownership pre-check (edificio_id → proprietario_id) | VERIFIED | Line 29-31: ownership check with `.eq('proprietario_id', user.id)` present before insert |
| `src/actions/contratos.js` | criarContrato + editarContrato ownership pre-checks | VERIFIED | 4 occurrences of `.eq('proprietario_id', user.id)` — linha 35 (criarContrato), 71 (editarContrato), 97 (cancelarContrato), 140 (encerrarContrato) |
| `src/actions/parcelas.js` | marcarParcelaComoPaga authGuard {user} + 4-hop ownership | VERIFIED | authGuard returns `{ user }` (line 14); 4-hop chain (lines 23-37) present |
| `test/unit/actions/unidades.test.js` | criarUnidade 5-case describe block | VERIFIED | Lines 176-232: happy, cross-tenant, validation 400, auth 401, D-08 assertion |
| `test/unit/actions/contratos.test.js` | criarContrato + editarContrato describe blocks (5 cases each) | VERIFIED | Lines 198-303: both describes present with full case coverage |
| `test/unit/actions/parcelas.test.js` | marcarParcelaComoPaga 4-hop describe (5 cases) | VERIFIED | Lines 72-115: full coverage including 4-hop helper and D-08 assertion |
| `test/helpers/supabaseMock.js` | `.in()` method added to builder chain | VERIFIED | Line 36: `in: vi.fn()` added; line 57: `builder.in.mockReturnValue(builder)` wired; resetAll at line 77 re-wires it |

---

## Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `criarUnidade` | `edificios.proprietario_id` | `supabaseAdmin fetch-then-verify before insert` | WIRED | Line 29-31: `.eq('edificio_id', edificio_id).eq('proprietario_id', user.id).single()` — insert only reached if edificio row owned by caller |
| `criarContrato` | `edificios.proprietario_id` | `fetch chain unidade→edificio` | WIRED | Lines 30-36: 2-hop chain; `.eq('proprietario_id', user.id)` at line 35 gates insert at line 38 |
| `editarContrato` | `edificios.proprietario_id` | `fetch chain contrato→unidade→edificio` | WIRED | Lines 62-72: 3-hop chain; `.eq('proprietario_id', user.id)` at line 71 gates update at line 74 |
| `marcarParcelaComoPaga` | `edificios.proprietario_id` | `fetch chain parcela→contrato→unidade→edificio` | WIRED | Lines 23-37: 4-hop chain; `.eq('proprietario_id', user.id)` at line 36 gates update at line 39 |

---

## Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|-------------|-------------|--------|----------|
| MT-03 | 16-01, 16-02, 16-03 | Fechar vetores IDOR restantes: criarUnidade, criarContrato, editarContrato, marcarParcelaComoPaga escopeados por proprietario_id | SATISFIED | All 4 actions have ownership pre-checks confirmed by code read and vitest run (47/47 passing) |

**MT-03 status in REQUIREMENTS.md:** `[ ]` checkbox not yet marked complete (line 25), but the implementation is done. The checkbox is an administrative artifact — the code evidence satisfies the requirement. The REQUIREMENTS.md tracking row at line 113 shows "Planned (16-01/02/03)" indicating the tracker was not updated post-completion, but this is a documentation lag, not a gap in the implementation.

---

## Anti-Patterns Found

None. Scan across all 6 phase-modified files (3 action files, 3 test files) found zero TBD/FIXME/XXX/TODO/HACK/PLACEHOLDER markers. No return null, return {}, or empty handler stubs found. No hardcoded empty data in paths that feed rendering.

---

## Behavioral Spot-Checks

| Behavior | Command | Result | Status |
|----------|---------|--------|--------|
| Full vitest suite passes | `npx vitest run` | PASS (47) FAIL (0) exit 0 | PASS |
| Playwright config parses without error | `npx playwright test --list` | exit 0 | PASS |
| proprietario_id filter present in all 4 target actions | `grep -n eq('proprietario_id', user.id)` | 8 matches across 3 files (unidades: 3, contratos: 4, parcelas: 1) | PASS |
| authGuard returns {user} in all 3 action files | `grep -n "return { user }"` | 3 matches (one per file) | PASS |
| contratos.js has >= 4 proprietario_id checks | `grep -c ...` | 4 | PASS |

---

## Probe Execution

No conventional `scripts/*/tests/probe-*.sh` probes exist for this phase. No probes declared in PLAN frontmatter. Skipped.

---

## Human Verification Required

None. All 6 success criteria are verifiable through code inspection and unit test execution. Cross-tenant blocking is proven by unit mocks (the single-instance nature of this TCC demo makes live cross-tenant testing structurally impossible, and the unit tests are the accepted cross-tenant proof per phase design).

---

## Summary

Phase 16 fully achieves its goal. All four IDOR write vectors are closed:

- **criarUnidade** (1-hop): edificio ownership check gates insert. Code at `unidades.js:29-31`.
- **criarContrato** (2-hop): unidade→edificio ownership chain gates insert. Code at `contratos.js:30-36`.
- **editarContrato** (3-hop): contrato→unidade→edificio ownership chain gates update. Code at `contratos.js:62-72`.
- **marcarParcelaComoPaga** (4-hop): parcela→contrato→unidade→edificio ownership chain gates update. Code at `parcelas.js:23-37`.

authGuard returns `{ user }` in all three action files (confirmed at the source level, not assumed from SUMMARY). The supabaseMock was extended with `.in()` to support the parcelas update chain. All 47 unit tests pass with zero failures. Playwright config parses cleanly. No debt markers exist in any phase-modified file.

The only non-critical observation: `REQUIREMENTS.md` MT-03 checkbox (`[ ]`) and tracker row still read "Planned" rather than complete — this is a documentation lag with no impact on the implementation.

---

_Verified: 2026-06-12_
_Verifier: Claude (gsd-verifier)_
