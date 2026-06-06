import { test, expect } from '@playwright/test'
import { login } from './helpers.js'
import { PROPRIETARIO } from './fixtures.js'

const routes = [
  { path: '/dashboard',            label: 'Visão Geral' },
  { path: '/dashboard/unidades',   label: '/dashboard/unidades' },
  { path: '/dashboard/contratos',  label: '/dashboard/contratos' },
  { path: '/dashboard/locatarios', label: '/dashboard/locatarios' },
]

test.describe('Dashboard smoke', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, PROPRIETARIO)
    await page.waitForURL('**/dashboard', { timeout: 10_000 })
  })

  for (const { path, label } of routes) {
    test(`4.x — ${path} carrega sem erro`, async ({ page }) => {
      await page.goto(path)
      await page.waitForURL(`**${path}`, { timeout: 10_000 })

      // Não deve exibir o estado de erro do Server Component
      await expect(page.getByText('Erro ao carregar dashboard')).not.toBeVisible()

      // Deve estar na URL correta (não redirecionado)
      expect(page.url()).toContain(path)
    })
  }

  test('4.1 — /dashboard renderiza "Visão Geral."', async ({ page }) => {
    await page.goto('/dashboard')
    await expect(page.getByText('Visão Geral.')).toBeVisible({ timeout: 10_000 })
  })

  test('UX-01 — sidebar exibe botão "Sair"', async ({ page }) => {
    await page.goto('/dashboard')
    await expect(page.getByText('Sair')).toBeVisible({ timeout: 10_000 })
  })

  test('UX-03 — sidebar não exibe link "Acessar como Locatário"', async ({ page }) => {
    await page.goto('/dashboard')
    await expect(page.getByText('Acessar como Locatário')).toHaveCount(0)
  })
})

// Página pública — sem login necessário
test.describe('BUG-04 — Link Voltar em /unidades', () => {
  test('BUG-04 — /unidades tem link "← Voltar" que navega para home', async ({ page }) => {
    // Navegar para /unidades sem autenticação (página pública)
    await page.goto('/unidades')
    await page.waitForURL('**/unidades', { timeout: 10_000 })

    // Deve ter um link com texto "← Voltar" ou "Voltar" no header
    // No código atual há apenas um <span> sem link — este teste estará RED
    const voltarLink = page.getByRole('link', { name: /voltar/i })
    await expect(voltarLink).toBeVisible({ timeout: 5_000 })

    // Clicar no link e verificar que navega para a home "/"
    await voltarLink.click()
    await page.waitForURL('/', { timeout: 10_000 })
    expect(page.url()).toMatch(/\/$/)
  })
})
