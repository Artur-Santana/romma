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
  return {}
}

export async function marcarParcelaComoPaga(id) {
  const { err } = await authGuard()
  if (err) return err

  if (!UUID_RE.test(id)) return { status: 400, erroMessage: 'ID inválido.' }

  const { error } = await supabaseAdmin
    .from('parcelas')
    .update({ status: 'paga', data_pagamento: new Date().toISOString().split('T')[0] })
    .eq('id', id)
    .in('status', ['pendente', 'vencida'])
  if (error) return { status: 500, erroMessage: error.message }
  return { status: 200 }
}
