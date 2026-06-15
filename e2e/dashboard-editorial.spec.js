/**
 * Wave-0 E2E scaffold for DASH-04, DASH-05, DASH-06
 *
 * DASH-04: OccupancyBar — Taxa de Ocupação numeral + per-unit bar visible
 * DASH-05: CashFlowChart — 6-column bar chart visible with gold eyebrow
 * DASH-06: Quick-action links navigate to correct routes
 *
 * These tests WILL FAIL until Plan 02/03 ship the editorial layout.
 * They define the acceptance contract Plan 02/03 must satisfy.
 */
import { test, expect } from '@playwright/test'
import { login } from './helpers.js'
import { PROPRIETARIO } from './fixtures.js'

test.describe('@editorial Dashboard editorial — DASH-04/05/06', () => {
  test.use({ viewport: { width: 1440, height: 900 } })

  test.beforeEach(async ({ page }) => {
    await login(page, PROPRIETARIO)
    await page.waitForURL('**/dashboard', { timeout: 15_000 })
    await page.goto('/dashboard')
    await page.waitForURL('**/dashboard', { timeout: 10_000 })
    await page.locator('.romma-desktop-only').first().waitFor({ state: 'visible', timeout: 10_000 })
  })

  test('DASH-04 — Taxa de Ocupação eyebrow e numeral de percentual visíveis', async ({ page }) => {
    const desktopSection = page.locator('.romma-desktop-only')

    // Eyebrow label "Taxa de Ocupação" must be visible
    await expect(desktopSection.getByText('Taxa de Ocupação')).toBeVisible({ timeout: 5_000 })

    // Occupancy numeral must match pattern like "75%" or "0%"
    const numeralLocator = desktopSection.getByText(/^\d+%$/)
    await expect(numeralLocator.first()).toBeVisible({ timeout: 5_000 })
  })

  test('DASH-05 — Gráfico de fluxo de caixa com 6 colunas visível', async ({ page }) => {
    const desktopSection = page.locator('.romma-desktop-only')

    // Gold eyebrow "Previsão de Fluxo · 2026" must be visible
    await expect(desktopSection.getByText(/Previsão de Fluxo/)).toBeVisible({ timeout: 5_000 })

    // Chart container must have exactly 6 direct child column divs
    const chartColumns = page.locator('[data-testid="cashflow-chart"] > div')
    await expect(chartColumns).toHaveCount(6, { timeout: 5_000 })
  })

  test('DASH-06 — Atalhos rápidos com links para as seções corretas', async ({ page }) => {
    const desktopSection = page.locator('.romma-desktop-only')

    // All four quick-action links must exist with correct hrefs
    await expect(desktopSection.locator('a[href="/dashboard/unidades"]').first()).toBeVisible({ timeout: 5_000 })
    await expect(desktopSection.locator('a[href="/dashboard/locatarios"]').first()).toBeVisible({ timeout: 5_000 })
    await expect(desktopSection.locator('a[href="/dashboard/contratos"]').first()).toBeVisible({ timeout: 5_000 })
    await expect(desktopSection.locator('a[href="/"]').first()).toBeVisible({ timeout: 5_000 })
  })
})
