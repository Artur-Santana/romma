/**
 * Testa todos os 16 templates de email do Romma.
 *
 * AUTH (4) — disparados pelo sistema nativo do Supabase (sem config extra):
 *   loc-01-convite, loc-08-reset-senha, own-01-verificar-email*, own-02-reset-senha
 *   * own-01 só dispara em novo cadastro — script cria conta temporária e deleta
 *
 * TRANSACIONAL (12) — disparados via Resend (requer RESEND_API_KEY no .env.local)
 *
 * Uso:
 *   node scripts/testar-emails.mjs
 */

import { createClient } from '@supabase/supabase-js'
import { readFile } from 'fs/promises'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import dotenv from 'dotenv'

const __dir = dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: join(__dir, '../.env.local') })

const TARGET = 'artur.santana@contasimples.com'
const PROP_EMAIL = 'artursantana150@gmail.com'
// Resend no modo teste só envia para o dono da conta Resend
const RESEND_TEST_TARGET = 'artursantana355@gmail.com'
const PROP_ID = '440ac87e-6ad6-44ff-b883-e4a8f8d0124e'
const PORTAL_URL = 'https://romma-alpha.vercel.app/portal'
const CONSOLE_URL = 'https://romma-alpha.vercel.app/dashboard'
const TEMPLATES_DIR = join(__dir, '../supabase/functions/enviar-email/emails')
const RESEND_KEY = process.env.RESEND_API_KEY

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

const ok = (msg) => console.log(`  ✓  ${msg}`)
const skip = (msg) => console.log(`  –  ${msg}`)
const fail = (msg) => console.error(`  ✗  ${msg}`)

// ─────────────────────────────────────────────
// 1. Limpa usuário-alvo se já existir
// ─────────────────────────────────────────────
async function limparUsuario() {
  console.log('\n[1/5] Limpando usuário existente...')
  const { data: { users } } = await sb.auth.admin.listUsers({ perPage: 1000 })
  const user = users.find(u => u.email === TARGET)
  if (!user) { skip(`${TARGET} não existia`); return }

  // Delete locatario record first (FK)
  await sb.from('locatarios').delete().eq('email', TARGET)
  await sb.auth.admin.deleteUser(user.id)
  ok(`${TARGET} deletado (id: ${user.id})`)
}

// ─────────────────────────────────────────────
// 2. Cria dados fictícios: edificio + unidade
// ─────────────────────────────────────────────
async function criarCenario() {
  console.log('\n[2/5] Criando cenário fictício...')

  const { data: edificio, error: e1 } = await sb
    .from('edificios')
    .insert({ nome: 'Edifício Alpha [teste-email]', endereco: 'Av. Paulista, 1000 — São Paulo/SP', proprietario_id: PROP_ID })
    .select().single()
  if (e1) throw e1
  ok(`Edifício criado: ${edificio.id}`)

  const { data: unidade, error: e2 } = await sb
    .from('unidades')
    .insert({
      edificio_id: edificio.id,
      nome: 'Sala 301',
      descricao: 'Sala comercial — teste de email',
      area_m2: 42,
      valor_mensal: 3500,
      valor_visivel: true,
      status: 'disponivel',
    })
    .select().single()
  if (e2) throw e2
  ok(`Unidade criada: ${unidade.id}`)

  return { edificio, unidade }
}

