---
phase: 25-portal-do-locat-rio-pix-recibo
plan: "01"
subsystem: server-actions
tags: [tdd, security, idor-guard, locatario, parcelas, queries]
dependency_graph:
  requires: []
  provides:
    - confirmarPagamentoLocatario (Server Action — Locatário write path)
    - getTodasParcelasPortal (query — all parcelas incl. futura)
  affects:
    - src/actions/parcelas.js
    - src/lib/queries-client.js
    - test/unit/actions/parcelas.test.js
tech_stack:
  added: []
  patterns:
    - 3-hop IDOR guard (parcela→contrato→locatario→usuario_id) — mirrors 4-hop Proprietário pattern
    - authGuardLocatario (getUser() only, no isProprietario)
    - 404 cross-tenant masking
    - .in() whitelist on update (status no-op guard)
    - TDD RED→GREEN cycle (Vitest)
key_files:
  created: []
  modified:
    - test/unit/actions/parcelas.test.js
    - src/actions/parcelas.js
    - src/lib/queries-client.js
decisions:
  - "authGuardLocatario is a separate local guard function that does NOT call isProprietario — Locatário has no proprietário role"
  - "Cross-tenant returns 404 (not 403) — 404 masking prevents resource enumeration"
  - "update filtered by .in('status', ['pendente','vencida']) — already-paid parcela is a transparent no-op returning 200"
  - "getTodasParcelasPortal uses ascending order (vs getParcelasPortal descending) to facilitate [0] index finding of next vencimento"
metrics:
  duration_seconds: 105
  completed_date: "2026-06-17"
  tasks_completed: 2
  files_changed: 3
---

# Phase 25 Plan 01: Guard IDOR Locatário + getTodasParcelasPortal Summary

**One-liner:** 3-hop IDOR guard test-first (parcela→contrato→locatario→usuario_id) + query variant sem filtro futura para progresso do portal.

---

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | RED: Testes Vitest confirmarPagamentoLocatario | 812ef28 | test/unit/actions/parcelas.test.js |
| 2 | GREEN: confirmarPagamentoLocatario + getTodasParcelasPortal | 6606af9 | src/actions/parcelas.js, src/lib/queries-client.js |

---

## What Was Built

### `confirmarPagamentoLocatario` (src/actions/parcelas.js)

Primeiro caminho de escrita do Locatário. Guard 3-hop server-side:

1. `authGuardLocatario()` — `supabase.auth.getUser()` sem `isProprietario`; usuário não autenticado → 401
2. UUID_RE regex — ID inválido → 400
3. Hop 1: `supabaseAdmin.from('parcelas').select('contrato_id').eq('id', id).single()` — ausente → 404
4. Hop 2: `supabaseAdmin.from('contratos').select('locatario_id').eq('id', parcela.contrato_id).single()` — ausente → 404
5. Hop 3: `supabaseAdmin.from('locatarios').select('usuario_id').eq('id', contrato.locatario_id).single()` — ausente ou `usuario_id !== user.id` → 404 (cross-tenant mascarado)
6. Update: `.update({ status: 'paga', data_pagamento: hoje }).eq('id', id).in('status', ['pendente','vencida'])` — parcela já paga é no-op transparente

Threat mitigations: T-25-01 (IDOR), T-25-02 (UUID tampering), T-25-03 (.in whitelist), T-25-04 (getUser vs getSession), T-25-05 (locatario_id derived server-side).

### `getTodasParcelasPortal` (src/lib/queries-client.js)

Variante de `getParcelasPortal` para progresso e destaque (D-08):
- Sem `.neq('status', 'futura')` — retorna todas as parcelas do contrato
- Adiciona `data_fechamento` ao select (necessário para recibo PDF PORT-07)
- Order ascending por `data_vencimento` (facilita encontrar próxima pagável como `[0]`)

### Test suite (test/unit/actions/parcelas.test.js)

6 novos testes no `describe('confirmarPagamentoLocatario')`:
- Happy path (200)
- Cross-tenant → 404 + `mockAdmin.update` NOT called
- Não autenticado → 401
- UUID inválido → 400
- Hop 1 null → 404
- Parcela já paga → 200 (no-op)

Helpers adicionados: `setupLocatarioOwnerSingles3()`, `setupLocatarioCrossTenantSingles3()`.

---

## TDD Gate Compliance

| Gate | Commit | Status |
|------|--------|--------|
| RED (test) | 812ef28 | PASS — 6 failed / 5 passed before implementation |
| GREEN (feat) | 6606af9 | PASS — 11/11 passed; 127/127 full suite |

---

## Deviations from Plan

None — plan executed exactly as written.

---

## Known Stubs

None — no placeholder data or stub patterns in the files created/modified.

---

## Threat Flags

None — no new network endpoints or trust boundaries introduced beyond what the plan's threat model documents. All mitigations (T-25-01 through T-25-05) implemented and verified by tests.

---

## Self-Check

Files exist:
- `src/actions/parcelas.js` — contains `export async function confirmarPagamentoLocatario` ✓
- `src/lib/queries-client.js` — contains `export async function getTodasParcelasPortal` ✓
- `test/unit/actions/parcelas.test.js` — contains `describe('confirmarPagamentoLocatario')` ✓

Commits exist:
- 812ef28 — test(25-01): add failing tests for confirmarPagamentoLocatario (RED) ✓
- 6606af9 — feat(25-01): implement confirmarPagamentoLocatario + getTodasParcelasPortal (GREEN) ✓

## Self-Check: PASSED
