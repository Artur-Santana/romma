/**
 * Seed de demonstração — Romma
 *
 * Cria:
 *   - Proprietário (artursantana150@gmail.com / Romma@2026)
 *   - 4 edifícios, 12 unidades (com fotos do picsum.photos)
 *   - 8 locatários (mix PF/PJ)
 *   - 8 contratos: ativos, perto de vencer, encerrados, cancelados
 *   - Parcelas realistas para cada contrato
 *
 * Uso: node scripts/seed-demo.mjs
 */

import { createClient } from '@supabase/supabase-js'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import dotenv from 'dotenv'

const __dir = dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: join(__dir, '../.env.local') })

const PROP_EMAIL    = 'artursantana150@gmail.com'
const PROP_PASSWORD = 'Romma@2026'

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

const ok   = (msg) => console.log(`  ✓  ${msg}`)
const warn = (msg) => console.log(`  ⚠  ${msg}`)
const fail = (msg) => { console.error(`  ✗  ${msg}`); process.exit(1) }

// ─────────────────────────────────────────────
// 1. Proprietário
// ─────────────────────────────────────────────
async function criarProprietario() {
  console.log('\n[1/6] Criando proprietário...')
  const { data, error } = await sb.auth.admin.createUser({
    email: PROP_EMAIL,
    password: PROP_PASSWORD,
    email_confirm: true,
  })
  if (error) fail(`createUser: ${error.message}`)
  const userId = data.user.id
  ok(`auth.users criado: ${userId}`)

  const { error: ep } = await sb.from('proprietarios').insert({ usuario_id: userId })
  if (ep) fail(`proprietarios insert: ${ep.message}`)
  ok('proprietarios inserido')
  return userId
}

// ─────────────────────────────────────────────
// 2. Edifícios
// ─────────────────────────────────────────────
async function criarEdificios(propId) {
  console.log('\n[2/6] Criando edifícios...')
  const specs = [
    { nome: 'Edifício Paulista',    endereco: 'Av. Paulista, 1374 — São Paulo/SP' },
    { nome: 'Torre Faria Lima',     endereco: 'Av. Brigadeiro Faria Lima, 4055 — São Paulo/SP' },
    { nome: 'Centro Empresarial Berrini', endereco: 'Av. Engenheiro Luís Carlos Berrini, 1500 — São Paulo/SP' },
    { nome: 'Park Tower Alphaville', endereco: 'Alameda Araguaia, 2044 — Barueri/SP' },
  ]

  const edificios = []
  for (const s of specs) {
    const { data, error } = await sb.from('edificios')
      .insert({ ...s, proprietario_id: propId })
      .select().single()
    if (error) fail(`edificios ${s.nome}: ${error.message}`)
    ok(s.nome)
    edificios.push(data)
  }
  return edificios
}

