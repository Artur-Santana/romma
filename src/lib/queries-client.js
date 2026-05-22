import { createClient } from "@/lib/supabase-browser"

const supabase = createClient()

export async function getUnidades() {
    const { data } = await supabase.from('unidades').select('id, edificio_id, nome, descricao, area_m2, valor_mensal, valor_visivel, status')
    return data
}

export async function getEdificios() {
    const { data } = await supabase.from('edificios').select('id, nome, endereco')
    return data
}

export async function getLocatarios() {
    const { data } = await supabase.from('locatarios').select('id, usuario_id, nome_razao_social, tipo, documento, email, telefone, status_convite')
    return data
}

export async function getContratos() {
    const { data } = await supabase.from('contratos').select('id, data_inicio, data_fim, status, observacoes, unidade_id, locatario_id, locatarios(nome_razao_social), unidades(nome)')
    return data
}

const ALLOWED_FILTERS = {
    unidades: ['status', 'edificio_id'],
    contratos: ['status', 'locatario_id', 'unidade_id'],
    parcelas: ['status', 'contrato_id'],
}

export async function countRegistros(tabela, coluna, valor) {
    if (!ALLOWED_FILTERS[tabela]?.includes(coluna)) {
        throw new Error(`countRegistros: combinação não permitida: ${tabela}.${coluna}`)
    }
    const { count } = await supabase
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

export async function getParcelasByContratos(contratoIds) {
  if (!contratoIds?.length) return []
  const { data } = await supabase
    .from('parcelas')
    .select('id, contrato_id, numero, data_fechamento, data_vencimento, data_pagamento, status')
    .in('contrato_id', contratoIds)
    .in('status', ['pendente', 'vencida'])
  return data ?? []
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
        .select('id, nome, area_m2, valor_mensal, valor_visivel, edificios(nome)')
        .eq('status', 'disponivel')
    return data?.map(u => u.valor_visivel ? u : { ...u, valor_mensal: null }) ?? []
}

export async function getLocatarioByUserId(userId) {
    const { data } = await supabase
        .from('locatarios')
        .select('id, usuario_id, nome_razao_social, tipo, documento, email, telefone')
        .eq('usuario_id', userId)
        .maybeSingle()
    return data
}

export async function getUnidade(unidadeId) {
    const { data } = await supabase
        .from('unidades')
        .select('id, edificio_id, nome, descricao, area_m2, valor_mensal, valor_visivel, status')
        .eq('id', unidadeId)
        .single()
    return data
}

export async function getEdificio(edificioId) {
    const { data } = await supabase
        .from('edificios')
        .select('id, nome, endereco')
        .eq('id', edificioId)
        .single()
    return data
}

export async function getContratosByLocatario(locatarioId) {
    const { data } = await supabase
        .from('contratos')
        .select('id, data_inicio, data_fim, status, observacoes, unidade_id, locatario_id')
        .eq('locatario_id', locatarioId)
    return data ?? []
}

export async function updateParcelaStatus(parcelaId, status, dataPagamento) {
    const updates = { status }
    if (dataPagamento !== undefined) updates.data_pagamento = dataPagamento
    const { error } = await supabase
        .from('parcelas')
        .update(updates)
        .eq('id', parcelaId)
    return error
}