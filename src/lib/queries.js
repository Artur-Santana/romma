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


export async function countRegistros(tabela, coluna, valor) {
    const { count } =  await supabase
    .from(tabela)
    .select('*', { count: 'exact', head: true})
    .eq(coluna, valor)
    return count
}

export async function getMetricas() {
    const unidadesDisponiveis = await countRegistros('unidades', 'status', 'disponivel')
    const unidadesAlugadas = await countRegistros('unidades', 'status', 'alugada')
    const contratosAtivos = await countRegistros('contratos', 'status', 'ativo')
    const parcelasPendentes = await countRegistros('parcelas', 'status', 'pendente')
    const parcelasVencidas = await countRegistros('parcelas', 'status', 'vencida')

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

export async function getUnidadesDisponiveis() {
    const { data } = await supabase
        .from('unidades')
        .select('*, edificios(nome)')
        .eq('status', 'disponivel')
    return data
}