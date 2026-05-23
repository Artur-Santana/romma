import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'

config({ path: '.env.test' })

const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

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

  // Limpar unidades e edificios criados pelo seed (identificados pelo nome único de teste)
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
