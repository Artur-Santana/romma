import 'server-only'
import { createServer } from "@/lib/supabase-server"

export async function getUnidades() {
    const supabase = await createServer()
    const { data } = await supabase.from('unidades').select('id, edificio_id, nome, descricao, area_m2, valor_mensal, valor_visivel, status')
    return data
}

export async function getEdificios() {
    const supabase = await createServer()
    const { data } = await supabase.from('edificios').select('id, nome, endereco')
    return data
}

export async function getLocatarios() {
    const supabase = await createServer()
    const { data } = await supabase.from('locatarios').select('id, usuario_id, nome_razao_social, tipo, documento, email, telefone')
    return data
}

export async function getContratos() {
    const supabase = await createServer()
    const { data } = await supabase.from('contratos').select('id, data_inicio, data_fim, status, observacoes, unidade_id, locatarios(nome_razao_social), unidades(nome)')
    return data
}

async function countRegistros(supabase, tabela, coluna, valor) {
    const { count } = await supabase
        .from(tabela)
        .select('*', { count: 'exact', head: true })
        .eq(coluna, valor)
    return count
}

export async function getMetricas() {
    const supabase = await createServer()
    const unidadesDisponiveis = await countRegistros(supabase, 'unidades', 'status', 'disponivel')
    const unidadesAlugadas = await countRegistros(supabase, 'unidades', 'status', 'alugada')
    const contratosAtivos = await countRegistros(supabase, 'contratos', 'status', 'ativo')
    const parcelasPendentes = await countRegistros(supabase, 'parcelas', 'status', 'pendente')
    const parcelasVencidas = await countRegistros(supabase, 'parcelas', 'status', 'vencida')

    return {
        unidadesDisponiveis,
        unidadesAlugadas,
        contratosAtivos,
        parcelasPendentes,
        parcelasVencidas
    }
}

export async function getParcelasByContrato(contratoId) {
    const supabase = await createServer()
    const { data } = await supabase
        .from('parcelas')
        .select('id, numero, data_fechamento, data_vencimento, data_pagamento, status')
        .eq('contrato_id', contratoId)
        .order('numero', { ascending: true })
    return data
}

export async function getUnidadesDisponiveis() {
    const supabase = await createServer()
    const { data } = await supabase
        .from('unidades')
        .select('id, nome, area_m2, valor_mensal, valor_visivel, edificios(nome)')
        .eq('status', 'disponivel')
    return data?.map(u => u.valor_visivel ? u : { ...u, valor_mensal: null }) ?? []
}
