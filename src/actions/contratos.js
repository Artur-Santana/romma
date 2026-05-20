"use server"

import supabaseJWT from "@/lib/supabaseJWT"
import supabaseAdmin from "@/lib/supabaseAdmin"
import { createServer } from "@/lib/supabase-server"
import { isProprietario } from "@/lib/auth"

const STATUS_CONTRATO = ['ativo', 'encerrado', 'cancelado']
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

async function authGuard() {
  const supabase = await createServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { err: { status: 401, erroMessage: 'Não autenticado.' } }
  if (!await isProprietario(supabase)) return { err: { status: 403, erroMessage: 'Sem permissão.' } }
  return {}
}

export async function criarContrato(form) {
  const { err } = await authGuard()
  if (err) return err

  const { data_inicio, data_fim, status, observacoes, unidade_id, locatario_id } = form
  if (!data_inicio) return { status: 400, erroMessage: 'Data de início é obrigatória.' }
  if (!data_fim) return { status: 400, erroMessage: 'Data de fim é obrigatória.' }
  if (!UUID_RE.test(unidade_id)) return { status: 400, erroMessage: 'Unidade inválida.' }
  if (!UUID_RE.test(locatario_id)) return { status: 400, erroMessage: 'Locatário inválido.' }
  if (status && !STATUS_CONTRATO.includes(status)) return { status: 400, erroMessage: 'Status inválido.' }

  const { data, error } = await supabaseAdmin
    .from('contratos')
    .insert({ data_inicio, data_fim, status: status ?? 'ativo', observacoes, unidade_id, locatario_id })
    .select()
    .single()
  if (error) return { status: 500, erroMessage: error.message }

  const { error: errUnidade } = await supabaseAdmin
    .from('unidades')
    .update({ status: 'alugada' })
    .eq('id', unidade_id)
  if (errUnidade) return { status: 500, erroMessage: errUnidade.message }

  return { status: 200, data: { id: data.id } }
}

export async function editarContrato(id, form) {
  const { err } = await authGuard()
  if (err) return err

  if (!UUID_RE.test(id)) return { status: 400, erroMessage: 'ID inválido.' }
  const { data_inicio, data_fim, status, observacoes } = form
  if (status && !STATUS_CONTRATO.includes(status)) return { status: 400, erroMessage: 'Status inválido.' }
  const { error } = await supabaseAdmin.from('contratos').update({ data_inicio, data_fim, status, observacoes }).eq('id', id)
  if (error) return { status: 500, erroMessage: error.message }
  return { status: 200 }
}

export async function cancelarContrato(id, unidade_id) {
  const { err } = await authGuard()
  if (err) return err

  if (!UUID_RE.test(id)) return { status: 400, erroMessage: 'ID inválido.' }
  if (!UUID_RE.test(unidade_id)) return { status: 400, erroMessage: 'Unidade inválida.' }

  const { error } = await supabaseAdmin
    .from('contratos')
    .update({ status: 'cancelado' })
    .eq('id', id)
  if (error) return { status: 500, erroMessage: error.message }

  const { error: errUnidade } = await supabaseAdmin
    .from('unidades')
    .update({ status: 'disponivel' })
    .eq('id', unidade_id)
  if (errUnidade) return { status: 500, erroMessage: errUnidade.message }

  // Deleta parcelas futuras (status 'cancelada' não existe no enum)
  await supabaseAdmin
    .from('parcelas')
    .delete()
    .eq('contrato_id', id)
    .eq('status', 'futura')

  return { status: 200 }
}

export async function encerrarContrato(id, unidade_id) {
  const { err } = await authGuard()
  if (err) return err

  if (!UUID_RE.test(id)) return { status: 400, erroMessage: 'ID inválido.' }
  if (!UUID_RE.test(unidade_id)) return { status: 400, erroMessage: 'Unidade inválida.' }

  const { error } = await supabaseAdmin
    .from('contratos')
    .update({ status: 'encerrado' })
    .eq('id', id)
  if (error) return { status: 500, erroMessage: error.message }

  const { error: errUnidade } = await supabaseAdmin
    .from('unidades')
    .update({ status: 'disponivel' })
    .eq('id', unidade_id)
  if (errUnidade) return { status: 500, erroMessage: errUnidade.message }

  await supabaseAdmin
    .from('parcelas')
    .delete()
    .eq('contrato_id', id)
    .eq('status', 'futura')

  return { status: 200 }
}

export async function gerarParcelas(contratoId) {
    const supabase = await createServer()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { status: 401, erroMessage: 'Não autenticado.' }
    if (!await isProprietario(supabase)) return { status: 403, erroMessage: 'Sem permissão.' }

    const { data: { session } } = await supabase.auth.getSession()
    const { error } = await supabaseJWT.functions.invoke('gerar-parcelas', {
        body: { contrato_id: contratoId },
        headers: { Authorization: 'Bearer ' + session.access_token }
    })
    if (!error){
        return { status: 200 }
    } else {
        return {
            status: 500,
            erroMessage: error.message ?? 'Erro ao invocar função.'
        }
    }
}