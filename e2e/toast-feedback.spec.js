/**
 * ANIM-03 acceptance spec — Phase Gate
 *
 * Asserts that a sonner toast.success() appears after each of the 5 main success actions
 * in the Proprietário dashboard. This spec is the PHASE GATE for Phase 14: Animações &
 * Feedback. It is EXPECTED TO FAIL now (Wave 0) — toast handlers are wired in Wave 1
 * plans 14-01, 14-02, 14-03. Once all Wave 1 plans are merged, this spec must turn GREEN.
 *
 * Toast messages locked from D-08 / UI-SPEC.md:
 *   - "Contrato criado"
 *   - "Contrato encerrado" / "Contrato cancelado"
 *   - "Unidade removida"
 *   - "Acesso revogado"
 *   - "Parcela marcada como paga"
 *
 * Trigger: npx playwright test e2e/toast-feedback.spec.js --project=chromium
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

// ─── Shared test data (created in beforeAll, cleaned in afterAll) ──────────────

let edificioId, unidadeParaContratoId, unidadeParaDeletarId
let locatarioId, locatarioUserId
let contratoId

test.describe('ANIM-03 — Toast Sonner confirma sucesso das ações principais', () => {
  test.use({ viewport: { width: 1440, height: 900 } })

  test.beforeAll(async () => {
    const { data: prop } = await admin.from('proprietarios').select('usuario_id').limit(1).single()
    const proprietarioId = prop.usuario_id

    // Idempotência: limpar artefatos E2E-Toast stale (worker restart, cleanup falho de run anterior)
    const { data: staleUnidades } = await admin.from('unidades').select('id').in('nome', ['E2E-Toast Sala Contrato', 'E2E-Toast Sala Deletar'])
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
    await admin.from('edificios').delete().eq('nome', 'E2E-Toast Edifício')

    // Criar edifício de suporte
    const { data: edif } = await admin.from('edificios').insert({
      nome: 'E2E-Toast Edifício',
      endereco: 'Rua Toast, 1',
      proprietario_id: proprietarioId,
    }).select().single()
    edificioId = edif.id

    // Unidade para criar/cancelar contrato
    const { data: u1 } = await admin.from('unidades').insert({
      edificio_id: edificioId,
      nome: 'E2E-Toast Sala Contrato',
      area_m2: 40,
      valor_mensal: 2000,
      valor_visivel: true,
      status: 'disponivel',
    }).select().single()
    unidadeParaContratoId = u1.id

    // Unidade para deletar (sem contrato)
    const { data: u2 } = await admin.from('unidades').insert({
      edificio_id: edificioId,
      nome: 'E2E-Toast Sala Deletar',
      area_m2: 20,
      valor_mensal: 1000,
      valor_visivel: true,
      status: 'disponivel',
    }).select().single()
    unidadeParaDeletarId = u2.id

    // Criar auth user para locatário
    const { data: list } = await admin.auth.admin.listUsers()
    const existing = list.users.find(u => u.email === 'e2e-toast@test.romma.local')
    if (existing) {
      locatarioUserId = existing.id
    } else {
      const { data } = await admin.auth.admin.createUser({
        email: 'e2e-toast@test.romma.local',
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
      nome_razao_social: 'E2E-Toast Locatário',
      tipo: 'pf',
      documento: '55544433322',
      email: 'e2e-toast@test.romma.local',
      telefone: '11333333333',
      status_convite: 'pendente',
    }).select().single()
    locatarioId = loc.id

    // Criar contrato ativo (para cancelar/encerrar) com parcelas
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
      // Limpar parcelas e contratos
      const { data: contratos } = await admin.from('contratos').select('id').eq('unidade_id', unidadeParaContratoId)
      if (contratos?.length) {
        await admin.from('parcelas').delete().in('contrato_id', contratos.map(c => c.id))
        await admin.from('contratos').delete().in('id', contratos.map(c => c.id))
      }
      if (locatarioId) await admin.from('locatarios').delete().eq('id', locatarioId)
      if (locatarioUserId) await admin.auth.admin.deleteUser(locatarioUserId)
      if (unidadeParaContratoId) await admin.from('unidades').delete().eq('id', unidadeParaContratoId)
      if (unidadeParaDeletarId) await admin.from('unidades').delete().eq('id', unidadeParaDeletarId)
      if (edificioId) await admin.from('edificios').delete().eq('id', edificioId)
      // Locatários auxiliares (03.1 / 03.4) — best-effort por email
      for (const email of ['e2e-toast2@test.romma.local', 'e2e-toast-revogar@test.romma.local']) {
        const { data: u } = await admin.auth.admin.listUsers()
        const found = u?.users?.find(x => x.email === email)
        if (found) {
          await admin.from('locatarios').delete().eq('usuario_id', found.id)
          await admin.auth.admin.deleteUser(found.id)
        }
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
    const existing2 = list.users.find(u => u.email === 'e2e-toast2@test.romma.local')
    if (existing2) {
      u2id = existing2.id
    } else {
      const { data } = await admin.auth.admin.createUser({
        email: 'e2e-toast2@test.romma.local',
        password: 'Test1234!',
        email_confirm: true,
      })
      u2id = data.user.id
    }
    await admin.from('locatarios').delete().eq('usuario_id', u2id)
    await admin.from('locatarios').insert({
      usuario_id: u2id,
      proprietario_id: prop.usuario_id,
      nome_razao_social: 'E2E-Toast Criar Contrato',
      tipo: 'pf',
      documento: '11122233344',
      email: 'e2e-toast2@test.romma.local',
      telefone: '11444444444',
      status_convite: 'pendente',
    })

    await login(page, PROPRIETARIO)
    await page.waitForURL('**/dashboard', { timeout: 15_000 })
    await page.goto('/dashboard/contratos')
    await page.waitForURL('**/dashboard/contratos', { timeout: 10_000 })

    await page.getByRole('button', { name: 'Novo Contrato' }).click()
    await page.getByRole('combobox').nth(0).click()
    await page.getByRole('option', { name: 'E2E-Toast Criar Contrato' }).click()
    await page.getByRole('combobox').nth(1).click()
    await page.getByRole('option', { name: 'E2E-Toast Sala Contrato' }).click()
    await page.locator('input[type="date"]').nth(0).fill('2026-06-01')
    await page.locator('input[type="date"]').nth(1).fill('2027-06-01')
    await page.getByRole('button', { name: 'Criar Contrato' }).click()

    // ANIM-03: toast must be visible — RED until Wave 1 wires toast.success("Contrato criado")
    await expect(page.getByText('Contrato criado')).toBeVisible({ timeout: 10_000 })

    // Cleanup extra locatário
    try {
      await admin.from('locatarios').delete().eq('usuario_id', u2id)
      await admin.auth.admin.deleteUser(u2id)
    } catch { /* cleanup best-effort */ }
  })

  // ─── Toast: Cancelar contrato ─────────────────────────────────────────────────

  test('ANIM-03.2 — toast "Contrato cancelado" após cancelar contrato', async ({ page }) => {
    // Garantir contrato ativo para E2E-Toast Locatário especificamente.
    // 03.1 pode deixar a unidade ocupada por OUTRO locatário ('Criar Contrato'),
    // então checar "qualquer ativo" não basta — o row clicado é o de E2E-Toast Locatário.
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

    // Click CANC on the E2E-Toast Locatário row
    await page.locator('span.font-medium', { hasText: 'E2E-Toast Locatário' }).locator('../..').getByRole('button', { name: 'CANC' }).click()
    await page.getByText('Cancelar contrato?').waitFor({ timeout: 5_000 })
    await page.getByRole('button', { name: 'Cancelar Contrato' }).click()

    // ANIM-03: toast must be visible — RED until Wave 1 wires toast.success("Contrato cancelado")
    await expect(page.getByText('Contrato cancelado')).toBeVisible({ timeout: 10_000 })
  })

  // ─── Toast: Deletar unidade ────────────────────────────────────────────────────

  test('ANIM-03.3 — toast "Unidade removida" após deletar unidade', async ({ page }) => {
    await login(page, PROPRIETARIO)
    await page.waitForURL('**/dashboard', { timeout: 15_000 })
    await page.goto('/dashboard/unidades')
    await page.waitForURL('**/dashboard/unidades', { timeout: 10_000 })

    // Click Remover on the unidade sem contrato
    const row = page.getByText('E2E-Toast Sala Deletar').locator('../..')
    await expect(row).toBeVisible({ timeout: 10_000 })
    await row.getByRole('button', { name: 'Remover' }).click()

    // ANIM-03: toast must be visible — RED until Wave 1 wires toast.success("Unidade removida")
    await expect(page.getByText('Unidade removida')).toBeVisible({ timeout: 10_000 })
  })

  // ─── Toast: Revogar acesso ─────────────────────────────────────────────────────

  test('ANIM-03.4 — toast "Acesso revogado" após revogar locatário', async ({ page }) => {
    // Locatário DEDICADO sem contrato: revogarConvite retorna 400 se houver contratos
    // vinculados (qualquer status). E2E-Toast Locatário carrega contratos da fixture,
    // então criamos um fresh pendente sem contrato para revogar.
    const { data: prop } = await admin.from('proprietarios').select('usuario_id').limit(1).single()
    const revEmail = 'e2e-toast-revogar@test.romma.local'
    const { data: list } = await admin.auth.admin.listUsers()
    const existingRev = list.users.find(u => u.email === revEmail)
    let revUserId
    if (existingRev) {
      revUserId = existingRev.id
    } else {
      const { data } = await admin.auth.admin.createUser({ email: revEmail, password: 'Test1234!', email_confirm: true })
      revUserId = data.user.id
    }
    await admin.from('locatarios').delete().eq('usuario_id', revUserId)
    await admin.from('locatarios').insert({
      usuario_id: revUserId,
      proprietario_id: prop.usuario_id,
      nome_razao_social: 'E2E-Toast Revogar',
      tipo: 'pf',
      documento: '99988877766',
      email: revEmail,
      telefone: '11222222222',
      status_convite: 'pendente',
    })

    await login(page, PROPRIETARIO)
    await page.waitForURL('**/dashboard', { timeout: 15_000 })
    await page.goto('/dashboard/locatarios')
    await page.waitForURL('**/dashboard/locatarios', { timeout: 10_000 })

    const row = page.getByText('E2E-Toast Revogar').locator('../..')
    await expect(row).toBeVisible({ timeout: 10_000 })
    await row.getByRole('button', { name: 'REVOGAR' }).click()

    // ANIM-03: toast.success("Acesso revogado") wired no LocatariosDesktop
    await expect(page.getByText('Acesso revogado')).toBeVisible({ timeout: 10_000 })

    // Cleanup — revogarConvite já deletou se sucesso; best-effort caso falhe
    try {
      await admin.from('locatarios').delete().eq('usuario_id', revUserId)
      await admin.auth.admin.deleteUser(revUserId)
    } catch { /* cleanup best-effort */ }
  })

  // ─── Toast: Marcar parcela como paga ──────────────────────────────────────────

  test('ANIM-03.5 — toast "Parcela marcada como paga" após marcar parcela como paga', async ({ page }) => {
    // Need an ativo contrato with a pendente parcela — find contratos for unidadeParaContratoId
    const { data: contratos } = await admin.from('contratos')
      .select('id')
      .eq('unidade_id', unidadeParaContratoId)
      .order('created_at', { ascending: false })
      .limit(1)

    if (!contratos?.length) {
      test.skip()
      return
    }

    const cId = contratos[0].id
    // Make sure there's at least one pendente parcela
    const { data: parcelas } = await admin.from('parcelas')
      .select('id')
      .eq('contrato_id', cId)
      .eq('status', 'pendente')
      .limit(1)

    if (!parcelas?.length) {
      const hoje = new Date().toISOString().split('T')[0]
      await admin.from('parcelas').insert({
        contrato_id: cId,
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
    await page.goto(`/dashboard/contratos/${cId}`)
    await page.waitForURL(`**/dashboard/contratos/${cId}`, { timeout: 10_000 })

    // Click the "Marcar Paga" button on the first pendente parcela
    const pagarBtn = page.getByRole('button', { name: 'Marcar Paga' }).first()
    await expect(pagarBtn).toBeVisible({ timeout: 10_000 })
    await pagarBtn.click()

    // ANIM-03: toast must be visible — RED until Wave 1 wires toast.success("Parcela marcada como paga")
    await expect(page.getByText('Parcela marcada como paga')).toBeVisible({ timeout: 10_000 })
  })
})
