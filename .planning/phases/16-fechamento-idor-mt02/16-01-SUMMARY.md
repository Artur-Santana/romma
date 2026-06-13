---
plan: 16-01
phase: 16-fechamento-idor-mt02
status: complete
one-liner: Fechado IDOR em criarUnidade (1-hop), criarContrato (2-hop), editarContrato (3-hop) via ownership pre-check por proprietario_id
requirements-completed: [MT-03]
key-files:
  modified:
    - src/actions/unidades.js
    - src/actions/contratos.js
commits:
  - 670d0e1
---

# Plan 16-01 — IDOR fixes (criarUnidade, criarContrato, editarContrato)

> **Nota de execução:** o agent executor caiu por API error (FailedToOpenSocket) após aplicar os edits mas antes de commitar/escrever SUMMARY. Trabalho recuperado pelo orquestrador: edits inspecionados (corretos, espelham 15-02), validados (ESLint clean, playwright --list exit 0, UUID guard preexistente), commitados em 670d0e1.

## O que foi feito

Espelhou o padrão de ownership pre-check de 15-02 nas 3 Actions:

- **criarUnidade** (unidades.js): `authGuard()` → `{user}`; antes do insert, valida `form.edificio_id` → `edificios.proprietario_id = user.id` (1-hop). 404 "Edifício não encontrado." em cross-tenant.
- **criarContrato** (contratos.js): `authGuard()` → `{user}`; valida `form.unidade_id` → `unidades.edificio_id` → `edificios.proprietario_id = user.id` (2-hop). 404 "Unidade não encontrada." em cross-tenant.
- **editarContrato** (contratos.js): `authGuard()` → `{user}`; valida `id` → `contrato.unidade_id` → `unidade.edificio_id` → `edificios.proprietario_id = user.id` (3-hop) antes do update. 404 "Contrato não encontrado." em cross-tenant.

Contrato `{status,erroMessage}` preservado. `authGuard()` nesses arquivos já retornava `{user}` (15-02) — reusado.

## Verificação
- ESLint: No issues found (ambos arquivos)
- `npx playwright test --list`: exit 0 (sem quebra de parse)
- UUID guard 'Edifício inválido.' preexistente em criarUnidade (linha 24) mantido
- Asserções unit cross-tenant: cobertas em 16-03

## Self-Check: PASSED
