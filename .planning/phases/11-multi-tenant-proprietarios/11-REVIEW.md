---
phase: 11-multi-tenant-proprietarios
reviewed: 2026-06-09T12:00:00Z
depth: standard
files_reviewed: 7
files_reviewed_list:
  - src/actions/edificios.js
  - src/actions/locatarios.js
  - src/components/features/UnidadesPublicas.js
  - src/lib/queries-client.js
  - supabase/migrations/20260521000000_multi_tenant_proprietario_id.sql
  - supabase/migrations/20260522000000_fix_edificios_select_public_policy.sql
  - supabase/migrations/20260523000000_fix_unidades_select_public_rpc.sql
findings:
  critical: 1
  warning: 3
  info: 2
  total: 6
status: issues_found
---

# Phase 11: Code Review Report

**Reviewed:** 2026-06-09
**Depth:** standard
**Files Reviewed:** 7
**Status:** issues_found

## Summary

This review covers the post-11-04 (gap closure) state of the code. The 11-04 work correctly scoped all write operations in `edificios.js` and `locatarios.js` with `.eq('proprietario_id', user.id)` — CR-01/CR-02/CR-03 from the pre-11-04 review are confirmed closed.

The RLS migration (20260521) is structurally sound: `SECURITY DEFINER` functions use `SET search_path`, `anon` REVOKED, no recursion cycles across the five helper functions. The column-ambiguity fix (20260522) is correct. The SECURITY DEFINER RPCs (20260523) properly bypass the `TO anon`-only policies for authenticated users on the public page.

**Remaining critical gap:** `contratos.js`, `unidades.js`, and `parcelas.js` — three action files outside the formal phase-11 scope — still use `supabaseAdmin` without ownership scoping. Because RLS is bypassed, any authenticated Proprietário can mutate another Proprietário's rows in these tables. This was the category of bug phase 11 set out to eliminate, and it persists in the majority of write paths. Additionally, `valor_mensal` confidentiality is enforced client-side only and can be bypassed by any caller invoking the RPC directly.

---

## Critical Issues

### CR-01: IDOR — `contratos.js`, `unidades.js`, `parcelas.js` write paths have no ownership scoping

**Files:**
- `src/actions/contratos.js:53` (`editarContrato`)
- `src/actions/contratos.js:72-90` (`cancelarContrato`)
- `src/actions/contratos.js:95-124` (`encerrarContrato`)
- `src/actions/unidades.js:50` (`editarUnidade`)
- `src/actions/unidades.js:60` (`deletarUnidade`)
- `src/actions/parcelas.js:24-28` (`marcarParcelaComoPaga`)

**Issue:** All six operations authenticate the caller as a Proprietário (`isProprietario()` returns true) but then mutate rows using `supabaseAdmin` scoped only to the target row's `id`. `supabaseAdmin` holds the service role key, which bypasses all RLS policies. The `isProprietario()` check proves the caller is *a* Proprietário — not that the caller *owns* the target row.

Concrete attack vectors under multi-tenant:
- Proprietário A calls `editarContrato(B_contrato_id, ...)` — modifies Proprietário B's contract terms.
- Proprietário A calls `cancelarContrato(B_contrato_id)` — cancels B's active contract, also sets `unidade.status = 'disponivel'` on B's unidade.
- Proprietário A calls `marcarParcelaComoPaga(B_parcela_id)` — marks B's parcel as paid, corrupting B's financial records.
- `criarContrato` trusts `unidade_id`/`locatario_id` from the caller's form and never verifies they belong to the caller before inserting.

`editarUnidade`/`deletarUnidade` in `unidades.js` have the same gap — no `edificio_id` owner check.

**Fix pattern:** Each action needs an ownership pre-check before mutating. The `authGuard()` function in `contratos.js` and `unidades.js` returns `{}` (not `user`); it needs to be updated to return `{ user }` as `edificios.js` now does. Then add ownership scoping:

```js
// contratos.js — authGuard fix
async function authGuard() {
  const supabase = await createServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { err: { status: 401, erroMessage: 'Não autenticado.' } }
  if (!await isProprietario(supabase)) return { err: { status: 403, erroMessage: 'Sem permissão.' } }
  return { user }   // expose user to callers
}

// editarContrato — scope the update
const { error } = await supabaseAdmin
  .from('contratos')
  .update({ data_inicio, data_fim, status, observacoes })
  .eq('id', id)
  // ownership: verify caller owns the unidade referenced by this contract
  // simplest: pre-fetch contrato.unidade_id and verify edificios.proprietario_id = user.id

// cancelarContrato / encerrarContrato — add ownership check on pre-fetch
const { data: contrato, error: fetchErr } = await supabaseAdmin
  .from('contratos')
  .select('unidade_id, unidades(edificio_id, edificios(proprietario_id))')
  .eq('id', id)
  .single()
if (fetchErr || !contrato) return { status: 404, erroMessage: 'Contrato não encontrado.' }
if (contrato.unidades.edificios.proprietario_id !== user.id) {
  return { status: 403, erroMessage: 'Sem permissão.' }
}

// editarUnidade / deletarUnidade — simpler: join through edificios
const { data: unidade } = await supabaseAdmin
  .from('unidades')
  .select('edificio_id, edificios(proprietario_id)')
  .eq('id', id)
  .single()
if (!unidade || unidade.edificios.proprietario_id !== user.id) {
  return { status: 403, erroMessage: 'Sem permissão.' }
}

// marcarParcelaComoPaga — join through contratos → unidades → edificios
const { data: parcela } = await supabaseAdmin
  .from('parcelas')
  .select('contratos(unidades(edificios(proprietario_id)))')
  .eq('id', id)
  .single()
if (!parcela || parcela.contratos.unidades.edificios.proprietario_id !== user.id) {
  return { status: 403, erroMessage: 'Sem permissão.' }
}
```

