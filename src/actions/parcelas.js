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