// ─────────────────────────────────────────────
// 3. Unidades + fotos
// ─────────────────────────────────────────────
async function criarUnidades(edificios) {
  console.log('\n[3/6] Criando unidades...')

  const [e1, e2, e3, e4] = edificios

  const specs = [
    // Paulista (3)
    { edificio_id: e1.id, nome: 'Sala 101', descricao: 'Sala comercial — 1º andar, frente para Av. Paulista', area_m2: 38,  valor_mensal: 4200,  valor_visivel: true,  status: 'disponivel', photo: 'photo-1497366216548-37526070297c' },
    { edificio_id: e1.id, nome: 'Sala 205', descricao: 'Sala executiva — 2º andar, vista panorâmica',          area_m2: 62,  valor_mensal: 6800,  valor_visivel: true,  status: 'alugada',    photo: 'photo-1497366811353-6870744d04b2' },
    { edificio_id: e1.id, nome: 'Sala 301', descricao: 'Andar corrido — 3º andar, ar-cond central',            area_m2: 85,  valor_mensal: 9500,  valor_visivel: false, status: 'alugada',    photo: 'photo-1600880292203-757bb62b4baf' },
    // Faria Lima (3)
    { edificio_id: e2.id, nome: 'Conjunto A', descricao: 'Conjunto 4 salas + recepção + copa',                area_m2: 120, valor_mensal: 14000, valor_visivel: true,  status: 'alugada',    photo: 'photo-1542744173-8e7e53415bb0'   },
    { edificio_id: e2.id, nome: 'Conjunto B', descricao: 'Open space — layout flexível, piso elevado',        area_m2: 95,  valor_mensal: 11000, valor_visivel: true,  status: 'disponivel', photo: 'photo-1524758631624-e2822e304c36' },
    { edificio_id: e2.id, nome: 'Pavimento Executivo', descricao: 'Pavimento exclusivo — terraço corporativo, acesso restrito, uso executivo', area_m2: 200, valor_mensal: 25000, valor_visivel: false, status: 'alugada',    photo: 'photo-1542621334-a254cf47733d'   },
    // Berrini (3)
    { edificio_id: e3.id, nome: 'Sala 310',  descricao: 'Sala compacta — ideal para equipes de 2 a 4 pessoas',area_m2: 28,  valor_mensal: 3200,  valor_visivel: true,  status: 'disponivel', photo: 'photo-1560179707-f14e90ef3623'   },
    { edificio_id: e3.id, nome: 'Sala 410',  descricao: 'Sala executiva — 4º andar, acabamento premium',      area_m2: 55,  valor_mensal: 7500,  valor_visivel: true,  status: 'alugada',    photo: 'photo-1486325212027-8081e485255e' },
    { edificio_id: e3.id, nome: 'Sala 415',  descricao: 'Sala premium — 4º andar, acabamento executivo, varanda corporativa', area_m2: 70, valor_mensal: 9800, valor_visivel: true, status: 'disponivel', photo: 'photo-1577962917302-cd874c4e31d2' },
    // Alphaville (3)
    { edificio_id: e4.id, nome: 'Sala Comercial 01', descricao: 'Espaço comercial térreo — acesso direto pela rua, vitrine envidraçada', area_m2: 80, valor_mensal: 8000, valor_visivel: true, status: 'alugada',    photo: 'photo-1497215728101-856f4ea42174' },
    { edificio_id: e4.id, nome: 'Sala Comercial 02', descricao: 'Espaço comercial térreo — layout aberto, fachada ampla',              area_m2: 95, valor_mensal: 9200, valor_visivel: true, status: 'disponivel', photo: 'photo-1486406146926-c627a92ad1ab' },
    { edificio_id: e4.id, nome: 'Andar 3',   descricao: 'Andar corporativo — 800m², divisão livre',           area_m2: 320, valor_mensal: 35000, valor_visivel: false, status: 'alugada',    photo: 'photo-1486325212027-8081e485255e' },
  ]

  const unidades = []
  for (const s of specs) {
    const { photo, ...row } = s
    const { data: unidade, error } = await sb.from('unidades').insert(row).select().single()
    if (error) fail(`unidades ${s.nome}: ${error.message}`)

    // Upload foto
    const fotoPath = await uploadFoto(unidade.id, photo)
    if (fotoPath) {
      await sb.from('unidades').update({ foto_url: fotoPath }).eq('id', unidade.id)
      ok(`${s.nome} + foto`)
    } else {
      warn(`${s.nome} (sem foto)`)
    }
    unidades.push({ ...unidade, foto_url: fotoPath })
  }
  return unidades
}

async function uploadFoto(unidadeId, photoId) {
  try {
    const url = `https://images.unsplash.com/${photoId}?w=800&h=600&fit=crop&q=80`
    const res = await fetch(url)
    if (!res.ok) return null
    const buffer = Buffer.from(await res.arrayBuffer())
    const path = `${unidadeId}/foto.jpg`

    const { error } = await sb.storage
      .from('unidades-fotos')
      .upload(path, buffer, { contentType: 'image/jpeg', upsert: true })
    if (error) { warn(`upload ${photoId}: ${error.message}`); return null }
    return path
  } catch (e) {
    warn(`upload ${photoId}: ${e.message}`)
    return null
  }
}