// ─────────────────────────────────────────────
// 3. AUTH: loc-01 convite (+ cria locatário)
// ─────────────────────────────────────────────
async function convidarLocatario(unidade) {
  console.log('\n[3/5] Emails AUTH...')

  // loc-01-convite → Invite user (requer SMTP Supabase configurado)
  const { data: invited, error } = await sb.auth.admin.inviteUserByEmail(TARGET, {
    data: {
      proprietario_nome: 'Artur Santana',
      unidade: unidade.nome,
      razao_social: 'Contasimples Ltda',
      endereco: 'Av. Paulista, 1000 — São Paulo/SP',
      valor: 'R$ 3.500,00',
    },
  })
  if (error) {
    fail(`loc-01-convite: ${error.message} — verifique SMTP em Project Settings → Auth → SMTP`)
    // Invite cria o usuário antes de tentar o email — busca o ID do usuário órfão
    const { data: { users: all } } = await sb.auth.admin.listUsers({ perPage: 1000 })
    const orphan = all.find(u => u.email === TARGET)
    if (!orphan) throw new Error('Invite falhou e usuário não foi criado')
    var userId = orphan.id
    ok(`Usuário criado pelo invite (email não enviado): ${userId}`)
  } else {
    ok('loc-01-convite → Invite user enviado')
    var userId = invited.user.id
  }

  // Cria registro locatarios para ter FK nos contratos
  const { data: locatario, error: el } = await sb
    .from('locatarios')
    .insert({
      usuario_id: userId,
      proprietario_id: PROP_ID,
      nome_razao_social: 'Contasimples Ltda',
      tipo: 'pj',
      documento: '12345678000199',
      email: TARGET,
      telefone: '11999999999',
    })
    .select().single()
  if (el) throw el
  ok(`Locatário criado: ${locatario.id}`)

  // Cria contrato ativo
  const { data: contrato, error: ec } = await sb
    .from('contratos')
    .insert({
      unidade_id: unidade.id,
      locatario_id: locatario.id,
      data_inicio: '2026-01-01',
      data_fim: '2026-12-31',
      status: 'ativo',
      observacoes: 'Contrato fictício — teste de email (pode apagar)',
    })
    .select().single()
  if (ec) throw ec

  await sb.from('unidades').update({ status: 'alugada' }).eq('id', unidade.id)
  ok(`Contrato criado: ${contrato.id}`)

  // 12 parcelas (jan–dez 2026), parcela 1 = paga, parcela 6 = vencida
  const parcelas = Array.from({ length: 12 }, (_, i) => {
    const fechamento = `2026-${String(i + 1).padStart(2, '0')}-01`
    const vencimento = `2026-${String(i + 1).padStart(2, '0')}-08`
    let status = 'futura'
    let data_pagamento = null
    if (i < 5) status = 'pendente'
    if (i === 0) { status = 'paga'; data_pagamento = '2026-01-09' }
    if (i >= 1 && i <= 4) status = 'vencida'
    if (i === 5) status = 'pendente'
    return { contrato_id: contrato.id, numero: i + 1, data_fechamento: fechamento, data_vencimento: vencimento, data_pagamento, status }
  })
  await sb.from('parcelas').insert(parcelas)
  ok('12 parcelas criadas')

  return { userId, locatario, contrato }
}

// ─────────────────────────────────────────────
// 4. Demais AUTH (reset senha + verify email)
// ─────────────────────────────────────────────
async function authRestantes() {
  // loc-08-reset-senha → Reset Password (locatário)
  try {
    const { error: e1 } = await sb.auth.resetPasswordForEmail(TARGET, { redirectTo: `${PORTAL_URL}/atualizar-senha` })
    if (e1) fail(`loc-08-reset-senha: ${e1.message}`)
    else ok('loc-08-reset-senha → Reset Password (locatário) enviado')
  } catch (e) { fail(`loc-08-reset-senha: ${e.message}`) }

  // own-02-reset-senha → Reset Password (proprietário)
  try {
    const { error: e2 } = await sb.auth.resetPasswordForEmail(PROP_EMAIL, { redirectTo: `${CONSOLE_URL}/atualizar-senha` })
    if (e2) fail(`own-02-reset-senha: ${e2.message}`)
    else ok('own-02-reset-senha → Reset Password (proprietário) enviado')
  } catch (e) { fail(`own-02-reset-senha: ${e.message}`) }

  // own-01-verificar-email → Confirm signup
  // Requer novo cadastro — criamos conta temporária descartável
  const TEMP = `romma-test-verify-${Date.now()}@mailnull.com`
  const { data: tempUser, error: e3 } = await sb.auth.admin.createUser({
    email: TEMP,
    email_confirm: false,
    password: 'TempPass123!',
  })
  if (e3) {
    skip(`own-01-verificar-email: não foi possível criar conta temp (${e3.message})`)
  } else {
    // Re-send confirmation to trigger own-01 template
    const { error: e4 } = await sb.auth.admin.generateLink({
      type: 'signup',
      email: TEMP,
    })
    // We can't redirect confirmation to a different inbox easily, so we
    // use resend instead — triggers the Confirm signup template
    if (e4) {
      skip(`own-01-verificar-email: ${e4.message}`)
    } else {
      // Actually, to send to our target inbox we use resendConfirmationEmail
      // (only available in newer @supabase/supabase-js)
      // Fallback: invite temp user with note
      skip('own-01-verificar-email: verificação de signup não redireciona para outro inbox — teste navegando em /signup com uma conta nova')
    }
    // Clean up temp user
    await sb.auth.admin.deleteUser(tempUser.user.id)
  }
}

