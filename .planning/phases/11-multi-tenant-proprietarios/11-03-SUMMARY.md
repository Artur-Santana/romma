---
phase: 11-multi-tenant-proprietarios
plan: "03"
subsystem: verification
tags: [multi-tenant, verification, rls, bug-fix, migration, audit]
dependency_graph:
  requires:
    - supabase/migrations/20260521000000_multi_tenant_proprietario_id.sql (Plan 01)
    - src/actions/edificios.js (Plan 02 — proprietario_id no insert)
  provides:
    - .planning/phases/11-multi-tenant-proprietarios/11-VERIFICATION.md
    - supabase/migrations/20260522000000_fix_edificios_select_public_policy.sql
  affects:
    - public.edificios (policy edificios_select_public corrigida)
tech_stack:
  added: []
  patterns:
    - Forward migration para corrigir policy RLS sem editar migration já aplicada
    - Qualificação explícita de coluna (public.edificios.id) em subquery EXISTS
key_files:
  created:
    - .planning/phases/11-multi-tenant-proprietarios/11-VERIFICATION.md
    - supabase/migrations/20260522000000_fix_edificios_select_public_policy.sql
  modified: []
decisions:
  - Bug Rule 1 detectado durante auditoria — policy edificios_select_public com id ambíguo (resolvia unidades.id via alias, não edificios.id)
  - Fix via ALTER POLICY em nova migration forward (não editar migration já aplicada)
  - Testes E2E Playwright marcados como MANUAL por conflito de porta com servidor dev ativo
metrics:
  duration: "~25min"
  completed: "2026-06-09"
  tasks_completed: 1
  tasks_total: 2
  files_changed: 2
---

# Phase 11 Plan 03: Verificação End-to-End Multi-Tenant — Summary

**One-liner:** Auditoria automatizada AUDIT-01 detectou e corrigiu bug de ambiguidade de coluna na policy RLS `edificios_select_public` (Plan 01) que impedia anon de ver nomes de edifícios em `/unidades`; 5 de 6 itens automatizados verificados como PASS antes do checkpoint humano.

---

## Tasks Completed

| # | Task | Commit | Files |
|---|------|--------|-------|
| 1 | Verificação automatizada + fix policy edificios_select_public | 69b6e21 | supabase/migrations/20260522000000_fix_edificios_select_public_policy.sql (criado), .planning/phases/11-multi-tenant-proprietarios/11-VERIFICATION.md (criado) |

---

## What Was Built

### `11-VERIFICATION.md`

Relatório de verificação automatizada com 6 cenários:

| Cenário | Resultado |
|---------|-----------|
| MT-04: ausência de guard instância única | PASS |
| Seed: 0 NULLs em edificios.proprietario_id | PASS |
| Seed: 0 NULLs em locatarios.proprietario_id | PASS |
| criarEdificio contém `proprietario_id: user.id` | PASS |
| `npm run build` completa sem erro | PASS |
| Testes E2E Playwright | MANUAL (conflito porta 3000) |

### `20260522000000_fix_edificios_select_public_policy.sql`

Forward migration que corrige a policy criada na Plan 01:

```sql
ALTER POLICY "edificios_select_public" ON public.edificios
USING (EXISTS (
  SELECT 1 FROM public.unidades u
  WHERE u.edificio_id = public.edificios.id AND u.status = 'disponivel'
));
```

---

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug Cross-Plan] Policy edificios_select_public com coluna ambígua**
- **Found during:** Task 1 — verificação funcional do JOIN anon
- **Issue:** Migration 20260521000000 (Plan 01) criou a policy com `WHERE u.edificio_id = id` onde `id` não qualificado resolvia para `unidades.id` (via alias `u`), não para `edificios.id`. EXISTS sempre false → anon via 0 edificios → JOIN `edificios(nome)` retornava NULL na página pública `/unidades`. Quebrava `must_have truth #2`.
- **Fix:** Nova migration forward `20260522000000_fix_edificios_select_public_policy.sql` com `public.edificios.id` explícito. Aplicada ao banco remoto via `npx supabase db push`.
- **Verificação:** `edificios SELECT anon` = 7 rows (era 0); JOIN `unidades+edificios(nome)` = nomes populados.
- **Files modified:** supabase/migrations/20260522000000_fix_edificios_select_public_policy.sql (criado)
- **Commit:** 69b6e21

---

## Checkpoint Pending — AUDIT-01 Human Verification

**Task 2 aguarda verificação humana.** Os seguintes cenários requerem login e validação visual:

1. **Isolamento A↔B:** Dois Proprietários distintos não veem dados um do outro
2. **Página /unidades anon:** Nomes dos edifícios visíveis (automaticamente verificado via API, recomendada confirmação visual)
3. **Portal do Locatário:** Contrato ativo + parcelas visíveis; sem acesso ao dashboard
4. **Supabase Studio:** `proprietario_id` do edifício criado por B = userId de B

---

## Known Stubs

Nenhum. Este plano cria apenas artefatos de verificação e uma migration de fix — sem UI, sem dados placeholder.

---

## Threat Flags

Nenhum novo. A migration de fix apenas qualifica a coluna na subquery EXISTS — não expande a superfície de acesso (anon ainda vê apenas edificios com unidades disponíveis).

---

## Self-Check

- `11-VERIFICATION.md` existe: FOUND
- `grep -q "MT-04"` no VERIFICATION.md: PASS
- `20260522000000_fix_edificios_select_public_policy.sql` existe: FOUND
- `npx supabase migration list` mostra 20260522000000 aplicada: PASS
- `edificios SELECT anon` = 7 rows (pós-fix): PASS
- Commit 69b6e21 existe: PASS

## Self-Check: PASSED
