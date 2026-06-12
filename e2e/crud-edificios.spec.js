/**
 * TEST-01 — CRUD Edifícios (split from crud.spec.js — D-10)
 *
 * Cobertura: CRUD completo de Edifícios (criar / editar / deletar)
 *
 * Pré-condições para rodar:
 *   - `supabase start` rodando (127.0.0.1:54321)
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

test.describe('TEST-01 — CRUD Edifícios', () => {
  test.use({ viewport: { width: 1440, height: 900 } })

  test.describe('Edifícios', () => {
    test.beforeEach(async ({ page }) => {
      await login(page, PROPRIETARIO)
      await page.waitForURL('**/dashboard', { timeout: 15_000 })
      await page.goto('/dashboard/edificios')
      await page.waitForURL('**/dashboard/edificios', { timeout: 10_000 })
    })

    test('criar edifício', async ({ page }) => {
      await page.getByRole('button', { name: 'Novo Edifício' }).click()
      await page.fill('input[placeholder="Nome do edifício"]', 'E2E-Edifício Alpha')
      await page.fill('input[placeholder="Endereço"]', 'Rua E2E, 1')
      await page.click('button[type="submit"]')
      await expect(page.getByText('E2E-Edifício Alpha')).toBeVisible({ timeout: 10_000 })
    })

    test('editar edifício', async ({ page }) => {
      // Ancorar no card do edifício — locator('../..') sobe até o flex row que contém text + buttons
      await page.getByText('E2E-Edifício Alpha').locator('../..').getByRole('button', { name: 'Editar' }).click()
      // Após clicar Editar, o texto vira input com value preenchido
      await page.fill('input[value="E2E-Edifício Alpha"]', 'E2E-Edifício Alpha Editado')
      await page.getByRole('button', { name: 'Salvar' }).click()
      await expect(page.getByText('E2E-Edifício Alpha Editado')).toBeVisible({ timeout: 10_000 })
    })

    test('deletar edifício', async ({ page }) => {
      await page.getByText('E2E-Edifício Alpha Editado').locator('../..').getByRole('button', { name: 'Remover' }).click()
      await expect(page.getByText('E2E-Edifício Alpha Editado')).toHaveCount(0)
    })
  })
})
