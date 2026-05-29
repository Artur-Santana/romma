import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'
import { existsSync, readFileSync, unlinkSync } from 'fs'
import { resolve } from 'path'

config({ path: '.env.test' })

const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

const STATE_FILE = resolve('.e2e-state.json')

export default async function globalTeardown() {
  // Buscar o usuario_id do locatário de teste
  const { data: list } = await admin.auth.admin.listUsers()
  const locatarioUser = list.users.find(u => u.email === 'locatario@test.romma.local')
  if (!locatarioUser) return

  // Usar select() (não maybeSingle) para funcionar mesmo com duplicatas
  const { data: locatarios } = await admin
    .from('locatarios')
    .select('id')
    .eq('usuario_id', locatarioUser.id)
  if (!locatarios?.length) return

  const locatarioIds = locatarios.map(l => l.id)

  const { data: contratos } = await admin
    .from('contratos')
    .select('id')
    .in('locatario_id', locatarioIds)
  const contratoIds = contratos?.map(c => c.id) ?? []

  // Ordem obrigatória: parcelas → contratos → locatarios → unidades → edificios
  if (contratoIds.length) {
    await admin.from('parcelas').delete().in('contrato_id', contratoIds)
    await admin.from('contratos').delete().in('id', contratoIds)
  }
  await admin.from('locatarios').delete().in('id', locatarioIds)

  // Limpar unidade e edificio pelo ID persistido pelo global-setup (robusto).
  // Fallback por nome apenas se o arquivo de estado não existir (ex: seed executado manualmente).
  let unidadeId = null
  let edificioId = null

  if (existsSync(STATE_FILE)) {
    try {
      const state = JSON.parse(readFileSync(STATE_FILE, 'utf-8'))
      unidadeId = state.unidadeId ?? null
      edificioId = state.edificioId ?? null
    } finally {
      unlinkSync(STATE_FILE)
    }
  }

  if (unidadeId && edificioId) {
    await admin.from('unidades').delete().eq('id', unidadeId)
    await admin.from('edificios').delete().eq('id', edificioId)
  } else {
    const { data: unidades } = await admin
      .from('unidades')
      .select('id, edificio_id')
      .eq('nome', 'Sala 101')
    if (unidades?.length) {
      const edificioIds = [...new Set(unidades.map(u => u.edificio_id))]
      await admin.from('unidades').delete().in('id', unidades.map(u => u.id))
      await admin.from('edificios').delete().in('id', edificioIds)
    }
  }

  // Bloco A: Limpar edificios com prefixo E2E- e toda a cascata FK (D-01)
  const { data: edificiosE2E } = await admin
    .from('edificios')
    .select('id')
    .like('nome', 'E2E-%')
  const edificioIdsE2E = edificiosE2E?.map(e => e.id) ?? []

  if (edificioIdsE2E.length) {
    const { data: unidadesE2E } = await admin.from('unidades').select('id').in('edificio_id', edificioIdsE2E)
    const unidadeIdsE2E = unidadesE2E?.map(u => u.id) ?? []
    if (unidadeIdsE2E.length) {
      const { data: contratosE2E } = await admin.from('contratos').select('id').in('unidade_id', unidadeIdsE2E)
      const contratoIdsE2E = contratosE2E?.map(c => c.id) ?? []
      if (contratoIdsE2E.length) {
        await admin.from('parcelas').delete().in('contrato_id', contratoIdsE2E)
        await admin.from('contratos').delete().in('id', contratoIdsE2E)
      }
      await admin.from('unidades').delete().in('id', unidadeIdsE2E)
    }
    await admin.from('edificios').delete().in('id', edificioIdsE2E)
  }

  // Bloco B: Limpar locatarios com prefixo E2E- em nome_razao_social (D-01)
  const { data: locatariosE2E } = await admin
    .from('locatarios')
    .select('id')
    .like('nome_razao_social', 'E2E-%')
  if (locatariosE2E?.length) {
    const locIdE2E = locatariosE2E.map(l => l.id)
    const { data: contE2E } = await admin.from('contratos').select('id').in('locatario_id', locIdE2E)
    if (contE2E?.length) {
      await admin.from('parcelas').delete().in('contrato_id', contE2E.map(c => c.id))
      await admin.from('contratos').delete().in('id', contE2E.map(c => c.id))
    }
    await admin.from('locatarios').delete().in('id', locIdE2E)
  }

  // Bloco C: Limpar usuários auth com email "e2e-*" (D-04)
  const { data: authList } = await admin.auth.admin.listUsers()
  const e2eUsers = authList?.users.filter(u => u.email?.startsWith('e2e-')) ?? []
  for (const u of e2eUsers) {
    await admin.auth.admin.deleteUser(u.id)
  }
}
