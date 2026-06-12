---
phase: 12
slug: escala-desktop-tema
status: verified
threats_open: 0
asvs_level: 1
created: 2026-06-12
---

# Phase 12 — Security

> Per-phase security contract: threat register, accepted risks, and audit trail.
> Mode: retroactive-STRIDE (no PLAN.md — register built from implementation files).

---

## Trust Boundaries

| Boundary | Description | Data Crossing |
|----------|-------------|---------------|
| Browser → Server | Next.js App Router renders HTML/CSS | Static CSS tokens only — no user data |
| DOM → CSS | `[data-theme]` blocks in globals.css | Presentation only — no data |

---

## Threat Register

| Threat ID | Category | Component | Disposition | Mitigation | Status |
|-----------|----------|-----------|-------------|------------|--------|
| T-12-01 | Information Disclosure | ThemeToggle (dev tool) | Mitigate | `ThemeToggle.js` deleted in plan 06. No `data-theme` applied anywhere in source. Stronger than gate — elimination. | closed |
| T-12-02 | Tampering | Theme state persistence | Mitigate | No localStorage/sessionStorage/cookie write path exists. ThemeToggle used `useState` only (confirmed). | closed |
| T-12-03 | Tampering | `[data-theme]` CSS blocks | Accept | 4 blocks remain in globals.css as unreachable dead CSS. No JS applies `data-theme` to DOM. Dead CSS is not attack surface. | closed |
| T-12-04 | Information Disclosure | Typography edits (6 files) | Mitigate | Grep for `dangerouslySetInnerHTML`, `innerHTML`, `eval`, `document.write` returned no matches. All changes are CSS class substitutions only. | closed |
| T-12-05 | Information Disclosure | FIX-01-A/B readability | Mitigate | `page.js:203` and `LocatariosDesktop.js:206` confirmed `text-[14px]` (commit `689b34c`). Remaining 13px are EXEMPT (CTA uppercase+tracking, mono error label, mobile scope). | closed |

---

## Accepted Risks Log

| Risk ID | Threat Ref | Rationale | Accepted By | Date |
|---------|------------|-----------|-------------|------|
| R-12-01 | T-12-03 | `[data-theme]` palette blocks remain as dead CSS in globals.css. No activation path in JS. Removing them is cleanup scope (Phase 13+), not a security risk. | auditor | 2026-06-12 |

---

## Security Audit Trail

| Audit Date | Threats Total | Closed | Open | Run By |
|------------|---------------|--------|------|--------|
| 2026-06-12 | 5 | 5 | 0 | gsd-security-auditor (retroactive-STRIDE) |

---

## Sign-Off

- [x] All threats have a disposition (mitigate / accept / transfer)
- [x] Accepted risks documented in Accepted Risks Log
- [x] `threats_open: 0` confirmed
- [x] `status: verified` set in frontmatter

**Approval:** verified 2026-06-12