// ─────────────────────────────────────────────
// 4. Locatários
// ─────────────────────────────────────────────
async function criarLocatarios(propId) {
  console.log('\n[4/6] Criando locatários...')

  const specs = [
    { email: 'contasimples@romma-demo.com',    nome: 'Contasimples Soluções Ltda',  tipo: 'pj', doc: '12345678000199', tel: '11991110001' },
    { email: 'techflow@romma-demo.com',         nome: 'TechFlow Sistemas S.A.',      tipo: 'pj', doc: '98765432000155', tel: '11992220002' },
    { email: 'nexus@romma-demo.com',            nome: 'Nexus Consultoria Ltda',      tipo: 'pj', doc: '11223344000188', tel: '11993330003' },
    { email: 'vertice@romma-demo.com',          nome: 'Vértice Arquitetura Ltda',    tipo: 'pj', doc: '55667788000177', tel: '11994440004' },
    { email: 'mariana.costa@romma-demo.com',    nome: 'Mariana Costa',               tipo: 'pf', doc: '12345678901',    tel: '11995550005' },
    { email: 'rafael.lima@romma-demo.com',      nome: 'Rafael Lima',                 tipo: 'pf', doc: '98765432100',    tel: '11996660006' },
    { email: 'beatriz.ferreira@romma-demo.com', nome: 'Beatriz Ferreira',            tipo: 'pf', doc: '45678912300',    tel: '11997770007' },
    { email: 'lucas.mendes@romma-demo.com',     nome: 'Lucas Mendes',                tipo: 'pf', doc: '78901234500',    tel: '11998880008' },
  ]

  const locatarios = []
  for (const s of specs) {
    const { data: inv, error: ei } = await sb.auth.admin.createUser({
      email: s.email,
      email_confirm: true,
    })
    if (ei) fail(`createUser ${s.email}: ${ei.message}`)

    const { data: loc, error: el } = await sb.from('locatarios').insert({
      usuario_id:        inv.user.id,
      proprietario_id:   propId,
      nome_razao_social: s.nome,
      tipo:              s.tipo,
      documento:         s.doc,
      email:             s.email,
      telefone:          s.tel,
      status_convite:    'aceito',
    }).select().single()
    if (el) fail(`locatario ${s.email}: ${el.message}`)
    ok(`${s.nome} (${s.tipo.toUpperCase()})`)
    locatarios.push(loc)
  }
  return locatarios
}

// ─────────────────────────────────────────────
// 5. Contratos + Parcelas
// ─────────────────────────────────────────────
function calcStatus(fechamento, vencimento, hoje, paga) {
  if (paga)             return 'paga'
  if (fechamento > hoje) return 'futura'
  if (vencimento < hoje) return 'vencida'
  return 'pendente'
}

function gerarParcelas(contratoId, inicio, fim) {
  const parcelas = []
  const hoje     = new Date('2026-06-18')
  const dataFim  = new Date(fim)

  // Parcela 1: regra especial
  let p1Fech = new Date(inicio)
  let p1Venc = new Date(inicio)
  p1Venc.setDate(p1Venc.getDate() + 7)
  if (p1Venc.getMonth() !== p1Fech.getMonth()) {
    p1Fech = new Date(p1Fech.getFullYear(), p1Fech.getMonth() + 1, 1)
    p1Venc = new Date(p1Fech)
    p1Venc.setDate(p1Venc.getDate() + 7)
  }

  const p1Paga = p1Venc < hoje
  parcelas.push({
    contrato_id: contratoId, numero: 1,
    data_fechamento: p1Fech.toISOString().slice(0, 10),
    data_vencimento: p1Venc.toISOString().slice(0, 10),
    data_pagamento:  p1Paga ? new Date(p1Venc.getTime() - 86400000).toISOString().slice(0, 10) : null,
    status: calcStatus(p1Fech, p1Venc, hoje, p1Paga),
  })

  let current = new Date(p1Fech.getFullYear(), p1Fech.getMonth() + 1, 1)
  let num = 2

  while (current <= dataFim) {
    const fech = new Date(current)
    const venc = new Date(current)
    venc.setDate(venc.getDate() + 7)
    const paga = venc < hoje
    parcelas.push({
      contrato_id: contratoId, numero: num++,
      data_fechamento: fech.toISOString().slice(0, 10),
      data_vencimento: venc.toISOString().slice(0, 10),
      data_pagamento:  paga ? new Date(venc.getTime() - 86400000).toISOString().slice(0, 10) : null,
      status: calcStatus(fech, venc, hoje, paga),
    })
    current.setMonth(current.getMonth() + 1)
  }
  return parcelas
}

