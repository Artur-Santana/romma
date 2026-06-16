import Link from "next/link"
import {
  getUnidades,
  getContratos,
  getLocatarios,
  getEdificios,
  getParcelasByContratos,
  getParcelasFluxo,
} from "@/lib/queries-server"
import { aggregateFluxo } from "@/lib/fluxo"
import { createServer } from "@/lib/supabase-server"
import { cn, fmtBRL, fmtData } from "@/lib/utils"
import StatusBadge from "@/components/ui/StatusBadge"
import RealtimeDot from "@/components/ui/RealtimeDot"

const MS_POR_DIA = 86_400_000

function getInitials(name) {
  if (!name) return "?"
  return name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase()
}

function OccupancyBar({ alugadas, total }) {
  return (
    <div style={{ display: "flex", gap: 3 }}>
      {Array.from({ length: total }).map((_, i) => (
        <div
          key={i}
          style={{
            flex: 1,
            height: 28,
            background: i < alugadas ? "var(--color-primary-hover)" : "var(--surface-hi)",
            border:     i < alugadas ? "none" : "1px solid var(--border-3)",
          }}
        />
      ))}
    </div>
  )
}

function fmtChartVal(raw) {
  if (!raw) return null
  if (raw >= 1000) return `R$${Math.round(raw / 1000)}k`
  return `R$${raw}`
}

function CashFlowChart({ fluxo, testId }) {
  return (
    <div
      data-testid={testId}
      style={{ display: "flex", gap: 6, height: "100%", alignItems: "stretch" }}
    >
      {fluxo.map((f, i) => (
        <div
          key={f.key}
          className="chart-col"
          style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", position: "relative" }}
        >
          {/* previsto (total recebível) at top */}
          <div style={{ height: 20, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 4 }}>
            {f.rawPrevisto > 0 && (
              <span style={{ fontSize: 12, fontFamily: "var(--font-mono)", color: "var(--fg-4)", whiteSpace: "nowrap" }}>
                {fmtChartVal(f.rawPrevisto)}
              </span>
            )}
          </div>
          {/* bar area */}
          <div style={{ position: "relative", width: "100%", flex: 1, display: "flex", alignItems: "flex-end", justifyContent: "center" }}>
            {/* previsto ghost */}
            <div style={{
              position: "absolute", bottom: 0, width: "62%",
              height: `${Math.max(f.previsto, f.previsto > 0 ? 4 : 0)}%`,
              background: "oklch(1 0 0 / 0.10)",
              border: "1px solid oklch(1 0 0 / 0.22)",
            }} />
            {/* recebido solid — value inside when tall enough */}
            <div
              className="chart-bar"
              style={{
                position: "relative",
                width: "62%",
                height: `${f.recebido}%`,
                background: f.peak ? "var(--highlight)" : "var(--color-primary-hover)",
                boxShadow: f.peak ? "0 0 8px 0 var(--highlight)" : "none",
                transformOrigin: "bottom",
                animation: `rGrowY var(--dur-base) var(--ease-crisp)`,
                animationDelay: `${i * 60}ms`,
                animationFillMode: "none",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                overflow: "hidden",
              }}
            >
              {f.recebido > 24 && (
                <span style={{
                  fontSize: 12, fontFamily: "var(--font-mono)", whiteSpace: "nowrap",
                  color: f.peak ? "oklch(0.25 0.05 70)" : "oklch(0 0 0 / 0.6)",
                }}>
                  {fmtChartVal(f.rawRecebido)}
                </span>
              )}
            </div>
          </div>
          {/* month label */}
          <div style={{ height: 18, display: "flex", alignItems: "center", justifyContent: "center", marginTop: 5 }}>
            <span style={{ fontSize: 12, fontFamily: "var(--font-mono)", color: "var(--fg-3)" }}>{f.mes}</span>
          </div>
          {/* hover tooltip */}
          <div className="chart-tooltip">
            <div style={{ color: "var(--fg-2)", fontWeight: 700, marginBottom: 2 }}>
              {f.mes.charAt(0).toUpperCase() + f.mes.slice(1)}
            </div>
            <div>Recebido:&nbsp;<span style={{ color: "var(--fg-1)" }}>{fmtChartVal(f.rawRecebido) ?? "R$0"}</span></div>
            <div>Previsto:&nbsp;<span style={{ color: "var(--fg-1)" }}>{fmtChartVal(f.rawPrevisto) ?? "R$0"}</span></div>
          </div>
        </div>
      ))}
    </div>
  )
}

