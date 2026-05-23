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

  const { data: locatario } = await admin
    .from('locatarios')
    .select('id')
    .eq('usuario_id', locatarioUser.id)
    .maybeSingle()
  if (!locatario) return

  const { data: contratos } = await admin
    .from('contratos')
    .select('id')
    .eq('locatario_id', locatario.id)
  const contratoIds = contratos?.map(c => c.id) ?? []

  // Ordem obrigatória: parcelas → contratos → locatarios → unidades → edificios
  if (contratoIds.length) {
    await admin.from('parcelas').delete().in('contrato_id', contratoIds)
    await admin.from('contratos').delete().in('id', contratoIds)
  }
  await admin.from('locatarios').delete().eq('id', locatario.id)

  // Limpar unidades e edificios criados pelo seed (identificados pelo nome único de teste)
  const { data: unidades } = await admin
    .from('unidades')
    .select('id, edificio_id')
    .eq('nome', 'Sala 101')
  if (unidades?.length) {
    const edificioId = unidades[0].edificio_id
    await admin.from('unidades').delete().in('id', unidades.map(u => u.id))
    await admin.from('edificios').delete().eq('id', edificioId)
  }
}
