/**
 * TEST-01 — CRUD Locatários (split from crud.spec.js — D-10)
 *
 * Cobertura: Locatários (convidar / editar)
 * + BUG-01: Revogar Acesso de Locatário
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

test.describe('TEST-01 — CRUD Locatários', () => {
  test.use({ viewport: { width: 1440, height: 900 } })

  // ------------------------------------------------------------------ Locatários
  test.describe('Locatários', () => {
    let locatarioUserId, locatarioId

    test.beforeAll(async () => {
      const { data: prop } = await admin.from('proprietarios').select('usuario_id').limit(1).single()
      const proprietarioId = prop.usuario_id

      // Criar auth user confirmado para o teste de edição (invite cria status pendente → sem botão Editar)
      const { data: list } = await admin.auth.admin.listUsers()
      const existing = list.users.find(u => u.email === 'e2e-edit-loc@test.romma.local')
      if (existing) {
        locatarioUserId = existing.id
      } else {
        const { data, error } = await admin.auth.admin.createUser({
          email: 'e2e-edit-loc@test.romma.local',
          password: 'Test1234!',
          email_confirm: true,
        })
        if (error) throw error
        locatarioUserId = data.user.id
      }
      // Limpar registros stale
      const { data: stale } = await admin.from('locatarios').select('id').eq('usuario_id', locatarioUserId)
      if (stale?.length) await admin.from('locatarios').delete().in('id', stale.map(l => l.id))
      // Criar locatário confirmado (status_convite='aceito' → mostra botão Editar)
      const { data: loc, error: errL } = await admin.from('locatarios').insert({
        usuario_id: locatarioUserId,
        proprietario_id: proprietarioId,
        nome_razao_social: 'E2E-Locatário Teste',
        tipo: 'pf',
        documento: '12345678901',
        email: 'e2e-edit-loc@test.romma.local',
        telefone: '11999999999',
        status_convite: 'aceito',
      }).select().single()
      if (errL) throw errL
      locatarioId = loc.id
    })

    test.afterAll(async () => {
      if (locatarioId) await admin.from('locatarios').delete().eq('id', locatarioId)
      if (locatarioUserId) await admin.auth.admin.deleteUser(locatarioUserId)
    })

    test.beforeEach(async ({ page }) => {
      await login(page, PROPRIETARIO)
      await page.waitForURL('**/dashboard', { timeout: 15_000 })
      await page.goto('/dashboard/locatarios')
      await page.waitForURL('**/dashboard/locatarios', { timeout: 10_000 })
    })

    test('convidar locatário', async ({ page }) => {
      const email = `e2e-invite-${Date.now()}@test.romma.local`
      // Abrir modal de convite
      await page.getByRole('button', { name: 'Convidar →' }).click()
      // Ordem dos campos no modal: Email → Nome → Tipo → Documento → Telefone
      await page.locator('input[type="email"]').fill(email)
      await page.locator('input[type="text"]').first().fill('E2E-Locatário Invite')
      await page.getByRole('button', { name: 'Pessoa Física' }).click()
      await page.locator('input[placeholder="000.000.000-00"]').fill('12345678901')
      await page.locator('input[type="tel"]').fill('11999999999')
      await page.locator('button[type="submit"]').click()
      await expect(page.getByText('E2E-Locatário Invite')).toBeVisible({ timeout: 10_000 })
    })

    test('editar locatário', async ({ page }) => {
      // locator('../..') sobe 2 níveis: span → name+avatar div → grid row
      await page.getByText('E2E-Locatário Teste').locator('../..').getByRole('button', { name: 'Editar' }).click()
      // Modal de edição: primeiro input[type="text"] é Nome / Razão Social
      await page.locator('input[type="text"]').first().fill('E2E-Locatário Editado')
      await page.getByRole('button', { name: 'Salvar →' }).click()
      await expect(page.getByText('E2E-Locatário Editado')).toBeVisible({ timeout: 10_000 })
    })
  })

  // --------------------------------------------------------- BUG-01 Fix
  test.describe('BUG-01 — Revogar Acesso de Locatário', () => {
    let revogarUserId, revogarLocatarioId
    let comContratoUserId, comContratoLocatarioId, comContratoEdificioId, comContratoUnidadeId, comContratoId

    test.beforeAll(async () => {
      const { data: prop } = await admin.from('proprietarios').select('usuario_id').limit(1).single()
      const proprietarioId = prop.usuario_id

      // --- Locatário pendente SEM contrato (para cenário de revogar sucesso) ---
      const { data: list } = await admin.auth.admin.listUsers()
      const existingRevoke = list.users.find(u => u.email === 'e2e-revogar@test.romma.local')
      if (existingRevoke) {
        revogarUserId = existingRevoke.id
      } else {
        const { data, error } = await admin.auth.admin.createUser({
          email: 'e2e-revogar@test.romma.local',
          password: 'Test1234!',
          email_confirm: true,
        })
        if (error) throw error
        revogarUserId = data.user.id
      }
      // Limpar registros stale e criar locatário pendente sem contrato
      const { data: stale } = await admin.from('locatarios').select('id').eq('usuario_id', revogarUserId)
      if (stale?.length) {
        const ids = stale.map(l => l.id)
        const { data: cExist } = await admin.from('contratos').select('id').in('locatario_id', ids)
        if (cExist?.length) {
          await admin.from('parcelas').delete().in('contrato_id', cExist.map(c => c.id))
          await admin.from('contratos').delete().in('id', cExist.map(c => c.id))
        }
        await admin.from('locatarios').delete().in('id', ids)
      }
      const { data: loc, error: errL } = await admin.from('locatarios').insert({
        usuario_id: revogarUserId,
        proprietario_id: proprietarioId,
        nome_razao_social: 'E2E-Locatário Revogar',
        tipo: 'pf',
        documento: '98765432100',
        email: 'e2e-revogar@test.romma.local',
        telefone: '11777777777',
        status_convite: 'pendente',
      }).select().single()
      if (errL) throw errL
      revogarLocatarioId = loc.id

      // --- Locatário pendente COM contrato (para cenário de erro FK) ---
      const existingComContrato = list.users.find(u => u.email === 'e2e-revogar-fk@test.romma.local')
      if (existingComContrato) {
        comContratoUserId = existingComContrato.id
      } else {
        const { data: d2, error: e2 } = await admin.auth.admin.createUser({
          email: 'e2e-revogar-fk@test.romma.local',
          password: 'Test1234!',
          email_confirm: true,
        })
        if (e2) throw e2
        comContratoUserId = d2.user.id
      }
      const { data: stale2 } = await admin.from('locatarios').select('id').eq('usuario_id', comContratoUserId)
      if (stale2?.length) {
        const ids2 = stale2.map(l => l.id)
        const { data: cExist2 } = await admin.from('contratos').select('id').in('locatario_id', ids2)
        if (cExist2?.length) {
          await admin.from('parcelas').delete().in('contrato_id', cExist2.map(c => c.id))
          await admin.from('contratos').delete().in('id', cExist2.map(c => c.id))
        }
        await admin.from('locatarios').delete().in('id', ids2)
      }
      const { data: loc2, error: errL2 } = await admin.from('locatarios').insert({
        usuario_id: comContratoUserId,
        proprietario_id: proprietarioId,
        nome_razao_social: 'E2E-Locatário FK',
        tipo: 'pj',
        documento: '12345678000111',
        email: 'e2e-revogar-fk@test.romma.local',
        telefone: '11666666666',
        status_convite: 'pendente',
      }).select().single()
      if (errL2) throw errL2
      comContratoLocatarioId = loc2.id

      // Criar edifício + unidade para o contrato
      const { data: edif, error: errEd } = await admin.from('edificios').insert({
        nome: 'E2E-Edifício BUG01',
        endereco: 'Rua BUG01, 1',
        proprietario_id: proprietarioId,
      }).select().single()
      if (errEd) throw errEd
      comContratoEdificioId = edif.id

      const { data: uni, error: errUni } = await admin.from('unidades').insert({
        edificio_id: comContratoEdificioId,
        nome: 'E2E-Sala BUG01',
        area_m2: 20,
        valor_mensal: 1000,
        valor_visivel: true,
        status: 'alugada',
      }).select().single()
      if (errUni) throw errUni
      comContratoUnidadeId = uni.id

      const hoje = new Date().toISOString().split('T')[0]
      const { data: contrato, error: errC } = await admin.from('contratos').insert({
        unidade_id: comContratoUnidadeId,
        locatario_id: comContratoLocatarioId,
        data_inicio: hoje,
        data_fim: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        status: 'ativo',
        observacoes: '',
      }).select().single()
      if (errC) throw errC
      comContratoId = contrato.id
    })

    test.afterAll(async () => {
      // Limpar locatário sem contrato
      if (revogarLocatarioId) await admin.from('locatarios').delete().eq('id', revogarLocatarioId)
      if (revogarUserId) await admin.auth.admin.deleteUser(revogarUserId).catch(() => {})

      // Limpar locatário com contrato
      if (comContratoId) {
        await admin.from('parcelas').delete().eq('contrato_id', comContratoId)
        await admin.from('contratos').delete().eq('id', comContratoId)
      }
      if (comContratoLocatarioId) await admin.from('locatarios').delete().eq('id', comContratoLocatarioId)
      if (comContratoUserId) await admin.auth.admin.deleteUser(comContratoUserId).catch(() => {})
      if (comContratoUnidadeId) await admin.from('unidades').delete().eq('id', comContratoUnidadeId)
      if (comContratoEdificioId) await admin.from('edificios').delete().eq('id', comContratoEdificioId)
    })

    test.beforeEach(async ({ page }) => {
      await login(page, PROPRIETARIO)
      await page.waitForURL('**/dashboard', { timeout: 15_000 })
      await page.goto('/dashboard/locatarios')
      await page.waitForURL('**/dashboard/locatarios', { timeout: 10_000 })
    })

    test('BUG-01 — revogar locatário pendente sem contrato remove a linha', async ({ page }) => {
      // O locatário pendente sem contrato deve ter o botão REVOGAR visível
      const row = page.locator('*').filter({ hasText: 'E2E-Locatário Revogar' }).first()
      await expect(row).toBeVisible({ timeout: 10_000 })

      // Clicar REVOGAR — escopo à linha do E2E-Locatário Revogar para evitar ambiguidade com outros pendentes
      await page.getByText('E2E-Locatário Revogar').locator('../..').getByRole('button', { name: 'REVOGAR' }).click()

      // Após revogar, a linha deve sumir da tabela
      await expect(page.getByText('E2E-Locatário Revogar')).toHaveCount(0, { timeout: 10_000 })
    })

    test('BUG-01 — erro inline ao revogar locatário com contrato vinculado', async ({ page }) => {
      // O locatário com contrato ativo deve ter o botão REVOGAR visível (status_convite='pendente')
      const row = page.locator('*').filter({ hasText: 'E2E-Locatário FK' }).first()
      await expect(row).toBeVisible({ timeout: 10_000 })

      // Clicar REVOGAR no locatário com contrato (localiza via ancestral da linha)
      await page.getByText('E2E-Locatário FK').locator('../..').getByRole('button', { name: 'REVOGAR' }).click()

      // A mensagem de erro deve aparecer inline na tabela (NÃO via alert/dialog do browser)
      // Este teste estará RED no código atual (usa alert()) — passará após o fix BUG-01
      await expect(page.getByText('Locatário tem contratos vinculados — encerre-os antes de revogar.')).toBeVisible({ timeout: 10_000 })
    })
  })
})
