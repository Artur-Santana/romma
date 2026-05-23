---
phase: 2
slug: portal-do-locat-rio
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-05-22
---

# Phase 2 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Playwright ^1.60.0 |
| **Config file** | `playwright.config.js` |
| **Quick run command** | `npx playwright test e2e/portal.spec.js` |
| **Full suite command** | `npx playwright test` |
| **Estimated runtime** | ~3-5 min (build + test) |

---

## Sampling Rate

- **After every task commit:** Run `npx playwright test e2e/portal.spec.js`
- **After every plan wave:** Run `npx playwright test`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** ~300 seconds (build-heavy — group assertions per spec to minimize rebuilds)

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 02-PORT-01 | login-routing | 1 | PORT-01 | T-02-auth | Locatário chega em /portal/dashboard; Proprietário chega em /dashboard | E2E | `npx playwright test e2e/portal.spec.js -g "PORT-01"` | ❌ W0 | ⬜ pending |
| 02-PORT-02 | portal-ui | 2 | PORT-02 | — | ContratoCard exibe unidade/valor/datas/status do contrato ativo | E2E | `npx playwright test e2e/portal.spec.js -g "PORT-02"` | ❌ W0 | ⬜ pending |
| 02-PORT-03 | portal-ui | 2 | PORT-03 | — | ParcelsTable exibe paga/pendente/vencida; status futura não aparece | E2E | `npx playwright test e2e/portal.spec.js -g "PORT-03"` | ❌ W0 | ⬜ pending |
| 02-VIS-03 | portal-ui | 2 | VIS-03 | — | N/A | Manual (visual) | — | manual-only | ⬜ pending |
| 02-auth-redirect | login-routing | 1 | PORT-01 | T-02-auth | auth-redirect.spec.js teste 1.2 atualizado: Locatário → /portal/dashboard | E2E | `npx playwright test e2e/auth-redirect.spec.js` | ✅ exists | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `e2e/portal.spec.js` — stubs para PORT-01, PORT-02, PORT-03
- [ ] `e2e/global-teardown.js` — cleanup FK-aware (parcelas → contratos → locatarios → unidades → edificios)
- [ ] `e2e/seed.mjs` — expandir com dados do locatário de teste
- [ ] `playwright.config.js` — adicionar `globalTeardown: './e2e/global-teardown.js'`
- [ ] `e2e/auth-redirect.spec.js` — atualizar teste 1.2: waitForURL de `/` para `**/portal/dashboard`

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Portal usa paleta Obsidian Blueprint (roxo/dourado, fontes Hanken Grotesk/Space Grotesk) | VIS-03 | Verificação visual — sem assertion automática de CSS vars | Abrir /portal/dashboard com Locatário logado; checar paleta e tipografia via DevTools |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 300s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
