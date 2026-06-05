# Pitfalls: v1.1 Polish & Completeness

**Project:** Romma
**Milestone:** v1.1 — Adding polish and gap-closure to existing Next.js 16 + Supabase app
**Researched:** 2026-06-05
**Overall confidence:** HIGH (all findings grounded in actual codebase + official docs)

---

## Pitfalls

### Signup Flow — Single-Instance Proprietário Constraint

**Risk:** Supabase `auth.signUp()` has no built-in guard against creating a second account. The `is_proprietario` RPC that gates the dashboard is reactive (checked post-login), not preventive (checked pre-signup). Anyone who finds `/signup` can create a second `auth.users` row. The partial unique index `contratos_unidade_ativo_unique` protects contracts; there is no equivalent guard on the proprietário role.

**What breaks silently:** A second user signs up, lands on `/` or `/portal` (redirected by `proxy.js` because `is_proprietario` returns false), and appears harmless — but now the DB has an orphaned auth user with no locatario row and no proprietario assignment. The demo environment could be poisoned before the banca.

**Prevention:**
1. Use Supabase's `before-user-created` auth hook (Postgres function) to check whether a `proprietarios` row already exists and return an HTTP error to block the signup. The hook fires before the `auth.users` INSERT, so the count check is clean.
2. Alternative (simpler for TCC): Do not expose a public `/signup` route at all. Implement signup as a one-time server action that checks `SELECT COUNT(*) FROM proprietarios` before calling `supabase.auth.admin.createUser()`. Gate the route behind a setup token in env vars.
3. If a signup page is client-rendered with `supabase.auth.signUp()`, add a server-side preflight check: call a Server Action that queries proprietarios count and returns 409 if > 0. Do this before the signUp call, not after.

**Phase to address:** First phase of v1.1 that implements the signup screen.

---

### Revoke User Access — Broken `revogarConvite` Root Cause

**Risk:** `revogarConvite` in `src/actions/locatarios.js` (line 100) guards with `if (loc.status_convite !== 'pendente') return 400`. This means the button that revokes a locatário who has already *accepted* their invite and logged in will always return 400 — the condition is checking for `pendente`, but an active locatário has `status_convite = 'aceito'`. The intended "revoke access" feature (remove portal access for an active user) is architecturally different from "revoke an unseen invite".

**What breaks silently:** The UI calls `revogarConvite` for both cases. The `alert(erroMessage)` path fires with "Convite não está pendente." — this is an opaque error that looks like a bug when it's actually a missing code path.

**Secondary risk — JWT not invalidated on ban/delete:** Even if the fix deletes the `auth.users` row via `supabaseAdmin.auth.admin.deleteUser()`, any active JWT the locatário holds remains valid until it expires (Supabase does not validate JWTs against current user state mid-request). For a TCC demo this is acceptable, but the fix must also delete the locatario row (or it leaks via RLS `locatarios_select_auth` which is `TO authenticated USING (true)`).

