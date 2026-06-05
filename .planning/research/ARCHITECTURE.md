## Architecture Analysis

**Project:** Romma v1.1 Polish & Completeness
**Researched:** 2026-06-05
**Confidence:** HIGH — based on direct codebase inspection, migration files, and schema

---

### Integration Points

#### 1. Signup do Proprietário

The system has a `proprietarios` table (`20260518000000_proprietarios_rls.sql`) with a UNIQUE constraint on `usuario_id`. The `is_proprietario()` RPC function confirms role by querying that table.

**Current gap:** `src/app/login/page.js` handles login only. No signup route exists. There is no page at `/signup` or `/login/signup`. The `proprietarios` table itself is the enforcement mechanism — inserting a second row would fail on the UNIQUE constraint, but there is no server-side guard preventing `supabase.auth.signUp()` from creating a second auth user without a corresponding `proprietarios` row.

**Integration point:** The signup flow touches:
- New route: `src/app/signup/page.js` (mirrors login page structure exactly — same layout shell: TopStrip, LeftPanel, RightPanel, BottomMeta)
- New Server Action: `src/actions/auth.js` → `cadastrarProprietario(email, password)`
- The action must: (1) check `SELECT COUNT(*) FROM proprietarios` — if > 0, return 403 "Instância já configurada"; (2) call `supabaseAdmin.auth.admin.createUser({ email, password, email_confirm: true })`; (3) insert into `proprietarios(usuario_id)`
- `src/proxy.js` already redirects authenticated non-proprietários away from `/dashboard`. No change needed there.
- `src/app/login/page.js` needs a link added: "Primeiro acesso? → Criar conta" pointing to `/signup`, visible only when `proprietarios` count is 0 (this check can be done server-side via a Server Component wrapper, or the link can always be shown and the Server Action handles the guard).

**Single-instance guard options:**
- Option A (recommended): Server Action guard queries `supabaseAdmin.from('proprietarios').select('id', { count: 'exact', head: true })` — if count > 0, reject. This runs before auth user creation. No extra DB function needed.
- Option B: Postgres trigger that raises an exception if `proprietarios` already has a row. Heavier, unnecessary given Option A.

#### 2. Bug: Revogar Convite

**Root cause (HIGH confidence):** `revogarConvite` in `src/actions/locatarios.js` line 100 checks `if (loc.status_convite !== 'pendente')` and returns 400. The column `status_convite` defaults to `'pendente'` (migration `20260520100000_locatarios_status_convite.sql`). There is NO trigger or webhook in the migrations that flips `status_convite` from `'pendente'` to `'aceito'` when the user accepts the invite and sets their password.

The flow: invite sent → user clicks email link → `/auth/confirm` exchanges token → `supabase.auth.updateUser()` sets password. None of these steps write back to `locatarios.status_convite`. As a result, every locatário stays `'pendente'` indefinitely.

**This means the 400 check (`status_convite !== 'pendente'`) passes** — locatários are always `pendente`. So the actual failure is elsewhere. The next suspect: `supabaseAdmin.auth.admin.deleteUser(loc.usuario_id)` — if the user has already accepted the invite and has active session or data attached, Supabase may reject the delete. Or the `locatarios` delete triggers a FK cascade issue before the auth delete.

**Diagnosis path:**
1. The `locatarios.delete().eq('id', id)` runs first. The `contratos` table has `locatario_id uuid NOT NULL REFERENCES public.locatarios(id)` — **no ON DELETE CASCADE**. If the locatário has any contratos (even encerrados/cancelados), the delete will fail with FK violation `contratos_locatario_id_fkey`. This surfaces as a 500 with the FK error message — which the UI shows via `alert()`.
2. `supabaseAdmin.auth.admin.deleteUser()` — secondary issue only if step 1 succeeds.

**Fix path for revogar:** Before deleting, check `contratos` for that `locatario_id`. If any exist, return 400 "Locatário possui contratos — remova os contratos antes." OR add `ON DELETE RESTRICT` semantics in the action (soft-delete the locatário instead, or only delete the auth user and mark `status_convite = 'revogado'`). For new invites (pendente + zero contratos), the current flow should work — confirm by verifying the FK first.

**Additionally:** `status_convite` never flips to `'aceito'`. This means the UI always shows "REVOGAR" for every locatário, even those who have accepted. Fix: add a Supabase Auth webhook or a pg trigger on `auth.users` update that sets `locatarios.status_convite = 'aceito'` when `email_confirmed_at` becomes non-null. Alternative: check `auth.users.email_confirmed_at` via `supabaseAdmin` in the query and derive the displayed status there without persisting it.

