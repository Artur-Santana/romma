import Link from "next/link"
import {
  getUnidades,
  getContratos,
  getLocatarios,
  getEdificios,
  getParcelasByContratos,
} from "@/lib/queries-server"
import { createServer } from "@/lib/supabase-server"
import { fmtBRL, fmtData } from "@/lib/utils"
import StatusBadge from "@/components/ui/StatusBadge"
import RealtimeDot from "@/components/ui/RealtimeDot"

const MS_POR_DIA = 86_400_000

function getInitials(name) {
  if (!name) return "?"
  return name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase()
}

export default async function Dashboard() {
  let unidades = [], contratos = [], locatarios = [], edificios = [], parcelas = []
  let proprietarioNome = "—"
  let erro = null

  try {
    ;[unidades, contratos, locatarios, edificios] = await Promise.all([
      getUnidades(), getContratos(), getLocatarios(), getEdificios(),
    ])
    const contratosAtivosIds = contratos.filter(c => c.status === "ativo").map(c => c.id)
    parcelas = await getParcelasByContratos(contratosAtivosIds)

    const supabase = await createServer()
    const { data: { user } } = await supabase.auth.getUser()
    proprietarioNome = user?.user_metadata?.full_name ?? user?.email ?? "—"
  } catch (e) {
    erro = e.message
  }

  if (erro) {
    return (
      <div style={{ padding: 48, color: "var(--danger)", fontFamily: "var(--font-mono)", fontSize: 13 }}>
        Erro ao carregar dashboard. Tente novamente.
      </div>
    )
  }

  // Métricas
  const disponiveis = unidades.filter(u => u.status === "disponivel").length
  const alugadas    = unidades.filter(u => u.status === "alugada").length
  const ativos      = contratos.filter(c => c.status === "ativo").length
  const mrr         = contratos
    .filter(c => c.status === "ativo")
    .reduce((sum, c) => sum + (unidades.find(u => u.id === c.unidade_id)?.valor_mensal ?? 0), 0)
  const totalPendente = parcelas.reduce((s, p) => {
    const contrato = contratos.find(c => c.id === p.contrato_id)
    const unidade  = unidades.find(u => u.id === contrato?.unidade_id)
    return s + (unidade?.valor_mensal ?? 0)
  }, 0)
  const vencendoContratos = contratos.filter(c => {
    if (c.status !== "ativo") return false
    const diff = (new Date(c.data_fim) - new Date()) / MS_POR_DIA
    return diff >= 0 && diff <= 7
  })
  const pctOcupacao = unidades.length ? Math.round((alugadas / unidades.length) * 100) : 0

  const isEmpty = edificios.length === 0

  const metricas = [
    { idx: "01", label: "Ocupação",           value: `${pctOcupacao}%`,        sub: `${alugadas} de ${unidades.length} unidades` },
    { idx: "02", label: "Contratos Ativos",   value: ativos,                   sub: `${fmtBRL(mrr)} / mês` },
    { idx: "03", label: "Parcelas Pendentes", value: parcelas.length,          sub: fmtBRL(totalPendente) },
    { idx: "04", label: "Vencendo em 7 dias", value: vencendoContratos.length, sub: `${vencendoContratos.length} contrato(s)`, warn: true },
  ]

  if (isEmpty) {
    return (
      <div className="romma-page" style={{ padding: 48, background: "var(--background)", minHeight: "100%" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 48 }}>
          <span className="eyebrow eyebrow--indigo">CONSOLE.OS // VISÃO DO PROPRIETÁRIO</span>
          <h2 className="font-display" style={{ fontWeight: 700, fontSize: 48, letterSpacing: -2.4, color: "var(--fg-1)", margin: 0, lineHeight: 1 }}>Visão Geral.</h2>
        </div>

        {/* Métricas ghosted */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", border: "1px solid var(--border-3)", marginBottom: 48 }}>
          {metricas.map((m, i) => (
            <div key={m.idx} style={{ padding: 28, borderRight: i < 3 ? "1px solid var(--border-3)" : "none", position: "relative" }}>
              <span className="font-mono" style={{ position: "absolute", top: 16, right: 16, fontSize: 9, color: "var(--fg-5)" }}>{m.idx}</span>
              <div className="font-mono" style={{ fontSize: 11, color: "var(--fg-5)", letterSpacing: 1, textTransform: "uppercase", marginBottom: 12 }}>{m.label}</div>
              <div className="font-display" style={{ fontWeight: 700, fontSize: 48, letterSpacing: -2.4, color: "var(--fg-5)", lineHeight: 1 }}>—</div>
            </div>
          ))}
        </div>

        {/* Setup wizard */}
        <div style={{ border: "1px solid var(--indigo)", padding: 64, maxWidth: 720 }}>
          <span className="eyebrow eyebrow--indigo" style={{ marginBottom: 16 }}>SETUP.SEQUENCE</span>
          <h3 className="font-display" style={{ fontWeight: 700, fontSize: 32, letterSpacing: -1.5, color: "var(--fg-1)", margin: "0 0 8px" }}>Construa seu sistema.</h3>
          <p style={{ fontSize: 14, color: "var(--fg-4)", margin: "0 0 40px" }}>Quatro etapas, zero atalhos. Configure o Romma para começar a gerir suas unidades.</p>
          <div style={{ border: "1px solid var(--border-3)" }}>
            {[
              { num: "01", label: "Cadastrar primeiro Edifício", href: "/dashboard/unidades", active: true },
              { num: "02", label: "Adicionar Unidades",         href: null,                  active: false },
              { num: "03", label: "Convidar Locatário",         href: null,                  active: false },
              { num: "04", label: "Criar primeiro Contrato",    href: null,                  active: false },
            ].map((step, i) => {
              const inner = (
                <>
                  <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
                    <span className="font-mono" style={{ fontSize: 10, color: step.active ? "var(--indigo)" : "var(--fg-5)" }}>{step.num}</span>
                    <span style={{ fontWeight: 700, fontSize: 13, color: step.active ? "var(--fg-1)" : "var(--fg-5)", letterSpacing: 0.5, textTransform: "uppercase" }}>{step.label}</span>
                  </div>
                  <span className="font-mono" style={{ fontSize: 12, color: step.active ? "var(--indigo)" : "var(--fg-5)" }}>{step.active ? "→" : "—"}</span>
                </>
              )
              const rowStyle = {
                display: "flex", alignItems: "center", justifyContent: "space-between",
                padding: "20px 24px",
                borderTop: i > 0 ? "1px solid var(--border-3)" : "none",
              }
              return step.active ? (
                <Link key={step.num} href={step.href} style={{ ...rowStyle, textDecoration: "none" }}>{inner}</Link>
              ) : (
                <div key={step.num} style={rowStyle}>{inner}</div>
              )
            })}
          </div>
        </div>
      </div>
    )
  }

  const contratosRecentes = contratos.filter(c => c.status === "ativo").slice(0, 4)
  const parcelasRecentes  = parcelas.slice(0, 5)

  return (
    <div className="romma-page" style={{ padding: "48px 48px 80px", background: "var(--background)", minHeight: "100%" }}>

      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 48 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <span className="eyebrow eyebrow--indigo">CONSOLE.OS // VISÃO DO PROPRIETÁRIO</span>
          <h2 className="font-display" style={{ fontWeight: 700, fontSize: 48, letterSpacing: -2.4, color: "var(--fg-1)", margin: 0, lineHeight: 1 }}>Visão Geral.</h2>
          <div style={{ display: "flex", alignItems: "center", gap: 16, marginTop: 4 }}>
            <span className="font-mono" style={{ fontSize: 12, color: "var(--fg-3)" }}>OPERADOR · {proprietarioNome}</span>
            <span style={{ width: 1, height: 12, background: "var(--border-2)" }} />
            <span className="font-mono" style={{ fontSize: 12, color: "var(--fg-3)" }}>{edificios.length} EDIFÍCIOS · {unidades.length} UNIDADES</span>
          </div>
        </div>
        <RealtimeDot label="REALTIME · GRID.OS.ALPHA" />
      </div>

      {/* Metrics Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", border: "1px solid var(--border-3)", marginBottom: 48 }}>
        {metricas.map((m, i) => (
          <div key={m.idx} style={{
            padding: 28,
            display: "flex", flexDirection: "column", gap: 8,
            position: "relative",
            borderRight: i < 3 ? "1px solid var(--border-3)" : "none",
            background: m.warn ? "var(--warning-bg)" : "transparent",
          }}>
            <span className="font-mono" style={{ position: "absolute", top: 16, right: 16, fontSize: 9, color: "var(--fg-5)" }}>{m.idx}</span>
            <div className="font-mono" style={{ fontSize: 11, color: m.warn ? "var(--warning)" : "var(--fg-4)", letterSpacing: 1, textTransform: "uppercase" }}>{m.label}</div>
            <div className="font-display" style={{ fontWeight: 700, fontSize: 48, letterSpacing: -2.4, color: m.warn ? "var(--warning)" : "var(--fg-1)", lineHeight: 1 }}>{m.value}</div>
            <div className="font-mono" style={{ fontSize: 11, color: m.warn ? "var(--warning)" : "var(--fg-4)" }}>{m.sub}</div>
          </div>
        ))}
      </div>

      {/* Vencendo Banner */}
      {vencendoContratos.length > 0 && (
        <div style={{
          background: "var(--warning-bg)", borderLeft: "2px solid var(--warning)",
          padding: "16px 24px", marginBottom: 32,
          display: "flex", justifyContent: "space-between", alignItems: "center",
        }}>
          <div>
            <span className="eyebrow eyebrow--warning" style={{ marginBottom: 4 }}>ATENÇÃO · CONTRATOS A VENCER</span>
            <span style={{ fontSize: 13, color: "var(--warning)" }}>
              {vencendoContratos.map(c => {
                const loc  = c.locatarios?.nome_razao_social ?? locatarios.find(l => l.id === c.locatario_id)?.nome_razao_social ?? "—"
                const uni  = c.unidades?.nome ?? unidades.find(u => u.id === c.unidade_id)?.nome ?? "—"
                const diff = Math.ceil((new Date(c.data_fim) - new Date()) / MS_POR_DIA)
                return `${loc} · ${uni} — vence em ${diff} dia(s) (${fmtData(c.data_fim)})`
              }).join(" · ")}
            </span>
          </div>
          <Link
            href="/dashboard/contratos"
            style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--warning)", border: "1px solid var(--warning)", padding: "8px 16px", letterSpacing: 0.5, flexShrink: 0, marginLeft: 24, textDecoration: "none" }}
          >
            Renovar →
          </Link>
        </div>
      )}

      {/* Two-column section */}
      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 32, marginBottom: 48 }}>

        {/* Left: Contratos Recentes */}
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 20 }}>
            <div>
              <span className="eyebrow eyebrow--indigo" style={{ marginBottom: 6 }}>SISTEMA.01</span>
              <h5 className="font-display" style={{ fontWeight: 700, fontSize: 24, letterSpacing: -0.5, color: "var(--fg-1)", margin: 0 }}>Contratos Recentes</h5>
            </div>
            <Link href="/dashboard/contratos" className="font-mono" style={{ fontSize: 12, color: "var(--indigo)", textDecoration: "none", letterSpacing: 0.5 }}>Ver todos →</Link>
          </div>
          <div style={{ background: "var(--surface)", border: "1px solid var(--border-3)" }}>
            <div style={{ display: "grid", gridTemplateColumns: "2.4fr 1fr 1fr 1.2fr", padding: "12px 20px", background: "oklch(0.26 0 0)" }}>
              {["Locatário · Unidade", "Valor mensal", "Término", "Status"].map(col => (
                <span key={col} className="font-mono" style={{ fontSize: 10, color: "var(--fg-4)", letterSpacing: 1, textTransform: "uppercase" }}>{col}</span>
              ))}
            </div>
            {contratosRecentes.length === 0 && (
              <div className="font-mono" style={{ padding: "24px 20px", fontSize: 12, color: "var(--fg-5)" }}>Nenhum contrato ativo.</div>
            )}
            {contratosRecentes.map(c => {
              const locNome = c.locatarios?.nome_razao_social ?? locatarios.find(l => l.id === c.locatario_id)?.nome_razao_social ?? "—"
              const uni     = unidades.find(u => u.id === c.unidade_id)
              const edi     = edificios.find(e => e.id === uni?.edificio_id)
              const uniNome = c.unidades?.nome ?? uni?.nome ?? "—"
              const ediNome = edi?.nome ?? "—"
              const diff    = (new Date(c.data_fim) - new Date()) / MS_POR_DIA
              const isExpiring = diff >= 0 && diff <= 7
              return (
                <div key={c.id} style={{ display: "grid", gridTemplateColumns: "2.4fr 1fr 1fr 1.2fr", padding: "16px 20px", borderTop: "1px solid var(--border-3)", alignItems: "center" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <div style={{ width: 32, height: 32, background: "var(--surface-hi)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <span className="font-mono" style={{ fontSize: 10, color: "var(--fg-2)", fontWeight: 700 }}>{getInitials(locNome)}</span>
                    </div>
                    <div>
                      <div style={{ fontSize: 13, color: "var(--fg-1)", fontWeight: 600 }}>{locNome}</div>
                      <div className="font-mono" style={{ fontSize: 10, color: "var(--fg-4)" }}>{uniNome} · {ediNome}</div>
                    </div>
                  </div>
                  <span className="font-mono" style={{ fontSize: 13, color: "var(--fg-2)" }}>{fmtBRL(uni?.valor_mensal)}</span>
                  <span className="font-mono" style={{ fontSize: 12, color: isExpiring ? "var(--warning)" : "var(--fg-3)" }}>{fmtData(c.data_fim)}</span>
                  <StatusBadge status={isExpiring ? "vencendo" : c.status} />
                </div>
              )
            })}
          </div>
        </div>

        {/* Right: Parcelas */}
        <div>
          <div style={{ marginBottom: 20 }}>
            <span className="eyebrow eyebrow--indigo" style={{ marginBottom: 6 }}>SISTEMA.02</span>
            <h5 className="font-display" style={{ fontWeight: 700, fontSize: 24, letterSpacing: -0.5, color: "var(--fg-1)", margin: 0 }}>Parcelas</h5>
          </div>
          <div style={{ background: "var(--surface)", border: "1px solid var(--border-3)" }}>
            {parcelasRecentes.length === 0 && (
              <div className="font-mono" style={{ padding: "24px 20px", fontSize: 12, color: "var(--fg-5)" }}>Sem parcelas pendentes.</div>
            )}
            {parcelasRecentes.map((p, i) => {
              const contrato      = contratos.find(c => c.id === p.contrato_id)
              const loc           = locatarios.find(l => l.id === contrato?.locatario_id)
              const uni           = unidades.find(u => u.id === contrato?.unidade_id)
              const edi           = edificios.find(e => e.id === uni?.edificio_id)
              const diasRestantes = Math.ceil((new Date(p.data_vencimento) - new Date()) / MS_POR_DIA)
              const isVencida     = p.status === "vencida"
              return (
                <div key={p.id} style={{ padding: "16px 20px", borderTop: i > 0 ? "1px solid var(--border-3)" : "none", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <div style={{ fontSize: 13, color: "var(--fg-1)", fontWeight: 600 }}>{loc?.nome_razao_social ?? "—"}</div>
                    <div className="font-mono" style={{ fontSize: 10, color: "var(--fg-4)" }}>{uni?.nome ?? "—"} · {edi?.nome ?? "—"}</div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div className="font-mono" style={{ fontSize: 13, color: "var(--fg-2)" }}>{fmtBRL(uni?.valor_mensal)}</div>
                    <div className="font-mono" style={{ fontSize: 10, color: isVencida ? "var(--warning)" : "var(--fg-4)" }}>
                      {isVencida ? `${Math.abs(diasRestantes)}d atraso` : `${diasRestantes}d restantes`}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div style={{ border: "1px solid var(--border-3)", display: "grid", gridTemplateColumns: "repeat(4, 1fr)" }}>
        {[
          { code: "U+",     label: "Nova Unidade",   href: "/dashboard/unidades" },
          { code: "L+",     label: "Novo Locatário", href: "/dashboard/locatarios" },
          { code: "C+",     label: "Novo Contrato",  href: "/dashboard/contratos" },
          { code: "GRID.OS",label: "Página Pública", href: "/" },
        ].map((action, i) => (
          <Link
            key={action.code}
            href={action.href}
            className="quick-action-cell"
            style={{
              padding: "20px 24px",
              borderRight: i < 3 ? "1px solid var(--border-3)" : "none",
              display: "flex", justifyContent: "space-between", alignItems: "center",
              textDecoration: "none",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
              <span className="font-mono" style={{ fontSize: 11, color: "var(--indigo)", letterSpacing: 1 }}>{action.code}</span>
              <span style={{ fontWeight: 600, fontSize: 13, color: "var(--fg-2)", letterSpacing: 0.5, textTransform: "uppercase" }}>{action.label}</span>
            </div>
            <span className="font-mono" style={{ fontSize: 12, color: "var(--fg-4)" }}>→</span>
          </Link>
        ))}
      </div>

    </div>
  )
}
