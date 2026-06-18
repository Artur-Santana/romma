/**
 * update-fotos.mjs — Substitui fotos de todas as unidades por imagens
 * reais de escritórios/edifícios comerciais (Unsplash, IDs fixos).
 *
 * Uso: node scripts/update-fotos.mjs
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

// Fotos Unsplash: escritórios, salas comerciais, edifícios corporativos.
// IDs fixos garantem que a imagem é sempre a mesma.
const OFFICE_PHOTOS = [
  // Sala comercial — interior moderno
  'photo-1497366216548-37526070297c',
  // Open space / escritório aberto
  'photo-1497366811353-6870744d04b2',
  // Sala executiva / vidro
  'photo-1600880292203-757bb62b4baf',
  // Sala de reunião / boardroom
  'photo-1542744173-8e7e53415bb0',
  // Lobby corporativo / recepção
  'photo-1524758631624-e2822e304c36',
  // Coworking / espaço flexível
  'photo-1604328698692-f76ea9498e76',
  // Fachada edifício comercial moderno
  'photo-1486406146926-c627a92ad1ab',
  // Arranha-céu corporativo
  'photo-1486325212027-8081e485255e',
  // Loja / espaço comercial térreo
  'photo-1441986300917-64674bd600d8',
  // Terraço / rooftop corporativo
  'photo-1516912481808-3406841bd33c',
  // Andar corporativo / escritório amplo
  'photo-1564069114553-7215e1ff1890',
  // Studio / espaço compacto moderno
  'photo-1560179707-f14e90ef3623',
]

function unsplashUrl(photoId) {
  return `https://images.unsplash.com/${photoId}?w=800&h=600&fit=crop&q=80`
}

async function uploadFoto(unidadeId, photoId, nome) {
  try {
    const url = unsplashUrl(photoId)
    const res = await fetch(url)
    if (!res.ok) { warn(`fetch falhou (${res.status}) — ${nome}`); return null }
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
  console.log('  ROMMA — UPDATE FOTOS UNIDADES')
  console.log('═══════════════════════════════════════════\n')

  const { data: unidades, error } = await sb
    .from('unidades')
    .select('id, nome')
    .order('created_at', { ascending: true })
  if (error) fail(`fetch unidades: ${error.message}`)
  if (!unidades?.length) { console.log('Nenhuma unidade encontrada.'); return }

  console.log(`  ${unidades.length} unidades encontradas\n`)

  let ok_count = 0
  for (let i = 0; i < unidades.length; i++) {
    const u = unidades[i]
    const photoId = OFFICE_PHOTOS[i % OFFICE_PHOTOS.length]
    const path = await uploadFoto(u.id, photoId, u.nome)
    if (path) {
      const { error: ue } = await sb
        .from('unidades')
        .update({ foto_url: path })
        .eq('id', u.id)
      if (ue) { warn(`db update ${u.nome}: ${ue.message}`) }
      else { ok(`${u.nome} → ${photoId}`); ok_count++ }
    }
  }

  console.log(`\n  ${ok_count}/${unidades.length} fotos atualizadas`)
  console.log('═══════════════════════════════════════════\n')
}

main().catch((err) => { console.error('\nERRO FATAL:', err.message); process.exit(1) })
