// src/lib/fluxo.js
// Pure functions — no imports, no side effects, testable with plain objects.
// No 'server-only' guard needed (pure math, no Supabase).

const SHORT_MONTHS = ["jan","fev","mar","abr","mai","jun","jul","ago","set","out","nov","dez"]

export function buildFluxoWindow(todayStr) {
  // todayStr = "YYYY-MM-DD" ISO date string from server
  const [y, m] = todayStr.split("-").map(Number)
  const months = []
  for (let delta = -2; delta <= 2; delta++) {
    let mm = m + delta
    let yy = y
    if (mm < 1)  { mm += 12; yy-- }
    if (mm > 12) { mm -= 12; yy++ }
    months.push({ key: `${yy}-${String(mm).padStart(2, "0")}`, mes: SHORT_MONTHS[mm - 1], isCurrent: delta === 0 })
  }
  return months  // always exactly 5 entries: m-2, m-1, m, m+1, m+2
}

function getValorParcela(parcela, contratos, unidades) {
  const contrato = contratos.find(c => c.id === parcela.contrato_id)
  const unidade  = unidades.find(u => u.id === contrato?.unidade_id)
  return unidade?.valor_mensal ?? 0
}

function bucketParcelas(parcelas, contratos, unidades, windowKeys) {
  const windowSet = new Set(windowKeys)
  const recebido  = Object.fromEntries(windowKeys.map(k => [k, 0]))
  const previsto  = Object.fromEntries(windowKeys.map(k => [k, 0]))

  for (const p of parcelas) {
    const valor = getValorParcela(p, contratos, unidades)
    // Previsto: ALL parcelas bucketed by data_vencimento
    const kv = p.data_vencimento?.slice(0, 7)
    if (kv && windowSet.has(kv)) previsto[kv] += valor
    // Recebido: only paga parcelas bucketed by data_pagamento
    if (p.status === "paga" && p.data_pagamento) {
      const kr = p.data_pagamento.slice(0, 7)
      if (windowSet.has(kr)) recebido[kr] += valor
    }
  }
  return { recebido, previsto }
}

function normalizeFluxo(windowMonths, recebido, previsto) {
  const maxVal = Math.max(
    ...windowMonths.map(({ key: k }) => Math.max(recebido[k] ?? 0, previsto[k] ?? 0)),
    1  // clamp to 1 to avoid division by zero
  )

  return windowMonths.map(({ key, mes, isCurrent }) => ({
    mes,
    key,
    recebido: Math.round(((recebido[key] ?? 0) / maxVal) * 100),
    previsto:  Math.round(((previsto[key]  ?? 0) / maxVal) * 100),
    current:  isCurrent,
    rawRecebido: recebido[key] ?? 0,
    rawPrevisto: previsto[key] ?? 0,
  }))
}

export function aggregateFluxo(parcelasFluxo, contratos, unidades, todayStr) {
  const windowMonths = buildFluxoWindow(todayStr)
  const windowKeys   = windowMonths.map(m => m.key)
  const { recebido, previsto } = bucketParcelas(parcelasFluxo, contratos, unidades, windowKeys)
  return normalizeFluxo(windowMonths, recebido, previsto)
}
