/**
 * TEST-02 — Ciclo de Parcelas via Edge Function gerar-parcelas
 *
 * PRE-CONDIÇÃO OBRIGATÓRIA:
 *   supabase start && supabase functions serve gerar-parcelas
 *
 * Sem a Edge Function rodando em http://127.0.0.1:54321/functions/v1/gerar-parcelas,
 * a criação de contrato via UI falha silenciosamente (handleCriarContrato chama
 * gerarParcelas automaticamente — erro 404/connection refused na chamada da EF).
 *
 * Comandos para rodar esta suíte:
 *   supabase start
 *   supabase functions serve gerar-parcelas &
 *   npx playwright test e2e/parcelas.spec.js
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

test.describe('TEST-02 — Parcelas', () => {
  test.use({ viewport: { width: 1440, height: 900 } })

  let edificioId
  let unidadeId
  let locatarioId
  let authUserId
  let contratoId

  test.beforeAll(async () => {
    // 1. Edifício
    const { data: edificio, error: errEdificio } = await admin
      .from('edificios')
      .insert({ nome: 'E2E-Edifício Parcelas', endereco: 'Rua E2E Parcelas, 2' })
      .select()
      .single()
    if (errEdificio) throw errEdificio
    edificioId = edificio.id

    // 2. Unidade (disponivel — sem contrato; o spec cria o contrato via UI)
    const { data: unidade, error: errUnidade } = await admin
      .from('unidades')
      .insert({
        edificio_id: edificioId,
        nome: 'E2E-Sala Parcelas',
        area_m2: 40,
        valor_mensal: 2500,
        valor_visivel: true,
        status: 'disponivel',
      })
      .select()
      .single()
    if (errUnidade) throw errUnidade
    unidadeId = unidade.id

    // 3. Auth user dedicado ao spec
    const { data: authData, error: errAuth } = await admin.auth.admin.createUser({
      email: 'e2e-parcelas@test.romma.local',
      password: 'Test1234!',
      email_confirm: true,
    })
    if (errAuth) throw errAuth
    authUserId = authData.user.id

    // 4. Locatário vinculado ao auth user
    const { data: locatario, error: errLocatario } = await admin
      .from('locatarios')
      .insert({
        usuario_id: authUserId,
        nome_razao_social: 'E2E-Locatário Parcelas',
        tipo: 'pf',
        documento: '98765432100',
        email: 'e2e-parcelas@test.romma.local',
        telefone: '11988887777',
      })
      .select()
      .single()
    if (errLocatario) throw errLocatario
    locatarioId = locatario.id
    // NÃO criamos contrato aqui — o teste 1 faz isso via UI para disparar gerarParcelas
  })

  test.afterAll(async () => {
    // Cascata FK obrigatória: parcelas → contratos → unidades → edificios → locatarios → auth user
    if (contratoId) {
      await admin.from('parcelas').delete().eq('contrato_id', contratoId)
      await admin.from('contratos').delete().eq('id', contratoId)
    }
    if (unidadeId) {
      await admin.from('unidades').delete().eq('id', unidadeId)
    }
    if (locatarioId) {
      await admin.from('locatarios').delete().eq('id', locatarioId)
    }
    if (edificioId) {
      await admin.from('edificios').delete().eq('id', edificioId)
    }
    if (authUserId) {
      await admin.auth.admin.deleteUser(authUserId)
    }
  })

  test.beforeEach(async ({ page }) => {
    await login(page, PROPRIETARIO)
    await page.waitForURL('**/dashboard', { timeout: 15_000 })
  })

  test('gera parcelas via Edge Function ao criar contrato', async ({ page }) => {
    // Navegar para a página de contratos
    await page.goto('/dashboard/contratos')
    await page.waitForURL('**/dashboard/contratos', { timeout: 10_000 })

    // Abrir formulário de novo contrato
    await page.getByRole('button', { name: 'Novo Contrato' }).click()

    // Selecionar locatário via shadcn Select (combobox[0] = Locatário)
    await page.getByRole('combobox').nth(0).click()
    await page.getByRole('option', { name: 'E2E-Locatário Parcelas' }).click()

    // Selecionar unidade disponível via shadcn Select (combobox[1] = Unidade)
    await page.getByRole('combobox').nth(1).click()
    await page.getByRole('option', { name: 'E2E-Sala Parcelas' }).click()

    // Preencher datas
    await page.locator('input[type="date"]').nth(0).fill('2026-06-01')
    await page.locator('input[type="date"]').nth(1).fill('2027-06-01')

    // Criar contrato — handleCriarContrato chama gerarParcelas automaticamente (EF)
    await page.getByRole('button', { name: 'Criar Contrato' }).click()

    // Aguardar com timeout estendido — criação envolve chamada à Edge Function
    await expect(
      page.getByText('E2E-Locatário Parcelas')
    ).toBeVisible({ timeout: 15_000 })

    // Capturar o contratoId via admin para navegar para a página de parcelas
    const { data: contratos, error: errQ } = await admin
      .from('contratos')
      .select('id')
      .eq('locatario_id', locatarioId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()
    if (errQ) throw errQ
    contratoId = contratos.id

    // Navegar para /dashboard/contratos/[id] e verificar que parcelas foram geradas pela EF
    await page.goto(`/dashboard/contratos/${contratoId}`)
    await expect(
      page.getByText('futura').or(page.getByText('pendente'))
    ).toBeVisible({ timeout: 15_000 })
  })

  test('marca parcela como paga', async ({ page }) => {
    // Garantir que existe pelo menos uma parcela com status pendente
    // (a EF pode ter criado futura — forçar pendente via admin para poder clicar "Marcar Paga")
    const hoje = new Date().toISOString().split('T')[0]
    const ontem = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0]

    await admin
      .from('parcelas')
      .update({
        status: 'pendente',
        data_fechamento: ontem,
        data_vencimento: hoje,
        data_pagamento: null,
      })
      .eq('contrato_id', contratoId)
      .eq('numero', 1)

    // Recarregar a página do contrato
    await page.goto(`/dashboard/contratos/${contratoId}`)

    // Clicar no primeiro botão "Marcar Paga" disponível
    await page.getByRole('button', { name: 'Marcar Paga' }).first().click()

    // Verificar que o status "paga" ficou visível
    await expect(page.getByText('paga').first()).toBeVisible({ timeout: 10_000 })
  })
})
