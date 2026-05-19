import { test, expect } from '@playwright/test'
import { login } from './helpers.js'
import { PROPRIETARIO } from './fixtures.js'

test.describe('Server actions — validação', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, PROPRIETARIO)
    await page.waitForURL('**/dashboard', { timeout: 10_000 })
  })

  test('3.1 — criarUnidade com nome vazio exibe erro', async ({ page }) => {
    await page.goto('/dashboard/unidades')
    await page.waitForURL('**/dashboard/unidades', { timeout: 10_000 })

    // Deixar campo nome vazio, preencher outros campos necessários
    await page.fill('input[placeholder="area_m2"]', '50')
    await page.fill('input[placeholder="valor_mensal"]', '1000')
    await page.click('button[type="submit"]')

    // criarUnidade retorna { status: 400, erroMessage: 'Nome é obrigatório.' }
    await expect(page.getByText('Nome é obrigatório.')).toBeVisible({ timeout: 10_000 })
  })

  test('3.2 — criarUnidade sem edifício selecionado exibe erro', async ({ page }) => {
    await page.goto('/dashboard/unidades')
    await page.waitForURL('**/dashboard/unidades', { timeout: 10_000 })

    // edificio_id vazio falha UUID_RE → 'Edifício inválido.'
    await page.fill('input[placeholder="nome"]', 'Unidade Teste')
    await page.fill('input[placeholder="area_m2"]', '50')
    await page.fill('input[placeholder="valor_mensal"]', '1000')
    await page.click('button[type="submit"]')

    await expect(page.getByText('Edifício inválido.')).toBeVisible({ timeout: 10_000 })
  })
})
