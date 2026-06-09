---
phase: 11-multi-tenant-proprietarios
reviewed: 2026-06-09T00:00:00Z
depth: standard
files_reviewed: 7
files_reviewed_list:
  - supabase/migrations/20260521000000_multi_tenant_proprietario_id.sql
  - supabase/migrations/20260522000000_fix_edificios_select_public_policy.sql
  - supabase/migrations/20260523000000_fix_unidades_select_public_rpc.sql
  - src/actions/edificios.js
  - src/actions/locatarios.js
  - src/lib/queries-client.js
  - src/components/features/UnidadesPublicas.js
findings:
  critical: 3
  warning: 3
  info: 2
  total: 8
status: issues_found
---

# Phase 11: Code Review Report

**Reviewed:** 2026-06-09
**Depth:** standard
**Files Reviewed:** 7
**Status:** issues_found

## Summary

This migration introduces multi-tenant isolation via `proprietario_id` columns, 23 RLS policies, and SECURITY DEFINER RPCs. The RLS read policies are structurally sound — `SET search_path`, `anon REVOKED`, no recursion cycles. The SECURITY DEFINER functions (migration 3) correctly bypass the `TO anon`-only read policies for authenticated users on the public page.

The critical failures are on the **write path**, which is outside RLS because all Server Actions use `supabaseAdmin` (service role). Three cross-tenant IDOR vulnerabilities allow any authenticated Proprietário to mutate another Proprietário's rows. Additionally, the `valor_mensal` confidentiality contract is enforced client-side only, making it trivially bypassable.

---

## Critical Issues

### CR-01: IDOR — `editarEdificio` has no ownership scope (any Proprietário edits any edifício)

**File:** `src/actions/edificios.js:31-41`

**Issue:** `editarEdificio` calls `authGuard()` destructuring only `{ err }` — it discards `user`. The update runs `supabaseAdmin...update(...).eq('id', id)` with no `proprietario_id` check. Any authenticated Proprietário who knows (or guesses) a valid UUID can rename or change the address of another Proprietário's edifício. `supabaseAdmin` bypasses RLS by design, so no database policy catches this.

**Fix:**
```js
export async function editarEdificio(id, form) {
  const { err, user } = await authGuard()   // destructure user
  if (err) return err

  if (!UUID_RE.test(id)) return { status: 400, erroMessage: 'ID inválido.' }
  const { nome, endereco } = form
  if (!nome?.trim()) return { status: 400, erroMessage: 'Nome é obrigatório.' }
  if (!endereco?.trim()) return { status: 400, erroMessage: 'Endereço é obrigatório.' }

  const { error } = await supabaseAdmin
    .from('edificios')
    .update({ nome: nome.trim(), endereco: endereco.trim() })
    .eq('id', id)
    .eq('proprietario_id', user.id)   // scope to caller
  if (error) return { status: 500, erroMessage: error.message }
  return { status: 200 }
}
```

---

### CR-02: IDOR — `deletarEdificio` has no ownership scope (any Proprietário deletes any edifício)

**File:** `src/actions/edificios.js:44-51`

**Issue:** Same pattern as CR-01. `deletarEdificio` calls `authGuard()` for auth/role check only, then deletes `.eq('id', id)` without any `proprietario_id` constraint. A Proprietário A can delete Proprietário B's entire edifício — and all its unidades — by supplying B's ID.

**Fix:**
```js
export async function deletarEdificio(id) {
  const { err, user } = await authGuard()   // destructure user
  if (err) return err

  if (!UUID_RE.test(id)) return { status: 400, erroMessage: 'ID inválido.' }
  const { error } = await supabaseAdmin
    .from('edificios')
    .delete()
    .eq('id', id)
    .eq('proprietario_id', user.id)   // scope to caller
  if (error) return { status: 500, erroMessage: error.message }
  return { status: 200 }
}
```

---

### CR-03: IDOR — `editarLocatario`, `deletarLocatario`, and `revogarConvite` have no ownership scope

**File:** `src/actions/locatarios.js:59-112`

**Issue:** All three mutations in `locatarios.js` authenticate the caller (check `isProprietario`) but then query/mutate `locatarios` scoped only by the locatário's `id` parameter. No `proprietario_id` filter is applied anywhere.

- `editarLocatario` (line 66): updates any locatário row by UUID.
- `deletarLocatario` (lines 79-87): fetches then deletes any locatário row and calls `deleteUser` on their auth account — cross-tenant deletion of a live user account.
- `revogarConvite` (lines 98-111): fetches, checks contratos count, then deletes and calls `deleteUser` — same cross-tenant risk but more dangerous because it also destroys the auth account.

**Fix pattern (apply to all three):** After the `authGuard` / `isProprietario` check, add `.eq('proprietario_id', user.id)` to every Supabase query. For the pre-fetch in `deletarLocatario`/`revogarConvite`, include `proprietario_id` in the select and verify it matches `user.id` before proceeding:

