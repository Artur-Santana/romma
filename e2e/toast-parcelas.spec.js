/**
 * ANIM-03 — Toast: Parcelas (split from toast-feedback.spec.js — D-10)
 *
 * Asserts that sonner toast.success() appears after parcela actions:
 *   - "Parcela marcada como paga"
 *
 * Requires: edificio + unidade + locatario + contrato + parcela fixtures (own beforeAll)
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
let edificioId, unidadeParaContratoId
let locatarioId, locatarioUserId
let contratoId

test.describe('ANIM-03 — Toast Parcelas', () => {
  test.use({ viewport: { width: 1440, height: 900 } })

  test.beforeAll(async () => {
    const { data: prop } = await admin.from('proprietarios').select('usuario_id').limit(1).single()
    const proprietarioId = prop.usuario_id

    // Idempotência: limpar artefatos E2E-ToastP stale
    const { data: staleUnidades } = await admin.from('unidades').select('id').in('nome', ['E2E-ToastP Sala Contrato'])
    if (staleUnidades?.length) {
      const uids = staleUnidades.map(u => u.id)
      const { data: staleContratos } = await admin.from('contratos').select('id').in('unidade_id', uids)
      if (staleContratos?.length) {
        const cids = staleContratos.map(c => c.id)
        await admin.from('parcelas').delete().in('contrato_id', cids)
        await admin.from('contratos').delete().in('id', cids)
      }
      await admin.from('unidades').delete().in('id', uids)
    }
    await admin.from('edificios').delete().eq('nome', 'E2E-ToastP Edifício')

    // Criar edifício de suporte
    const { data: edif } = await admin.from('edificios').insert({
      nome: 'E2E-ToastP Edifício',
      endereco: 'Rua ToastP, 1',
      proprietario_id: proprietarioId,
    }).select().single()
    edificioId = edif.id

    // Unidade para contrato com parcelas
    const { data: u1 } = await admin.from('unidades').insert({
      edificio_id: edificioId,
      nome: 'E2E-ToastP Sala Contrato',
      area_m2: 40,
      valor_mensal: 2000,
      valor_visivel: true,
      status: 'alugada',
    }).select().single()
    unidadeParaContratoId = u1.id

    // Criar auth user para locatário
    const { data: list } = await admin.auth.admin.listUsers()
    const existing = list.users.find(u => u.email === 'e2e-toastp@test.romma.local')
    if (existing) {
      locatarioUserId = existing.id
    } else {
      const { data } = await admin.auth.admin.createUser({
        email: 'e2e-toastp@test.romma.local',
        password: 'Test1234!',
        email_confirm: true,
      })
      locatarioUserId = data.user.id
    }

    // Limpar locatários stale
    const { data: stale } = await admin.from('locatarios').select('id').eq('usuario_id', locatarioUserId)
    if (stale?.length) {
      const ids = stale.map(l => l.id)
      const { data: cExist } = await admin.from('contratos').select('id').in('locatario_id', ids)
      if (cExist?.length) {
        await admin.from('parcelas').delete().in('contrato_id', cExist.map(c => c.id))
        await admin.from('contratos').delete().in('id', cExist.map(c => c.id))
      }
      await admin.from('locatarios').delete().in('id', ids)
    }

    // Criar locatário
    const { data: loc } = await admin.from('locatarios').insert({
      usuario_id: locatarioUserId,
      proprietario_id: proprietarioId,
      nome_razao_social: 'E2E-ToastP Locatário',
      tipo: 'pf',
      documento: '55544433300',
      email: 'e2e-toastp@test.romma.local',
      telefone: '11333333300',
      status_convite: 'pendente',
    }).select().single()
    locatarioId = loc.id

    // Criar contrato ativo com parcela pendente
    const hoje = new Date().toISOString().split('T')[0]
    const { data: contrato } = await admin.from('contratos').insert({
      unidade_id: unidadeParaContratoId,
      locatario_id: locatarioId,
      data_inicio: hoje,
      data_fim: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      status: 'ativo',
      observacoes: '',
    }).select().single()
    contratoId = contrato.id

    // Criar pelo menos uma parcela para poder testar marcar como paga
    await admin.from('parcelas').insert({
      contrato_id: contratoId,
      numero: 1,
      data_fechamento: hoje,
      data_vencimento: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      data_pagamento: null,
      status: 'pendente',
    })
  })

  test.afterAll(async () => {
    try {
      if (contratoId) {
        await admin.from('parcelas').delete().eq('contrato_id', contratoId)
        await admin.from('contratos').delete().eq('id', contratoId)
      }
      if (locatarioId) await admin.from('locatarios').delete().eq('id', locatarioId)
      if (locatarioUserId) await admin.auth.admin.deleteUser(locatarioUserId)
      if (unidadeParaContratoId) await admin.from('unidades').delete().eq('id', unidadeParaContratoId)
      if (edificioId) await admin.from('edificios').delete().eq('id', edificioId)
    } catch { /* cleanup best-effort */ }
  })

  // ─── Toast: Marcar parcela como paga ──────────────────────────────────────────

  test('ANIM-03.5 — toast "Parcela marcada como paga" após marcar parcela como paga', async ({ page }) => {
    // Garantir que há pelo menos uma parcela pendente
    const { data: parcelas } = await admin.from('parcelas')
      .select('id')
      .eq('contrato_id', contratoId)
      .eq('status', 'pendente')
      .limit(1)

    if (!parcelas?.length) {
      const hoje = new Date().toISOString().split('T')[0]
      await admin.from('parcelas').insert({
        contrato_id: contratoId,
        numero: 99,
        data_fechamento: hoje,
        data_vencimento: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        data_pagamento: null,
        status: 'pendente',
      })
    }

    await login(page, PROPRIETARIO)
    await page.waitForURL('**/dashboard', { timeout: 15_000 })

    // Navigate to the contrato detail page where Parcelas component is mounted
    await page.goto(`/dashboard/contratos/${contratoId}`)
    await page.waitForURL(`**/dashboard/contratos/${contratoId}`, { timeout: 10_000 })

    // Click the "Marcar Paga" button on the first pendente parcela
    const pagarBtn = page.getByRole('button', { name: 'Marcar Paga' }).first()
    await expect(pagarBtn).toBeVisible({ timeout: 10_000 })
    await pagarBtn.click()

    // ANIM-03: toast must be visible
    await expect(page.getByText('Parcela marcada como paga')).toBeVisible({ timeout: 10_000 })
  })
})
