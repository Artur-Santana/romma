---
phase: 17-funda-o-tokens-mobile-modal-fixes-infra
reviewed: 2026-06-13T22:47:54Z
depth: standard
files_reviewed: 8
files_reviewed_list:
  - next.config.mjs
  - src/app/globals.css
  - src/app/portal/layout.js
  - src/components/features/LocatariosDesktop.js
  - src/components/features/UnidadesPublicas.js
  - src/components/ui/ConfirmDialog.js
  - src/components/ui/DashboardShell.js
  - supabase/migrations/20260601000000_v15_foundation.sql
findings:
  critical: 1
  warning: 5
  info: 4
  total: 10
status: issues_found
---

# Phase 17: Code Review Report

**Reviewed:** 2026-06-13T22:47:54Z
**Depth:** standard
**Files Reviewed:** 8
**Status:** issues_found

## Summary

Phase 17 delivers additive CSS tokens, cross-cutting mobile/modal fixes, and the v1.5 Supabase migration (nullable columns, PRIVATE Storage bucket, ownership-chain RLS).

The migration's core security model is sound: I traced `edificios.proprietario_id` to its definition in `20260521000000_multi_tenant_proprietario_id.sql` (FK to `auth.users(id)`), confirming that `e.proprietario_id = auth.uid()` correctly enforces the `unidade → edificio → proprietario` chain. The bucket is created with `public=false`, `SET search_path` is pinned, and `DROP POLICY IF EXISTS` guards make re-runs idempotent. The `EXCEPTION WHEN OTHERS` block fails closed (returns FALSE), so a malformed path or missing row denies access rather than granting it. No IDOR or privilege-escalation path was found in the function itself.

The one BLOCKER is an authorization gap created by the unconditional `GRANT ALL ... TO authenticated` on `proprietarios` and `unidades` at the end of the migration, which expands the attack surface for any authenticated locatário if RLS coverage on those tables is ever incomplete. Remaining findings are robustness/quality issues in the React components.

## Critical Issues

### CR-01: `GRANT ALL` to `authenticated` on tenant tables widens blast radius if any RLS op-policy is missing

**File:** `supabase/migrations/20260601000000_v15_foundation.sql:87-88`
**Issue:** The migration ends with:
```sql
GRANT ALL ON public.proprietarios TO service_role, authenticated;
GRANT ALL ON public.unidades      TO service_role, authenticated;
```
`GRANT ALL` includes SELECT/INSERT/UPDATE/DELETE for *every* authenticated user — which in this app includes invited **locatários**, not just the proprietário. The only thing standing between a locatário and full read/write on `unidades` and `proprietarios` is RLS. Per CLAUDE.md's own convention ("RLS: políticas por operação — Falta de uma → 403 só nessa op"), a single missing op-policy on these tables silently becomes an authorization bypass for all authenticated users, because the table-level GRANT permits the operation and there is no policy to deny it. `proprietarios` in particular only has a `*_select_own` policy in `20260518000000`; granting `authenticated` INSERT/UPDATE/DELETE here with no corresponding write policies means those writes are blocked only by absence of a permissive policy (correct *today*) but the grant is strictly broader than needed and is a standing IDOR/escalation risk. This grant is also not idempotency-guarded against future privilege drift.
**Fix:** Grant only the privileges actually exercised by `authenticated` (mutations go through `supabaseAdmin`/service_role), and keep `authenticated` to the minimum RLS-gated surface:
```sql
-- service_role bypasses RLS and performs mutations; authenticated only needs SELECT (RLS-gated)
GRANT ALL                     ON public.proprietarios TO service_role;
GRANT SELECT                  ON public.proprietarios TO authenticated;
GRANT ALL                     ON public.unidades      TO service_role;
GRANT SELECT                  ON public.unidades      TO authenticated;
```
Then add explicit op-policies for any authenticated write path that genuinely exists. Re-verify that every operation granted to `authenticated` on both tables has a corresponding RLS policy before shipping.

## Warnings

### WR-01: `data_theme` light palettes do not override `--success` / `--warning` / `--danger-fg`, risking invisible/low-contrast semantic text on light backgrounds

