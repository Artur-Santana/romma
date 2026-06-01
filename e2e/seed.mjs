import { createClient } from '@supabase/supabase-js'
import { createRequire } from 'module'

const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

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

export async function seed() {
  const proprietario = await upsertUser('proprietario@test.romma.local', 'Test1234!')
  await admin
    .from('proprietarios')
    .upsert({ usuario_id: proprietario.id }, { onConflict: 'usuario_id' })

  // locatário existe em auth.users mas NÃO em proprietarios — intencional
  const locatarioUser = await upsertUser('locatario@test.romma.local', 'Test1234!')

  // Cadeia FK: edificio → unidade → locatario → contrato → parcelas
  // 1. Edifício de teste
  const { data: edificio, error: errEdificio } = await admin
    .from('edificios')
    .insert({ nome: 'Edifício Teste E2E', endereco: 'Rua Teste, 1' })
    .select()
    .single()
  if (errEdificio) throw errEdificio

  // 2. Unidade de teste
  const { data: unidade, error: errUnidade } = await admin
    .from('unidades')
    .insert({
      edificio_id: edificio.id,
      nome: 'Sala 101',
      area_m2: 40,
      valor_mensal: 2500,
      valor_visivel: true,
      status: 'alugada',
    })
    .select()
    .single()
  if (errUnidade) throw errUnidade

  // 2b. Unidade dedicada ao TEST-04 (sempre disponivel — sem contrato)
  const { data: unidadeE2E, error: errUniE2E } = await admin
    .from('unidades')
    .insert({
      edificio_id: edificio.id,
      nome: 'E2E-Sala Disponivel',
      area_m2: 30,
      valor_mensal: 1500,
      valor_visivel: true,
      status: 'disponivel',
    })
    .select()
    .single()
  if (errUniE2E) throw errUniE2E

  // 3. Locatário de teste (tabela locatarios, não auth.users)
  // Limpar locatarios existentes do usuario para garantir idempotência
  // (tabela não tem unique constraint em usuario_id — maybeSingle() falha com > 1 row)
  const { data: locatariosExistentes } = await admin
    .from('locatarios')
    .select('id')
    .eq('usuario_id', locatarioUser.id)
  if (locatariosExistentes?.length) {
    const ids = locatariosExistentes.map(l => l.id)
    const { data: contratosExistentes } = await admin.from('contratos').select('id').in('locatario_id', ids)
    const contratoIdsExistentes = contratosExistentes?.map(c => c.id) ?? []
    if (contratoIdsExistentes.length) {
      await admin.from('parcelas').delete().in('contrato_id', contratoIdsExistentes)
      await admin.from('contratos').delete().in('id', contratoIdsExistentes)
    }
    await admin.from('locatarios').delete().in('id', ids)
  }
  const { data: locatario, error: errLocatario } = await admin
    .from('locatarios')
    .insert({
      usuario_id: locatarioUser.id,
      nome_razao_social: 'Locatário Teste',
      tipo: 'pf',
      documento: '12345678901',
      email: locatarioUser.email,
      telefone: '11999999999',
    })
    .select()
    .single()
  if (errLocatario) throw errLocatario

  // 4. Contrato ativo
  const dataInicio = new Date().toISOString().split('T')[0]
  const dataFim = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  const { data: contrato, error: errContrato } = await admin
    .from('contratos')
    .insert({
      unidade_id: unidade.id,
      locatario_id: locatario.id,
      data_inicio: dataInicio,
      data_fim: dataFim,
      status: 'ativo',
    })
    .select()
    .single()
  if (errContrato) throw errContrato

  // 5. Parcelas (mix paga/pendente/vencida — sem futura)
  const ontem = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  const emSeteDias = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  const { error: errParcelas } = await admin.from('parcelas').insert([
    {
      contrato_id: contrato.id,
      numero: 1,
      data_fechamento: ontem,
      data_vencimento: ontem,
      data_pagamento: ontem,
      status: 'paga',
    },
    {
      contrato_id: contrato.id,
      numero: 2,
      data_fechamento: ontem,
      data_vencimento: ontem,
      data_pagamento: null,
      status: 'vencida',
    },
    {
      contrato_id: contrato.id,
      numero: 3,
      data_fechamento: dataInicio,
      data_vencimento: emSeteDias,
      data_pagamento: null,
      status: 'pendente',
    },
  ])
  if (errParcelas) throw errParcelas

  return { edificioId: edificio.id, unidadeId: unidade.id }
}

// executa quando chamado diretamente: node e2e/seed.mjs
if (import.meta.url === `file://${process.argv[1]}`) {
  const { config } = createRequire(import.meta.url)('dotenv')
  config({ path: '.env.test' })
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
  if (!url.includes('test') && !url.includes('local') && !url.includes('127.0.0.1')) {
    console.error('ABORT: URL de Supabase não parece ser de teste:', url)
    process.exit(1)
  }
  seed().then(() => console.log('seed ok')).catch(e => { console.error(e); process.exit(1) })
}
