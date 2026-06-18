/**
 * Renomeia unidades residenciais/varejo → nomenclatura corporativa
 * e troca as fotos por imagens de escritório adequadas.
 *
 * Uso: node scripts/rename-unidades.mjs
 */

import { createClient } from '@supabase/supabase-js'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import dotenv from 'dotenv'

const __dir = dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: join(__dir, '../.env.local') })

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

const ok   = (msg) => console.log(`  ✓  ${msg}`)
const warn = (msg) => console.log(`  ⚠  ${msg}`)
const fail = (msg) => { console.error(`  ✗  ${msg}`); process.exit(1) }

const UPDATES = [
  {
    nomeAtual: 'Suite 410',
    nome:      'Sala 410',
    descricao: 'Sala executiva — 4º andar, acabamento premium',
    photo:     'photo-1486325212027-8081e485255e',
  },
  {
    nomeAtual: 'Studio 01',
    nome:      'Sala 310',
    descricao: 'Sala compacta — ideal para equipes de 2 a 4 pessoas',
    photo:     'photo-1560179707-f14e90ef3623',
  },
  {
    nomeAtual: 'Loja 02',
    nome:      'Sala Comercial 02',
    descricao: 'Espaço comercial térreo — layout aberto, fachada ampla',
    photo:     'photo-1486406146926-c627a92ad1ab',
  },
]

async function uploadFoto(unidadeId, photoId, nome) {
  try {
    const url = `https://images.unsplash.com/${photoId}?w=800&h=600&fit=crop&q=80`
    const res = await fetch(url)
    if (!res.ok) { warn(`fetch 404 — ${photoId} (${nome})`); return null }
    const buffer = Buffer.from(await res.arrayBuffer())
    const path = `${unidadeId}/foto.jpg`
    const { error } = await sb.storage
      .from('unidades-fotos')
      .upload(path, buffer, { contentType: 'image/jpeg', upsert: true })
    if (error) { warn(`upload ${nome}: ${error.message}`); return null }
    return path
  } catch (e) {
    warn(`upload ${nome}: ${e.message}`)
    return null
  }
}

async function main() {
  console.log('═══════════════════════════════════════════')
  console.log('  ROMMA — RENOMEAR UNIDADES')
  console.log('═══════════════════════════════════════════\n')

  for (const u of UPDATES) {
    const { data, error } = await sb
      .from('unidades')
      .select('id')
      .eq('nome', u.nomeAtual)
      .single()
    if (error || !data) { warn(`não encontrada: "${u.nomeAtual}"`); continue }

    const fotoPath = await uploadFoto(data.id, u.photo, u.nome)

    const patch = { nome: u.nome, descricao: u.descricao }
    if (fotoPath) patch.foto_url = fotoPath

    const { error: ue } = await sb
      .from('unidades')
      .update(patch)
      .eq('id', data.id)

    if (ue) { warn(`update "${u.nome}": ${ue.message}`); continue }
    ok(`"${u.nomeAtual}" → "${u.nome}"${fotoPath ? ' + foto' : ''}`)
  }

  console.log('\n═══════════════════════════════════════════\n')
}

main().catch((err) => { console.error('\nERRO FATAL:', err.message); process.exit(1) })