async function criarContratos(unidades, locatarios) {
  console.log('\n[5/6] Criando contratos e parcelas...')

  const u = {}
  for (const un of unidades) u[un.nome] = un

  const specs = [
    // 2 ativos (meio do prazo)
    { label: 'Ativo — meio do prazo',        unidade: 'Sala 205',   loc: locatarios[0], inicio: '2026-01-01', fim: '2026-12-31', status: 'ativo',     obs: 'Contrato anual vigente. Renovação prevista para Jan/2027.' },
    { label: 'Ativo — início recente',        unidade: 'Conjunto A', loc: locatarios[1], inicio: '2026-05-01', fim: '2027-04-30', status: 'ativo',     obs: 'Contrato anual iniciado em Maio/2026.' },
    // 2 ativos perto de vencer
    { label: 'Ativo — vence em 12 dias',     unidade: 'Sala 301',   loc: locatarios[2], inicio: '2025-07-01', fim: '2026-06-30', status: 'ativo',     obs: 'Contrato vence em 30/06/2026. Em negociação de renovação.' },
    { label: 'Ativo — vence em 25 dias',     unidade: 'Sala 410',          loc: locatarios[3], inicio: '2025-07-13', fim: '2026-07-12', status: 'ativo',     obs: 'Contrato vence em 12/07/2026.' },
    // 2 encerrados
    { label: 'Encerrado — mai/2026',         unidade: 'Sala Comercial 01', loc: locatarios[4], inicio: '2025-01-01', fim: '2026-05-31', status: 'encerrado', obs: 'Contrato encerrado normalmente em 31/05/2026.' },
    { label: 'Encerrado — dez/2025',         unidade: 'Sala 310',          loc: locatarios[5], inicio: '2025-01-01', fim: '2025-12-31', status: 'encerrado', obs: 'Contrato encerrado normalmente em 31/12/2025.' },
    // 2 cancelados
    { label: 'Cancelado — mai/2026',         unidade: 'Pavimento Executivo', loc: locatarios[6], inicio: '2026-03-01', fim: '2026-12-31', status: 'cancelado', obs: 'Cancelado em 15/05/2026 por inadimplência.' },
    { label: 'Cancelado — fev/2026',         unidade: 'Andar 3',    loc: locatarios[7], inicio: '2026-01-01', fim: '2026-12-31', status: 'cancelado', obs: 'Cancelado em 10/02/2026 — rescisão amigável.' },
  ]

  for (const s of specs) {
    const unidade = u[s.unidade]
    if (!unidade) fail(`unidade não encontrada: ${s.unidade}`)

    const { data: contrato, error: ec } = await sb.from('contratos').insert({
      unidade_id:   unidade.id,
      locatario_id: s.loc.id,
      data_inicio:  s.inicio,
      data_fim:     s.fim,
      status:       s.status,
      observacoes:  s.obs,
    }).select().single()
    if (ec) fail(`contrato ${s.label}: ${ec.message}`)

    const parcelas = gerarParcelas(contrato.id, s.inicio, s.fim)
    const { error: ep } = await sb.from('parcelas').insert(parcelas)
    if (ep) fail(`parcelas ${s.label}: ${ep.message}`)

    ok(`${s.label} — ${parcelas.length} parcelas`)
  }
}

// ─────────────────────────────────────────────
async function main() {
  console.log('═══════════════════════════════════════════')
  console.log('  ROMMA — SEED DE DEMONSTRAÇÃO (dobro)')
  console.log('  Data base: 2026-06-18 (dia da banca)')
  console.log('═══════════════════════════════════════════')

  const propId    = await criarProprietario()
  const edificios = await criarEdificios(propId)
  const unidades  = await criarUnidades(edificios)
  const locatarios = await criarLocatarios(propId)
  await criarContratos(unidades, locatarios)

  console.log('\n[6/6] Resumo...')
  console.log(`
  Proprietário : ${PROP_EMAIL}
  Senha        : ${PROP_PASSWORD}
  URL          : https://romma-alpha.vercel.app/dashboard

  Edifícios    : 4
  Unidades     : 12 (com fotos)
  Locatários   : 8 (4 PJ + 4 PF)
  Contratos    : 8
    • Ativo (meio prazo)      — Sala 205 / Contasimples    (jan–dez 2026)
    • Ativo (início recente)  — Conjunto A / TechFlow      (mai/26–abr/27)
    • Ativo perto de vencer   — Sala 301 / Nexus           (vence 30/jun — 12 dias)
    • Ativo perto de vencer   — Sala 410 / Vértice         (vence 12/jul — 25 dias)
    • Encerrado               — Sala Comercial 01 / Mariana Costa  (encerrado mai/2026)
    • Encerrado               — Sala 310 / Rafael Lima     (encerrado dez/2025)
    • Cancelado               — Pavimento Executivo / Beatriz Ferreira
    • Cancelado               — Andar 3 / Lucas Mendes
  `)
  console.log('═══════════════════════════════════════════\n')
}

main().catch((err) => { console.error('\nERRO FATAL:', err.message); process.exit(1) })
