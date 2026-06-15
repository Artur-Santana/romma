/**
 * TEST-01 — CRUD Unidades (split from crud.spec.js — D-10)
 *
 * Cobertura: CRUD completo de Unidades (criar / editar / deletar)
 * + BUG-02: Estado de Erro Separado (delete vs edit)
 * + Wave-0 scaffold: métricas (UNID-01), busca/filtro (UNID-02), ConfirmDialog-before-delete (UNID-05)
 *
 * NOTE: Tests targeting UnifiedUnidadeModal flow (Tasks 2–4) will be RED until
 * Plans 03 and 04 land — this is the Wave-0 scaffold, not a regression.
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

      // Modal appears — wait for UnifiedUnidadeModal backdrop
      await expect(page.locator('.romma-modal-backdrop')).toBeVisible()

      // Select edificio via native <select> (FSelect uses native select, not shadcn combobox)
      await page.selectOption('select', { label: 'Edifício Teste E2E' })

      // Fields are scoped inside the modal
      await page.fill('input[placeholder="Ex: Sala 1208"]', 'E2E-Sala 301')
      await page.fill('input[placeholder="0"][type="number"]', '50')

      await page.getByRole('button', { name: 'Criar Unidade' }).click()
      await expect(page.getByText('E2E-Sala 301')).toBeVisible({ timeout: 10_000 })
    })

    test('editar unidade', async ({ page }) => {
      // Ancorar no card da unidade criada
      await page.getByText('E2E-Sala 301').locator('../..').getByRole('button', { name: 'Editar' }).click()

      // Modal appears in edit mode
      await expect(page.locator('.romma-modal-backdrop')).toBeVisible()

      // Scope the nome input to the modal backdrop
      const nomeInput = page.locator('.romma-modal-backdrop input[placeholder="Ex: Sala 1208"]')
      await nomeInput.fill('E2E-Sala 301 Editada')

      await page.getByRole('button', { name: 'Salvar Alterações' }).click()
      await expect(page.getByText('E2E-Sala 301 Editada')).toBeVisible({ timeout: 10_000 })
    })

    test('deletar unidade', async ({ page }) => {
      await page.getByText('E2E-Sala 301 Editada').locator('../..').getByRole('button', { name: 'Remover' }).click()

      // ConfirmDialog appears — same romma-modal-backdrop class
      await expect(page.locator('.romma-modal-backdrop')).toBeVisible()
      await page.getByRole('button', { name: 'Remover Unidade' }).click()

      await expect(page.getByText('E2E-Sala 301 Editada')).toHaveCount(0)
    })
  })

  // --------------------------------------------------------- Métricas (UNID-01)
  test.describe('Métricas — UNID-01', () => {
    test.beforeEach(async ({ page }) => {
      await login(page, PROPRIETARIO)
      await page.waitForURL('**/dashboard', { timeout: 15_000 })
      await page.goto('/dashboard/unidades')
      await page.waitForURL('**/dashboard/unidades', { timeout: 10_000 })
    })

    test('métricas visíveis na tela de unidades', async ({ page }) => {
      await expect(page.getByText('Área total')).toBeVisible()
      await expect(page.getByText('MRR realizado')).toBeVisible()
      await expect(page.getByText('Potencial em aberto')).toBeVisible()
      await expect(page.getByText('Valores ocultos')).toBeVisible()
    })
  })

  // --------------------------------------------------------- Busca/Filtro (UNID-02)
  test.describe('Busca e Filtros — UNID-02', () => {
    test.beforeEach(async ({ page }) => {
      await login(page, PROPRIETARIO)
      await page.waitForURL('**/dashboard', { timeout: 15_000 })
      await page.goto('/dashboard/unidades')
      await page.waitForURL('**/dashboard/unidades', { timeout: 10_000 })
    })

    test('busca por nome filtra cards ao vivo', async ({ page }) => {
      await page.fill('input[placeholder="Buscar unidade..."]', 'E2E-')
      // result count appears when filter is active
      await expect(page.locator('text=/resultado/i')).toBeVisible()
    })
  })

  // --------------------------------------------------------- ConfirmDialog (UNID-05)
  test.describe('ConfirmDialog antes do delete — UNID-05', () => {
    test.beforeEach(async ({ page }) => {
      await login(page, PROPRIETARIO)
      await page.waitForURL('**/dashboard', { timeout: 15_000 })
      await page.goto('/dashboard/unidades')
      await page.waitForURL('**/dashboard/unidades', { timeout: 10_000 })
    })

    test('ConfirmDialog aparece antes do delete', async ({ page }) => {
      const row = page.getByText('E2E-Sala Disponivel').locator('../..')
      await row.getByRole('button', { name: 'Remover' }).click()

      // ConfirmDialog opens — backdrop visible + title text
      await expect(page.locator('.romma-modal-backdrop')).toBeVisible()
      await expect(page.getByText('Remover unidade?')).toBeVisible()

      // Cancel — don't actually delete
      await page.getByRole('button', { name: 'Cancelar' }).click()
      await expect(page.locator('.romma-modal-backdrop')).not.toBeVisible()
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

      // ConfirmDialog appears — confirm to trigger the delete attempt
      await expect(page.locator('.romma-modal-backdrop')).toBeVisible()
      await page.getByRole('button', { name: 'Remover Unidade' }).click()

      // Mensagem de erro de delete deve aparecer no nível da lista (acima dos cards)
      // No código atual (estado único), a mensagem aparece DENTRO do card via prop erro={erro}
      // Após o fix BUG-02, o erro de delete aparece no nível da lista com a classe bg-danger-bg2
      await page.waitForTimeout(2_000) // aguardar resposta da action

      // Abrir o form de edição da unidade 'E2E-Sala Disponivel' (sem contrato)
      const salaDisponivel = page.getByText('E2E-Sala Disponivel').locator('../..')
      await expect(salaDisponivel).toBeVisible({ timeout: 10_000 })
      await salaDisponivel.getByRole('button', { name: 'Editar' }).click()

      // Modal opens in edit mode
      await expect(page.locator('.romma-modal-backdrop')).toBeVisible()

      // Dentro do modal de edição da E2E-Sala Disponivel, NÃO deve aparecer o erro de delete
      // Este teste estará RED no código atual porque estado único vaza o erro para o card
      const editModal = page.locator('.romma-modal-backdrop')
      // O erro de delete não deve estar dentro do modal em edição
      await expect(editModal.locator('.text-danger-fg')).toHaveCount(0, { timeout: 5_000 })
    })
  })
})
