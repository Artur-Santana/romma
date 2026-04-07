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
    const { data } = await supabase.from('contratos').select('id, data_inicio, data_fim, status, observacoes, unidade_id, locatarios(nome_razao_social), unidades(nome)')
    return data
}

export async function getCountUnidadesDisponiveis(){
    const { count } =  await supabase
    .from('unidades')
    .select('*', { count: 'exact', head: true})
    .eq('status', 'disponivel')
    return count
}

export async function getCountUnidadesAlugadas(){
    const { count } =  await supabase
    .from('unidades')
    .select('*', { count: 'exact', head: true})
    .eq('status', 'alugada')
    return count
}

export async function getCountContratosAtivos(){
    const { count } =  await supabase
    .from('contratos')
    .select('*', { count: 'exact', head: true})
    .eq('status', 'ativo')
    return count
}

export async function getCountParcelasPendentes(){
    const { count } =  await supabase
    .from('parcelas')
    .select('*', { count: 'exact', head: true})
    .eq('status', 'pendente')
    return count
}

export async function getCountParcelasVencidas(){
    const { count } =  await supabase
    .from('parcelas')
    .select('*', { count: 'exact', head: true})
    .eq('status', 'vencida')
    return count
}

export async function getMetricas() {
    const unidadesDisponiveis = await getCountUnidadesDisponiveis()
    const unidadesAlugadas = await getCountUnidadesAlugadas()
    const contratosAtivos = await getCountContratosAtivos()
    const parcelasPendentes = await getCountParcelasPendentes()
    const parcelasVencidas = await getCountParcelasVencidas()

    return {
        unidadesDisponiveis,
        unidadesAlugadas,
        contratosAtivos,
        parcelasPendentes,
        parcelasVencidas
    }
}

export async function getParcelasByContrato(contratoId) {
    const { data } = await supabase
        .from('parcelas')
        .select('id, numero, data_fechamento, data_vencimento, data_pagamento, status')
        .eq('contrato_id', contratoId)
        .order('numero', { ascending: true })
    return data
}