import { test, expect } from '@playwright/test'

test.describe('Auth confirm — Route Handler /auth/confirm', () => {
  test('2.1 — GET /auth/confirm sem parâmetros redireciona para /login com error=invite_invalid', async ({ page }) => {
    await page.goto('/auth/confirm')
    await page.waitForURL(url => url.includes('/login') && url.includes('error=invite_invalid'), { timeout: 10_000 })
    expect(page.url()).toContain('/login')
    expect(page.url()).toContain('error=invite_invalid')
  })

  test('2.2 — GET /auth/confirm com token inválido redireciona para /login com error=invite_invalid', async ({ page }) => {
    await page.goto('/auth/confirm?token_hash=invalido&type=invite')
    await page.waitForURL(url => url.includes('/login') && url.includes('error=invite_invalid'), { timeout: 10_000 })
    expect(page.url()).toContain('/login')
    expect(page.url()).toContain('error=invite_invalid')
  })
})
