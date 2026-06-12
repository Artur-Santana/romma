/**
 * Phase 13 — Mobile Responsivo
 * UX-02: Dashboard sidebar oculta em 375px; MobileTopBar e MobileBottomNav visíveis
 * UX-03: 4 abas do dashboard sem overflow horizontal em 375px
 * UX-04: Portal do Locatário sem overflow horizontal em 375px
 */
import { test, expect } from '@playwright/test'
import { login } from './helpers.js'
import { PROPRIETARIO, LOCATARIO } from './fixtures.js'

test.describe('UX-02 — Dashboard shell mobile', () => {
  test.use({ viewport: { width: 375, height: 812 } })

  test.beforeEach(async ({ page }) => {
    await login(page, PROPRIETARIO)
    await page.waitForURL('**/dashboard', { timeout: 10_000 })
  })

  test('UX-02 — sidebar oculta; MobileTopBar e MobileBottomNav visíveis', async ({ page }) => {
    await page.goto('/dashboard')
    await page.waitForLoadState('networkidle')
    await expect(page.locator('.romma-sidebar-wrapper')).toBeHidden()
    await expect(page.locator('[data-testid="mobile-top-bar"]')).toBeVisible()
    await expect(page.locator('[data-testid="mobile-bottom-nav"]')).toBeVisible()
  })
})

test.describe('UX-03 — Abas do dashboard sem overflow', () => {
  test.use({ viewport: { width: 375, height: 812 } })

  test.beforeEach(async ({ page }) => {
    await login(page, PROPRIETARIO)
    await page.waitForURL('**/dashboard', { timeout: 10_000 })
  })

  test('UX-03 — /dashboard sem overflow horizontal', async ({ page }) => {
    await page.goto('/dashboard')
    await page.waitForLoadState('networkidle')
    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth)
    expect(scrollWidth).toBeLessThanOrEqual(375)
  })

  test('UX-03 — /dashboard/unidades sem overflow horizontal', async ({ page }) => {
    await page.goto('/dashboard/unidades')
    await page.waitForLoadState('networkidle')
    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth)
    expect(scrollWidth).toBeLessThanOrEqual(375)
  })

  test('UX-03 — /dashboard/contratos sem overflow horizontal', async ({ page }) => {
    await page.goto('/dashboard/contratos')
    await page.waitForLoadState('networkidle')
    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth)
    expect(scrollWidth).toBeLessThanOrEqual(375)
  })

  test('UX-03 — /dashboard/locatarios sem overflow horizontal', async ({ page }) => {
    await page.goto('/dashboard/locatarios')
    await page.waitForLoadState('networkidle')
    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth)
    expect(scrollWidth).toBeLessThanOrEqual(375)
  })

  test('UX-03 — /dashboard/contratos/[id] (Parcelas) sem overflow horizontal', async ({ page }) => {
    await page.goto('/dashboard/contratos')
    await page.waitForLoadState('networkidle')
    await page.getByRole('button', { name: 'VER →' }).first().click()
    await page.waitForURL('**/dashboard/contratos/**', { timeout: 10_000 })
    await page.waitForLoadState('networkidle')
    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth)
    expect(scrollWidth).toBeLessThanOrEqual(375)
  })
})

test.describe('UX-04 — Portal mobile', () => {
  test.use({ viewport: { width: 375, height: 812 } })

  test.beforeEach(async ({ page }) => {
    await login(page, LOCATARIO)
    await page.waitForURL('**/portal/dashboard', { timeout: 15_000 })
  })

  test('UX-04 — portal sem overflow horizontal', async ({ page }) => {
    await page.waitForLoadState('networkidle')
    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth)
    expect(scrollWidth).toBeLessThanOrEqual(375)
  })
})