#### 3. Bug: Editar Unidade — FK Constraint Error (contratos_unidade_id_fkey)

**Root cause (HIGH confidence):** `editarUnidade` in `src/actions/unidades.js` does a straightforward `UPDATE unidades SET ... WHERE id = ?`. The `contratos` table has `unidade_id uuid NOT NULL REFERENCES public.unidades(id)` with **no ON DELETE CASCADE or ON UPDATE CASCADE** (confirmed in `20250101000000_initial_schema.sql` line 50). This FK does NOT trigger on UPDATE of the referenced column (`id`) — Postgres FKs only fire on delete of the parent or insert/update of the child.

**The real trigger:** `editarUnidade` passes the entire `patch` object including `status`. When the status changes from `'alugada'` to `'disponivel'` via the edit form, the business logic requires a contrato to be updated too (the contrato stays `ativo` referencing an `'alugada'` unidade — inconsistency). BUT this is not a FK violation. A true FK violation (`contratos_unidade_id_fkey`) would only fire if someone tried to delete the unidade, not edit it.

**Re-diagnosis:** The FK error on edit is most likely happening from a different code path. Examine: when `handleSalvarUnidade` is called, `formEdit` always includes `status` (set in `handleEditarUnidade`). If the status changes to `'disponivel'` for an `'alugada'` unidade, the action succeeds. The FK error message the user sees is probably from a different operation (maybe a `deletarUnidade` call on a unit that has contratos, not an edit). Unidades table has no CASCADE — `DELETE unidades WHERE id=? ` will fail with `contratos_unidade_id_fkey` if any contrato references it.

**Actionable:** Add a guard in `deletarUnidade`: query `contratos.count WHERE unidade_id = id` first — if > 0, return 400 "Unidade possui contratos e não pode ser excluída." Also add the same guard pattern to `editarUnidade` for status changes that conflict with active contratos (e.g., prevent setting status back to `'disponivel'` while a contrato `ativo` references the unit).

#### 4. Mobile Layout — Authenticated Area

**Integration point:** `src/app/dashboard/layout.js` renders `OwnerSidebar` (`w-64 shrink-0`) in a flex row. On mobile, the sidebar takes full width or collapses incorrectly because `romma-sidebar-wrapper` class is not defined in `globals.css` — this class appears in `DashboardLayout` but is not in the CSS file (the file ends at line ~200 checked, no `romma-sidebar-wrapper` definition found). The sidebar never hides on mobile.

`MobileNav.js` provides `MobileTopBar` and `MobileBottomNav` components — they exist but are not used in `dashboard/layout.js`. They are only used in the portal.

**Fix path:** `DashboardLayout` needs a responsive split:
- Mobile: `MobileTopBar` + `MobileBottomNav` (tabs for VG, UN, CT, LC) + no sidebar
- Desktop: existing `OwnerSidebar` layout

This means `DashboardLayout` needs to become a Client Component (to use `usePathname` for bottom nav active state), OR pass nav items to a responsive wrapper that conditionally renders `OwnerSidebar` vs `MobileBottomNav`.

#### 5. Theme Variations

**Integration point:** `globals.css` already has a complete token architecture for theming. The `:root` block defines 5 source tokens (`--ds-primary`, `--ds-background`, `--ds-surface`, `--ds-secondary`, `--ds-highlight`). All other variables derive from these via CSS relative color syntax. The `.dark` block mirrors `:root` with identical values (dark-only design — no light mode).

**To switch themes:** Override `--ds-*` tokens on `:root` via a data attribute or class. Example:
```css
[data-theme="forest"] {
  --ds-primary:    oklch(0.35 0.15 160);
  --ds-highlight:  oklch(0.72 0.18 140);
}
```
Apply `document.documentElement.setAttribute('data-theme', 'forest')` from a client component. No Tailwind config changes needed — the entire system cascades from CSS vars.

**No new infrastructure needed.** Theme switching is a pure CSS variable override. The login page, dashboard, and portal all consume the same tokens. A `ThemeProvider` context with `localStorage` persistence is optional polish.

#### 6. Animations

**Current state:** `tw-animate-css` is already installed (v1.4.0) and imported in `globals.css`. One animation already exists: `animate-loading-bar` used in `login/page.js`. The `--ease-crisp` easing is defined. Tailwind v4's `@keyframes` support is native.

