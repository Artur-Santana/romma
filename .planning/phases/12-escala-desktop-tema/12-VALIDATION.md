---
phase: 12
slug: escala-desktop-tema
status: verified
nyquist_compliant: true
wave_0_complete: true
created: 2026-06-12
---

# Phase 12 — Validation Strategy

> Per-phase validation contract — CSS/typography phase.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Playwright E2E |
| **Config file** | `playwright.config.js` |
| **Quick run command** | `npx playwright test tema desktop-scale --project=chromium` |
| **Full suite command** | `npx playwright test --project=chromium` |
| **Estimated runtime** | ~30 seconds |

---

## Sampling Rate

- **After every task commit:** `npx playwright test tema desktop-scale --project=chromium`
- **After every plan wave:** Full suite
- **Before `/gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** ~30 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Requirement | Threat Ref | Test Type | Automated Command | File | Status |
|---------|------|-------------|------------|-----------|-------------------|------|--------|
| 12-01-04 | 01 | T-12-01: ThemeToggle ausente em produção | T-12-01 | E2E | `npx playwright test tema --project=chromium` | `e2e/tema.spec.js` | ✅ green |
| 12-01-02 | 01 | UX-01: max-width wrapper dashboard ~1570px centralizado | — | E2E | `npx playwright test desktop-scale --project=chromium` | `e2e/desktop-scale.spec.js` | ✅ green |
| 12-02 | 02 | D-08: dados de células tabelas Contratos/Parcelas/Locatários >=14px | — | E2E | `npx playwright test desktop-scale --project=chromium` | `e2e/desktop-scale.spec.js` | ✅ green |
| 12-03 | 03 | D-08: dados Overview, Edifícios, UnidadeCard >=14px | — | E2E | `npx playwright test desktop-scale --project=chromium` | `e2e/desktop-scale.spec.js` | ✅ green |
| 12-04 | 04 | THEME-02: paletas claras ultra-violet/cloudy-sky com overrides | — | manual | — | — | ✅ accepted (CSS-only, sem ativação JS) |
| 12-05 | 05 | D-02: Obsidian vencedor; decisão registrada | — | manual | — | — | ✅ accepted (decisão editorial) |
| 12-06-01 | 06 | D-02: ThemeToggle removido; data-theme nunca aplicado | T-12-01 | E2E | `npx playwright test tema --project=chromium` | `e2e/tema.spec.js` | ✅ green |
| 12-06-02 | 06 | FIX-01-A: banner vencimento text >=14px | — | E2E | `npx playwright test desktop-scale --project=chromium` | `e2e/desktop-scale.spec.js` | ✅ green |
| 12-06-02 | 06 | FIX-01-B: callout convite text >=14px | — | E2E | `npx playwright test desktop-scale --project=chromium` | `e2e/desktop-scale.spec.js` | ✅ green |

---

## Wave 0 Requirements

Existing infrastructure covers all phase requirements. No new test scaffolding needed.

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Paletas ultra-violet e cloudy-sky visualmente corretas | THEME-02 | CSS-only, sem ativação JS — não há mecanismo para ligar as paletas sem ThemeToggle | Adicionar `data-theme="ultra-violet"` via DevTools → verificar fg escuro + bg claro. Repetir para cloudy-sky. |
| Decisão editorial D-02 (Obsidian) | D-02 | Escolha subjetiva do Proprietário — não automatizável | Inspecionar o dashboard e confirmar que o tema escuro Obsidian está ativo e agradável. |

---

## Coverage Notes

- **D-08 exempt filter:** O teste de tipografia usa filtro de isenção baseado em classes CSS. Elementos com `tracking`, `font-mono`, `[9-12px]`, `eyebrow`, `uppercase` ou dentro de `mobile` são isentos por design (conforme UI-SPEC D-08/D-09/D-10). Um elemento de body text regredido para 13px com classe `tracking-[...]` não seria detectado — tradeoff aceito.
- **Seed dependency:** Os testes D-08 verificam nós de texto reais; a cobertura é proporcional ao volume de dados de seed. Guard `checkedCount >= 1` garante que o filtro não é vacuous.

---

## Validation Sign-Off

- [x] Todos os requisitos verificáveis têm cobertura automatizada (E2E ou accepted manual)
- [x] Sampling continuity: sem 3 tasks consecutivas sem verify automático
- [x] Wave 0 não necessária — infra existente suficiente
- [x] Sem flags watch-mode
- [x] Latência de feedback < 30s
- [x] `nyquist_compliant: true` confirmado

**Approval:** approved 2026-06-12