```js
// editarLocatario — example fix
export async function editarLocatario(id, form) {
  const supabase = await createServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { status: 401, erroMessage: 'Não autenticado.' }
  if (!await isProprietario(supabase)) return { status: 403, erroMessage: 'Sem permissão.' }
  if (!UUID_RE.test(id)) return { status: 400, erroMessage: 'ID inválido.' }
  const { nome_razao_social, tipo, documento, email, telefone } = form
  const { error } = await supabaseAdmin
    .from('locatarios')
    .update({ nome_razao_social, tipo, documento, email, telefone })
    .eq('id', id)
    .eq('proprietario_id', user.id)   // scope to caller
  if (error) return { status: 500, erroMessage: error.message }
  return { status: 200 }
}
```

For `deletarLocatario`/`revogarConvite`, also add `.eq('proprietario_id', user.id)` to the initial `.select()` fetch and check that the returned row is non-null (the `.single()` will 404 if the row doesn't belong to the caller, giving implicit ownership verification).

---

## Warnings

### WR-01: `valor_mensal` confidentiality enforced client-side only — bypassable via direct RPC call

**File:** `supabase/migrations/20260523000000_fix_unidades_select_public_rpc.sql:41` / `src/lib/queries-client.js:82`

**Issue:** The SECURITY DEFINER function `get_unidades_disponiveis()` returns `u.valor_mensal` unconditionally (migration 3, line 41) and is GRANTed to `anon` and `authenticated`. The masking to `null` only happens in client JS (queries-client.js line 82: `u.valor_visivel ? u : { ...u, valor_mensal: null }`). Any caller — browser devtools, curl, PostgREST — can invoke `supabase.rpc('get_unidades_disponiveis')` directly and read hidden prices. The migration comment on line 16 ("não expõem dados sensíveis") is incorrect.

**Fix:** Mask inside the SQL function:
```sql
CASE WHEN u.valor_visivel THEN u.valor_mensal ELSE NULL END AS valor_mensal,
```
Keep `valor_visivel` in the return set so the client can still render "Consulte o Proprietário" instead of a blank.

---

### WR-02: Locatário RLS access not scoped to `ativo` contracts — former tenants retain data access

**File:** `supabase/migrations/20260521000000_multi_tenant_proprietario_id.sql:70-83` and `215-227`

**Issue:** `is_unidade_do_locatario` (line 74) and `is_contrato_do_locatario` (line 109) join `contratos` to check if the calling user is the locatário, but neither filters `contratos.status = 'ativo'`. This means a locatário whose contract was `encerrado` or `cancelado` retains SELECT access to the unidade and to the contract row via these policies. Depending on the portal design this may be intentional (read-only history), but the system grants no explicit historical-access permission — it's a silent side-effect of the policy design. If the intent is access-only-while-active, add `AND c.status = 'ativo'` to both functions.

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
```

---

### WR-03: `deletarLocatario` destroys auth user before FK constraints can protect data integrity

**File:** `src/actions/locatarios.js:83-87`

**Issue:** `deletarLocatario` deletes the `locatarios` row first (line 83), then calls `deleteUser` (line 86). If the `locatarios` DELETE fails due to FK constraints (e.g., active contracts referencing `locatario_id`), the function returns a 500 — but no auth user deletion occurs, which is correct. However, if the `locatarios` DELETE succeeds but `deleteUser` fails (line 87), the function returns a 500 error to the caller while the locatário row is already gone. The locatário record no longer exists but their auth.users account remains — a stranded auth user with no portal access. Unlike `revogarConvite`, there is no pre-flight contract count check to prevent this situation from arising in the first place.

**Fix:** Either (a) add the same `contratosCount > 0` guard that `revogarConvite` uses before proceeding, or (b) restructure to call `deleteUser` before deleting the locatários row (auth deletion is more reversible via re-invite; row deletion is not).

---

## Info

### IN-01: Migration 1 shipped with column ambiguity bug — required two follow-up migrations

**File:** `supabase/migrations/20260521000000_multi_tenant_proprietario_id.sql:199-204`
**Fixed by:** `supabase/migrations/20260522000000_fix_edificios_select_public_policy.sql`

**Issue:** The original `edificios_select_public` policy used `WHERE u.edificio_id = id` where `id` resolved to `u.id` (the aliased table), not `edificios.id`. This caused `EXISTS` to always return false, breaking the public page. The fix in migration 2 correctly qualifies it as `public.edificios.id`. Consider squashing these two migrations into one in a future schema cleanup — shipping and immediately patching a migration creates cognitive overhead for anyone reading migration history.

---

### IN-02: `getLocatarioByUserId` uses `.maybeSingle()` — will throw if `usuario_id` is duplicated across tenants

**File:** `src/lib/queries-client.js:92-99`

**Issue:** Now that `locatarios` is multi-tenant, a `usuario_id` could theoretically appear in rows for two different `proprietario_id` values (e.g., if the same email was invited by two proprietários). `maybeSingle()` throws when more than one row is returned. The current invite flow calls `inviteUserByEmail` which creates a new auth user per invite, so duplicates should not occur in practice. But there is no database-level `UNIQUE(usuario_id)` constraint enforcing this, making it a latent risk if data is inserted via other paths (seeds, admin panel, future bulk import).

**Fix:** Add a unique constraint `UNIQUE (usuario_id)` on `locatarios` — or at minimum a partial unique index — to make the invariant explicit at the database level rather than relying solely on application logic.

---

_Reviewed: 2026-06-09_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
