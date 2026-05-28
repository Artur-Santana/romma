---
phase: 4
slug: polimento-visual-p-blico
status: ready
nyquist_compliant: true
wave_0_complete: true
created: 2026-05-25
---

# Phase 4 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Playwright ^1.60.0 (existente) + ESLint (lint) |
| **Config file** | `playwright.config.js` (existente) |
| **Quick run command** | `npm run lint` |
| **Full suite command** | `npm run lint && npm run build` |
| **Estimated runtime** | ~30 seconds (lint) / ~90 seconds (build) |

---

## Sampling Rate

- **After every task commit:** Run `npm run lint`
- **After every plan wave:** Run `npm run lint && npm run build`
- **Before `/gsd:verify-work`:** Full suite deve ser verde + inspeção visual das 3 páginas afetadas
- **Max feedback latency:** 30 seconds (lint)

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| D-01 JetBrains removal | — | 1 | VIS-01 | — | N/A | grep | `grep -r 'JetBrains\|jetbrains' src/ --include="*.js" --include="*.css"` (expected: 0 matches) | N/A | ⬜ pending |
| D-02 img→Image page.js | — | 1 | VIS-01 | — | N/A | grep | `grep -c '<img' src/app/page.js` (expected: 0) | N/A | ⬜ pending |
| D-03 img→Image unidades | — | 1 | VIS-01 | — | N/A | grep | `grep -rn '<img' src/app/unidades/` (expected: 0 matches) | N/A | ⬜ pending |
| D-04 Tailwind v4 no inline | — | 1 | VIS-01 | — | N/A | grep | `grep -c 'style={{' src/app/unidades/page.js` (expected: 0 or button-reset only) | N/A | ⬜ pending |
| D-09 Editar Locatário | — | 2 | VIS-01 | — | editarLocatario whitelist campos existente | manual | Inspeção visual: botão "Editar" aparece em LocatariosDesktop | N/A | ⬜ pending |
| Build gate | — | final | VIS-01 | — | N/A | build | `npm run lint && npm run build` | N/A | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

Nenhum — infraestrutura de lint e build existente cobre todas as verificações automáticas desta fase.

*Existing infrastructure covers all phase requirements.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Visual fidelity Obsidian Blueprint em /unidades | VIS-01 | Playwright não cobre fidelidade visual (fase 5) | Abrir /unidades, verificar paleta roxo #370085 + dourado #C5A059, layout de cards, dark background |
| UnidadeDetailSheet bottom sheet mobile | VIS-01 | Interação visual/layout | Clicar num card em mobile viewport, verificar bottom sheet com overlay |
| UnidadeCard dashboard modo edição inline | VIS-01 | CRUD visual interativo | Abrir dashboard/unidades, clicar editar num card, verificar modo edição inline com shadcn inputs |
| Botão Editar Locatário funcional | VIS-01 | Fluxo de formulário completo | Abrir dashboard/locatarios, clicar editar, submeter form, verificar persistência |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 30s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
