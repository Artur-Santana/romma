"use server"

import supabaseAdmin from "@/lib/supabaseAdmin"
import { createServer } from "@/lib/supabase-server"

export async function convidarLocatario(email, nome_razao_social, documento, telefone, tipo) {
    if (!email || !nome_razao_social || !documento || !telefone || !tipo) {
        return { status: 400, erroMessage: 'Todos os campos são obrigatórios.' }
    }
    const supabase = await createServer()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { status: 401, erroMessage: 'Não autenticado.' }
    const { data, error} = await supabaseAdmin.auth.admin.inviteUserByEmail(email, {
        redirectTo: `${process.env.SITE_URL}/dashboard`
    })
    if (!error){
        const {error:errorInsert} = await supabaseAdmin.from('locatarios')
        .insert({
            usuario_id:data.user.id, 
            nome_razao_social, 
            email:data.user.email, 
            telefone,
            documento, 
            tipo}) 
        if (errorInsert){
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
    const { error } = await supabaseAdmin.from('locatarios').update(form).eq('id', id)
    if (error) return { status: 500, erroMessage: error.message }
    return { status: 200 }
}

export async function deletarLocatario(id) {
    const supabase = await createServer()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { status: 401, erroMessage: 'Não autenticado.' }
    const { error } = await supabaseAdmin.from('locatarios').delete().eq('id', id)
    if (error) return { status: 500, erroMessage: error.message }
    return { status: 200 }
}