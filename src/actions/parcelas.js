'use server'

import supabaseAdmin from '@/lib/supabaseAdmin'
import { createServer } from '@/lib/supabase-server'
import { isProprietario } from '@/lib/auth'

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

async function authGuard() {
  const supabase = await createServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { err: { status: 401, erroMessage: 'Não autenticado.' } }
  if (!await isProprietario(supabase)) return { err: { status: 403, erroMessage: 'Sem permissão.' } }
  return { user }
}

export async function marcarParcelaComoPaga(id) {
  const { err, user } = await authGuard()
  if (err) return err

  if (!UUID_RE.test(id)) return { status: 400, erroMessage: 'ID inválido.' }

  const { data: parcela, error: fetchParcelaErr } = await supabaseAdmin
    .from('parcelas').select('contrato_id').eq('id', id).single()
  if (fetchParcelaErr || !parcela) return { status: 404, erroMessage: 'Parcela não encontrada.' }

  const { data: contrato, error: fetchContratoErr } = await supabaseAdmin
    .from('contratos').select('unidade_id').eq('id', parcela.contrato_id).single()
  if (fetchContratoErr || !contrato) return { status: 404, erroMessage: 'Parcela não encontrada.' }

  const { data: unidade, error: fetchUnidadeErr } = await supabaseAdmin
    .from('unidades').select('edificio_id').eq('id', contrato.unidade_id).single()
  if (fetchUnidadeErr || !unidade) return { status: 404, erroMessage: 'Parcela não encontrada.' }

  const { data: edificio, error: fetchEdificioErr } = await supabaseAdmin
    .from('edificios').select('id').eq('id', unidade.edificio_id).eq('proprietario_id', user.id).single()
  if (fetchEdificioErr || !edificio) return { status: 404, erroMessage: 'Parcela não encontrada.' }

  const { error } = await supabaseAdmin
    .from('parcelas')
    .update({ status: 'paga', data_pagamento: new Date().toISOString().split('T')[0] })
    .eq('id', id)
    .in('status', ['pendente', 'vencida'])
  if (error) return { status: 500, erroMessage: error.message }
  return { status: 200 }
}

// Guard para o Locatário — não chama isProprietario (Locatário não tem role de Proprietário)
async function authGuardLocatario() {
  const supabase = await createServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { err: { status: 401, erroMessage: 'Não autenticado.' } }
  return { user }
}

export async function confirmarPagamentoLocatario(id) {
  const { err, user } = await authGuardLocatario()
  if (err) return err

  if (!UUID_RE.test(id)) return { status: 400, erroMessage: 'ID inválido.' }

  // Hop 1 — parcela existe?
  const { data: parcela, error: e1 } = await supabaseAdmin
    .from('parcelas').select('contrato_id').eq('id', id).single()
  if (e1 || !parcela) return { status: 404, erroMessage: 'Parcela não encontrada.' }

  // Hop 2 — contrato existe?
  const { data: contrato, error: e2 } = await supabaseAdmin
    .from('contratos').select('locatario_id').eq('id', parcela.contrato_id).single()
  if (e2 || !contrato) return { status: 404, erroMessage: 'Parcela não encontrada.' }

  // Hop 3 — locatário pertence ao usuário autenticado? (cross-tenant → 404, mascarado)
  const { data: locatario, error: e3 } = await supabaseAdmin
    .from('locatarios').select('usuario_id').eq('id', contrato.locatario_id).single()
  if (e3 || !locatario || locatario.usuario_id !== user.id)
    return { status: 404, erroMessage: 'Parcela não encontrada.' }

  const { error } = await supabaseAdmin
    .from('parcelas')
    .update({ status: 'paga', data_pagamento: new Date().toISOString().split('T')[0] })
    .eq('id', id)
    .in('status', ['pendente', 'vencida'])
  if (error) return { status: 500, erroMessage: error.message }
  return { status: 200 }
}
