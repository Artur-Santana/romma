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
  return { user }
}

export async function criarContrato(form) {
  const { err, user } = await authGuard()
  if (err) return err

  const { data_inicio, data_fim, status, observacoes, unidade_id, locatario_id } = form
  if (!data_inicio) return { status: 400, erroMessage: 'Data de início é obrigatória.' }
  if (!data_fim) return { status: 400, erroMessage: 'Data de fim é obrigatória.' }
  if (!UUID_RE.test(unidade_id)) return { status: 400, erroMessage: 'Unidade inválida.' }
  if (!UUID_RE.test(locatario_id)) return { status: 400, erroMessage: 'Locatário inválido.' }
  if (status && !STATUS_CONTRATO.includes(status)) return { status: 400, erroMessage: 'Status inválido.' }

  const { data: unidade, error: fetchUnidadeErr } = await supabaseAdmin
    .from('unidades').select('edificio_id').eq('id', unidade_id).single()
  if (fetchUnidadeErr || !unidade) return { status: 404, erroMessage: 'Unidade não encontrada.' }

  const { data: edificio, error: fetchEdificioErr } = await supabaseAdmin
    .from('edificios').select('id').eq('id', unidade.edificio_id).eq('proprietario_id', user.id).single()
  if (fetchEdificioErr || !edificio) return { status: 404, erroMessage: 'Unidade não encontrada.' }

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
  const { err, user } = await authGuard()
  if (err) return err

  if (!UUID_RE.test(id)) return { status: 400, erroMessage: 'ID inválido.' }
  const { data_inicio, data_fim, status, observacoes } = form
  if (status && !STATUS_CONTRATO.includes(status)) return { status: 400, erroMessage: 'Status inválido.' }

  const { data: contrato, error: fetchErr } = await supabaseAdmin
    .from('contratos').select('unidade_id').eq('id', id).single()
  if (fetchErr || !contrato) return { status: 404, erroMessage: 'Contrato não encontrado.' }

  const { data: unidade, error: fetchUnidadeErr } = await supabaseAdmin
    .from('unidades').select('edificio_id').eq('id', contrato.unidade_id).single()
  if (fetchUnidadeErr || !unidade) return { status: 404, erroMessage: 'Contrato não encontrado.' }

  const { data: edificio, error: fetchEdificioErr } = await supabaseAdmin
    .from('edificios').select('id').eq('id', unidade.edificio_id).eq('proprietario_id', user.id).single()
  if (fetchEdificioErr || !edificio) return { status: 404, erroMessage: 'Contrato não encontrado.' }

  const { error } = await supabaseAdmin.from('contratos').update({ data_inicio, data_fim, status, observacoes }).eq('id', id)
  if (error) return { status: 500, erroMessage: error.message }
  return { status: 200 }
}

export async function cancelarContrato(id) {
  const { err, user } = await authGuard()
  if (err) return err

  if (!UUID_RE.test(id)) return { status: 400, erroMessage: 'ID inválido.' }

  const { data: contrato, error: fetchErr } = await supabaseAdmin
    .from('contratos')
    .select('unidade_id')
    .eq('id', id)
    .single()
  if (fetchErr || !contrato) return { status: 404, erroMessage: 'Contrato não encontrado.' }

  const { data: unidade, error: fetchUnidadeErr } = await supabaseAdmin
    .from('unidades').select('edificio_id').eq('id', contrato.unidade_id).single()
  if (fetchUnidadeErr || !unidade) return { status: 404, erroMessage: 'Contrato não encontrado.' }

  const { data: edificio, error: fetchEdificioErr } = await supabaseAdmin
    .from('edificios').select('id').eq('id', unidade.edificio_id).eq('proprietario_id', user.id).single()
  if (fetchEdificioErr || !edificio) return { status: 404, erroMessage: 'Contrato não encontrado.' }

  const { error } = await supabaseAdmin
    .from('contratos')
    .update({ status: 'cancelado' })
    .eq('id', id)
  if (error) return { status: 500, erroMessage: error.message }

  const { error: errUnidade } = await supabaseAdmin
    .from('unidades')
    .update({ status: 'disponivel' })
    .eq('id', contrato.unidade_id)
  if (errUnidade) return { status: 500, erroMessage: errUnidade.message }

  // Deleta parcelas futuras (status 'cancelada' não existe no enum)
  await supabaseAdmin
    .from('parcelas')
    .delete()
    .eq('contrato_id', id)
    .eq('status', 'futura')

  return { status: 200 }
}