---

## Warnings

### WR-01: `valor_mensal` confidentiality enforced client-side only — bypassable via direct RPC call

**Files:** `supabase/migrations/20260523000000_fix_unidades_select_public_rpc.sql:41` and `src/lib/queries-client.js:82`

**Issue:** The SECURITY DEFINER function `get_unidades_disponiveis()` returns `u.valor_mensal` unconditionally (migration line 41). The masking to `null` only happens in client JS (`queries-client.js:82`): `u.valor_visivel ? u : { ...u, valor_mensal: null }`. Any caller — browser devtools, curl, `supabase.rpc('get_unidades_disponiveis')` — bypasses this mask and reads prices the Proprietário chose to hide behind "Consulte o Proprietário." The migration comment at line 16 ("As funções não expõem dados sensíveis") is incorrect.

**Fix:** Mask inside the SQL function so the wire response never carries hidden prices:
```sql
CASE WHEN u.valor_visivel THEN u.valor_mensal ELSE NULL END AS valor_mensal,
```
Keep `valor_visivel` in the return columns so the client can still render "Consulte o Proprietário" conditionally.

---

### WR-02: `deletarLocatario` has no pre-flight contract guard — can create stranded auth user

**File:** `src/actions/locatarios.js:71-89`

**Issue:** `deletarLocatario` deletes the `locatarios` row (line 83) then calls `supabaseAdmin.auth.admin.deleteUser(loc.usuario_id)` (line 86). If the row deletion succeeds but `deleteUser` fails, the function returns a 500 error with the locatário row already gone — a stranded `auth.users` entry with no corresponding portal record. `revogarConvite` (line 102) guards against this with a contract count check before proceeding; `deletarLocatario` has no equivalent guard. Additionally there is no check that the locatário has no active contracts before cascading the auth-user deletion.

**Fix:** Add the same pre-flight check used in `revogarConvite`:
```js
const { count: contratosCount, error: countErr } = await supabaseAdmin
  .from('contratos')
  .select('*', { count: 'exact', head: true })
  .eq('locatario_id', id)
if (countErr) return { status: 500, erroMessage: countErr.message }
if (contratosCount > 0) return { status: 400, erroMessage: 'Locatário tem contratos vinculados — encerre-os antes de deletar.' }
```

---

### WR-03: Locatário RLS access not scoped to `ativo` contracts — former tenants retain data access

**File:** `supabase/migrations/20260521000000_multi_tenant_proprietario_id.sql:70-83` and `104-116`

**Issue:** `is_unidade_do_locatario` (line 74) and `is_contrato_do_locatario` (line 109) join `contratos` to check if the calling user is the locatário, but neither filters `contratos.status = 'ativo'`. A locatário whose contract was `encerrado` or `cancelado` retains SELECT access to the unidade row and to the contract row via these policies indefinitely. The system grants no explicit historical-access permission — this is a silent side-effect. If portal access should end when the contract ends, add `AND c.status = 'ativo'` to both functions.

**Fix (if access should be revoked on contract end):**
```sql
-- is_unidade_do_locatario
SELECT EXISTS (
  SELECT 1 FROM contratos c
  JOIN locatarios l ON l.id = c.locatario_id
  WHERE c.unidade_id = p_unidade_id
    AND l.usuario_id = auth.uid()
    AND c.status = 'ativo'   -- add this
);

-- is_contrato_do_locatario
SELECT EXISTS (
  SELECT 1 FROM locatarios l
  WHERE l.id = p_locatario_id
    AND l.usuario_id = auth.uid()
    -- note: this function doesn't filter by status directly — the contratos
    -- SELECT policy uses it as-is. If history access is desired, leave it;
    -- if not, filter via the calling policy or a separate function.
);
```

---

## Info

### IN-01: Migration 1 shipped with column ambiguity bug — required two follow-up migrations

**File:** `supabase/migrations/20260521000000_multi_tenant_proprietario_id.sql:199-204`
**Fixed by:** `supabase/migrations/20260522000000_fix_edificios_select_public_policy.sql`

**Issue:** The original `edificios_select_public` policy used `WHERE u.edificio_id = id` where `id` resolved to `u.id` (the aliased table), not `edificios.id`. This caused `EXISTS` to always return false, breaking the public page. The fix in migration 2 correctly qualifies it as `public.edificios.id`. Consider squashing these two migrations into one in a future schema cleanup — shipping and immediately patching a migration adds cognitive overhead for anyone reading migration history.

---

### IN-02: `getLocatarioByUserId` uses `.maybeSingle()` — will throw if `usuario_id` appears in multiple tenant rows

**File:** `src/lib/queries-client.js:92-99`

**Issue:** Now that `locatarios` is multi-tenant, a `usuario_id` could theoretically appear in rows for two different `proprietario_id` values if the same email was invited by two proprietários. `maybeSingle()` throws when more than one row is returned. The current invite flow uses `inviteUserByEmail` (one auth user per email) so duplicates should not occur in practice, but there is no database-level `UNIQUE(usuario_id)` constraint enforcing this — a latent risk if data enters via seeds or future bulk import paths.

**Fix:** Add a unique constraint to make the invariant explicit at the database level:
```sql
ALTER TABLE public.locatarios ADD CONSTRAINT locatarios_usuario_id_unique UNIQUE (usuario_id);
```

---

_Reviewed: 2026-06-09_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