**Prevention:**
1. Separate the two operations: `revogarConvite` (delete pending invite, user never logged in) vs. `revogarAcesso` (delete active user's auth account + locatario row).
2. For `revogarAcesso`: call `deleteUser(loc.usuario_id)` then `delete from locatarios where id = id`. Order matters — delete auth first, then locatario row, to avoid FK constraint (`locatarios.usuario_id REFERENCES auth.users(id)`) blocking the locatario delete.
3. Do NOT use `banUser` / `updateUserById({ ban_duration })` as the primary revoke mechanism — it does not invalidate existing JWTs and requires a separate refresh cycle before the lock-out takes effect. For a demo this appears broken.

**Phase to address:** Bug-fix phase for "revogar acesso" (described as broken in PROJECT.md).

---

### Editing Unidades — FK Constraint Violation (`contratos_unidade_id_fkey`)

**Risk:** The error `contratos_unidade_id_fkey` fires on DELETE, not on UPDATE. `editarUnidade` calls `.update(patch)` which should never touch FK columns and should not trigger the constraint. The actual bug is almost certainly the UI calling `deletarUnidade` on a unidade that has existing contratos — Postgres RESTRICT (the default since no `ON DELETE` clause is specified on `contratos.unidade_id`) prevents this.

**What breaks silently:** The error message surfaces as a generic 500 with the raw Postgres error string. The user sees "update or delete on table violates foreign key constraint contratos_unidade_id_fkey" and assumes editing is broken, when the real problem is deletion is correctly blocked.

**Prevention:**
1. Add a preflight check in `deletarUnidade`: query `SELECT COUNT(*) FROM contratos WHERE unidade_id = id` before attempting delete. Return a clear 409 with message "Unidade possui contratos e não pode ser removida."
2. Do NOT add `ON DELETE CASCADE` to `contratos.unidade_id` — that would silently wipe all contracts and parcelas when a unit is deleted, which is destructive and irreversible in production.
3. If the intent is to allow deletion of a unidade with encerrado/cancelado contratos but not ativo ones, write the preflight as `WHERE unidade_id = id AND status = 'ativo'`.
4. The `editarUnidade` action is safe as-is for UPDATE — no schema change needed.

**Phase to address:** Bug-fix phase alongside the unidades screen audit.

---

### Mobile Layout — Authenticated Area

**Risk:** `dashboard/layout.js` is a Server Component. Mobile navigation that requires toggle state (open/close sidebar drawer) must live in a Client Component. If the sidebar is added directly to `layout.js` with mobile-toggle state, Next.js will throw because Server Components cannot hold `useState`. Attempting to add `'use client'` to `layout.js` forces the entire layout — including the auth check and data fetches — to re-run on the client, breaking the SSR auth pattern.

**What breaks silently:** `romma-desktop-only` / `romma-mobile-only` CSS classes currently hide entire feature components by breakpoint. On mobile the dashboard area is blank, not broken with an error — so the breakage is invisible until tested on a real mobile viewport.

**Prevention:**
1. Keep `dashboard/layout.js` as a Server Component. Extract a `MobileNav` client component that owns the drawer open/close state and import it into the layout server component. This is the standard Next.js App Router pattern.
2. Avoid using `usePathname` or `useRouter` inside `layout.js` directly — wrap in a client component shell.
3. Test with Chrome DevTools device emulation at 375px (iPhone SE) and 390px (iPhone 14) before any phase is marked done. The `min-h-full` + `p-12` patterns in `romma-page` will overflow on mobile.
4. `romma-desktop-only` hides content with `display: none` on mobile. Features behind this class (e.g., `LocatariosDesktop`) need mobile-equivalent components or the class needs removal. Do not just strip the class — the layout will break on desktop.

**Phase to address:** Dedicated mobile layout phase.

---

### CSS Theme Switching — Tailwind v4 CSS Vars

**Risk:** Tailwind v4 uses a CSS-first config (`@theme` in `globals.css`) instead of `tailwind.config.js`. The current design system uses custom CSS vars (`--fg-1..5`, `--indigo`, etc.) defined in `globals.css`. Adding a theme toggle (e.g., dark/light or palette variants) requires these vars to be redefined under a selector (`.dark`, `[data-theme="alt"]`). If done carelessly, two problems arise: (1) flash of wrong theme on first paint because `next-themes` toggles a class on `<html>` client-side after SSR; (2) Tailwind v4 `dark:` utilities only work if the dark variant is configured to use `selector: '.dark'` — the default in v4 is `@media (prefers-color-scheme: dark)`.

**What breaks silently:** Utility classes like `dark:text-foreground` in shadcn/ui components will apply based on OS preference, not the toggled class, until the `dark` variant is explicitly reconfigured. This causes inconsistent behavior in the dashboard that only manifests when a user's OS is in dark mode but the app is in "light" palette.

**Prevention:**
1. To use class-based dark mode in Tailwind v4, add `@variant dark (&:where(.dark, .dark *))` in `globals.css` (not in `tailwind.config.js`).
2. Wrap the theme provider in `layout.js` (server component) using `next-themes` `ThemeProvider` — pass `attribute="class"` and `defaultTheme="dark"` to match the current Obsidian Blueprint baseline.
3. Add `suppressHydrationWarning` to the `<html>` element in `app/layout.js` to suppress the inevitable class mismatch on SSR.
4. If the goal is only palette swapping (not dark/light), use `data-theme` attribute instead of `class` and define `@variant theme-alt (&:where([data-theme="alt"], [data-theme="alt"] *))`. This avoids colliding with the existing `dark:` utility classes in shadcn components.
5. Do NOT redefine `--background`, `--foreground` et al. directly in `:root` for the alternate theme — it overrides shadcn component vars globally. Use the scoped `[data-theme="alt"]` selector.

**Phase to address:** Theme variation phase.

---

### Animation Libraries — Server Component Boundary Issues

**Risk:** `motion` (formerly Framer Motion) and all animation libraries that rely on DOM APIs are client-only. `layout.js` files in App Router are Server Components by default. Importing `motion` directly in a `layout.js` will fail at build time or cause a hydration mismatch.

**What breaks silently:** Adding `'use client'` to `dashboard/layout.js` to enable animations there forces the auth guard logic that currently runs server-side (the `supabase.rpc('is_proprietario')` call in `proxy.js`) to be bypassed for prefetching purposes. The dashboard layout itself does not re-run the auth check — it relies on `proxy.js`. This is safe, but adding `'use client'` to layout can expose the layout to flash-of-unauthenticated-content if the redirect in `proxy.js` is slow.

**Secondary risk:** `AnimatePresence` in Next.js App Router does not animate page exits by default because Next.js unmounts the page before the exit animation can play. Wrapping `{children}` in `layout.js` with `AnimatePresence` produces no exit animation without the `FrozenRouter` pattern or `template.js`.

**Prevention:**
1. Keep all animation components in feature Client Components (`src/components/features/*.js`), never in `layout.js` or page server shells.
2. For exit animations (encerrar contrato, revogar acesso), use CSS transitions (`transition-all`, `opacity`, `scale`) via Tailwind rather than motion library, to avoid the `AnimatePresence` routing issue entirely.
3. If motion library animations are needed at route level, use `src/app/dashboard/template.js` (re-renders on every navigation) instead of `layout.js` (persists). `template.js` supports enter animations but not exit animations.
4. For action animations (button → success state → dismiss), CSS keyframes via `tw-animate-css` (already in the stack) are sufficient and have zero Server Components risk.
5. Test all animations with `next build && next start` (production mode), not just `next dev --turbopack`. Turbopack's HMR can hide hydration issues that surface in production.

**Phase to address:** Animation phase. Flag for deeper testing before each phase ships.

---

### Deep-Dive Page Audits — Cross-Page Regression Risk

**Risk:** Each feature component (`LocatariosDesktop.js`, `UnidadesDesktop.js`, etc.) imports from `queries-client.js` and calls the same `supabaseAdmin` actions. A fix to `editarUnidade` that changes the return signature or error codes will silently break any component that checks `status === 200` without also checking the new error paths. Similarly, CSS var renames during theme work will break every component that hardcodes `var(--fg-1)` inline.

**What breaks silently:** Inline styles using CSS vars (e.g., `color: "var(--fg-1)"`) will fall back to `initial` with no visible error in the console — the element just turns black or transparent. This is the most common silent regression in this codebase's inline-style-heavy pattern.

**Prevention:**
1. Before shipping any phase, run `next build` and check for TypeScript/lint errors (the project uses `eslint-config-next` — zero lint errors is the gate).
2. Run the E2E Playwright suite after every phase: `npx playwright test`. The suite covers CRUD Proprietário + Parcelas + Realtime — any mutation signature change will surface here.
3. Audit inline `style={{ color: "var(--X)" }}` references when renaming or adding CSS vars. Use `grep -r "var(--" src/` to get the full list before a theme change.
4. When adding mobile layouts: test that `romma-desktop-only` components still render correctly at 1440px after the mobile equivalents are added. The CSS classes use media queries — a mistake in `globals.css` can flip visibility at all widths.

**Phase to address:** Every phase — treat E2E run as exit criterion.

---

## Summary Table

| Feature Area | Severity | Silent? | Hardest to Reverse |
|---|---|---|---|
| Signup single-instance | CRITICAL | Yes — second account appears harmless | Yes — once a second proprietário row exists, the role system is ambiguous |
| Revoke access bug | HIGH | No — surfaces as alert(erroMessage) | No — straightforward fix |
| Unidade FK on delete | MEDIUM | No — Postgres error shown | No — preflight check is additive |
| Mobile authenticated layout | HIGH | Yes — blank screen, no error | Medium — layout restructure affects all dashboard pages |
| CSS theme switching | MEDIUM | Yes — wrong theme on SSR, no error | Medium — CSS var renames are global |
| Animation Server Component boundary | MEDIUM | Sometimes — only visible in prod build | Low — move animation to client component |
| Deep-dive regression | HIGH | Yes — inline CSS var fallback is invisible | Medium — depends on scope of change |
