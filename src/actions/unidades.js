'use server'

import supabaseAdmin from '@/lib/supabaseAdmin'
import { createServer } from '@/lib/supabase-server'
import { isProprietario } from '@/lib/auth'

const STATUS_UNIDADE = ['disponivel', 'alugada']
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

async function authGuard() {
  const supabase = await createServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { err: { status: 401, erroMessage: 'Não autenticado.' } }
  if (!await isProprietario(supabase)) return { err: { status: 403, erroMessage: 'Sem permissão.' } }
  return { user }
}

export async function criarUnidade(form) {
  const { err, user } = await authGuard()
  if (err) return err

  const { nome, descricao, area_m2, valor_mensal, status, valor_visivel, edificio_id, foto_url } = form
  if (!nome?.trim()) return { status: 400, erroMessage: 'Nome é obrigatório.' }
  if (!UUID_RE.test(edificio_id)) return { status: 400, erroMessage: 'Edifício inválido.' }
  if (isNaN(parseFloat(area_m2)) || parseFloat(area_m2) <= 0) return { status: 400, erroMessage: 'Área inválida.' }
  if (isNaN(parseFloat(valor_mensal)) || parseFloat(valor_mensal) < 0) return { status: 400, erroMessage: 'Valor mensal inválido.' }
  if (!STATUS_UNIDADE.includes(status)) return { status: 400, erroMessage: 'Status inválido.' }

  const { data: edificio, error: fetchEdificioErr } = await supabaseAdmin
    .from('edificios').select('id').eq('id', edificio_id).eq('proprietario_id', user.id).single()
  if (fetchEdificioErr || !edificio) return { status: 404, erroMessage: 'Edifício não encontrado.' }

  const { data, error } = await supabaseAdmin.from('unidades').insert({
    nome: nome.trim(), descricao, area_m2, valor_mensal,
    status, valor_visivel: Boolean(valor_visivel), edificio_id,
    foto_url: foto_url ?? null,
  }).select('id').single()
  if (error) return { status: 500, erroMessage: error.message }
  return { status: 200, id: data.id }
}

export async function editarUnidade(id, form) {
  const { err, user } = await authGuard()
  if (err) return err

  if (!UUID_RE.test(id)) return { status: 400, erroMessage: 'ID inválido.' }

  const { data: unidade, error: fetchUnidadeErr } = await supabaseAdmin
    .from('unidades').select('edificio_id').eq('id', id).single()
  if (fetchUnidadeErr || !unidade) return { status: 404, erroMessage: 'Unidade não encontrada.' }

  const { data: edificio, error: fetchEdificioErr } = await supabaseAdmin
    .from('edificios').select('id').eq('id', unidade.edificio_id).eq('proprietario_id', user.id).single()
  if (fetchEdificioErr || !edificio) return { status: 404, erroMessage: 'Unidade não encontrada.' }

  const { nome, descricao, area_m2, valor_mensal, status, valor_visivel, foto_url } = form
  if (nome !== undefined && !nome?.trim()) return { status: 400, erroMessage: 'Nome é obrigatório.' }
  if (status !== undefined && !STATUS_UNIDADE.includes(status)) return { status: 400, erroMessage: 'Status inválido.' }

  const patch = { descricao, area_m2, valor_mensal, status }
  if (nome !== undefined) patch.nome = nome.trim()
  if (valor_visivel !== undefined) patch.valor_visivel = Boolean(valor_visivel)
  if (foto_url !== undefined) patch.foto_url = foto_url

  const { error } = await supabaseAdmin.from('unidades').update(patch).eq('id', id)
  if (error) return { status: 500, erroMessage: error.message }
  return { status: 200 }
}

export async function deletarUnidade(id) {
  const { err, user } = await authGuard()
  if (err) return err

  if (!UUID_RE.test(id)) return { status: 400, erroMessage: 'ID inválido.' }

  const { data: unidade, error: fetchUnidadeErr } = await supabaseAdmin
    .from('unidades').select('edificio_id, foto_url').eq('id', id).single()
  if (fetchUnidadeErr || !unidade) return { status: 404, erroMessage: 'Unidade não encontrada.' }

  const { data: edificio, error: fetchEdificioErr } = await supabaseAdmin
    .from('edificios').select('id').eq('id', unidade.edificio_id).eq('proprietario_id', user.id).single()
  if (fetchEdificioErr || !edificio) return { status: 404, erroMessage: 'Unidade não encontrada.' }

  if (unidade.foto_url && !unidade.foto_url.startsWith('/')) {
    await supabaseAdmin.storage
      .from('unidades-fotos')
      .remove([unidade.foto_url])
      .catch(() => {})
  }

  const { error } = await supabaseAdmin.from('unidades').delete().eq('id', id)
  if (error) return { status: 500, erroMessage: error.message }
  return { status: 200 }
}
