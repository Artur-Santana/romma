/**
 * Popula dados de demonstração na base de produção do Supabase.
 *
 * Uso: node scripts/seed-prod-demo.mjs
 *
 * Lê credenciais de .env.local (NEXT_PUBLIC_SUPABASE_URL + SUPABASE_ROLE_KEY).
 * Aponta INTENCIONALMENTE para a URL de produção — estratégia mix D-04.
 *
 * Idempotente: verifica existência antes de inserir, nunca faz DELETE/TRUNCATE.
 * Seguro para rodar múltiplas vezes contra a base ao vivo da banca.
 *
 * Base gerada (D-04):
 *   - 2 edifícios com múltiplas unidades (mix disponivel/alugada, valor_visivel true/false)
 *   - 1 locatário cadastrado e logável (email_confirm: true)
 *   - 1 contrato ativo com parcelas nos 4 status: paga, vencida, pendente, futura
 */

import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'
import { resolve } from 'path'

config({ path: resolve(process.cwd(), '.env.local') })

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const ROLE_KEY     = process.env.SUPABASE_ROLE_KEY

if (!SUPABASE_URL || !ROLE_KEY) {
  console.error('NEXT_PUBLIC_SUPABASE_URL ou SUPABASE_ROLE_KEY ausentes em .env.local')
  process.exit(1)
}

const admin = createClient(SUPABASE_URL, ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
})

// Datas relativas para garantir status corretos em qualquer data de execução
const hoje       = new Date()
const fmt        = d => d.toISOString().split('T')[0]
const addDias    = n => { const d = new Date(hoje); d.setDate(d.getDate() + n); return fmt(d) }

const HOJE           = fmt(hoje)
const ONTEM          = addDias(-1)
const EM_SETE_DIAS   = addDias(7)
const EM_TRINTA_DIAS = addDias(30)
const EM_UM_ANO      = addDias(365)
const HA_DOIS_MESES  = addDias(-60)
const HA_UM_MES      = addDias(-30)

async function step(label, fn) {
  process.stdout.write(`  ${label}... `)
  try {
    const result = await fn()
    console.log('ok', result !== undefined ? `(${JSON.stringify(result)})` : '')
    return result
  } catch (e) {
    console.log('ERRO:', e.message)
    throw e
  }
}

// Cria usuário auth se não existir. Retorna usuário existente ou recém-criado.
async function upsertUser(email, password) {
  const { data: list } = await admin.auth.admin.listUsers()
  const existing = list.users.find(u => u.email === email)
  if (existing) return existing
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true, // obrigatório — sem isso login retorna "Email not confirmed"
  })
  if (error) throw error
  return data.user
}

