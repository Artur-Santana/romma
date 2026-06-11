/**
 * Smoke test: ThemeToggle gate — T-12-01
 *
 * Valida que o ThemeToggle dev-only não vaza para produção.
 *
 * Para validar contra build de produção (mitigação T-12-01 completa):
 *   next build && next start
 *   NODE_ENV=production npx playwright test --grep tema --project=chromium
 *
 * Em ambiente de desenvolvimento (NODE_ENV=development):
 *   npx playwright test --grep tema --project=chromium
 *   → assere PRESENÇA do toggle (gate funciona nos dois sentidos)
 */

import { test, expect } from '@playwright/test'
import { login } from './helpers.js'
import { PROPRIETARIO } from './fixtures.js'

test.describe("tema", () => {
  test.beforeEach(async ({ page }) => {
    await login(page, PROPRIETARIO)
    await page.waitForURL('**/dashboard', { timeout: 10_000 })
  })

  test("T-12-01 — ThemeToggle ausente em produção, presente em desenvolvimento", async ({ page }) => {
    await page.goto('/dashboard')
    await page.waitForURL('**/dashboard', { timeout: 10_000 })

    const toggle = page.locator('[data-testid="theme-toggle"]')

    if (process.env.NODE_ENV === 'production') {
      // Mitigação T-12-01: toggle não deve aparecer no bundle de produção
      await expect(toggle).toBeHidden()
    } else {
      // Em desenvolvimento: toggle deve estar visível (gate funciona nos dois sentidos)
      await expect(toggle).toBeVisible({ timeout: 10_000 })
    }
  })
})