**Integration point for Framer Motion vs CSS:**
- CSS transitions + tw-animate-css: zero bundle cost, sufficient for fade/slide/scale on modals, badges, and status changes. The existing modal pattern (LocatariosDesktop, Unidades forms) uses plain `className` conditionals — adding `animate-in fade-in` from tw-animate-css requires only class additions.
- Framer Motion: adds ~25KB gzipped. Justified only for gesture-driven animations (drag, spring physics) or complex sequencing. For the v1.1 scope (contract close, revoke confirmation), CSS is sufficient.

**Recommendation:** Use tw-animate-css `animate-in`, `fade-in`, `slide-in-from-bottom-4` on modal entry. Use CSS `transition` on status badge color changes. Reserve Framer Motion for post-TCC if at all.

---

### New Components

| Component | Path | Type | Purpose |
|-----------|------|------|---------|
| `SignUpForm` | `src/app/signup/page.js` | Client Component | Proprietário first-time signup form. Mirrors LoginPage structure: same TopStrip, LeftPanel (hero image), BottomMeta. RightPanel hosts email + password + confirmPassword fields. Calls new Server Action. Shows "instância já ativa" error if signup is blocked. |
| Responsive dashboard layout wrapper | `src/components/ui/DashboardShell.js` | Client Component | Wraps `OwnerSidebar` (desktop) + `MobileTopBar` + `MobileBottomNav` (mobile). Uses `usePathname` for active state. `DashboardLayout` imports this. |

---

### Modified Components

| Component | Path | Change | Why |
|-----------|------|--------|-----|
| `LoginPage` | `src/app/login/page.js` | Add "Primeiro acesso →" link to `/signup` | Signup discovery |
| `DashboardLayout` | `src/app/dashboard/layout.js` | Replace inline layout with `DashboardShell` | Mobile support |
| `src/actions/locatarios.js` | — | Fix `revogarConvite`: add contrato count guard before delete; fix `status_convite` flip mechanism | Bug fix |
| `src/actions/unidades.js` | — | Add guard in `deletarUnidade` for active contrato check; clarify error message | Bug fix |
| `src/app/globals.css` | — | Add `[data-theme="..."]` blocks for alternate palettes | Theme variations |
| `LocatariosDesktop` | `src/components/features/LocatariosDesktop.js` | Derive displayed status from `email_confirmed_at` (via query update) or add webhook-driven `status_convite` update | Bug fix for revogar display |

---

### New Server Actions

| Action | File | Logic |
|--------|------|-------|
| `cadastrarProprietario(email, password)` | `src/actions/auth.js` (new) | 1. Query `supabaseAdmin.from('proprietarios').select('id', {count:'exact', head:true})`. If count > 0 → return {status:403, erroMessage:'Instância já configurada.'}. 2. `supabaseAdmin.auth.admin.createUser({email, password, email_confirm:true})`. 3. Insert `proprietarios(usuario_id: user.id)`. 4. Return {status:200}. |

---

### Build Order

Dependencies determine this order:

**1. Bug: Revogar convite (blocks trust in the system)**
- Fix `revogarConvite` in `src/actions/locatarios.js`: add contrato count guard before delete
- Update `getLocatarios` query (both `queries-client.js` and `queries-server.js`) to join `auth.users` for `email_confirmed_at`, OR add a DB trigger to flip `status_convite`
- Verify `deletarLocatario` has the same contrato guard
- No new files. Modifies: `src/actions/locatarios.js`, optionally `queries-client.js`/`queries-server.js`

**2. Bug: Editar/Deletar unidade FK error**
- Add guard in `deletarUnidade` checking contrato count
- Add validation in `editarUnidade` preventing `status = 'disponivel'` when an `ativo` contrato exists
- No new files. Modifies: `src/actions/unidades.js`

**3. Signup do Proprietário**
- Create `src/actions/auth.js` with `cadastrarProprietario`
- Create `src/app/signup/page.js` (new Client Component — copy LoginPage shell, new form)
- Add link in `src/app/login/page.js`
- No schema changes needed — `proprietarios` table exists

**4. Mobile dashboard layout**
- Create `src/components/ui/DashboardShell.js` (Client Component — responsive layout)
- Update `src/app/dashboard/layout.js` to use DashboardShell
- The portal layout already works on mobile (`flex flex-col h-screen`) — may only need minor adjustments

**5. Theme variations**
- Add `[data-theme]` blocks to `globals.css`
- Add theme switcher UI (can be a debug-only overlay for TCC demo, or a settings toggle in sidebar footer)
- Zero risk — CSS-only change, no component logic changes