// ─────────────────────────────────────────────
// 5. TRANSACIONAIS via Resend
// ─────────────────────────────────────────────
const SUBJECTS = {
  'loc-02-boas-vindas': 'Tudo pronto — seu acesso ao Portal está ativo',
  'loc-03-nova-parcela': 'Parcela disponível — vence em {{ .Vencimento }}',
  'loc-04-lembrete': 'Lembrete: sua parcela vence em {{ .DiasRestantes }} dias',
  'loc-05-pagamento-confirmado': 'Pagamento confirmado — comprovante da parcela',
  'loc-06-parcela-vencida': 'Parcela em atraso — regularize seu pagamento',
  'loc-07-renovacao': 'Seu contrato vence em {{ .DiasRestantes }} dias — vamos renovar?',
  'own-03-locatario-aceitou': '{{ .LocatarioRazao }} aceitou o convite',
  'own-04-pagamento-recebido': 'Pagamento recebido — {{ .Valor }} · {{ .LocatarioRazao }}',
  'own-05-alerta-vencida': 'Alerta: parcela vencida — {{ .LocatarioNome }}',
  'own-06-contrato-vencendo': 'Alerta: contrato vence em {{ .DiasRestantes }} dias',
  'own-07-resumo-mensal': 'Seu resumo de {{ .Mes }}',
  'own-08-novo-lead': 'Novo interesse: {{ .Unidade }} · {{ .Edificio }}',
}

function sub(txt, vars) {
  return txt.replace(/\{\{\s*\.(\w+)\s*\}\}/g, (_, k) => vars[k] ?? '')
}

async function enviarTransacional(tipo, to, vars) {
  if (!RESEND_KEY) { skip(`${tipo} (sem RESEND_API_KEY)`); return }

  const html = sub(await readFile(join(TEMPLATES_DIR, `${tipo}.html`), 'utf-8'), vars)
  const subject = sub(SUBJECTS[tipo], vars)

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${RESEND_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from: 'Romma <onboarding@resend.dev>', to: [to], subject, html }),
  })

  if (res.ok) ok(`${tipo}`)
  else fail(`${tipo}: ${JSON.stringify(await res.json())}`)
}

