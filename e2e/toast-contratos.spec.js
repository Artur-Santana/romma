/**
 * ANIM-03 — Toast: Contratos (split from toast-feedback.spec.js — D-10)
 *
 * Asserts that sonner toast.success() appears after contrato actions:
 *   - "Contrato criado"
 *   - "Contrato cancelado"
 *
 * Requires: edificio + unidade + locatario + contrato fixtures (own beforeAll)
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

test.describe('ANIM-03 — Toast Contratos', () => {
  test.use({ viewport: { width: 1440, height: 900 } })

  test.beforeAll(async () => {
    const { data: prop } = await admin.from('proprietarios').select('usuario_id').limit(1).single()
    const proprietarioId = prop.usuario_id

    // Idempotência: limpar artefatos E2E-Toast-Contratos stale
    const { data: staleUnidades } = await admin.from('unidades').select('id').in('nome', ['E2E-ToastC Sala Contrato'])
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
    await admin.from('edificios').delete().eq('nome', 'E2E-ToastC Edifício')

    // Criar edifício de suporte
    const { data: edif } = await admin.from('edificios').insert({
      nome: 'E2E-ToastC Edifício',
      endereco: 'Rua ToastC, 1',
      proprietario_id: proprietarioId,
    }).select().single()
    edificioId = edif.id

    // Unidade para criar/cancelar contrato
    const { data: u1 } = await admin.from('unidades').insert({
      edificio_id: edificioId,
      nome: 'E2E-ToastC Sala Contrato',
      area_m2: 40,
      valor_mensal: 2000,
      valor_visivel: true,
      status: 'disponivel',
    }).select().single()
    unidadeParaContratoId = u1.id

    // Criar auth user para locatário
    const { data: list } = await admin.auth.admin.listUsers()
    const existing = list.users.find(u => u.email === 'e2e-toastc@test.romma.local')
    if (existing) {
      locatarioUserId = existing.id
    } else {
      const { data } = await admin.auth.admin.createUser({
        email: 'e2e-toastc@test.romma.local',
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

    // Criar locatário para revogar (status_convite pendente, sem contrato)
    const { data: loc } = await admin.from('locatarios').insert({
      usuario_id: locatarioUserId,
      proprietario_id: proprietarioId,
      nome_razao_social: 'E2E-ToastC Locatário',
      tipo: 'pf',
      documento: '55544433300',
      email: 'e2e-toastc@test.romma.local',
      telefone: '11333333300',
      status_convite: 'pendente',
    }).select().single()
    locatarioId = loc.id

    // Criar contrato ativo (para cancelar) com parcelas
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
  })

  test.afterAll(async () => {
    try {
      // Limpar parcelas e contratos
      const { data: contratos } = await admin.from('contratos').select('id').eq('unidade_id', unidadeParaContratoId)
      if (contratos?.length) {
        await admin.from('parcelas').delete().in('contrato_id', contratos.map(c => c.id))
        await admin.from('contratos').delete().in('id', contratos.map(c => c.id))
      }
      if (locatarioId) await admin.from('locatarios').delete().eq('id', locatarioId)
      if (locatarioUserId) await admin.auth.admin.deleteUser(locatarioUserId)
      if (unidadeParaContratoId) await admin.from('unidades').delete().eq('id', unidadeParaContratoId)
      if (edificioId) await admin.from('edificios').delete().eq('id', edificioId)
      // Locatário auxiliar criado no teste 03.1
      const { data: u } = await admin.auth.admin.listUsers()
      const aux = u?.users?.find(x => x.email === 'e2e-toastc2@test.romma.local')
      if (aux) {
        await admin.from('locatarios').delete().eq('usuario_id', aux.id)
        await admin.auth.admin.deleteUser(aux.id)
      }
    } catch { /* cleanup best-effort */ }
  })

  // ─── Toast: Criar contrato ────────────────────────────────────────────────────

  test('ANIM-03.1 — toast "Contrato criado" após criar contrato com sucesso', async ({ page }) => {
    // Precondition: fresh locatário + unidade disponível (created via admin above)
    // This test creates a second contrato via UI to trigger "Contrato criado"
    // We first need unidadeParaContratoId to be disponivel — cancel existing via admin
    await admin.from('contratos').update({ status: 'cancelado' }).eq('id', contratoId)
    await admin.from('unidades').update({ status: 'disponivel' }).eq('id', unidadeParaContratoId)

    // Create a second locatário user to use for the new contract
    const { data: prop } = await admin.from('proprietarios').select('usuario_id').limit(1).single()
    let u2id
    const { data: list } = await admin.auth.admin.listUsers()
    const existing2 = list.users.find(u => u.email === 'e2e-toastc2@test.romma.local')
    if (existing2) {
      u2id = existing2.id
    } else {
      const { data } = await admin.auth.admin.createUser({
        email: 'e2e-toastc2@test.romma.local',
        password: 'Test1234!',
        email_confirm: true,
      })
      u2id = data.user.id
    }
    await admin.from('locatarios').delete().eq('usuario_id', u2id)
    await admin.from('locatarios').insert({
      usuario_id: u2id,
      proprietario_id: prop.usuario_id,
      nome_razao_social: 'E2E-ToastC Criar Contrato',
      tipo: 'pf',
      documento: '11122233300',
      email: 'e2e-toastc2@test.romma.local',
      telefone: '11444444400',
      status_convite: 'pendente',
    })

    await login(page, PROPRIETARIO)
    await page.waitForURL('**/dashboard', { timeout: 15_000 })
    await page.goto('/dashboard/contratos')
    await page.waitForURL('**/dashboard/contratos', { timeout: 10_000 })

    await page.getByRole('button', { name: 'Novo Contrato' }).click()
    await page.getByRole('combobox').nth(0).click()
    await page.getByRole('option', { name: 'E2E-ToastC Criar Contrato' }).click()
    await page.getByRole('combobox').nth(1).click()
    await page.getByRole('option', { name: 'E2E-ToastC Sala Contrato' }).click()
    await page.locator('input[type="date"]').nth(0).fill('2026-06-01')
    await page.locator('input[type="date"]').nth(1).fill('2027-06-01')
    await page.getByRole('button', { name: 'Criar Contrato' }).click()

    // ANIM-03: toast must be visible
    await expect(page.getByText('Contrato criado')).toBeVisible({ timeout: 10_000 })

    // Cleanup extra locatário
    try {
      await admin.from('locatarios').delete().eq('usuario_id', u2id)
      await admin.auth.admin.deleteUser(u2id)
    } catch { /* cleanup best-effort */ }
  })

  // ─── Toast: Cancelar contrato ─────────────────────────────────────────────────

  test('ANIM-03.2 — toast "Contrato cancelado" após cancelar contrato', async ({ page }) => {
    // Garantir contrato ativo para E2E-ToastC Locatário especificamente.
    const { data: ativoLoc } = await admin.from('contratos')
      .select('id')
      .eq('unidade_id', unidadeParaContratoId)
      .eq('locatario_id', locatarioId)
      .eq('status', 'ativo')
      .limit(1)

    if (!ativoLoc?.length) {
      // Libera a unidade (cancela qualquer ativo de outro locatário — constraint: máx 1 ativo/unidade)
      await admin.from('contratos').update({ status: 'cancelado' }).eq('unidade_id', unidadeParaContratoId).eq('status', 'ativo')
      await admin.from('unidades').update({ status: 'disponivel' }).eq('id', unidadeParaContratoId)
      const hoje = new Date().toISOString().split('T')[0]
      await admin.from('contratos').insert({
        unidade_id: unidadeParaContratoId,
        locatario_id: locatarioId,
        data_inicio: hoje,
        data_fim: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        status: 'ativo',
        observacoes: '',
      })
      await admin.from('unidades').update({ status: 'alugada' }).eq('id', unidadeParaContratoId)
    }

    await login(page, PROPRIETARIO)
    await page.waitForURL('**/dashboard', { timeout: 15_000 })
    await page.goto('/dashboard/contratos')
    await page.waitForURL('**/dashboard/contratos', { timeout: 10_000 })

    // Click CANC on the E2E-ToastC Locatário row
    await page.locator('span.font-medium', { hasText: 'E2E-ToastC Locatário' }).locator('../..').getByRole('button', { name: 'CANC' }).click()
    await page.getByText('Cancelar contrato?').waitFor({ timeout: 5_000 })
    await page.getByRole('button', { name: 'Cancelar Contrato' }).click()

    // ANIM-03: toast must be visible
    await expect(page.getByText('Contrato cancelado')).toBeVisible({ timeout: 10_000 })
  })
})