export default async function Dashboard() {
  let unidades = [], contratos = [], locatarios = [], edificios = [], parcelas = []
  let parcelasFluxo = []
  let proprietarioNome = "—"
  let erro = null

  try {
    ;[unidades, contratos, locatarios, edificios, parcelasFluxo] = await Promise.all([
      getUnidades(), getContratos(), getLocatarios(), getEdificios(), getParcelasFluxo(),
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
      <div className="p-12 text-danger-fg font-mono text-[13px]">
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

  const todayStr = new Date().toISOString().slice(0, 10)
  const fluxoData = aggregateFluxo(parcelasFluxo, contratos, unidades, todayStr)

  const isEmpty = edificios.length === 0

  const metricas = [
    { idx: "01", label: "Ocupação",           value: `${pctOcupacao}%`,                                           sub: `${alugadas} de ${unidades.length} unidades` },
    { idx: "02", label: "MRR",                value: mrr >= 1000 ? `R$${(mrr/1000).toFixed(1)}k` : fmtBRL(mrr), sub: `${ativos} contrato(s) ativo(s)` },
    { idx: "03", label: "Receita Esperada",   value: fmtBRL(totalPendente),                                       sub: `${parcelas.length} parcela(s) em aberto` },
    { idx: "04", label: "Vencendo em 7 dias", value: vencendoContratos.length,                                    sub: `${vencendoContratos.length} contrato(s)`, warn: true },
  ]

  if (isEmpty) {
    return (
      <>
        <div className="romma-desktop-only">
          <div className="romma-page p-12 bg-background min-h-full">
            <div className="flex flex-col gap-3 mb-12">
              <span className="eyebrow eyebrow--indigo">CONSOLE.OS // VISÃO DO PROPRIETÁRIO</span>
              <h2 className="font-display font-bold text-[48px] leading-none tracking-[-2.4px] text-fg-1 m-0">Visão Geral.</h2>
            </div>

            {/* Métricas ghosted — static 4 cells (empty state, no data) */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)" }} className="border border-border-3 mb-12">
              {[
                { idx: "01", label: "Ocupação" },
                { idx: "02", label: "MRR" },
                { idx: "03", label: "Receita Esperada" },
                { idx: "04", label: "Vencendo em 7 dias" },
              ].map((m, i) => (
                <div key={m.idx} className={cn("p-7 relative", i < 3 ? "border-r border-border-3" : "")}>
                  <span className="font-mono absolute top-4 right-4 text-[9px] text-fg-5">{m.idx}</span>
                  <div className="font-mono text-[11px] text-fg-5 tracking-[1px] uppercase mb-3">{m.label}</div>
                  <div className="font-display font-bold text-[48px] leading-none tracking-[-2.4px] text-fg-5">—</div>
                </div>
              ))}
            </div>

            {/* Setup wizard */}
            <div className="border border-indigo p-16 max-w-[720px]">
              <span className="eyebrow eyebrow--indigo mb-4">SETUP.SEQUENCE</span>
              <h3 className="font-display font-bold text-[32px] tracking-[-1.5px] text-fg-1 m-0 mb-2">Construa seu sistema.</h3>
              <p className="text-[18px] text-fg-4 m-0 mb-10">Quatro etapas, zero atalhos. Configure o Romma para começar a gerir suas unidades.</p>
              <div className="border border-border-3">
                {[
                  { num: "01", label: "Cadastrar primeiro Edifício", href: "/dashboard/edificios", active: true },
                  { num: "02", label: "Adicionar Unidades",         href: null,                  active: false },
                  { num: "03", label: "Convidar Locatário",         href: null,                  active: false },
                  { num: "04", label: "Criar primeiro Contrato",    href: null,                  active: false },
                ].map((step, i) => {
                  const inner = (
                    <>
                      <div className="flex items-center gap-5">
                        <span className={cn("font-mono text-[10px]", step.active ? "text-indigo" : "text-fg-5")}>{step.num}</span>
                        <span className={cn("font-bold text-[18px] tracking-[0.5px] uppercase", step.active ? "text-fg-1" : "text-fg-5")}>{step.label}</span>
                      </div>
                      <span className={cn("font-mono text-[12px]", step.active ? "text-indigo" : "text-fg-5")}>{step.active ? "→" : "—"}</span>
                    </>
                  )
                  const rowCn = cn("flex items-center justify-between px-6 py-5 no-underline", i > 0 ? "border-t border-border-3" : "")
                  return step.active ? (
                    <Link key={step.num} href={step.href} className={rowCn}>{inner}</Link>
                  ) : (
                    <div key={step.num} className={rowCn}>{inner}</div>
                  )
                })}
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col md:hidden">
          <div className="romma-mobile-pane flex-1 overflow-auto p-5">
            <div className="border border-indigo p-6">
              <span className="eyebrow eyebrow--indigo mb-3">SETUP.SEQUENCE</span>
              <h3 className="font-display font-bold text-[28px] tracking-[-1.4px] text-fg-1 m-0 mb-2 leading-[1.1]">Construa seu sistema.</h3>
              <p className="text-[13px] text-fg-3 m-0 mb-6">Configure o Romma para começar a gerir suas unidades.</p>
              <Link
                href="/dashboard/edificios"
                className="block bg-indigo py-[18px] px-6 no-underline font-mono text-[14px] text-white tracking-[1px] uppercase text-center"
              >
                Cadastrar Edifício →
              </Link>
            </div>
          </div>
        </div>
      </>
    )
  }

  const contratosRecentes = contratos.filter(c => c.status === "ativo").slice(0, 4)
  const contratosRecentesMobile = contratos.filter(c => c.status === "ativo").slice(0, 3)
  const parcelasRecentes  = parcelas.slice(0, 5)

  return (
    <>
      <div className="romma-desktop-only">
        <div className="romma-page p-12 pb-20 bg-background min-h-full">

          {/* Header */}
          <div className="flex justify-between items-end mb-12">
            <div className="flex flex-col gap-3">
              <span className="eyebrow eyebrow--indigo">CONSOLE.OS // VISÃO DO PROPRIETÁRIO</span>
              <h2 className="font-display font-bold text-[48px] leading-none tracking-[-2.4px] text-fg-1 m-0">Visão Geral.</h2>
              <div className="flex items-center gap-4 mt-1">
                <span className="font-mono text-[12px] text-fg-3">OPERADOR · {proprietarioNome}</span>
                <span className="w-px h-3 bg-[var(--border-2)]" />
                <span className="font-mono text-[12px] text-fg-3">{edificios.length} EDIFÍCIOS · {unidades.length} UNIDADES</span>
              </div>
            </div>
            <RealtimeDot label="REALTIME · GRID.OS.ALPHA" />
          </div>

          {/* Hero Grid — Variant B: 1.55fr occupancy + 1fr stacked metrics */}
          <div style={{ display: "grid", gridTemplateColumns: "1.55fr 1fr", gap: "var(--rd-block-sm)" }} className="mb-12">
            {/* Left: occupancy hero + OccupancyBar + divider + CashFlowChart */}
            <div className="bg-surface border border-border-3" style={{ padding: "var(--rd-panel)", display: "flex", flexDirection: "column" }}>
              <div>
                <div className="flex justify-between items-start mb-[18px]">
                  <div>
                    <span className="eyebrow eyebrow--indigo mb-2">Taxa de Ocupação</span>
                    <div style={{ display: "flex", alignItems: "baseline", gap: 12 }}>
                      <span className="r-metric" style={{ fontSize: 56 }}>{pctOcupacao}%</span>
                      <span className="r-data" style={{ color: "var(--fg-4)" }}>{alugadas}/{unidades.length} unidades</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="eyebrow mb-2">Disponíveis</span>
                    <span className="r-metric" style={{ fontSize: 34, color: "var(--success)" }}>{disponiveis}</span>
                  </div>
                </div>
                <OccupancyBar alugadas={alugadas} total={unidades.length} />
                <div style={{ height: 1, background: "var(--border-3)", margin: "20px 0 18px" }} />
                <span className="r-eyebrow gold" style={{ display: "block", marginBottom: 12 }}>Previsão de Fluxo · 2026</span>
              </div>
              {/* chart fills remaining panel height */}
              <div style={{ flex: 1, minHeight: 160 }}>
                <CashFlowChart fluxo={fluxoData} testId="cashflow-chart" />
              </div>
            </div>
            {/* Right: stacked metrics 02, 03, 04 */}
            <div style={{ display: "flex", flexDirection: "column", gap: "var(--rd-block-sm)" }}>
              <div className="border border-border-3" style={{ display: "grid", gridTemplateRows: "1fr 1fr" }}>
                {/* MetricCell 02 — MRR */}
                <div className="border-b border-border-3 p-7 flex flex-col gap-2 relative">
                  <span className="font-mono absolute top-4 right-4 text-[9px] text-fg-5">02</span>
                  <div className="font-mono text-[11px] text-fg-4 tracking-[1px] uppercase">MRR</div>
                  <div className="font-display font-bold text-[48px] leading-none tracking-[-2.4px] text-fg-1">
                    {mrr >= 1000 ? `R$${(mrr/1000).toFixed(1)}k` : fmtBRL(mrr)}
                  </div>
                  <div className="font-mono text-[11px] text-fg-4">{ativos} contrato(s) ativo(s)</div>
                </div>
                {/* MetricCell 03 — Receita Esperada */}
                <div className="p-7 flex flex-col gap-2 relative">
                  <span className="font-mono absolute top-4 right-4 text-[9px] text-fg-5">03</span>
                  <div className="font-mono text-[11px] text-fg-4 tracking-[1px] uppercase">Receita Esperada</div>
                  <div className="font-display font-bold text-[48px] leading-none tracking-[-2.4px] text-fg-1">{fmtBRL(totalPendente)}</div>
                  <div className="font-mono text-[11px] text-fg-4">{parcelas.length} parcela(s) em aberto</div>
                </div>
              </div>
              {/* MetricCell 04 — Vencendo em 7 dias */}
              <div className="border border-border-3 bg-warning-bg p-7 flex flex-col gap-2 relative">
                <span className="font-mono absolute top-4 right-4 text-[9px] text-fg-5">04</span>
                <div className="font-mono text-[11px] text-warning tracking-[1px] uppercase">Vencendo em 7 dias</div>
                <div className="font-display font-bold text-[48px] leading-none tracking-[-2.4px] text-warning">{vencendoContratos.length}</div>
                <div className="font-mono text-[11px] text-warning">{vencendoContratos.length} contrato(s)</div>
              </div>
            </div>
          </div>

          {/* Vencendo Banner */}
          {vencendoContratos.length > 0 && (
            <div className="bg-warning-bg border-l-2 border-warning px-6 py-4 mb-8 flex justify-between items-center">
              <div>
                <span className="eyebrow eyebrow--warning mb-2">ATENÇÃO · CONTRATOS A VENCER</span>
                <div className="flex flex-col gap-1">
                  {vencendoContratos.map(c => {
                    const loc  = c.locatarios?.nome_razao_social ?? locatarios.find(l => l.id === c.locatario_id)?.nome_razao_social ?? "—"
                    const uni  = c.unidades?.nome ?? unidades.find(u => u.id === c.unidade_id)?.nome ?? "—"
                    const diff = Math.ceil((new Date(c.data_fim) - new Date()) / MS_POR_DIA)
                    return (
                      <Link key={c.id} href={`/dashboard/contratos/${c.id}`} className="text-[14px] text-warning no-underline hover:underline">
                        {loc} · {uni} — vence em {diff} dia(s) ({fmtData(c.data_fim)})
                      </Link>
                    )
                  })}
                </div>
              </div>
              <Link
                href="/dashboard/contratos"
                className="font-mono text-[12px] text-warning border border-warning px-4 py-2 tracking-[0.5px] shrink-0 ml-6 no-underline"
              >
                Renovar →
              </Link>
            </div>
          )}

          {/* Two-column section */}
          <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr" }} className="gap-8 mb-12">

            {/* Left: Contratos Recentes */}
            <div>
              <div className="flex justify-between items-end mb-5">
                <div>
                  <span className="eyebrow eyebrow--indigo mb-1.5">SISTEMA.01</span>
                  <h5 className="font-display font-bold text-[30px] tracking-[-0.5px] text-fg-1 m-0">Contratos Recentes</h5>
                </div>
                <Link href="/dashboard/contratos" className="font-mono text-[12px] text-indigo no-underline tracking-[0.5px]">Ver todos →</Link>
              </div>
              <div className="bg-surface border border-border-3">
                <div style={{ display: "grid", gridTemplateColumns: "2.4fr 1fr 1fr 1.2fr" }} className="px-5 py-3 bg-[var(--surface-hi)]">
                  {["Locatário · Unidade", "Valor mensal", "Término", "Status"].map(col => (
                    <span key={col} className="font-mono text-[10px] text-fg-4 tracking-[1px] uppercase">{col}</span>
                  ))}
                </div>
                {contratosRecentes.length === 0 && (
                  <div className="font-mono px-5 py-6 text-[12px] text-fg-5">Nenhum contrato ativo.</div>
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
                    <Link key={c.id} href={`/dashboard/contratos/${c.id}`} style={{ display: "grid", gridTemplateColumns: "2.4fr 1fr 1fr 1.2fr" }} className="px-5 py-4 border-t border-border-3 items-center no-underline hover:bg-surface-hi transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-surface-hi flex items-center justify-center shrink-0">
                          <span className="font-mono text-[10px] text-fg-2 font-bold">{getInitials(locNome)}</span>
                        </div>
                        <div>
                          <div className="text-[18px] text-fg-1 font-semibold">{locNome}</div>
                          <div className="font-mono text-[10px] text-fg-4">{uniNome} · {ediNome}</div>
                        </div>
                      </div>
                      <span className="font-mono text-[14px] text-fg-2">{fmtBRL(uni?.valor_mensal)}</span>
                      <span className={cn("font-mono text-[14px]", isExpiring ? "text-warning" : "text-fg-3")}>{fmtData(c.data_fim)}</span>
                      <StatusBadge status={isExpiring ? "vencendo" : c.status} />
                    </Link>
                  )
                })}
              </div>
            </div>

            {/* Right: Parcelas */}
            <div>
              <div className="mb-5">
                <span className="eyebrow eyebrow--indigo mb-1.5">SISTEMA.02</span>
                <h5 className="font-display font-bold text-[30px] tracking-[-0.5px] text-fg-1 m-0">Parcelas</h5>
              </div>
              <div className="bg-surface border border-border-3">
                {parcelasRecentes.length === 0 && (
                  <div className="font-mono px-5 py-6 text-[12px] text-fg-5">Sem parcelas pendentes.</div>
                )}
                {parcelasRecentes.map((p, i) => {
                  const contrato      = contratos.find(c => c.id === p.contrato_id)
                  const loc           = locatarios.find(l => l.id === contrato?.locatario_id)
                  const uni           = unidades.find(u => u.id === contrato?.unidade_id)
                  const edi           = edificios.find(e => e.id === uni?.edificio_id)
                  const diasRestantes = Math.ceil((new Date(p.data_vencimento) - new Date()) / MS_POR_DIA)
                  const isVencida     = p.status === "vencida"
                  return (
                    <Link key={p.id} href={`/dashboard/contratos/${p.contrato_id}`} className={cn("px-5 py-4 flex justify-between items-center no-underline hover:bg-surface-hi transition-colors", i > 0 ? "border-t border-border-3" : "")}>
                      <div>
                        <div className="text-[18px] text-fg-1 font-semibold">{loc?.nome_razao_social ?? "—"}</div>
                        <div className="font-mono text-[10px] text-fg-4">{uni?.nome ?? "—"} · {edi?.nome ?? "—"}</div>
                      </div>
                      <div className="text-right">
                        <div className="font-mono text-[14px] text-fg-2">{fmtBRL(uni?.valor_mensal)}</div>
                        <div className={cn("font-mono text-[10px]", isVencida ? "text-warning" : "text-fg-4")}>
                          {isVencida ? `${Math.abs(diasRestantes)}d atraso` : `${diasRestantes}d restantes`}
                        </div>
                      </div>
                    </Link>
                  )
                })}
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)" }} className="border border-border-3">
            {[
              { code: "U+",     label: "Nova Unidade",   href: "/dashboard/unidades" },
              { code: "L+",     label: "Novo Locatário", href: "/dashboard/locatarios" },
              { code: "C+",     label: "Novo Contrato",  href: "/dashboard/contratos" },
              { code: "GRID.OS",label: "Página Pública", href: "/" },
            ].map((action, i) => (
              <Link
                key={action.code}
                href={action.href}
                className={cn(
                  "quick-action-cell px-6 py-5 flex justify-between items-center no-underline",
                  i < 3 ? "border-r border-border-3" : ""
                )}
              >
                <div className="flex items-center gap-4">
                  <span className="font-mono text-[11px] text-indigo tracking-[1px]">{action.code}</span>
                  <span className="font-semibold text-[18px] text-fg-2 tracking-[0.5px] uppercase">{action.label}</span>
                </div>
                <span className="font-mono text-[12px] text-fg-4">→</span>
              </Link>
            ))}
          </div>

        </div>
      </div>

      {/* Mobile layout */}
      <div className="flex flex-col md:hidden">
        <div className="romma-mobile-pane flex-1 overflow-auto">

          {/* Stats row 1: Ocupação + Contratos */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr" }} className="mx-5 mt-5 border border-border-3 border-b-0">
            <div className="p-5 flex flex-col gap-1 border-r border-border-3">
              <div className="font-mono text-[10px] text-fg-4 tracking-[1px] uppercase">Ocupação</div>
              <div className="font-display font-bold text-[36px] leading-none tracking-[-1.8px] text-fg-1">{pctOcupacao}%</div>
              <div className="font-mono text-[10px] text-fg-4">{alugadas}/{unidades.length} unidades</div>
            </div>
            <div className="p-5 flex flex-col gap-1">
              <div className="font-mono text-[10px] text-fg-4 tracking-[1px] uppercase">Contratos</div>
              <div className="font-display font-bold text-[36px] leading-none tracking-[-1.8px] text-fg-1">{ativos}</div>
              <div className="font-mono text-[10px] text-fg-4">ativos</div>
            </div>
          </div>

          {/* Stats row 2: MRR + Receita Esperada */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr" }} className="mx-5 mb-6 border border-border-3">
            <div className="p-5 flex flex-col gap-1 border-r border-border-3">
              <div className="font-mono text-[10px] text-fg-4 tracking-[1px] uppercase">MRR</div>
              <div className="font-display font-bold text-[36px] leading-none tracking-[-1.8px] text-fg-1">
                {mrr >= 1000 ? `R$${(mrr / 1000).toFixed(1)}k` : fmtBRL(mrr)}
              </div>
              <div className="font-mono text-[10px] text-fg-4">/ mês</div>
            </div>
            <div className="p-5 flex flex-col gap-1">
              <div className="font-mono text-[10px] text-warning tracking-[1px] uppercase">Receita Esperada</div>
              <div className="font-display font-bold text-[36px] leading-none tracking-[-1.8px] text-warning">{fmtBRL(totalPendente)}</div>
              <div className="font-mono text-[10px] text-warning">{parcelas.length} parcela(s) em aberto</div>
            </div>
          </div>

          {/* Vencendo banner mobile */}
          {vencendoContratos.length > 0 && (
            <div className="bg-warning-bg border-l-2 border-warning px-5 py-[14px] mx-5 mb-6">
              <span className="eyebrow eyebrow--warning mb-1">ALERTA · VENCIMENTO PRÓXIMO</span>
              <span className="text-[12px] text-warning block">
                {(() => {
                  const c = vencendoContratos[0]
                  const loc  = c.locatarios?.nome_razao_social ?? locatarios.find(l => l.id === c.locatario_id)?.nome_razao_social ?? "—"
                  const diff = Math.ceil((new Date(c.data_fim) - new Date()) / MS_POR_DIA)
                  return `${loc} — vence em ${diff} dia(s)`
                })()}
                {vencendoContratos.length > 1 && ` +${vencendoContratos.length - 1}`}
              </span>
            </div>
          )}

          {/* Contratos recentes mobile */}
          <div className="mx-5 mb-6">
            <div className="flex justify-between items-center mb-3">
              <span className="eyebrow eyebrow--indigo">SISTEMA.01 · CONTRATOS</span>
              <Link href="/dashboard/contratos" className="font-mono text-[11px] text-indigo no-underline">Todos →</Link>
            </div>
            <div className="bg-surface border border-border-3">
              {contratosRecentesMobile.length === 0 && (
                <div className="font-mono px-4 py-5 text-[11px] text-fg-5">Nenhum contrato ativo.</div>
              )}
              {contratosRecentesMobile.map((c, i) => {
                const locNome = c.locatarios?.nome_razao_social ?? locatarios.find(l => l.id === c.locatario_id)?.nome_razao_social ?? "—"
                const uni     = unidades.find(u => u.id === c.unidade_id)
                const uniNome = c.unidades?.nome ?? uni?.nome ?? "—"
                return (
                  <div key={c.id} className={cn("p-4 flex flex-col gap-1.5", i > 0 ? "border-t border-border-3" : "")}>
                    <div className="flex justify-between items-center">
                      <span className="text-[13px] text-fg-1 font-medium">{locNome}</span>
                      <span className="font-mono text-[12px] text-fg-1">{fmtBRL(uni?.valor_mensal)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="font-mono text-[10px] text-fg-4">{uniNome} · {fmtData(c.data_fim)}</span>
                      <StatusBadge status={c.status} />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Quick actions 2x2 mobile */}
          <div className="mx-5 mb-6">
            <span className="eyebrow eyebrow--indigo mb-3">AÇÕES RÁPIDAS</span>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr" }} className="border border-border-3">
              {[
                { code: "U+",     label: "Nova Unidade",   href: "/dashboard/unidades" },
                { code: "L+",     label: "Novo Locatário", href: "/dashboard/locatarios" },
                { code: "C+",     label: "Novo Contrato",  href: "/dashboard/contratos" },
                { code: "GRID",   label: "Pág. Pública",   href: "/" },
              ].map((action, i) => (
                <Link
                  key={action.code}
                  href={action.href}
                  className={cn(
                    "py-[18px] px-4 flex flex-col gap-1.5 no-underline",
                    i % 2 === 0 ? "border-r border-border-3" : "",
                    i >= 2 ? "border-t border-border-3" : ""
                  )}
                >
                  <span className="font-mono text-[9px] text-indigo">{action.code}</span>
                  <span className="font-bold text-[11px] text-fg-1 tracking-[0.5px] uppercase leading-[1.2]">{action.label}</span>
                </Link>
              ))}
            </div>
          </div>

        </div>
      </div>
    </>
  )
}
