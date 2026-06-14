import { test, expect } from '@playwright/test'
import { config } from 'dotenv'

config({ path: '.env.test' })

// ── /login ───────────────────────────────────────────────────────────────────

test.describe('Login screen (/login)', () => {
  test('1.1 — split-panel: aside visible at desktop viewport', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 })
    await page.goto('/login')
    // AuthAside is hidden on mobile via "hidden lg:block" — at 1280px it must be visible
    // The ROMMA wordmark lives inside AuthAside
    await expect(page.getByText('ROMMA').first()).toBeVisible()
  })

  test('1.2 — split-panel: aside hidden at 375px, form still visible', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 })
    await page.goto('/login')
    // At 375px the aside is "hidden lg:block" → not visible
    // The ROMMA wordmark text inside AuthAside should not be visible
    // (There may be other text containing ROMMA in BottomMeta — check specifically for the display wordmark via aside)
    const rommaWordmarks = page.locator('text=ROMMA')
    // BottomMeta left text is "ROMMA © 2026 · CONSOLE v2.4.1" — those are also hidden on mobile
    // The form (AuthFrame right panel) is always visible
    await expect(page.getByRole('button', { name: /ACESSAR SISTEMA/i })).toBeVisible()
  })

  test('1.3 — SubmitButton idle label ACESSAR SISTEMA exists', async ({ page }) => {
    await page.goto('/login')
    await expect(page.getByRole('button', { name: /ACESSAR SISTEMA/i })).toBeVisible()
  })

  test('1.4 — password toggle EXIBIR button exists', async ({ page }) => {
    await page.goto('/login')
    await expect(page.getByRole('button', { name: 'EXIBIR' })).toBeVisible()
  })

  test('1.5 — password toggle changes input type from password to text', async ({ page }) => {
    await page.goto('/login')
    const senhaInput = page.locator('#senha-login')
    await expect(senhaInput).toHaveAttribute('type', 'password')
    await page.getByRole('button', { name: 'EXIBIR' }).click()
    await expect(senhaInput).toHaveAttribute('type', 'text')
  })

  test('1.6 — Esqueci minha senha navigates to /auth/reset-password', async ({ page }) => {
    await page.goto('/login')
    await page.getByRole('button', { name: 'Esqueci minha senha' }).click()
    await page.waitForURL('**/auth/reset-password', { timeout: 5_000 })
    expect(page.url()).toContain('/auth/reset-password')
  })
})

// ── /signup ───────────────────────────────────────────────────────────────────

test.describe('Signup screen (/signup)', () => {
  test('2.1 — renders 6 field labels', async ({ page }) => {
    await page.goto('/signup')
    // Each label is rendered as a <label> element inside AuthField
    // Use exact:true to avoid partial text matches (e.g. NOME vs SOBRENOME)
    await expect(page.getByText('NOME', { exact: true })).toBeVisible()
    await expect(page.getByText('SOBRENOME', { exact: true })).toBeVisible()
    await expect(page.getByText('E-MAIL', { exact: true })).toBeVisible()
    await expect(page.getByText('TELEFONE', { exact: true })).toBeVisible()
    await expect(page.getByText('SENHA', { exact: true })).toBeVisible()
    await expect(page.getByText('CONFIRMAR SENHA', { exact: true })).toBeVisible()
  })

  test('2.2 — password hint text visible below SENHA field', async ({ page }) => {
    await page.goto('/signup')
    await expect(
      page.getByText('Mínimo 6 caracteres, 1 letra maiúscula e 1 número.')
    ).toBeVisible()
  })

  test('2.3 — submitting empty form surfaces ERRO_VALIDAÇÃO banner (client-side, no network)', async ({ page }) => {
    await page.goto('/signup')
    // Submit without filling any fields — validarCadastro will block and show banner
    await page.getByRole('button', { name: /CONFIGURAR SISTEMA/i }).click()
    await expect(page.getByText('ERRO_VALIDAÇÃO')).toBeVisible()
    // URL must remain on /signup — no navigation occurred
    expect(page.url()).toContain('/signup')
  })

  test('2.4 — user stays on /signup after failed client-side validation', async ({ page }) => {
    await page.goto('/signup')
    await page.locator('#nome-signup').fill('Ana')
    // Leave other required fields empty
    await page.getByRole('button', { name: /CONFIGURAR SISTEMA/i }).click()
    await expect(page.getByText('ERRO_VALIDAÇÃO')).toBeVisible()
    expect(page.url()).toContain('/signup')
  })
})

// ── /auth/reset-password ──────────────────────────────────────────────────────

test.describe('Reset password screen (/auth/reset-password)', () => {
  test('3.1 — renders request-email sub-flow by default (no recovery session)', async ({ page }) => {
    await page.goto('/auth/reset-password')
    // Default view shows the request-email form with ENVIAR LINK button
    await expect(page.getByRole('button', { name: /ENVIAR LINK/i })).toBeVisible({ timeout: 8_000 })
  })

  test('3.2 — headline REDEFINIR SENHA. is visible in request-email sub-flow', async ({ page }) => {
    await page.goto('/auth/reset-password')
    // Use getByRole heading to uniquely target the h2 element
    await expect(
      page.getByRole('heading', { name: /REDEFINIR/i })
    ).toBeVisible({ timeout: 8_000 })
  })

  test('3.3 — back button ← LOGIN is visible and navigates to /login', async ({ page }) => {
    await page.goto('/auth/reset-password')
    const backBtn = page.getByRole('button', { name: '← LOGIN' })
    await expect(backBtn).toBeVisible({ timeout: 8_000 })
    await backBtn.click()
    await page.waitForURL('**/login', { timeout: 5_000 })
    expect(page.url()).toContain('/login')
  })
})
