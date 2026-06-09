"use server"

import supabaseAdmin from "@/lib/supabaseAdmin"
import { createServer } from "@/lib/supabase-server"
import { isProprietario } from "@/lib/auth"

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const DOCUMENTO_RE = /^\d{11}$|^\d{14}$/

export async function convidarLocatario(email, nome_razao_social, documento, telefone, tipo) {
    if (!email || !nome_razao_social || !documento || !telefone || !tipo) {
        return { status: 400, erroMessage: 'Todos os campos são obrigatórios.' }
    }
    if (!EMAIL_RE.test(email)) {
        return { status: 400, erroMessage: 'E-mail inválido.' }
    }
    if (!DOCUMENTO_RE.test(documento)) {
        return { status: 400, erroMessage: 'Documento inválido. Use apenas dígitos (CPF: 11, CNPJ: 14).' }
    }
    const siteUrl = process.env.SITE_URL
    if (!siteUrl) return { status: 500, erroMessage: 'Configuração de servidor inválida.' }
    const supabase = await createServer()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { status: 401, erroMessage: 'Não autenticado.' }
    if (!await isProprietario(supabase)) return { status: 403, erroMessage: 'Sem permissão.' }
    const { data, error} = await supabaseAdmin.auth.admin.inviteUserByEmail(email, {
        redirectTo: `${siteUrl}/auth/confirm`
    })
    if (!error){
        const {error:errorInsert} = await supabaseAdmin.from('locatarios')
        .insert({
            usuario_id:data.user.id,
            proprietario_id: user.id,
            nome_razao_social,
            email:data.user.email,
            telefone,
            documento,
            tipo})
        if (errorInsert){
            await supabaseAdmin.auth.admin.deleteUser(data.user.id)
            return {
                status: 500,
                erroMessage: errorInsert.message
            }
        } else{
            return {
                status: 200
            }
        }
    } else {
        return {
            status: 500,
            erroMessage: error.message
        }
    }
}

export async function editarLocatario(id, form) {
    const supabase = await createServer()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { status: 401, erroMessage: 'Não autenticado.' }
    if (!await isProprietario(supabase)) return { status: 403, erroMessage: 'Sem permissão.' }
    if (!UUID_RE.test(id)) return { status: 400, erroMessage: 'ID inválido.' }
    const { nome_razao_social, tipo, documento, email, telefone } = form
    const { error } = await supabaseAdmin.from('locatarios').update({ nome_razao_social, tipo, documento, email, telefone }).eq('id', id)
    if (error) return { status: 500, erroMessage: error.message }
    return { status: 200 }
}

export async function deletarLocatario(id) {
    const supabase = await createServer()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { status: 401, erroMessage: 'Não autenticado.' }
    if (!await isProprietario(supabase)) return { status: 403, erroMessage: 'Sem permissão.' }
    if (!UUID_RE.test(id)) return { status: 400, erroMessage: 'ID inválido.' }

    // Busca usuario_id antes de deletar a linha
    const { data: loc, error: fetchErr } = await supabaseAdmin
        .from('locatarios').select('usuario_id').eq('id', id).single()
    if (fetchErr || !loc) return { status: 404, erroMessage: 'Locatário não encontrado.' }

    const { error } = await supabaseAdmin.from('locatarios').delete().eq('id', id)
    if (error) return { status: 500, erroMessage: error.message }

    const { error: authDelErr } = await supabaseAdmin.auth.admin.deleteUser(loc.usuario_id)
    if (authDelErr) return { status: 500, erroMessage: authDelErr.message }

    return { status: 200 }
}

export async function revogarConvite(id) {
    const supabase = await createServer()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { status: 401, erroMessage: 'Não autenticado.' }
    if (!await isProprietario(supabase)) return { status: 403, erroMessage: 'Sem permissão.' }
    if (!UUID_RE.test(id)) return { status: 400, erroMessage: 'ID inválido.' }
    const { data: loc, error: fetchErr } = await supabaseAdmin
        .from('locatarios').select('usuario_id, status_convite').eq('id', id).single()
    if (fetchErr || !loc) return { status: 404, erroMessage: 'Locatário não encontrado.' }
    if (loc.status_convite !== 'pendente') return { status: 400, erroMessage: 'Convite não está pendente.' }
    const { count: contratosCount, error: countErr } = await supabaseAdmin
        .from('contratos')
        .select('*', { count: 'exact', head: true })
        .eq('locatario_id', id)
    if (countErr) return { status: 500, erroMessage: countErr.message }
    if (contratosCount > 0) return { status: 400, erroMessage: 'Locatário tem contratos vinculados — encerre-os antes de revogar.' }
    const { error: delErr } = await supabaseAdmin.from('locatarios').delete().eq('id', id)
    if (delErr) return { status: 500, erroMessage: delErr.message }
    const { error: authDelErr } = await supabaseAdmin.auth.admin.deleteUser(loc.usuario_id)
    if (authDelErr) return { status: 500, erroMessage: authDelErr.message }
    return { status: 200 }
}