**File:** `src/app/globals.css:167-236`
**Issue:** The `ultra-violet` and `cloudy-sky` palettes are explicitly light-background themes and carefully override `--fg-*`, `--surface*`, and `--border-*`. But the semantic tokens `--success` (`oklch(0.696 ...)`), `--warning` (`oklch(0.769 ...)`), `--danger-fg` (`oklch(0.826 ...)`), and `--danger` are defined once in `:root` (lines 118-128) tuned for a dark background and are never re-derived in the light palettes. On the lemon-chiffon (`L≈0.975`) and cloudy-sky (`L≈0.88`) backgrounds these light, low-chroma colors will be near-illegible — the same class of bug the comment block on lines 175-178 warns about for `--fg-1`. Components using `text-danger-fg` (e.g., `ConfirmDialog`, `LocatariosDesktop` error text) and `text-success`/`text-warning` are affected.
**Fix:** Add darker semantic overrides inside both light palettes, mirroring the `--fg-*` overrides:
```css
[data-theme="ultra-violet"], [data-theme="cloudy-sky"] {
  --success:   oklch(0.45 0.14 162.5);
  --warning:   oklch(0.55 0.15 70.08);
  --danger:    oklch(0.50 0.18 27);
  --danger-fg: oklch(0.50 0.18 27);
}
```
(Listed as light-palette themes are dev-only per the comment, hence Warning not Blocker — but the contrast regression is real if these ever ship.)

### WR-02: Realtime subscription ignores UPDATE, so units transitioning `disponivel → alugada` linger in the public list until manual refresh

**File:** `src/components/features/UnidadesPublicas.js:37-41`
**Issue:** The channel subscribes only to `INSERT` and `DELETE` on `unidades`. A unit becoming `alugada` is an UPDATE (status column), not a DELETE. CLAUDE.md documents that the `disponivel → alugada` event is dropped by RLS *anyway*, so adding an UPDATE handler would not fix realtime removal — but the current code also has no fallback (no polling, no refetch on focus). The result is that a visitor staring at the public page can attempt to inquire about a unit that was rented seconds ago, with no client-side reconciliation until a full reload. `getUnidadesDisponiveis()` filters server-side, so a refetch *would* drop it.
**Fix:** Add a lightweight reconciliation that doesn't depend on the RLS-dropped UPDATE event — e.g. refetch `load()` on window focus / visibility change, or on a low-frequency interval:
```js
const onFocus = () => load()
window.addEventListener('focus', onFocus)
// cleanup: window.removeEventListener('focus', onFocus)
```

### WR-03: `getInitials` can throw on names containing consecutive spaces

**File:** `src/components/features/LocatariosDesktop.js:25-28`
**Issue:** `name.split(" ").slice(0, 2).map(s => s[0])` — if `nome_razao_social` contains a double space or a leading/trailing space (e.g. `"Acme  Ltda"` or `" Acme"`), `split(" ")` yields empty-string segments. `s[0]` on `""` is `undefined`, and while `.join("")` tolerates `undefined`, the resulting initials are wrong/blank (e.g. a leading space yields a single-letter or empty avatar). User-entered company names commonly have irregular spacing.
**Fix:** Filter empties before slicing:
```js
return name.trim().split(/\s+/).filter(Boolean).slice(0, 2).map(s => s[0]).join("").toUpperCase() || "?"
```

### WR-04: `revogarConvite` schedules a state update inside `setTimeout` with no guard against unmount

**File:** `src/components/features/LocatariosDesktop.js:103-106`
**Issue:** After a successful revoke, a 200ms `setTimeout` fires `getLocatarios().then(setLocatarios)` and `setRemovingIds(...)`. There is no stored timer ref and no cleanup, so if the component unmounts within that window (route change) the async `setLocatarios` runs against an unmounted component and the timer is never cleared. Unlike `UnidadesPublicas` (which tracks `timerRef` and clears it on cleanup), this path leaks. Compounding it: the `getLocatarios()` here re-fetches the full list rather than removing the single id locally, so a transient query failure leaves the revoked row visible with `opacity:0` (invisible but still occupying grid space) because `removingIds` was cleared but the row was never removed from `locatarios`.
**Fix:** Track the timeout in a ref and clear on unmount; on success remove the id from `locatarios` directly rather than relying solely on a refetch:
```js
const timerRef = useRef(null)
// inside success branch:
timerRef.current = setTimeout(() => {
  setLocatarios(prev => prev.filter(x => x.id !== id))
  setRemovingIds(prev => { const n = new Set(prev); n.delete(id); return n })
}, 200)
// useEffect(() => () => clearTimeout(timerRef.current), [])
```

