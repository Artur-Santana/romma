import "@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from "jsr:@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  const authHeader = req.headers.get('Authorization')
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return new Response(
      JSON.stringify({ error: 'Unauthorized' }),
      { status: 401, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    )
  }

  try {
    const { contrato_id } = await req.json()

    if (!contrato_id) {
      return new Response(
        JSON.stringify({ error: "contrato_id é obrigatório" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      )
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    )

    // Busca o contrato para pegar data_inicio e data_fim
    const { data: contrato, error: contratoError } = await supabase
      .from("contratos")
      .select("data_inicio, data_fim")
      .eq("id", contrato_id)
      .single()

    if (contratoError || !contrato) {
      return new Response(
        JSON.stringify({ error: "Contrato não encontrado" }),
        { status: 404, headers: { "Content-Type": "application/json", ...corsHeaders } }
      )
    }

    const dataInicio = new Date(contrato.data_inicio)
    const dataFim = new Date(contrato.data_fim)

    const parcelas = []

    // Parcela 1: se vencimento cair em mês diferente, fecha no dia 1 do mês seguinte
    const vencimento1Simples = new Date(dataInicio)
    vencimento1Simples.setDate(vencimento1Simples.getDate() + 7)

    const venceNoMesSeguinte = vencimento1Simples.getMonth() !== dataInicio.getMonth()

    const fechamento1 = venceNoMesSeguinte
      ? new Date(dataInicio.getFullYear(), dataInicio.getMonth() + 1, 1)
      : new Date(dataInicio)

    const vencimento1 = new Date(fechamento1)
    vencimento1.setDate(vencimento1.getDate() + 7)

    parcelas.push({
      contrato_id,
      numero: 1,
      data_fechamento: fechamento1.toISOString().split("T")[0],
      data_vencimento: vencimento1.toISOString().split("T")[0],
      status: "futura",
    })

    // Parcelas 2+: primeiro dia do mês seguinte ao fechamento da parcela 1
    let mes = new Date(fechamento1.getFullYear(), fechamento1.getMonth() + 1, 1)
    let numero = 2

    while (mes <= dataFim) {
      const vencimento = new Date(mes)
      vencimento.setDate(vencimento.getDate() + 7)

      parcelas.push({
        contrato_id,
        numero,
        data_fechamento: mes.toISOString().split("T")[0],
        data_vencimento: vencimento.toISOString().split("T")[0],
        status: "futura",
      })

      mes = new Date(mes.getFullYear(), mes.getMonth() + 1, 1)
      numero++
    }

    // Insere todas as parcelas de uma vez
    const { error: insertError } = await supabase
      .from("parcelas")
      .insert(parcelas)

    if (insertError) {
      return new Response(
        JSON.stringify({ error: insertError.message }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      )
    }

    return new Response(
      JSON.stringify({ ok: true, total: parcelas.length }),
       { headers: { "Content-Type": "application/json", ...corsHeaders } }
    )

  } catch (err) {
    return new Response(
      JSON.stringify({ error: String(err) }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    )
  }
})