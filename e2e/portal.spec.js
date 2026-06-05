import { test, expect } from '@playwright/test'
import { login } from './helpers.js'
import { LOCATARIO } from './fixtures.js'

test.describe('Portal do Locatário', () => {
  test('PORT-01: locatário loga e é redirecionado para /portal/dashboard', async ({ page }) => {
    await login(page, LOCATARIO)
    await page.waitForURL('**/portal/dashboard', { timeout: 15_000 })
    expect(page.url()).toContain('/portal/dashboard')
  })

  test.describe('autenticado', () => {
    test.beforeEach(async ({ page }) => {
      await login(page, LOCATARIO)
      await page.waitForURL('**/portal/dashboard', { timeout: 15_000 })
    })

    test('PORT-02: locatário visualiza contrato ativo (unidade, valor, status)', async ({ page }) => {
      await expect(page.getByText('Sala 101')).toBeVisible({ timeout: 10_000 })
      await expect(page.getByText(/R\$\s*2\.?500/)).toBeVisible({ timeout: 10_000 })
      // exact:true evita match em substring ("contrato ativo", "ativos") da página
      await expect(page.getByText('Ativo', { exact: true })).toBeVisible({ timeout: 10_000 })
    })

    test('PORT-03: ParcelsTable exibe paga/pendente/vencida e omite futura', async ({ page }) => {
      const parcelasRegion = page.getByRole('region', { name: /HISTÓRICO DE PARCELAS/i })
      // exact:true evita match em botão "Marcar Paga" e outros textos que contêm a substring
      await expect(parcelasRegion.getByText('Paga', { exact: true })).toBeVisible({ timeout: 10_000 })
      await expect(parcelasRegion.getByText('Pendente', { exact: true })).toBeVisible({ timeout: 10_000 })
      await expect(parcelasRegion.getByText('Vencida', { exact: true })).toBeVisible({ timeout: 10_000 })
      await expect(parcelasRegion.getByText(/futura/i)).toHaveCount(0)
    })
  })
})
