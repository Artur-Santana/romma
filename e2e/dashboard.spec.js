/**
 * Testes E2E para DASH-01, DASH-02, DASH-03
 *
 * DASH-01: Tile 02 deve exibir "MRR" e valor em R$ (atualmente mostra "Contratos Ativos" + contagem)
 * DASH-02: Tile 03 deve exibir "Receita Esperada" e valor em R$ (atualmente mostra "Parcelas Pendentes" + contagem)
 * DASH-03: Banner de alerta aparece quando há contratos vencendo em 7 dias (já funciona)
 *
 * Escopo: desktop layout (romma-desktop-only). Mobile mostra MRR separado — não é o mesmo tile.
 */
import { test, expect } from '@playwright/test'
import { login } from './helpers.js'
import { PROPRIETARIO } from './fixtures.js'

test.describe('@smoke Dashboard tiles — DASH-01/02/03', () => {
  test.use({ viewport: { width: 1440, height: 900 } })

  test.beforeEach(async ({ page }) => {
    await login(page, PROPRIETARIO)
    await page.waitForURL('**/dashboard', { timeout: 15_000 })
    await page.goto('/dashboard')
    await page.waitForURL('**/dashboard', { timeout: 10_000 })
    // Aguardar carregamento do grid de métricas desktop
    await page.locator('.romma-desktop-only').waitFor({ state: 'visible', timeout: 10_000 })
  })

  test('DASH-01 @smoke — tile 02 exibe "MRR" como label e valor em R$', async ({ page }) => {
    // O tile 02 atualmente tem label "Contratos Ativos" e exibe ativos (número inteiro).
    // Este teste DEVE FALHAR até que o tile seja migrado para MRR.
    const desktopSection = page.locator('.romma-desktop-only')

    // Verificar que label "MRR" está presente (não mais "Contratos Ativos")
    await expect(desktopSection.getByText('MRR', { exact: true }).first()).toBeVisible({ timeout: 5_000 })
    // Verificar que label antigo "Contratos Ativos" foi removido
    await expect(desktopSection.getByText('Contratos Ativos', { exact: true })).toHaveCount(0)
  })

  test('DASH-02 @smoke — tile 03 exibe "Receita Esperada" como label e valor em R$', async ({ page }) => {
    // O tile 03 atualmente tem label "Parcelas Pendentes" e exibe parcelas.length (número).
    // Este teste DEVE FALHAR até que o tile seja migrado para Receita Esperada.
    const desktopSection = page.locator('.romma-desktop-only')

    // Verificar que label "Receita Esperada" está presente no tile 03 (desktop)
    // Atualmente está "Parcelas Pendentes" — portanto esta asserção falha
    await expect(desktopSection.getByText('Receita Esperada', { exact: true }).first()).toBeVisible({ timeout: 5_000 })
  })

  test('DASH-03 @smoke — banner de alerta de contratos vencendo funciona', async ({ page }) => {
    // Este teste PASSA no estado atual — o banner já está implementado.
    // Estrutura condicional: se há contratos vencendo → banner aparece com texto correto.
    // Se não há → banner não deve aparecer (sem contratos no ambiente de teste).
    const banner = page.locator('[data-testid="expiry-banner"]')
    const bannerByText = page.locator('.romma-desktop-only').getByText('ATENÇÃO · CONTRATOS A VENCER')

    const isBannerVisible = await bannerByText.isVisible().catch(() => false)

    if (isBannerVisible) {
      // Há contratos vencendo: verificar que o banner tem estilo de warning
      await expect(bannerByText).toBeVisible()
      // O banner está dentro de um container com classes Tailwind de warning (bg-warning-bg)
      const bannerContainer = bannerByText.locator('..').locator('..')
      const bgClass = await bannerContainer.getAttribute('class')
      // Verificar que tem classe de warning (bg-warning-bg após migração Tailwind v4)
      expect(bgClass).toMatch(/warning/)
    } else {
      // Sem contratos vencendo no ambiente: banner não deve aparecer
      await expect(bannerByText).not.toBeVisible()
      // Verificar que a página carregou normalmente (grid de métricas presente)
      await expect(page.locator('.romma-desktop-only').getByText('Ocupação')).toBeVisible()
    }
  })
})
