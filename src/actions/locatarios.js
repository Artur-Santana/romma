"use server"

import supabaseAdmin from "@/lib/supabaseAdmin"
import { createServer } from "@/lib/supabase-server"

export async function convidarLocatario(email, nome_razao_social, documento, telefone, tipo) {
    const supabase = await createServer()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { status: 401, erroMessage: 'Não autenticado.' }
    const { data, error} = await supabaseAdmin.auth.admin.inviteUserByEmail(email)
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