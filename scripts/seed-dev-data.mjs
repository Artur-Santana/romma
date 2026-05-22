/**
 * Popula dados de desenvolvimento no Supabase de produção.
 * - Atualiza parcelas futura→pendente onde data_fechamento <= hoje
 * - Cria contrato de teste com data_fim em 4 dias (ativa DASH-03 banner)
 * - Cria parcelas pendentes para o contrato de teste
 *
 * Uso: node scripts/seed-dev-data.mjs
 */

import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'
import { resolve } from 'path'

config({ path: resolve(process.cwd(), '.env.local') })

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const ROLE_KEY    = process.env.SUPABASE_ROLE_KEY

if (!SUPABASE_URL || !ROLE_KEY) {
  console.error('NEXT_PUBLIC_SUPABASE_URL ou SUPABASE_ROLE_KEY ausentes em .env.local')
  process.exit(1)
}

const admin = createClient(SUPABASE_URL, ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
})

const HOJE = new Date().toISOString().split('T')[0]

// IDs fixos do prod
const LOCATARIO_ID = '079d8869-69a8-4e77-8c59-04a13547b4db' // Carlos Eduardo Mendes
const UNIDADE_ID   = '8d1c4d43-504f-4452-b1df-bda99ef13a12' // Sala 101 — disponível — valor_mensal 3500

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

async function main() {
  console.log('\n=== seed-dev-data ===\n')

  // 1. Parcelas futura → pendente onde fechamento <= hoje
  console.log('1. Atualizar parcelas futura → pendente')
  const { data: futuras } = await admin
    .from('parcelas')
    .select('id, data_fechamento, data_vencimento, status')
    .eq('status', 'futura')
    .lte('data_fechamento', HOJE)

  if (futuras?.length) {
    const ids = futuras.map(p => p.id)
    await step(`  ${ids.length} parcela(s) futura→pendente`, async () => {
      const { error } = await admin
        .from('parcelas')
        .update({ status: 'pendente' })
        .in('id', ids)
      if (error) throw error
      return ids.length
    })
  } else {
    console.log('  nenhuma parcela futura com fechamento ≤ hoje')
  }

  // 2. Parcelas pendente → vencida onde vencimento < hoje
  console.log('2. Atualizar parcelas pendente → vencida')
  const { data: pendentes } = await admin
    .from('parcelas')
    .select('id, data_vencimento, status')
    .eq('status', 'pendente')
    .lt('data_vencimento', HOJE)

  if (pendentes?.length) {
    const ids = pendentes.map(p => p.id)
    await step(`  ${ids.length} parcela(s) pendente→vencida`, async () => {
      const { error } = await admin
        .from('parcelas')
        .update({ status: 'vencida' })
        .in('id', ids)
      if (error) throw error
      return ids.length
    })
  } else {
    console.log('  nenhuma')
  }

  // 3. Verificar se já existe contrato de teste vencendo em breve
  const DATA_FIM_TESTE = '2026-05-26'
  const { data: existente } = await admin
    .from('contratos')
    .select('id')
    .eq('unidade_id', UNIDADE_ID)
    .eq('status', 'ativo')
    .maybeSingle()

  if (existente) {
    console.log(`3. Contrato de teste já existe para Sala 101 (id=${existente.id}) — skip`)
  } else {
    console.log('3. Criar contrato de teste com data_fim em 4 dias (DASH-03)')

    // Garantir unidade disponível
    await step('  marcar Sala 101 como disponivel', async () => {
      const { error } = await admin
        .from('unidades')
        .update({ status: 'disponivel' })
        .eq('id', UNIDADE_ID)
      if (error) throw error
    })

    // Criar contrato
    const { data: contrato, error: errContrato } = await admin
      .from('contratos')
      .insert({
        unidade_id:   UNIDADE_ID,
        locatario_id: LOCATARIO_ID,
        data_inicio:  '2026-02-01',
        data_fim:     DATA_FIM_TESTE,
        status:       'ativo',
        observacoes:  'Contrato de teste — DASH-03 (vencendo em breve)',
      })
      .select('id')
      .single()

    if (errContrato) throw errContrato

    await step(`  contrato criado id=${contrato.id}`, async () => contrato.id)

    // Marcar unidade como alugada
    await step('  marcar Sala 101 como alugada', async () => {
      const { error } = await admin
        .from('unidades')
        .update({ status: 'alugada' })
        .eq('id', UNIDADE_ID)
      if (error) throw error
    })

    // Criar parcelas manualmente (parcela 1 já pendente, parcelas 2-3 futuras)
    const parcelas = [
      {
        contrato_id:      contrato.id,
        numero:           1,
        data_fechamento:  '2026-02-01',
        data_vencimento:  '2026-02-08',
        status:           'paga',
        data_pagamento:   '2026-02-06',
      },
      {
        contrato_id:      contrato.id,
        numero:           2,
        data_fechamento:  '2026-03-01',
        data_vencimento:  '2026-03-08',
        status:           'paga',
        data_pagamento:   '2026-03-05',
      },
      {
        contrato_id:      contrato.id,
        numero:           3,
        data_fechamento:  '2026-04-01',
        data_vencimento:  '2026-04-08',
        status:           'vencida',
      },
      {
        contrato_id:      contrato.id,
        numero:           4,
        data_fechamento:  '2026-05-01',
        data_vencimento:  '2026-05-08',
        status:           'vencida',
      },
    ]

    await step(`  inserir ${parcelas.length} parcelas`, async () => {
      const { error } = await admin.from('parcelas').insert(parcelas)
      if (error) throw error
      return parcelas.length
    })
  }

  // 4. Resumo final
  console.log('\n=== estado final ===\n')
  const [{ count: pendentesCount }, { count: vencidasCount }, contratos] = await Promise.all([
    admin.from('parcelas').select('*', { count: 'exact', head: true }).eq('status', 'pendente'),
    admin.from('parcelas').select('*', { count: 'exact', head: true }).eq('status', 'vencida'),
    admin.from('contratos').select('id, status, data_fim').eq('status', 'ativo'),
  ])

  console.log(`parcelas pendentes : ${pendentesCount}`)
  console.log(`parcelas vencidas  : ${vencidasCount}`)
  console.log(`contratos ativos   : ${contratos.data?.length}`)
  contratos.data?.forEach(c => {
    const diff = Math.ceil((new Date(c.data_fim) - new Date()) / (1000 * 60 * 60 * 24))
    const banner = diff <= 7 ? ' ← DASH-03 banner!' : ''
    console.log(`  ${c.id} — data_fim ${c.data_fim} (${diff} dias)${banner}`)
  })
}

main().catch(e => { console.error('\nFATAL:', e); process.exit(1) })