### WR-05: `EXCEPTION WHEN OTHERS THEN RETURN FALSE` masks operational errors as access denials

**File:** `supabase/migrations/20260601000000_v15_foundation.sql:45-47`
**Issue:** The blanket handler is correct for *security* (fails closed on malformed UUID / missing row), but it also swallows genuine faults — a transient lock, a renamed column, a permissions error inside the SECURITY DEFINER body — and reports them indistinguishably as "not owned" → 403. During the live banca demo this would surface as a silent "you can't upload this photo" with zero diagnostic signal. The comment claims it only catches "malformed UUID, null path segment, or missing row," but `WHEN OTHERS` is strictly broader than that claim.
**Fix:** Narrow the handler to the genuinely-expected exceptions so real faults propagate:
```sql
EXCEPTION
  WHEN invalid_text_representation THEN RETURN FALSE; -- malformed UUID cast
  WHEN no_data_found              THEN RETURN FALSE;
```
(`SELECT ... INTO` does not raise `no_data_found` by default — a missing row leaves `v_prop_id` NULL and the final `RETURN v_prop_id = auth.uid()` yields NULL→treated as false in USING, so the missing-row case is already covered without `WHEN OTHERS`.)

## Info

### IN-01: Non-deterministic value rendered during render (`new Date()` in JSX)

**File:** `src/components/features/UnidadesPublicas.js:119`
**Issue:** `SYNC · {new Date().toISOString().slice(0, 10)}` computes a fresh date on every render directly in JSX. For a date-only string this is cosmetically harmless but is a render side-effect anti-pattern; it also produces a UTC date that can disagree with the visitor's local day near midnight.
**Fix:** Hoist to a `useMemo(() => new Date().toISOString().slice(0,10), [])` (or compute in the load effect) so the displayed sync date is stable for the session.

### IN-02: `ConfirmDialog` non-danger eyebrow text falls back to `confirmLabel`, producing odd UI copy

**File:** `src/components/ui/ConfirmDialog.js:18`
**Issue:** `const eyebrowText = danger ? "AÇÃO DESTRUTIVA" : (confirmLabel ?? "Confirmação")`. For a non-danger dialog the small eyebrow label renders the *button* label (e.g. "Salvar") instead of a heading like "CONFIRMAÇÃO". Since `confirmLabel` defaults to `"Confirmar"`, the `?? "Confirmação"` branch is effectively dead (confirmLabel is never null given the default).
**Fix:** Use a fixed eyebrow string for the non-danger case: `const eyebrowText = danger ? "AÇÃO DESTRUTIVA" : "CONFIRMAÇÃO"`.

### IN-03: `editarLocatario` allows editing email but invite identity is keyed on email — silent divergence

**File:** `src/components/features/LocatariosDesktop.js:288-296`
**Issue:** The edit modal lets the proprietário change a locatário's `email`. The invite/auth linkage is established via `inviteUserByEmail` (CLAUDE.md), so editing the `locatarios.email` row after acceptance desynchronizes the displayed email from the `auth.users` identity the locatário actually logs in with. This is a data-consistency footgun rather than a crash. Out of strict file scope for the action itself, flagged because the UI exposes it.
**Fix:** Make `email` read-only after the invite is accepted (`status_convite === "aceito"`), or document that it edits only the display record, not the auth identity.

### IN-04: Stale source-line references in CSS/SQL comments

**File:** `src/app/globals.css:360`, `supabase/migrations/20260601000000_v15_foundation.sql:21,51`
**Issue:** Comments cite exact line numbers in other files ("LocatariosDesktop.js lines 240,337 + ConfirmDialog.js line 23", "proprietarios_rls.sql lines 16-24"). `LocatariosDesktop.js` now uses `romma-modal-backdrop` at lines 240/337 so that one happens to still match, but line-number references rot on the next edit and become misleading.
**Fix:** Reference symbols/identifiers instead of line numbers (e.g. "see `is_proprietario` in proprietarios_rls.sql").

---

_Reviewed: 2026-06-13T22:47:54Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
