/**
 * ANIM-03 — Toast: Unidades (split from toast-feedback.spec.js — D-10)
 *
 * Asserts that sonner toast.success() appears after unidade actions:
 *   - "Unidade removida"
 *
 * Requires: edificio + unidade fixtures (own beforeAll)
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

// ─── Scoped fixture vars (per-file, not shared across split files) ──────────────
let edificioId, unidadeParaDeletarId

test.describe('ANIM-03 — Toast Unidades', () => {
  test.use({ viewport: { width: 1440, height: 900 } })

  test.beforeAll(async () => {
    const { data: prop } = await admin.from('proprietarios').select('usuario_id').limit(1).single()
    const proprietarioId = prop.usuario_id

    // Idempotência: limpar artefatos E2E-ToastU stale
    const { data: staleUnidades } = await admin.from('unidades').select('id').in('nome', ['E2E-ToastU Sala Deletar'])
    if (staleUnidades?.length) {
      const uids = staleUnidades.map(u => u.id)
      // Verificar e limpar contratos antes de deletar unidades
      const { data: staleContratos } = await admin.from('contratos').select('id').in('unidade_id', uids)
      if (staleContratos?.length) {
        const cids = staleContratos.map(c => c.id)
        await admin.from('parcelas').delete().in('contrato_id', cids)
        await admin.from('contratos').delete().in('id', cids)
      }
      await admin.from('unidades').delete().in('id', uids)
    }
    await admin.from('edificios').delete().eq('nome', 'E2E-ToastU Edifício')

    // Criar edifício de suporte
    const { data: edif } = await admin.from('edificios').insert({
      nome: 'E2E-ToastU Edifício',
      endereco: 'Rua ToastU, 1',
      proprietario_id: proprietarioId,
    }).select().single()
    edificioId = edif.id

    // Unidade para deletar (sem contrato)
    const { data: u2 } = await admin.from('unidades').insert({
      edificio_id: edificioId,
      nome: 'E2E-ToastU Sala Deletar',
      area_m2: 20,
      valor_mensal: 1000,
      valor_visivel: true,
      status: 'disponivel',
    }).select().single()
    unidadeParaDeletarId = u2.id
  })

  test.afterAll(async () => {
    try {
      if (unidadeParaDeletarId) await admin.from('unidades').delete().eq('id', unidadeParaDeletarId)
      if (edificioId) await admin.from('edificios').delete().eq('id', edificioId)
    } catch { /* cleanup best-effort */ }
  })

  // ─── Toast: Deletar unidade ────────────────────────────────────────────────────

  test('ANIM-03.3 — toast "Unidade removida" após deletar unidade', async ({ page }) => {
    await login(page, PROPRIETARIO)
    await page.waitForURL('**/dashboard', { timeout: 15_000 })
    await page.goto('/dashboard/unidades')
    await page.waitForURL('**/dashboard/unidades', { timeout: 10_000 })

    // Click Remover on the unidade sem contrato
    const row = page.getByText('E2E-ToastU Sala Deletar').locator('../..')
    await expect(row).toBeVisible({ timeout: 10_000 })
    await row.getByRole('button', { name: 'Remover' }).click()

    // ANIM-03: toast must be visible
    await expect(page.getByText('Unidade removida')).toBeVisible({ timeout: 10_000 })
  })
})