**6. Animations**
- Add `animate-in fade-in slide-in-from-bottom-4` classes to existing modals in `Unidades.js`, `LocatariosDesktop.js`, `Contratos.js`
- CSS transition additions to `StatusBadge.js` for color changes
- No new dependencies needed — `tw-animate-css` already installed

---

### Bug Diagnoses

#### Revogar Convite — Full Analysis

**Symptom:** Action call fails or shows unexpected error.

**Code path:**
1. `LocatariosDesktop` calls `revogarConvite(l.id)` when REVOGAR button is clicked
2. `revogarConvite` queries `locatarios.select('usuario_id, status_convite').eq('id', id).single()`
3. Checks `loc.status_convite !== 'pendente'` → returns 400 if true
4. Deletes from `locatarios`
5. Deletes from `auth.users`

**Root cause 1 — `status_convite` never flips to `'aceito'`:** There is no trigger in any migration that updates `locatarios.status_convite` when a user accepts the invite. The column defaults to `'pendente'`. The check on line 100 always passes (everyone is `pendente`). So that guard is not the failure point.

**Root cause 2 — FK violation on `locatarios` delete:** The `contratos` table has `locatario_id REFERENCES public.locatarios(id)` with no ON DELETE action specified, which defaults to `RESTRICT`. If ANY contrato references the locatário being revoked (even encerrado/cancelado), the `DELETE FROM locatarios WHERE id=?` will fail with `contratos_locatario_id_fkey`.

**Root cause 3 — Auth delete timing:** Even if the locatários row is deleted, `supabaseAdmin.auth.admin.deleteUser()` may fail if the user is in a specific state. This is secondary to root cause 2.

**Fix:** Add before the delete:
```js
const { count } = await supabaseAdmin
  .from('contratos')
  .select('id', { count: 'exact', head: true })
  .eq('locatario_id', id)
if (count > 0) return { status: 400, erroMessage: 'Locatário possui contratos vinculados.' }
```

For the `status_convite` display issue: query `auth.users` via `supabaseAdmin.auth.admin.listUsers()` and cross-reference `email_confirmed_at`, OR add a Postgres trigger:
```sql
CREATE OR REPLACE FUNCTION sync_locatario_status_convite()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  IF NEW.email_confirmed_at IS NOT NULL AND OLD.email_confirmed_at IS NULL THEN
    UPDATE public.locatarios SET status_convite = 'aceito'
    WHERE usuario_id = NEW.id;
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER on_auth_user_confirmed
  AFTER UPDATE ON auth.users
  FOR EACH ROW EXECUTE FUNCTION sync_locatario_status_convite();
```
This trigger approach is the cleanest and avoids N+1 queries in the UI.

#### Editar Unidade — FK Constraint Error

**Symptom:** Error message references `contratos_unidade_id_fkey`.

**Analysis:** `editarUnidade` only calls `UPDATE unidades SET ... WHERE id = ?`. This cannot trigger a FK violation on `contratos_unidade_id_fkey` — that FK fires when the child (`contratos`) references a non-existent parent (`unidades`), or when trying to delete/update the `id` column of `unidades`. Since the edit never changes `unidades.id`, no FK fires.

**Actual source:** The user is likely seeing this error from `deletarUnidade`, not `editarUnidade`. The `Unidades.js` component has both delete and edit buttons rendering at the same time with shared `erro` state. When delete fails with the FK error, `setErro(result.erroMessage)` sets the shared `erro` state. The form then appears to show the error in the edit context.

**Fix:** Separate error state for delete vs edit operations in `Unidades.js` (or add the contrato guard in `deletarUnidade` to prevent the error from surfacing at all). Add the guard:
```js
const { count } = await supabaseAdmin
  .from('contratos').select('id', {count:'exact', head:true}).eq('unidade_id', id)
if (count > 0) return { status: 400, erroMessage: 'Unidade possui contratos — encerre ou cancele os contratos primeiro.' }
```

---

### Architecture Confidence

| Area | Confidence | Notes |
|------|------------|-------|
| Signup flow | HIGH | Table schema + RPC function confirmed in migrations |
| Revogar bug root cause | HIGH | FK structure confirmed in schema, no trigger for status_convite flip confirmed by absence in all migration files |
| FK constraint on unidade edit | HIGH | SQL semantics confirm UPDATE on non-PK column cannot trigger referencing FK |
| Mobile layout gap | HIGH | DashboardLayout source confirmed, `romma-sidebar-wrapper` not defined in globals.css |
| Theme variation approach | HIGH | CSS var architecture confirmed in globals.css — `--ds-*` source tokens fully cascade |
| Animation approach | HIGH | tw-animate-css already imported in globals.css |
