/**
 * TEST-01 — CRUD Contratos (split from crud.spec.js — D-10)
 *
 * Cobertura: Contratos (criar / cancelar / encerrar) + regra de negócio de status da unidade
 *
 * Pré-condições para rodar:
 *   - `supabase start` rodando (127.0.0.1:54321)
 *   - `supabase functions serve` rodando (Edge Function gerar-parcelas)
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

test.describe('TEST-01 — CRUD Contratos', () => {
  test.use({ viewport: { width: 1440, height: 900 } })

  // ------------------------------------------------------------------ Contratos
  test.describe('Contratos', () => {
    // IDs dos pré-requisitos criados via supabaseAdmin no beforeAll
    let edificioId, unidadeId, locatarioId, locatarioUserId

    test.beforeAll(async () => {
      const { data: prop } = await admin.from('proprietarios').select('usuario_id').limit(1).single()
      const proprietarioId = prop.usuario_id

      // Criar auth user para o locatário de contratos
      const { data: list } = await admin.auth.admin.listUsers()
      const existing = list.users.find(u => u.email === 'e2e-contratos@test.romma.local')
      if (existing) {
        locatarioUserId = existing.id
      } else {
        const { data, error } = await admin.auth.admin.createUser({
          email: 'e2e-contratos@test.romma.local',
          password: 'Test1234!',
          email_confirm: true,
        })
        if (error) throw error
        locatarioUserId = data.user.id
      }

      // Criar edifício
      const { data: edificio, error: errE } = await admin
        .from('edificios')
        .insert({ nome: 'E2E-Edifício Contratos', endereco: 'Rua E2E Contratos, 1', proprietario_id: proprietarioId })
        .select()
        .single()
      if (errE) throw errE
      edificioId = edificio.id

      // Criar unidade disponível
      const { data: unidade, error: errU } = await admin
        .from('unidades')
        .insert({
          edificio_id: edificioId,
          nome: 'E2E-Sala Contrato',
          area_m2: 60,
          valor_mensal: 4000,
          valor_visivel: true,
          status: 'disponivel',
        })
        .select()
        .single()
      if (errU) throw errU
      unidadeId = unidade.id

      // Limpar locatarios existentes do usuario antes de criar (idempotência)
      const { data: locExist } = await admin
        .from('locatarios')
        .select('id')
        .eq('usuario_id', locatarioUserId)
      if (locExist?.length) {
        const ids = locExist.map(l => l.id)
        const { data: cExist } = await admin.from('contratos').select('id').in('locatario_id', ids)
        if (cExist?.length) {
          await admin.from('parcelas').delete().in('contrato_id', cExist.map(c => c.id))
          await admin.from('contratos').delete().in('id', cExist.map(c => c.id))
        }
        await admin.from('locatarios').delete().in('id', ids)
      }

      // Criar locatário
      const { data: locatario, error: errL } = await admin
        .from('locatarios')
        .insert({
          usuario_id: locatarioUserId,
          proprietario_id: proprietarioId,
          nome_razao_social: 'E2E-Locatário Contratos',
          tipo: 'pj',
          documento: '12345678000195',
          email: 'e2e-contratos@test.romma.local',
          telefone: '11888888888',
        })
        .select()
        .single()
      if (errL) throw errL
      locatarioId = locatario.id
    })

    test.afterAll(async () => {
      // Teardown defensivo — o global-teardown por prefixo E2E- já limpa,
      // mas o afterAll garante ordem correta para os demais testes do spec
      const { data: contratos } = await admin
        .from('contratos')
        .select('id')
        .eq('unidade_id', unidadeId)
      if (contratos?.length) {
        await admin.from('parcelas').delete().in('contrato_id', contratos.map(c => c.id))
        await admin.from('contratos').delete().in('id', contratos.map(c => c.id))
      }
      if (locatarioId) await admin.from('locatarios').delete().eq('id', locatarioId)
      if (unidadeId) await admin.from('unidades').delete().eq('id', unidadeId)
      if (edificioId) await admin.from('edificios').delete().eq('id', edificioId)
      if (locatarioUserId) await admin.auth.admin.deleteUser(locatarioUserId)
    })

    test.beforeEach(async ({ page }) => {
      await login(page, PROPRIETARIO)
      await page.waitForURL('**/dashboard', { timeout: 15_000 })
      await page.goto('/dashboard/contratos')
      await page.waitForURL('**/dashboard/contratos', { timeout: 10_000 })
    })

    test('criar contrato (com gerarParcelas automático)', async ({ page }) => {
      await page.getByRole('button', { name: 'Novo Contrato' }).click()

      // shadcn Select — Locatário (combobox 0)
      await page.getByRole('combobox').nth(0).click()
      await page.getByRole('option', { name: 'E2E-Locatário Contratos' }).click()

      // shadcn Select — Unidade disponível (combobox 1)
      await page.getByRole('combobox').nth(1).click()
      await page.getByRole('option', { name: 'E2E-Sala Contrato' }).click()

      // Datas
      await page.locator('input[type="date"]').nth(0).fill('2026-06-01')
      await page.locator('input[type="date"]').nth(1).fill('2027-06-01')

      await page.getByRole('button', { name: 'Criar Contrato' }).click()
      // handleCriarContrato chama gerarParcelas automaticamente — timeout maior
      // span.font-medium: escopo à linha da lista, evita match no Select trigger do formulário
      await expect(page.locator('span.font-medium', { hasText: 'E2E-Locatário Contratos' })).toBeVisible({ timeout: 15_000 })

      // Verificar via admin que a unidade ficou alugada
      const { data: uni } = await admin.from('unidades').select('status').eq('id', unidadeId).single()
      expect(uni.status).toBe('alugada')
    })

    test('cancelar contrato via ConfirmDialog e verificar unidade volta a disponivel', async ({ page }) => {
      // Seed tem contrato ativo (Locatário Teste) — scopar ao row E2E para não ambiguar CANC
      await page.locator('span.font-medium', { hasText: 'E2E-Locatário Contratos' }).locator('../..').getByRole('button', { name: 'CANC' }).click()

      // Aguardar ConfirmDialog
      await page.getByText('Cancelar contrato?').waitFor({ timeout: 5_000 })
      await page.getByRole('button', { name: 'Cancelar Contrato' }).click()
      // D-07 (Phase 14): contrato cancelado some da listagem (filtro ativo-only + exit animation 200ms)
      await expect(page.locator('span.font-medium', { hasText: 'E2E-Locatário Contratos' })).toHaveCount(0, { timeout: 10_000 })

      // Verificar via admin que a unidade voltou a disponivel
      const { data: uni } = await admin.from('unidades').select('status').eq('id', unidadeId).single()
      expect(uni.status).toBe('disponivel')
    })

    test('encerrar contrato (data_fim no passado via admin) e verificar unidade volta a disponivel', async ({ page }) => {
      // Criar segundo contrato via UI (unidade voltou a disponivel após cancelamento)
      await page.getByRole('button', { name: 'Novo Contrato' }).click()

      await page.getByRole('combobox').nth(0).click()
      await page.getByRole('option', { name: 'E2E-Locatário Contratos' }).click()

      await page.getByRole('combobox').nth(1).click()
      await page.getByRole('option', { name: 'E2E-Sala Contrato' }).click()

      await page.locator('input[type="date"]').nth(0).fill('2026-06-01')
      await page.locator('input[type="date"]').nth(1).fill('2027-06-01')

      await page.getByRole('button', { name: 'Criar Contrato' }).click()
      // Aguardar form fechar — setShowForm(false) só ocorre após sucesso da Server Action
      await expect(page.getByRole('button', { name: 'Novo Contrato' })).toBeVisible({ timeout: 15_000 })

      // Capturar id do contrato ativo mais recente para E2E-Sala Contrato
      const { data: contratos } = await admin
        .from('contratos')
        .select('id')
        .eq('unidade_id', unidadeId)
        .eq('status', 'ativo')
        .order('created_at', { ascending: false })
        .limit(1)
      const contratoId = contratos?.[0]?.id
      expect(contratoId).toBeTruthy()

      // Pitfall 2: setar data_fim no passado para que botão ENC apareça
      const ontem = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      await admin.from('contratos').update({ data_fim: ontem }).eq('id', contratoId)

      // Recarregar página para que o componente recalcule vencido = true
      await page.reload()
      await page.waitForURL('**/dashboard/contratos', { timeout: 10_000 })

      // Clicar ENC — único botão ENC visível (só o contrato com data_fim no passado)
      await page.getByRole('button', { name: 'ENC' }).click()

      // Aguardar ConfirmDialog de encerramento
      await page.getByText('Encerrar contrato?').waitFor({ timeout: 5_000 })
      await page.getByRole('button', { name: 'Encerrar' }).click()
      // D-07 (Phase 14): contrato encerrado some da listagem (filtro ativo-only + exit animation 200ms)
      await expect(page.locator('span.font-medium', { hasText: 'E2E-Locatário Contratos' })).toHaveCount(0, { timeout: 10_000 })

      // Verificar via admin que a unidade voltou a disponivel
      const { data: uni } = await admin.from('unidades').select('status').eq('id', unidadeId).single()
      expect(uni.status).toBe('disponivel')
    })
  })
})
