import { test, expect } from '@playwright/test'
import { login } from './helpers.js'
import { PROPRIETARIO } from './fixtures.js'

test.describe('Auth session', () => {
  test('2.1 — sessão persiste após reload em /dashboard', async ({ page }) => {
    await login(page, PROPRIETARIO)
    await page.waitForURL('**/dashboard', { timeout: 10_000 })
    await page.reload()
    await page.waitForURL('**/dashboard', { timeout: 10_000 })
    expect(page.url()).toContain('/dashboard')
  })

  test.skip('2.2 — logout limpa sessão e /dashboard redireciona para /login', async ({ page }) => {
    // Implementar quando logout estiver na UI
    await login(page, PROPRIETARIO)
    await page.waitForURL('**/dashboard', { timeout: 10_000 })
    // await page.click('[data-testid="logout-btn"]')
    // await page.goto('/dashboard')
    // await page.waitForURL('**/login', { timeout: 10_000 })
    // expect(page.url()).toContain('/login')
  })
})
