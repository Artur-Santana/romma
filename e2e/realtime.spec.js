/**
 * TEST-04 — Realtime / Estado público: unidade some da listagem após contrato ativo.
 *
 * NOTA DE LIMITAÇÃO RT (documentada em CLAUDE.md):
 * O evento UPDATE `disponivel → alugada` é descartado pelo RLS para clientes anônimos.
 * Portanto este teste NÃO aguarda evento Realtime — verifica o ESTADO FINAL após
 * um `page.goto('/unidades')` completo (nova query ao servidor), não um evento RT.
 * Referência: CLAUDE.md "Realtime — limitação conhecida", RESEARCH.md Pitfall 4.
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

test.describe('TEST-04 — Realtime/estado público', () => {
  test.use({ viewport: { width: 1440, height: 900 } })

  test.afterAll(async () => {
    // Limpar contratos/parcelas criados para E2E-Sala Disponivel e restaurar status.
    // Filtro por unidade_id para não afetar outros contratos do locatário (ex: Sala 101 do seed).
    const { data: unidade } = await admin
      .from('unidades')
      .select('id')
      .eq('nome', 'E2E-Sala Disponivel')
      .single()

    if (unidade?.id) {
      const { data: contratos } = await admin
        .from('contratos')
        .select('id')
        .eq('unidade_id', unidade.id)

      const contratoIds = contratos?.map(c => c.id) ?? []
      if (contratoIds.length) {
        await admin.from('parcelas').delete().in('contrato_id', contratoIds)
        await admin.from('contratos').delete().in('id', contratoIds)
      }

      // Restaurar status da unidade para disponivel (defensivo — garante idempotência entre runs)
      await admin
        .from('unidades')
        .update({ status: 'disponivel' })
        .eq('id', unidade.id)
    }
  })

  test('unidade some da listagem pública após criar contrato ativo', async ({ page }) => {
    // Passo 1: Visita pública — sem login — verificar que E2E-Sala Disponivel aparece
    await page.goto('/unidades')
    await expect(page.getByText('E2E-Sala Disponivel')).toBeVisible({ timeout: 10_000 })

    // Passo 2: Login como Proprietário e navegar para /dashboard/contratos
    await login(page, PROPRIETARIO)
    await page.waitForURL('**/dashboard', { timeout: 15_000 })
    await page.goto('/dashboard/contratos')
    await page.waitForURL('**/dashboard/contratos', { timeout: 10_000 })

    // Passo 3: Criar contrato para E2E-Sala Disponivel
    await page.getByRole('button', { name: 'Novo Contrato' }).click()

    // shadcn Select — combobox 0 = Locatário
    // Usa click pattern (page.selectOption não funciona com Radix UI — RESEARCH.md Pitfall 1)
    await page.getByRole('combobox').nth(0).click()
    await page.getByRole('option', { name: 'Locatário Teste' }).click()

    // shadcn Select — combobox 1 = Unidade disponível
    await page.getByRole('combobox').nth(1).click()
    await page.getByRole('option', { name: 'E2E-Sala Disponivel' }).click()

    // Datas: data_inicio = hoje, data_fim = +365 dias
    const dataInicio = new Date().toISOString().slice(0, 10)
    const dataFim = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
    await page.locator('input[type="date"]').nth(0).fill(dataInicio)
    await page.locator('input[type="date"]').nth(1).fill(dataFim)

    await page.getByRole('button', { name: 'Criar Contrato' }).click()

    // Aguardar confirmação de criação — timeout 15_000 porque handleCriarContrato
    // chama gerarParcelas (Edge Function) automaticamente após criarContrato.
    await expect(page.getByText('Locatário Teste').first()).toBeVisible({ timeout: 15_000 })

    // Passo 4: Navegar de volta para /unidades — força nova query (estado final, não evento RT)
    // Após reload, a query de unidades disponíveis exclui status='alugada'
    await page.goto('/unidades')
    await expect(page.getByText('E2E-Sala Disponivel')).toHaveCount(0)
  })
})
