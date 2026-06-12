/**
 * Smoke test: tema Obsidian hardcoded — T-12-01
 *
 * D-02: Obsidian é a paleta vencedora. ThemeToggle removido permanentemente.
 * Valida que nenhum data-theme é aplicado ao <html> (Obsidian = :root base, sem atributo).
 *
 * Para executar:
 *   npx playwright test --grep tema --project=chromium
 */

import { test, expect } from '@playwright/test'
import { login } from './helpers.js'
import { PROPRIETARIO } from './fixtures.js'

test.describe("tema", () => {
  test.beforeEach(async ({ page }) => {
    await login(page, PROPRIETARIO)
    await page.waitForURL('**/dashboard', { timeout: 10_000 })
  })

  test("T-12-01 — ThemeToggle ausente; data-theme não aplicado (Obsidian hardcoded)", async ({ page }) => {
    await page.goto('/dashboard')
    await page.waitForURL('**/dashboard', { timeout: 10_000 })

    // ThemeToggle removido em D-02 — nunca deve aparecer em nenhum ambiente
    const toggle = page.locator('[data-testid="theme-toggle"]')
    await expect(toggle).toBeHidden()

    // Obsidian = :root base — nenhum data-theme deve ser setado no <html>
    const dataTheme = await page.locator('html').getAttribute('data-theme')
    expect(dataTheme === null || dataTheme === '').toBeTruthy()
  })
})
