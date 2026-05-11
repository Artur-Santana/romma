"use server"

import supabaseJWT from "@/lib/supabaseJWT"
import { createServer } from "@/lib/supabase-server"

export async function gerarParcelas(contratoId) {
    const supabase = await createServer()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { status: 401, erroMessage: 'Não autenticado.' }

    const { error } = await supabaseJWT.functions.invoke('gerar-parcelas', {
        body: { contrato_id: contratoId },
        headers: { Authorization: 'Bearer ' + process.env.SUPABASE_JWT}
    })
    if (!error){
        return {
            status:200,
            message: "parcelas criadas"
        }
    } else {
        return {
            status:500,
            errorMessage: error.message
        }
    }
}