async function main() {
  console.log('\n=== seed-prod-demo ===\n')

  // ──────────────────────────────────────────────
  // 1. Edifícios
  // ──────────────────────────────────────────────
  console.log('1. Edifícios')

  let edificio1, edificio2

  const { data: exEdificio1 } = await admin
    .from('edificios')
    .select('id')
    .eq('nome', 'Edifício Comercial Aurora')
    .maybeSingle()

  if (exEdificio1) {
    console.log(`  Edifício Aurora já existe (id=${exEdificio1.id}) — skip`)
    edificio1 = exEdificio1
  } else {
    await step('criar Edifício Comercial Aurora', async () => {
      const { data, error } = await admin
        .from('edificios')
        .insert({ nome: 'Edifício Comercial Aurora', endereco: 'Av. Paulista, 1000 — São Paulo/SP' })
        .select('id')
        .single()
      if (error) throw error
      edificio1 = data
      return data.id
    })
  }

  const { data: exEdificio2 } = await admin
    .from('edificios')
    .select('id')
    .eq('nome', 'Centro Empresarial Bela Vista')
    .maybeSingle()

  if (exEdificio2) {
    console.log(`  Centro Empresarial já existe (id=${exEdificio2.id}) — skip`)
    edificio2 = exEdificio2
  } else {
    await step('criar Centro Empresarial Bela Vista', async () => {
      const { data, error } = await admin
        .from('edificios')
        .insert({ nome: 'Centro Empresarial Bela Vista', endereco: 'R. Bela Cintra, 350 — São Paulo/SP' })
        .select('id')
        .single()
      if (error) throw error
      edificio2 = data
      return data.id
    })
  }

  // ──────────────────────────────────────────────
  // 2. Unidades — Edifício Aurora (4 unidades: mix alugada/disponivel, valor_visivel true/false)
  // ──────────────────────────────────────────────
  console.log('\n2. Unidades — Edifício Aurora')

  const unidadesAurora = [
    { nome: 'Sala 101', area_m2: 45, valor_mensal: 3800, valor_visivel: true,  status: 'alugada'    },
    { nome: 'Sala 102', area_m2: 60, valor_mensal: 5200, valor_visivel: true,  status: 'disponivel' },
    { nome: 'Sala 201', area_m2: 80, valor_mensal: 7500, valor_visivel: false, status: 'disponivel' },
    { nome: 'Andar 3 — Laje Corporativa', area_m2: 300, valor_mensal: 28000, valor_visivel: false, status: 'disponivel' },
  ]

  const unidadesAurora_ids = {}

  for (const uni of unidadesAurora) {
    const { data: exUni } = await admin
      .from('unidades')
      .select('id')
      .eq('edificio_id', edificio1.id)
      .eq('nome', uni.nome)
      .maybeSingle()

    if (exUni) {
      console.log(`  ${uni.nome} já existe — skip`)
      unidadesAurora_ids[uni.nome] = exUni.id
    } else {
      await step(`criar ${uni.nome}`, async () => {
        const { data, error } = await admin
          .from('unidades')
          .insert({ edificio_id: edificio1.id, ...uni })
          .select('id')
          .single()
        if (error) throw error
        unidadesAurora_ids[uni.nome] = data.id
        return data.id
      })
    }
  }

  // ──────────────────────────────────────────────
  // 3. Unidades — Centro Empresarial Bela Vista (2 unidades)
  // ──────────────────────────────────────────────
  console.log('\n3. Unidades — Centro Empresarial Bela Vista')

  const unidadesBela = [
    { nome: 'Conjunto 01', area_m2: 55, valor_mensal: 4200, valor_visivel: true, status: 'disponivel' },
    { nome: 'Conjunto 02', area_m2: 55, valor_mensal: 4200, valor_visivel: true, status: 'disponivel' },
  ]

  for (const uni of unidadesBela) {
    const { data: exUni } = await admin
      .from('unidades')
      .select('id')
      .eq('edificio_id', edificio2.id)
      .eq('nome', uni.nome)
      .maybeSingle()

    if (exUni) {
      console.log(`  ${uni.nome} já existe — skip`)
    } else {
      await step(`criar ${uni.nome}`, async () => {
        const { data, error } = await admin
          .from('unidades')
          .insert({ edificio_id: edificio2.id, ...uni })
          .select('id')
          .single()
        if (error) throw error
        return data.id
      })
    }
  }

  // ──────────────────────────────────────────────
  // 4. Locatário de demonstração
  // ──────────────────────────────────────────────
  console.log('\n4. Locatário')

  const DEMO_EMAIL    = 'locatario.demo@romma.demo'
  const DEMO_PASSWORD = 'Demo1234!'

  await step('upsert auth.user locatario.demo', async () => {
    const u = await upsertUser(DEMO_EMAIL, DEMO_PASSWORD)
    return u.id
  })

  // Buscar o objeto completo do usuário para ter o id
  const { data: authList } = await admin.auth.admin.listUsers()
  const locatarioAuthUser = authList.users.find(u => u.email === DEMO_EMAIL)
  if (!locatarioAuthUser) throw new Error('Usuário auth não encontrado após upsert')

  // Verificar se já existe registro na tabela locatarios para esse usuario_id
  // (sem unique constraint em usuario_id — usar limit(1) em vez de maybeSingle)
  let locatario
  const { data: locatariosExistentes } = await admin
    .from('locatarios')
    .select('id')
    .eq('usuario_id', locatarioAuthUser.id)
    .limit(1)

  if (locatariosExistentes?.length) {
    console.log(`  locatario já existe (id=${locatariosExistentes[0].id}) — skip`)
    locatario = locatariosExistentes[0]
  } else {
    await step('inserir locatario na tabela locatarios', async () => {
      const { data, error } = await admin
        .from('locatarios')
        .insert({
          usuario_id:        locatarioAuthUser.id,
          nome_razao_social: 'Carlos Eduardo Mendes',
          tipo:              'pf',
          documento:         '34567890100',
          email:             DEMO_EMAIL,
          telefone:          '11987654321',
        })
        .select('id')
        .single()
      if (error) throw error
      locatario = data
      return data.id
    })
  }

  // ──────────────────────────────────────────────
  // 5. Contrato ativo + parcelas (4 status) — Sala 101 do Aurora
  // ──────────────────────────────────────────────
  console.log('\n5. Contrato ativo + parcelas')

  const unidade101Id = unidadesAurora_ids['Sala 101']

  // Gate: só criar contrato E parcelas se não existir contrato ativo para essa unidade
  const { data: exContrato } = await admin
    .from('contratos')
    .select('id')
    .eq('unidade_id', unidade101Id)
    .eq('status', 'ativo')
    .maybeSingle()

  if (exContrato) {
    console.log(`  Contrato ativo já existe (id=${exContrato.id}) — skip contrato e parcelas`)
  } else {
    // Garantir unidade disponível antes de criar contrato
    await step('marcar Sala 101 como disponivel', async () => {
      const { error } = await admin
        .from('unidades')
        .update({ status: 'disponivel' })
        .eq('id', unidade101Id)
      if (error) throw error
    })

    // Criar contrato ativo com data_fim distante (não dispara alerta DASH-03)
    let contrato
    await step('criar contrato ativo', async () => {
      const { data, error } = await admin
        .from('contratos')
        .insert({
          unidade_id:   unidade101Id,
          locatario_id: locatario.id,
          data_inicio:  HA_DOIS_MESES,
          data_fim:     EM_UM_ANO,
          status:       'ativo',
          observacoes:  'Contrato de demonstração — banca TCC 2026',
        })
        .select('id')
        .single()
      if (error) throw error
      contrato = data
      return data.id
    })

    // Marcar unidade como alugada
    await step('marcar Sala 101 como alugada', async () => {
      const { error } = await admin
        .from('unidades')
        .update({ status: 'alugada' })
        .eq('id', unidade101Id)
      if (error) throw error
    })

    // Inserir parcelas cobrindo os 4 status: paga, vencida, pendente, futura
    await step('inserir 4 parcelas (paga/vencida/pendente/futura)', async () => {
      const { error } = await admin.from('parcelas').insert([
        {
          // Parcela 1 — paga (vencimento passado + data_pagamento preenchida)
          contrato_id:     contrato.id,
          numero:          1,
          data_fechamento: HA_DOIS_MESES,
          data_vencimento: addDias(-53),  // HA_DOIS_MESES + 7d
          data_pagamento:  addDias(-50),  // pago 3 dias antes do vencimento
          status:          'paga',
        },
        {
          // Parcela 2 — vencida (vencimento passado, sem pagamento)
          contrato_id:     contrato.id,
          numero:          2,
          data_fechamento: HA_UM_MES,
          data_vencimento: addDias(-23),  // HA_UM_MES + 7d
          data_pagamento:  null,
          status:          'vencida',
        },
        {
          // Parcela 3 — pendente (fechamento <= hoje, vencimento >= hoje, sem pagamento)
          contrato_id:     contrato.id,
          numero:          3,
          data_fechamento: ONTEM,
          data_vencimento: EM_SETE_DIAS,
          data_pagamento:  null,
          status:          'pendente',
        },
        {
          // Parcela 4 — futura (fechamento > hoje)
          contrato_id:     contrato.id,
          numero:          4,
          data_fechamento: EM_TRINTA_DIAS,
          data_vencimento: addDias(37),  // EM_TRINTA_DIAS + 7d
          data_pagamento:  null,
          status:          'futura',
        },
      ])
      if (error) throw error
      return 4
    })
  }

  // ──────────────────────────────────────────────
  // 6. Resumo final
  // ──────────────────────────────────────────────
  console.log('\n=== estado final ===\n')

  const [
    { count: pagasCount },
    { count: vencidasCount },
    { count: pendentesCount },
    { count: futurasCount },
    contratos,
  ] = await Promise.all([
    admin.from('parcelas').select('*', { count: 'exact', head: true }).eq('status', 'paga'),
    admin.from('parcelas').select('*', { count: 'exact', head: true }).eq('status', 'vencida'),
    admin.from('parcelas').select('*', { count: 'exact', head: true }).eq('status', 'pendente'),
    admin.from('parcelas').select('*', { count: 'exact', head: true }).eq('status', 'futura'),
    admin.from('contratos').select('id, status, data_fim').eq('status', 'ativo'),
  ])

  console.log(`parcelas pagas     : ${pagasCount}`)
  console.log(`parcelas vencidas  : ${vencidasCount}`)
  console.log(`parcelas pendentes : ${pendentesCount}`)
  console.log(`parcelas futuras   : ${futurasCount}`)
  console.log(`contratos ativos   : ${contratos.data?.length}`)
  contratos.data?.forEach(c => {
    const diff = Math.ceil((new Date(c.data_fim) - new Date()) / (1000 * 60 * 60 * 24))
    console.log(`  ${c.id} — data_fim ${c.data_fim} (em ${diff} dias)`)
  })

  console.log('\n=== seed-prod-demo concluído ===\n')
}

main().catch(e => { console.error('\nFATAL:', e); process.exit(1) })