export async function encerrarContrato(id) {
  const { err, user } = await authGuard()
  if (err) return err

  if (!UUID_RE.test(id)) return { status: 400, erroMessage: 'ID inválido.' }

  const { data: contrato, error: fetchErr } = await supabaseAdmin
    .from('contratos')
    .select('unidade_id')
    .eq('id', id)
    .single()
  if (fetchErr || !contrato) return { status: 404, erroMessage: 'Contrato não encontrado.' }

  const { data: unidade, error: fetchUnidadeErr } = await supabaseAdmin
    .from('unidades').select('edificio_id').eq('id', contrato.unidade_id).single()
  if (fetchUnidadeErr || !unidade) return { status: 404, erroMessage: 'Contrato não encontrado.' }

  const { data: edificio, error: fetchEdificioErr } = await supabaseAdmin
    .from('edificios').select('id').eq('id', unidade.edificio_id).eq('proprietario_id', user.id).single()
  if (fetchEdificioErr || !edificio) return { status: 404, erroMessage: 'Contrato não encontrado.' }

  const { error } = await supabaseAdmin
    .from('contratos')
    .update({ status: 'encerrado' })
    .eq('id', id)
  if (error) return { status: 500, erroMessage: error.message }

  const { error: errUnidade } = await supabaseAdmin
    .from('unidades')
    .update({ status: 'disponivel' })
    .eq('id', contrato.unidade_id)
  if (errUnidade) return { status: 500, erroMessage: errUnidade.message }

  await supabaseAdmin
    .from('parcelas')
    .delete()
    .eq('contrato_id', id)
    .eq('status', 'futura')

  return { status: 200 }
}

export async function renovarContrato(id, meses) {
  const { err, user } = await authGuard()
  if (err) return err

  if (!UUID_RE.test(id)) return { status: 400, erroMessage: 'ID inválido.' }

  const m = Number(meses)
  if (!Number.isInteger(m) || m < 1 || m > 36) {
    return { status: 400, erroMessage: 'Número de meses inválido (1–36).' }
  }

  // Cadeia de propriedade 3 níveis (igual cancelarContrato)
  const { data: contrato, error: fetchErr } = await supabaseAdmin
    .from('contratos')
    .select('unidade_id, data_fim')
    .eq('id', id)
    .single()
  if (fetchErr || !contrato) return { status: 404, erroMessage: 'Contrato não encontrado.' }

  const { data: unidade, error: fetchUnidadeErr } = await supabaseAdmin
    .from('unidades').select('edificio_id').eq('id', contrato.unidade_id).single()
  if (fetchUnidadeErr || !unidade) return { status: 404, erroMessage: 'Contrato não encontrado.' }

  const { data: edificio, error: fetchEdificioErr } = await supabaseAdmin
    .from('edificios').select('id').eq('id', unidade.edificio_id).eq('proprietario_id', user.id).single()
  if (fetchEdificioErr || !edificio) return { status: 404, erroMessage: 'Contrato não encontrado.' }

  // Calcular nova data_fim com T12:00:00 para evitar UTC shift
  const d = new Date(contrato.data_fim + 'T12:00:00')
  d.setMonth(d.getMonth() + m)
  const nova_data_fim = d.toISOString().slice(0, 10)

  // UPDATE data_fim primeiro
  const { error: updateErr } = await supabaseAdmin
    .from('contratos')
    .update({ data_fim: nova_data_fim })
    .eq('id', id)
  if (updateErr) return { status: 500, erroMessage: updateErr.message }

  // Buscar última parcela (MAX(numero) via ORDER DESC LIMIT 1)
  const { data: lastParc, error: lastParcErr } = await supabaseAdmin
    .from('parcelas')
    .select('numero, data_fechamento')
    .eq('contrato_id', id)
    .order('numero', { ascending: false })
    .limit(1)
    .single()
  if (lastParcErr) return { status: 500, erroMessage: lastParcErr.message }

  // Gerar novas parcelas a partir do mês seguinte ao último fechamento
  const novasParcelas = []
  let nextNumero = lastParc.numero + 1
  const fechBase = new Date(lastParc.data_fechamento + 'T12:00:00')
  fechBase.setMonth(fechBase.getMonth() + 1)
  fechBase.setDate(1)
  const fim = new Date(nova_data_fim + 'T12:00:00')

  while (fechBase <= fim) {
    const venc = new Date(fechBase)
    venc.setDate(venc.getDate() + 7)
    novasParcelas.push({
      contrato_id: id,
      numero: nextNumero,
      data_fechamento: fechBase.toISOString().slice(0, 10),
      data_vencimento: venc.toISOString().slice(0, 10),
      status: 'futura',
    })
    nextNumero++
    fechBase.setMonth(fechBase.getMonth() + 1)
  }

  if (novasParcelas.length > 0) {
    const { error: insertErr } = await supabaseAdmin
      .from('parcelas')
      .insert(novasParcelas)
    if (insertErr) return { status: 500, erroMessage: insertErr.message }
  }

  return { status: 200 }
}

export async function gerarParcelas(contratoId) {
    const supabase = await createServer()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { status: 401, erroMessage: 'Não autenticado.' }
    if (!await isProprietario(supabase)) return { status: 403, erroMessage: 'Sem permissão.' }

    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return { status: 401, erroMessage: 'Sessão expirada.' }
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