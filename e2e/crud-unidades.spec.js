/**
 * TEST-01 — CRUD Unidades (split from crud.spec.js — D-10)
 *
 * Cobertura: CRUD completo de Unidades (criar / editar / deletar)
 * + BUG-02: Estado de Erro Separado (delete vs edit)
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

test.describe('TEST-01 — CRUD Unidades', () => {
  test.use({ viewport: { width: 1440, height: 900 } })

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
      // Ancorar no card da unidade criada — locator('../..') sobe 2 níveis: span → info div → row div
      await page.getByText('E2E-Sala 301').locator('../..').getByRole('button', { name: 'Editar' }).click()
      // Após clicar Editar, o nome vira input com value preenchido
      await page.fill('input[value="E2E-Sala 301"]', 'E2E-Sala 301 Editada')
      await page.getByRole('button', { name: 'Salvar' }).click()
      await expect(page.getByText('E2E-Sala 301 Editada')).toBeVisible({ timeout: 10_000 })
    })

    test('deletar unidade', async ({ page }) => {
      await page.getByText('E2E-Sala 301 Editada').locator('../..').getByRole('button', { name: 'Remover' }).click()
      await expect(page.getByText('E2E-Sala 301 Editada')).toHaveCount(0)
    })
  })

  // --------------------------------------------------------- BUG-02 Fix
  test.describe('BUG-02 — Estado de Erro Separado (delete vs edit)', () => {
    test.beforeEach(async ({ page }) => {
      await login(page, PROPRIETARIO)
      await page.waitForURL('**/dashboard', { timeout: 15_000 })
      await page.goto('/dashboard/unidades')
      await page.waitForURL('**/dashboard/unidades', { timeout: 10_000 })
    })

    test('BUG-02 — erro de delete não vaza para o form de edição', async ({ page }) => {
      // A unidade seedada 'Sala 101' tem status 'alugada' com contrato ativo (FK bloqueia delete)
      // Localizar o botão Remover da unidade 'Sala 101'
      const sala101Row = page.getByText('Sala 101').locator('../..')
      await expect(sala101Row).toBeVisible({ timeout: 10_000 })

      // Tentar deletar Sala 101 (deve falhar por FK)
      await sala101Row.getByRole('button', { name: 'Remover' }).click()

      // Mensagem de erro de delete deve aparecer no nível da lista (acima dos cards)
      // No código atual (estado único), a mensagem aparece DENTRO do card via prop erro={erro}
      // Após o fix BUG-02, o erro de delete aparece no nível da lista com a classe bg-danger-bg2
      await page.waitForTimeout(2_000) // aguardar resposta da action

      // Abrir o form de edição da unidade 'E2E-Sala Disponivel' (sem contrato)
      const salaDisponivel = page.getByText('E2E-Sala Disponivel').locator('../..')
      await expect(salaDisponivel).toBeVisible({ timeout: 10_000 })
      await salaDisponivel.getByRole('button', { name: 'Editar' }).click()

      // Dentro do card de edição da E2E-Sala Disponivel, NÃO deve aparecer o erro de delete
      // Este teste estará RED no código atual porque estado único vaza o erro para o card
      const editCard = page.getByText('E2E-Sala Disponivel').locator('../..')
      // O erro de delete não deve estar dentro do card em edição
      await expect(editCard.locator('.text-danger-fg')).toHaveCount(0, { timeout: 5_000 })
    })
  })
})
