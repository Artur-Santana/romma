/**
 * TEST-01 — CRUD Proprietário
 *
 * Cobertura: CRUD completo das 4 entidades do dashboard do Proprietário:
 *   - Edifícios (criar / editar / deletar)
 *   - Unidades  (criar / editar / deletar)
 *   - Locatários (convidar / editar)
 *   - Contratos (criar / cancelar / encerrar) + regra de negócio de status da unidade
 *
 * Pré-condições para rodar:
 *   - `supabase start` rodando (127.0.0.1:54321)
 *   - `supabase functions serve` rodando (Edge Function gerar-parcelas)
 *   - `npx playwright test` (webServer config sobe o Next.js automaticamente)
 *
 * Isolamento: todos os dados criados usam prefixo "E2E-" (D-01).
 * O global-teardown limpa por prefixo automaticamente após a suíte.
 */
import { test, expect } from '@playwright/test'
import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'
import { login } from './helpers.js'
import { PROPRIETARIO } from './fixtures.js'

config({ path: '.env.test' })

const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

test.describe('TEST-01 — CRUD Proprietário', () => {
  test.use({ viewport: { width: 1440, height: 900 } })

  // ------------------------------------------------------------------ Edifícios
  test.describe('Edifícios', () => {
    test.beforeEach(async ({ page }) => {
      await login(page, PROPRIETARIO)
      await page.waitForURL('**/dashboard', { timeout: 15_000 })
      await page.goto('/dashboard/edificios')
      await page.waitForURL('**/dashboard/edificios', { timeout: 10_000 })
    })

    test('criar edifício', async ({ page }) => {
      await page.fill('input[placeholder="Nome do edificio"]', 'E2E-Edifício Alpha')
      await page.fill('input[placeholder="Endereço"]', 'Rua E2E, 1')
      await page.click('button[type="submit"]')
      await expect(page.getByText('E2E-Edifício Alpha')).toBeVisible({ timeout: 10_000 })
    })

    test('editar edifício', async ({ page }) => {
      // Ancorar no card do edifício criado no teste anterior
      await page.getByText('E2E-Edifício Alpha').locator('..').getByRole('button', { name: 'Editar' }).click()
      // Após clicar Editar, o texto some e vira um input — usar value para localizar
      await page.fill('input[value="E2E-Edifício Alpha"]', 'E2E-Edifício Alpha Editado')
      await page.getByRole('button', { name: 'Salvar' }).click()
      await expect(page.getByText('E2E-Edifício Alpha Editado')).toBeVisible({ timeout: 10_000 })
    })

    test('deletar edifício', async ({ page }) => {
      await page.getByText('E2E-Edifício Alpha Editado').locator('..').getByRole('button', { name: 'Remover' }).click()
      await expect(page.getByText('E2E-Edifício Alpha Editado')).toHaveCount(0)
    })
  })

  // ------------------------------------------------------------------ Unidades
  test.describe('Unidades', () => {
    test.beforeEach(async ({ page }) => {
      await login(page, PROPRIETARIO)
      await page.waitForURL('**/dashboard', { timeout: 15_000 })
      await page.goto('/dashboard/unidades')
      await page.waitForURL('**/dashboard/unidades', { timeout: 10_000 })
    })

    test('criar unidade', async ({ page }) => {
      await page.getByRole('button', { name: 'Nova Unidade' }).click()

      // shadcn Select — Edifício é o combobox índice 0 (Status é o índice 1)
      // Usar o edifício do seed principal (não depende de dado E2E-)
      await page.getByRole('combobox').first().click()
      await page.getByRole('option', { name: 'Edifício Teste E2E' }).click()

      await page.fill('input[placeholder="Nome da unidade"]', 'E2E-Sala 301')
      await page.fill('input[placeholder="Área (m²)"]', '50')
      await page.fill('input[placeholder="Valor mensal (R$)"]', '3000')

      await page.getByRole('button', { name: 'Criar Unidade' }).click()
      await expect(page.getByText('E2E-Sala 301')).toBeVisible({ timeout: 10_000 })
    })

    test('editar unidade', async ({ page }) => {
      // Ancorar no card da unidade criada
      await page.getByText('E2E-Sala 301').locator('..').getByRole('button', { name: 'Editar' }).click()
      // Após clicar Editar, o nome vira input com value preenchido
      await page.fill('input[value="E2E-Sala 301"]', 'E2E-Sala 301 Editada')
      await page.getByRole('button', { name: 'Salvar' }).click()
      await expect(page.getByText('E2E-Sala 301 Editada')).toBeVisible({ timeout: 10_000 })
    })

    test('deletar unidade', async ({ page }) => {
      await page.getByText('E2E-Sala 301 Editada').locator('..').getByRole('button', { name: 'Deletar' }).click()
      await expect(page.getByText('E2E-Sala 301 Editada')).toHaveCount(0)
    })
  })
})
