# TESTING
_Last updated: 2026-05-21 | Focus: quality_

## Summary
Romma has Playwright E2E tests only — no unit or integration tests. Coverage is thin (~10 active tests) covering auth flows, basic navigation smoke, and one validation case. No CI/CD pipeline configured.

---

## Test Infrastructure

**Framework:** Playwright `@playwright/test` ^1.60.0
**Test directory:** `e2e/`
**Browser:** Chromium Desktop Chrome only

**Commands:**
```bash
npm run test:e2e        # playwright test
npm run test:e2e:ui     # playwright test --ui
npm run db:test:reset   # supabase db reset
npm run db:test:seed    # node e2e/seed.mjs
```

**Config:** `playwright.config.js`
- `fullyParallel: false`, `workers: 1` (sequential)
- `globalSetup: './e2e/global-setup.js'` → runs `seed()` before all tests
- `webServer`: builds/starts Next.js prod server using `.env.test` vars

---

## Test Setup

**Seed** (`e2e/seed.mjs`): creates `proprietario@test.romma.local` and `locatario@test.romma.local` via admin API, upserts `proprietarios` row.

**Fixtures** (`e2e/fixtures.js`): `PROPRIETARIO` and `LOCATARIO` credential constants.

**Helpers** (`e2e/helpers.js`): `login(page, { email, password })` — navigates to `/login`, fills and submits. Caller responsible for `waitForURL`.

---

## Spec Files

| File | Suite | Tests |
|------|-------|-------|
| `auth-redirect.spec.js` | Auth redirect | 5 — login flows, role redirects, wrong password |
| `auth-session.spec.js` | Auth session | 1 active + 1 `test.skip` (logout — awaiting UI) |
| `dashboard-smoke.spec.js` | Dashboard smoke | 4 routes load without error + 1 text assertion |
| `server-actions.spec.js` | Server actions validation | 2 — empty name, missing edificio_id |

**Total active:** ~10 tests. One explicitly skipped (`test.skip` for logout).

---

## Test Patterns

```js
test.beforeEach(async ({ page }) => {
  await login(page, PROPRIETARIO);
  await page.waitForURL('**/dashboard', { timeout: 10_000 });
});

// Navigation assertion
await expect(page.getByText('Edifícios')).toBeVisible({ timeout: 10_000 });

// Parameterized routes
const routes = ['/dashboard', '/dashboard/unidades', ...];
for (const route of routes) {
  test(`${route} loads`, async ({ page }) => { ... });
}
```

---

## Coverage Gaps

**No unit tests for:**
- Server Actions validation logic (`src/actions/*.js`)
- `src/lib/utils.js` (`fmtBRL`, `fmtData`)
- `applyEvent` in `useUnidadesRealtime.js`
- Query builder functions in `queries-client.js`, `queries-server.js`

**No E2E coverage for:**
- CRUD flows: Unidades, Locatários, Contratos, Parcelas forms
- Realtime updates (unit status changes)
- Edge Function `gerar-parcelas`
- Mobile layout / responsive behavior
- Error states from failed DB operations
- `encerrarContrato` / `cancelarContrato` flows
- Parcela payment marking
- Invite locatário flow

**CI/CD:** No pipeline detected (no `.github/`, no `ci.yml`). Tests run manually only.

**No coverage reporting** configured.