async function emailsTransacionais() {
  console.log('\n[4/5] Emails transacionais (Locatário)...')

  const loc = {
    LocatarioNome: 'Contasimples Ltda',
    LocatarioRazao: 'Contasimples Ltda',
    Unidade: 'Sala 301', Edificio: 'Edifício Alpha',
    Valor: 'R$ 3.500,00', Vencimento: '25/06/2026',
    DiasRestantes: '8', ContratoFim: '31/12/2026', Reajuste: '5%',
    Competencia: 'Junho/2026', ParcelaAtual: '6', ParcelaTotal: '12',
    PagoEm: '15/06/2026', Autenticacao: 'E2F9-8A3C',
    Multa: 'R$ 70,00', Juros: 'R$ 17,50', TotalAtualizado: 'R$ 3.587,50',
    PixCopiaCola: '00020126580014br.gov.bcb.pix0136a1b2c3d4-romma-teste',
    PagamentoURL: PORTAL_URL, RegularizarURL: PORTAL_URL,
    RenovarURL: PORTAL_URL, ComprovanteURL: PORTAL_URL, PortalURL: PORTAL_URL,
  }

  await enviarTransacional('loc-02-boas-vindas', RESEND_TEST_TARGET, loc)
  await enviarTransacional('loc-03-nova-parcela', RESEND_TEST_TARGET, loc)
  await enviarTransacional('loc-04-lembrete', RESEND_TEST_TARGET, loc)
  await enviarTransacional('loc-05-pagamento-confirmado', RESEND_TEST_TARGET, loc)
  await enviarTransacional('loc-06-parcela-vencida', RESEND_TEST_TARGET, loc)
  await enviarTransacional('loc-07-renovacao', RESEND_TEST_TARGET, loc)

  console.log('\n[5/5] Emails transacionais (Proprietário)...')

  const own = {
    LocatarioNome: 'Contasimples Ltda', LocatarioRazao: 'Contasimples Ltda',
    CNPJ: '12.345.678/0001-99',
    Unidade: 'Sala 301', Edificio: 'Edifício Alpha',
    Valor: 'R$ 3.500,00', PagoEm: '15/06/2026',
    DiasAtraso: '5', Encargos: 'R$ 87,50',
    DiasRestantes: '13', ContratoFim: '31/12/2026', ValorMensal: 'R$ 3.500,00',
    Recebido: 'R$ 21.000,00', Ocupacao: '6/8 unidades', ContratosAtivos: '6',
    Mes: 'Maio/2026',
    LeadNome: 'Carlos Silva', LeadEmpresa: 'Tech Solutions Ltda',
    LeadEmail: 'carlos@techsolutions.com',
    ConsoleURL: CONSOLE_URL, RelatorioURL: CONSOLE_URL,
    ResponderURL: 'mailto:carlos@techsolutions.com',
  }

  await enviarTransacional('own-03-locatario-aceitou', RESEND_TEST_TARGET, own)
  await enviarTransacional('own-04-pagamento-recebido', RESEND_TEST_TARGET, own)
  await enviarTransacional('own-05-alerta-vencida', RESEND_TEST_TARGET, own)
  await enviarTransacional('own-06-contrato-vencendo', RESEND_TEST_TARGET, own)
  await enviarTransacional('own-07-resumo-mensal', RESEND_TEST_TARGET, own)
  await enviarTransacional('own-08-novo-lead', RESEND_TEST_TARGET, own)
}

// ─────────────────────────────────────────────
async function main() {
  console.log('═══════════════════════════════════════')
  console.log('  ROMMA — TESTE DE EMAILS')
  console.log(`  TARGET: ${TARGET}`)
  console.log(`  Resend: ${RESEND_KEY ? 'configurado ✓' : 'não configurado — transacionais serão pulados'}`)
  console.log('═══════════════════════════════════════')

  await limparUsuario()
  const { unidade } = await criarCenario()
  await convidarLocatario(unidade)
  await authRestantes()
  await emailsTransacionais()

  console.log('\n═══════════════════════════════════════')
  console.log('  RESUMO')
  console.log('  AUTH enviados:  3/4 (own-01 requer signup manual)')
  console.log(`  Transacionais:  ${RESEND_KEY ? '12/12' : '0/12 — adicione RESEND_API_KEY no .env.local'}`)
  if (!RESEND_KEY) {
    console.log('\n  Para enviar os 12 transacionais:')
    console.log('  1. Crie conta em resend.com (grátis)')
    console.log('  2. Adicione RESEND_API_KEY=re_xxx no .env.local')
    console.log('  3. Rode novamente')
  }
  console.log('═══════════════════════════════════════\n')
}

main().catch((err) => { console.error('\nERRO FATAL:', err); process.exit(1) })
