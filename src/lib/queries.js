import supabase from "@/lib/supabase"

export async function getUnidades() {
    const { data } = await supabase.from('unidades').select('*')
    return data
}

export async function getEdificios() {
    const { data } = await supabase.from('edificios').select('*')
    return data
}

export async function getLocatarios() {
    const { data } = await supabase.from('locatarios').select('*')
    return data
}

export async function getContratos() {
    const { data } = await supabase.from('contratos').select('id, data_inicio, data_fim, status, observacoes, locatarios(nome_razao_social), unidades(nome)') 
    return data
}