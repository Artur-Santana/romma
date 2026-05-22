---
status: partial
phase: 01-dashboard-completions
source: [01-VERIFICATION.md]
started: 2026-05-22T13:00:00Z
updated: 2026-05-22T13:00:00Z
---

## Current Test

[aguardando validação humana]

## Tests

### 1. Playwright @smoke — DASH-01, DASH-02, DASH-03
expected: `npx playwright test e2e/dashboard.spec.js --grep "@smoke"` passa com servidor rodando em localhost:3000
result: [pending]

### 2. Validação visual VIS-02 — consistência Obsidian Blueprint
expected: /dashboard, /dashboard/contratos, /dashboard/locatarios, /dashboard/unidades consistentes em desktop e mobile (UnidadeCard ainda em HTML puro — follow-up documentado)
result: [pending]

### 3. DASH-03 — banner contratos a vencer com dados reais
expected: Banner "ATENÇÃO · CONTRATOS A VENCER" aparece quando contrato vence em ≤7 dias
result: [pending]

## Summary

total: 3
passed: 0
issues: 0
pending: 3
skipped: 0
blocked: 0

## Gaps
