"use client"

import { useEffect, useState } from "react"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import { getParcelasByContrato, getContratos, getLocatarios, getUnidades, getEdificios } from "@/lib/queries-client"
import { cn, fmtData, fmtBRL } from "@/lib/utils"
import StatusBadge from "@/components/ui/StatusBadge"
import { Button } from "@/components/ui/button"
import { marcarParcelaComoPaga } from "@/actions/parcelas"

export default function Parcelas({ contratoId }) {
  const router = useRouter()
  const [parcelas, setParcelas] = useState([])
  const [contrato, setContrato] = useState(null)
  const [locatario, setLocatario] = useState(null)
  const [unidade, setUnidade] = useState(null)
  const [edificio, setEdificio] = useState(null)
  const [erro, setErro] = useState(null)

  useEffect(() => {
    async function carregar() {
      const [p, contratos, locatarios, unidades, edificios] = await Promise.all([
        getParcelasByContrato(contratoId),
        getContratos(),
        getLocatarios(),
        getUnidades(),
        getEdificios(),
      ])
      setParcelas(p ?? [])
      const c = (contratos ?? []).find(x => x.id === contratoId)
      if (c) {
        setContrato(c)
        setLocatario((locatarios ?? []).find(l => l.id === c.locatario_id) ?? c.locatarios)
        const u = (unidades ?? []).find(u => u.id === c.unidade_id) ?? c.unidades
        setUnidade(u)
        if (u?.edificio_id) {
          setEdificio((edificios ?? []).find(e => e.id === u.edificio_id) ?? null)
        }
      }
    }
    carregar()
  }, [contratoId])

  async function marcarComoPaga(parcela) {
    const result = await marcarParcelaComoPaga(parcela.id)
    if (result.status === 200) {
      setErro(null)
      const hoje = new Date()
      const dataHoje = fmtData(hoje.toISOString().slice(0, 10))
      toast.success(`Pagamento registrado · ${dataHoje}`)
      setParcelas(await getParcelasByContrato(contratoId) ?? [])
    } else {
      setErro(result.erroMessage)
    }
  }

  // Derivações financeiras inline — recalculam no re-render após setParcelas
  const valor = unidade?.valor_mensal ?? 0
  const pagas = parcelas.filter(p => p.status === "paga")
  const vencidas = parcelas.filter(p => p.status === "vencida")
  const emAberto = parcelas.filter(p => p.status === "pendente" || p.status === "vencida" || p.status === "futura")
  const totalContrato = parcelas.length * valor
  const totalPago = pagas.length * valor
  const totalEmAberto = emAberto.length * valor
  const totalInadimplencia = vencidas.length * valor

  const metrics = [
    {
      l: "Valor do contrato",
      v: fmtBRL(totalContrato),
      s: `${parcelas.length} parcelas`,
    },
    {
      l: "Total recebido",
      v: fmtBRL(totalPago),
      s: `${pagas.length} pagas`,
      ok: true,
    },
    {
      l: "Em aberto",
      v: fmtBRL(totalEmAberto),
      s: `${emAberto.length} parcelas`,
      gold: true,
    },
    {
      l: "Inadimplência",
      v: vencidas.length > 0 ? fmtBRL(totalInadimplencia) : "R$0",
      s: `${vencidas.length} vencida(s)`,
      danger: vencidas.length > 0,
    },
  ]

  return (
    <div className="romma-page bg-background min-h-full px-4 sm:px-12 pt-6 sm:pt-12 pb-20">

      {/* Back */}
      <Button
        variant="outline"
        onClick={() => router.push("/dashboard/contratos")}
        className="border-border-3 bg-transparent text-fg-3 font-mono text-[10px] uppercase tracking-[1.2px] font-bold rounded-none mb-10 h-auto py-[10px] px-5"
      >
        ← Contratos
      </Button>

      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: "var(--rd-block)", gap: 16, flexWrap: "wrap" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <span className="eyebrow eyebrow--indigo">SISTEMA.02 · PARCELAS</span>
          <h1 className="font-display font-bold text-fg-1 m-0" style={{ fontSize: "clamp(28px, 5vw, 48px)", lineHeight: 1, letterSpacing: "-2.4px" }}>
            {locatario?.nome_razao_social ?? "Parcelas."}
          </h1>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <StatusBadge status={contrato?.status} />
        </div>
      </div>

      {erro && (
        <div className="px-4 py-[10px] mb-6 bg-[var(--danger-bg2)] border border-danger-fg font-mono text-[12px] text-danger-fg">
          {erro}
        </div>
      )}

      {/* Grade-resumo: 5 colunas desktop, 2×3 mobile */}
      {contrato && unidade && (
        <>
          {/* Desktop: 5 colunas */}
          <div className="romma-desktop-only" style={{
            display: "grid",
            gridTemplateColumns: "repeat(5, 1fr)",
            border: "1px solid var(--border-3)",
            marginBottom: "var(--rd-block)",
          }}>
            {[
              { label: "Unidade", value: unidade?.nome ?? "—" },
              { label: "Edifício", value: edificio?.nome ?? "—" },
              { label: "Valor mensal", value: fmtBRL(unidade?.valor_mensal) },
              { label: "Início", value: fmtData(contrato?.data_inicio) },
              { label: "Término", value: fmtData(contrato?.data_fim) },
            ].map((s, i) => (
              <div key={s.label} style={{
                padding: "14px 16px",
                background: "var(--surface)",
                borderRight: i < 4 ? "1px solid var(--border-3)" : "none",
              }}>
                <div className="r-label" style={{ marginBottom: 8 }}>{s.label}</div>
                <div className="font-display font-bold text-fg-1" style={{ fontSize: 16, letterSpacing: "-0.4px" }}>{s.value}</div>
              </div>
            ))}
          </div>

          {/* Mobile: 2×3 grid */}
          <div className="romma-mobile-only" style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            border: "1px solid var(--border-3)",
            marginBottom: "var(--rd-block)",
          }}>
            {[
              { label: "Unidade", value: unidade?.nome ?? "—" },
              { label: "Edifício", value: edificio?.nome ?? "—" },
              { label: "Valor mensal", value: fmtBRL(unidade?.valor_mensal) },
              { label: "Início", value: fmtData(contrato?.data_inicio) },
              { label: "Término", value: fmtData(contrato?.data_fim) },
            ].map((s, i) => (
              <div key={s.label} style={{
                padding: "14px 16px",
                background: "var(--surface)",
                borderRight: i % 2 === 0 ? "1px solid var(--border-3)" : "none",
                borderTop: i >= 2 ? "1px solid var(--border-3)" : "none",
              }}>
                <div className="r-label" style={{ marginBottom: 8 }}>{s.label}</div>
                <div className="font-display font-bold text-fg-1" style={{ fontSize: 16, letterSpacing: "-0.4px" }}>{s.value}</div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Resumo financeiro: 4 colunas */}
      {contrato && (
        <>
          {/* Desktop: 4 colunas */}
          <div className="romma-desktop-only" style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, 1fr)",
            border: "1px solid var(--border-3)",
            marginBottom: 20,
          }}>
            {metrics.map((m, i) => (
              <div key={m.l} style={{
                padding: "14px 16px",
                background: m.danger ? "var(--danger-bg2)" : "transparent",
                borderRight: i < 3 ? "1px solid var(--border-3)" : "none",
              }}>
                <div className="r-label" style={{
                  fontSize: 9.5, marginBottom: 7,
                  color: m.danger ? "var(--danger-fg)" : m.gold ? "var(--highlight)" : m.ok ? "var(--success)" : "var(--fg-4)",
                }}>{m.l}</div>
                <div className="font-display font-bold" style={{
                  fontSize: 24, letterSpacing: "-1px",
                  color: m.danger ? "var(--danger-fg)" : m.gold ? "var(--highlight)" : m.ok ? "var(--success)" : "var(--fg-1)",
                }}>{m.v}</div>
                <div className="r-meta" style={{ marginTop: 4 }}>{m.s}</div>
              </div>
            ))}
          </div>

          {/* Mobile: 2×2 grid */}
          <div className="romma-mobile-only" style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            border: "1px solid var(--border-3)",
            marginBottom: 20,
          }}>
            {metrics.map((m, i) => (
              <div key={m.l} style={{
                padding: "14px 16px",
                background: m.danger ? "var(--danger-bg2)" : "transparent",
                borderRight: i % 2 === 0 ? "1px solid var(--border-3)" : "none",
                borderTop: i >= 2 ? "1px solid var(--border-3)" : "none",
              }}>
                <div className="r-label" style={{
                  fontSize: 9.5, marginBottom: 7,
                  color: m.danger ? "var(--danger-fg)" : m.gold ? "var(--highlight)" : m.ok ? "var(--success)" : "var(--fg-4)",
                }}>{m.l}</div>
                <div className="font-display font-bold" style={{
                  fontSize: 20, letterSpacing: "-0.8px",
                  color: m.danger ? "var(--danger-fg)" : m.gold ? "var(--highlight)" : m.ok ? "var(--success)" : "var(--fg-1)",
                }}>{m.v}</div>
                <div className="r-meta" style={{ marginTop: 4 }}>{m.s}</div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Cabeçalho da seção de parcelas */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
        <div>
          <span className="eyebrow eyebrow--indigo" style={{ marginBottom: 5, display: "block" }}>SISTEMA.PARCELAS</span>
          <h2 className="font-display font-bold text-fg-1 m-0" style={{ fontSize: 18 }}>Cronograma de Parcelas</h2>
        </div>
        <span className="r-meta">{pagas.length}/{parcelas.length} pagas</span>
      </div>

      {/* Barra de progresso segmentada */}
      <div style={{ display: "flex", gap: 3, marginBottom: 24 }} aria-hidden="true">
        {parcelas.map(p => (
          <div key={p.id} style={{
            flex: 1, height: 6,
            background: p.status === "paga" ? "var(--success)"
              : p.status === "vencida" ? "var(--danger)"
              : p.status === "pendente" ? "var(--warning)"
              : "var(--surface-hi)",
          }} />
        ))}
      </div>

      {/* Timeline vertical */}
      <div className="r-panel" style={{ padding: "var(--rd-panel)" }}>
        {parcelas.length === 0 && (
          <div className="font-mono text-[12px] text-fg-4 py-8 text-center">
            Nenhuma parcela encontrada.
          </div>
        )}
        {parcelas.map((parcela, i) => {
          const col = parcela.status === "paga" ? "var(--success)"
            : parcela.status === "vencida" ? "var(--danger)"
            : parcela.status === "pendente" ? "var(--warning)"
            : "var(--fg-5)"
          return (
            <div key={parcela.id} style={{ display: "flex", gap: 16 }}>
              {/* Coluna esquerda: ponto quadrado + linha vertical */}
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                <span style={{
                  width: 12, height: 12, flexShrink: 0, marginTop: 3,
                  background: parcela.status === "futura" ? "transparent" : col,
                  border: parcela.status === "futura" ? "1px solid var(--fg-5)" : "none",
                  // Quadrado — sem border-radius (Obsidian Blueprint)
                }} />
                {i < parcelas.length - 1 && (
                  <span style={{ flex: 1, width: 1, background: "var(--border-3)", minHeight: 28 }} />
                )}
              </div>

              {/* Coluna direita: label + badge + botão + meta */}
              <div style={{ flex: 1, paddingBottom: i < parcelas.length - 1 ? 18 : 0 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 }}>
                  <span className="font-display font-bold text-fg-1" style={{ fontSize: 15 }}>
                    Parcela {String(parcela.numero).padStart(2, "0")}
                  </span>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    {(parcela.status === "pendente" || parcela.status === "vencida") && (
                      <button
                        onClick={() => marcarComoPaga(parcela)}
                        aria-label={`Registrar pagamento da parcela ${parcela.numero}`}
                        style={{
                          all: "unset", cursor: "pointer",
                          fontFamily: "var(--font-mono)", fontSize: 10, fontWeight: 700,
                          color: "var(--success)", letterSpacing: "0.5px", textTransform: "uppercase",
                          border: "1px solid color-mix(in oklch, var(--success) 40%, transparent)",
                          padding: "5px 9px",
                        }}
                      >
                        ✓ Registrar
                      </button>
                    )}
                    <StatusBadge status={parcela.status} />
                  </div>
                </div>
                <div className="r-meta" style={{ marginTop: 5, display: "flex", gap: 14, flexWrap: "wrap" }}>
                  <span>Venc · <span style={{ color: parcela.status === "vencida" ? "var(--danger-fg)" : "var(--fg-3)" }}>{fmtData(parcela.data_vencimento)}</span></span>
                  <span>Pago · <span style={{ color: parcela.data_pagamento ? "var(--success)" : "var(--fg-5)" }}>{parcela.data_pagamento ? fmtData(parcela.data_pagamento) : "—"}</span></span>
                  <span style={{ color: "var(--fg-2)" }}>{fmtBRL(unidade?.valor_mensal)}</span>
                </div>
              </div>
            </div>
          )
        })}
      </div>

    </div>
  )
}
