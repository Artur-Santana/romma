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
    await page.getByRole('button', { name: 'Nova Unidade' }).click()

    // Preencher nome só com espaços — HTML5 required passa (value não vazio),
    // server action retorna 'Nome é obrigatório.' após .trim()
    await page.fill('input[placeholder="Nome da unidade"]', '   ')
    await page.fill('input[placeholder="Área (m²)"]', '50')
    await page.fill('input[placeholder="Valor mensal (R$)"]', '1000')
    await page.getByRole('button', { name: 'Criar Unidade' }).click()

    await expect(page.getByText('Nome é obrigatório.')).toBeVisible({ timeout: 10_000 })
  })

  test('3.2 — criarUnidade sem edifício selecionado exibe erro', async ({ page }) => {
    await page.goto('/dashboard/unidades')
    await page.waitForURL('**/dashboard/unidades', { timeout: 10_000 })
    await page.getByRole('button', { name: 'Nova Unidade' }).click()

    // edificio_id fica "" — Select sem required não bloqueia HTML5
    // server action: nome ok → UUID_RE test("") → 'Edifício inválido.'
    await page.fill('input[placeholder="Nome da unidade"]', 'Unidade Teste')
    await page.fill('input[placeholder="Área (m²)"]', '50')
    await page.fill('input[placeholder="Valor mensal (R$)"]', '1000')
    await page.getByRole('button', { name: 'Criar Unidade' }).click()

    await expect(page.getByText('Edifício inválido.')).toBeVisible({ timeout: 10_000 })
  })
})
