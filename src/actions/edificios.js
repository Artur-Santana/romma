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

export async function criarEdificio(form) {
  const { err, user } = await authGuard()
  if (err) return err

  const { nome, endereco } = form
  if (!nome?.trim()) return { status: 400, erroMessage: 'Nome é obrigatório.' }
  if (!endereco?.trim()) return { status: 400, erroMessage: 'Endereço é obrigatório.' }

  const { error } = await supabaseAdmin.from('edificios').insert({ nome: nome.trim(), endereco: endereco.trim(), proprietario_id: user.id })
  if (error) return { status: 500, erroMessage: error.message }
  return { status: 200 }
}

export async function editarEdificio(id, form) {
  const { err } = await authGuard()
  if (err) return err

  if (!UUID_RE.test(id)) return { status: 400, erroMessage: 'ID inválido.' }
  const { nome, endereco } = form
  if (!nome?.trim()) return { status: 400, erroMessage: 'Nome é obrigatório.' }
  if (!endereco?.trim()) return { status: 400, erroMessage: 'Endereço é obrigatório.' }

  const { error } = await supabaseAdmin.from('edificios').update({ nome: nome.trim(), endereco: endereco.trim() }).eq('id', id)
  if (error) return { status: 500, erroMessage: error.message }
  return { status: 200 }
}

export async function deletarEdificio(id) {
  const { err } = await authGuard()
  if (err) return err

  if (!UUID_RE.test(id)) return { status: 400, erroMessage: 'ID inválido.' }
  const { error } = await supabaseAdmin.from('edificios').delete().eq('id', id)
  if (error) return { status: 500, erroMessage: error.message }
  return { status: 200 }
}
