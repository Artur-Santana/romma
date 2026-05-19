import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'

config({ path: '.env.test' })

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
  await upsertUser('locatario@test.romma.local', 'Test1234!')
}

// executa quando chamado diretamente: node e2e/seed.mjs
seed().then(() => console.log('seed ok')).catch(e => { console.error(e); process.exit(1) })
