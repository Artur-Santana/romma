import { test, expect } from '@playwright/test'
import { login } from './helpers.js'
import { PROPRIETARIO, LOCATARIO } from './fixtures.js'

test.describe('Auth redirect', () => {
  test('1.1 — proprietário loga e chega em /dashboard', async ({ page }) => {
    await login(page, PROPRIETARIO)
    // 500ms delay em login/page.js:174 antes do router.push — usar waitForURL
    await page.waitForURL('**/dashboard', { timeout: 10_000 })
    expect(page.url()).toContain('/dashboard')
  })

  test('1.2 — não-proprietário loga e é redirecionado para /portal/dashboard', async ({ page }) => {
    await login(page, LOCATARIO)
    // login/page.js: is_proprietario() retorna false → redirect para /portal/dashboard
    await page.waitForURL('**/portal/dashboard', { timeout: 10_000 })
    expect(page.url()).toContain('/portal/dashboard')
  })

  test('1.3 — anônimo visita /dashboard e é redirecionado para /login', async ({ page }) => {
    await page.goto('/dashboard')
    await page.waitForURL('**/login', { timeout: 10_000 })
    expect(page.url()).toContain('/login')
  })

  test('1.4 — senha errada exibe erro e URL permanece /login', async ({ page }) => {
    await login(page, { email: PROPRIETARIO.email, password: 'senhaErrada999!' })
    await expect(page.getByText('ERRO_AUTH · 401')).toBeVisible({ timeout: 10_000 })
    expect(page.url()).toContain('/login')
  })

  test('1.5 — proprietário acessa /dashboard/contratos diretamente', async ({ page }) => {
    await login(page, PROPRIETARIO)
    await page.waitForURL('**/dashboard', { timeout: 10_000 })
    await page.goto('/dashboard/contratos')
    await page.waitForURL('**/dashboard/contratos', { timeout: 10_000 })
    expect(page.url()).toContain('/dashboard/contratos')
  })
})
