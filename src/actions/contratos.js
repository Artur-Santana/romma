"use server"

import supabaseJWT from "@/lib/supabaseJWT"

export async function gerarParcelas(contratoId) {

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