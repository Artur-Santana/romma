"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { getContratos, getLocatarios, getUnidades, getEdificios } from "@/lib/queries-client"
import { fmtData, fmtBRL, cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import StatusBadge from "@/components/ui/StatusBadge"
import ConfirmDialog from "@/components/ui/ConfirmDialog"
import PageHeader from "@/components/ui/PageHeader"
import { gerarParcelas, criarContrato, cancelarContrato, encerrarContrato } from "@/actions/contratos"
import { toast } from "sonner"
import { Skeleton } from "@/components/ui/skeleton"

function SkeletonContratos() {
  const skel = (w, h, mb = 0) => (
    <div style={{ width: w, height: h, marginBottom: mb, background: "var(--surface)", position: "relative", overflow: "hidden" }}>
      <div style={{ position: "absolute", inset: 0, background: "linear-gradient(90deg, transparent 0%, var(--surface-hi) 50%, transparent 100%)", animation: "rBar 1.4s ease-in-out infinite" }} />
    </div>
  )
  return (
    <div className="romma-page px-[18px] sm:px-12 pt-6 sm:pt-12 pb-20 bg-background min-h-full">
      {/* Header skeleton */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 28 }}>
        <div>
          {skel(120, 11, 10)}
          {skel(180, 40)}
        </div>
        {skel(120, 34)}
      </div>
      {/* Busca + filtro skeleton */}
      <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
        {skel("100%", 36)}
        {skel(110, 36)}
      </div>
      {/* Cards grid skeleton — desktop */}
      <div className="romma-desktop-only" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(330px, 1fr))", gap: 12 }}>
        {[0,1,2,3].map(i => (
          <div key={i} style={{ border: "1px solid var(--border-3)", background: "var(--surface)", padding: 16, display: "flex", flexDirection: "column", gap: 12 }}>
            {skel(60, 10, 4)}
            {skel("70%", 18)}
            {skel("50%", 11)}
            {skel("100%", 4, 4)}
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              {skel(80, 14)}
              {skel(60, 28)}
            </div>
          </div>
        ))}
      </div>
      {/* Rows skeleton — mobile */}
      <div className="romma-mobile-only" style={{ border: "1px solid var(--border-3)", background: "var(--surface)" }}>
        {[0,1,2,3].map(i => (
          <div key={i} style={{ padding: "12px 16px", borderTop: i > 0 ? "1px solid var(--border-3)" : "none", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 }}>
            <div style={{ flex: 1 }}>
              {skel("60%", 14, 6)}
              {skel("80%", 11)}
            </div>
            {skel(72, 22)}
          </div>
        ))}
      </div>
    </div>
  )
}

function getTodayLocal() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function isExpiring(c) {
  if (c.status !== "ativo") return false
  const diff = (new Date(c.data_fim + "T12:00:00") - new Date()) / 86400000
  return diff >= 0 && diff <= 7
}

function daysLeft(c) {
  return Math.ceil((new Date(c.data_fim + "T12:00:00") - new Date()) / 86400000)
}

function pctElapsed(c) {
  const a = new Date(c.data_inicio + "T12:00:00")
  const b = new Date(c.data_fim + "T12:00:00")
  const n = new Date()
  return Math.max(4, Math.min(100, Math.round(((n - a) / (b - a)) * 100)))
}

function nameOf(c) {
  return (c.locatarios?.nome_razao_social ?? "") + " " + (c.unidades?.nome ?? "")
}


export default function Contratos() {
  const router = useRouter()

  const [unidades, setUnidades] = useState([])
  const [locatarios, setLocatarios] = useState([])
  const [contratos, setContratos] = useState([])
  const [edificios, setEdificios] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ data_inicio: "", data_fim: "", observacoes: "", unidade_id: "", locatario_id: "" })
  const [erro, setErro] = useState(null)
  const [loading, setLoading] = useState(false)
  const [loadingInicial, setLoadingInicial] = useState(true)
  const [confirmDialog, setConfirmDialog] = useState(null)
  const [removingIds, setRemovingIds] = useState(new Set())
  const [q, setQ] = useState("")
  const [onlyVencendo, setOnlyVencendo] = useState(false)
  const [showArquivo, setShowArquivo] = useState(false)

  useEffect(() => {
    async function carregar() {
      const [u, l, c, e] = await Promise.all([getUnidades(), getLocatarios(), getContratos(), getEdificios()])
      setUnidades(u ?? [])
      setLocatarios(l ?? [])
      setContratos(c ?? [])
      setEdificios(e ?? [])
      setLoadingInicial(false)
    }
    carregar()
  }, [])

  function resetForm() {
    setForm({ data_inicio: "", data_fim: "", observacoes: "", unidade_id: "", locatario_id: "" })
  }

  const unidadesDisponiveis = unidades.filter(u => u.status === "disponivel")
  const unidadeSelecionada = unidades.find(u => u.id === form.unidade_id)

  async function handleCriarContrato(e) {
    e.preventDefault()
    setLoading(true)
    setErro(null)
    const result = await criarContrato({ ...form, status: "ativo" })
    if (result.status === 200) {
      const parcResult = await gerarParcelas(result.data.id)
      if (parcResult.status !== 200) {
        setErro(parcResult.erroMessage ?? "Erro ao gerar parcelas.")
        setLoading(false)
        return
      }
      const [c, u] = await Promise.all([getContratos(), getUnidades()])
      setContratos(c ?? [])
      setUnidades(u ?? [])
      resetForm()
      setShowForm(false)
      toast.success("Contrato criado")
    } else {
      setErro(result.erroMessage)
    }
    setLoading(false)
  }

  function askCancelar(contrato) {
    const loc = locatarios.find(l => l.id === contrato.locatario_id)
    const uni = unidades.find(u => u.id === contrato.unidade_id)
    setConfirmDialog({
      title: "Cancelar contrato?",
      body: `Isso encerrará imediatamente o contrato de ${loc?.nome_razao_social ?? "—"} na unidade ${uni?.nome ?? "—"} e marcará a unidade como disponível.`,
      danger: true,
      confirmLabel: "Cancelar Contrato",
      onConfirm: () => confirmarCancelamento(contrato),
    })
  }

  function askEncerrar(contrato) {
    const loc = locatarios.find(l => l.id === contrato.locatario_id)
    const uni = unidades.find(u => u.id === contrato.unidade_id)
    setConfirmDialog({
      title: "Encerrar contrato?",
      body: `O contrato de ${loc?.nome_razao_social ?? "—"} na unidade ${uni?.nome ?? "—"} será encerrado. A unidade voltará a ficar disponível.`,
      danger: false,
      confirmLabel: "Encerrar",
      onConfirm: () => confirmarEncerramento(contrato),
    })
  }

  async function confirmarCancelamento(contrato) {
    setConfirmDialog(null)
    setRemovingIds(prev => new Set([...prev, contrato.id]))
    const result = await cancelarContrato(contrato.id)
    if (result.status !== 200) {
      setErro(result.erroMessage)
      setRemovingIds(prev => { const n = new Set(prev); n.delete(contrato.id); return n })
      return
    }
    setErro(null)
    toast.success("Contrato cancelado")
    setTimeout(() => {
      setContratos(prev => prev.filter(c => c.id !== contrato.id))
      getUnidades().then(u => setUnidades(u ?? []))
      setRemovingIds(prev => { const n = new Set(prev); n.delete(contrato.id); return n })
    }, 200)
  }

  async function confirmarEncerramento(contrato) {
    setConfirmDialog(null)
    setRemovingIds(prev => new Set([...prev, contrato.id]))
    const result = await encerrarContrato(contrato.id)
    if (result.status !== 200) {
      setErro(result.erroMessage)
      setRemovingIds(prev => { const n = new Set(prev); n.delete(contrato.id); return n })
      return
    }
    setErro(null)
    toast.success("Contrato encerrado")
    setTimeout(() => {
      // Re-fetch em vez de filter otimista: a row encerrada reaparece nos dados
      // (atualiza a contagem "encerrados" no subtítulo) mas contratosAtivos a filtra da lista.
      Promise.all([getContratos(), getUnidades()]).then(([c, u]) => {
        setContratos(c ?? [])
        setUnidades(u ?? [])
      })
      setRemovingIds(prev => { const n = new Set(prev); n.delete(contrato.id); return n })
    }, 200)
  }

  const ativos = contratos.filter(c => c.status === "ativo").length
  const encerrados = contratos.filter(c => c.status === "encerrado").length
  const contratosAtivos = contratos.filter(c => c.status === "ativo")
  const vencendoCount = contratosAtivos.filter(isExpiring).length
  const arquivo = contratos.filter(c => c.status !== "ativo")
  const view = contratosAtivos.filter(c => {
    if (onlyVencendo && !isExpiring(c)) return false
    if (q && !nameOf(c).toLowerCase().includes(q.toLowerCase())) return false
    return true
  })

  if (loadingInicial) return <SkeletonContratos />;

  return (
    <>
      <ConfirmDialog
        open={!!confirmDialog}
        title={confirmDialog?.title}
        body={confirmDialog?.body}
        danger={confirmDialog?.danger ?? true}
        confirmLabel={confirmDialog?.confirmLabel}
        onConfirm={confirmDialog?.onConfirm}
        onCancel={() => setConfirmDialog(null)}
      />

      <div className="romma-page px-[18px] sm:px-12 pt-6 sm:pt-12 pb-20 bg-background min-h-full">

        <PageHeader
          eyebrow="SISTEMA.02 // VÍNCULOS"
          title="Contratos."
          subtitle={`${ativos} ativos · ${encerrados} encerrados`}
          cta={{ label: "Novo Contrato", code: "C+", onClick: () => setShowForm(true) }}
        />

        {/* New contract modal */}
        {showForm && (
          <div
            onClick={() => { resetForm(); setShowForm(false); setErro(null) }}
            className="romma-modal-backdrop z-[100]"
          >
            <div
              onClick={e => e.stopPropagation()}
              style={{
                width: 560, maxWidth: "calc(100vw - 32px)",
                background: "var(--background)",
                border: "1px solid var(--border-3)",
                padding: 28,
                maxHeight: "90vh",
                overflowY: "auto",
              }}
            >
              {/* Header */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
                <div>
                  <span className="eyebrow eyebrow--indigo" style={{ marginBottom: 6, display: "block" }}>NOVO CONTRATO</span>
                  <h3 className="r-section">Cadastrar Contrato</h3>
                </div>
                <button
                  type="button"
                  onClick={() => { resetForm(); setShowForm(false); setErro(null) }}
                  style={{
                    all: "unset", cursor: "pointer", width: 30, height: 30,
                    border: "1px solid var(--border-3)", display: "flex",
                    alignItems: "center", justifyContent: "center",
                    color: "var(--fg-3)", fontFamily: "var(--font-mono)",
                  }}
                >✕</button>
              </div>

              {/* Form */}
              <form onSubmit={handleCriarContrato} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                  <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    <span style={{ fontFamily: "var(--font-mono)", fontSize: 10, letterSpacing: "1px", textTransform: "uppercase", color: "var(--fg-4)" }}>Locatário</span>
                    <Select required value={form.locatario_id} onValueChange={v => setForm({ ...form, locatario_id: v })}>
                      <SelectTrigger className="bg-surface-hi border-border-3 text-fg-1 font-mono text-[13px] rounded-none h-[42px]">
                        <SelectValue placeholder="Selecionar..." />
                      </SelectTrigger>
                      <SelectContent>
                        {locatarios.map(l => (
                          <SelectItem key={l.id} value={l.id}>{l.nome_razao_social}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </label>

                  <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    <span style={{ fontFamily: "var(--font-mono)", fontSize: 10, letterSpacing: "1px", textTransform: "uppercase", color: "var(--fg-4)" }}>Unidade</span>
                    <Select required value={form.unidade_id} onValueChange={v => setForm({ ...form, unidade_id: v })}>
                      <SelectTrigger className="bg-surface-hi border-border-3 text-fg-1 font-mono text-[13px] rounded-none h-[42px]">
                        <SelectValue placeholder="Selecionar..." />
                      </SelectTrigger>
                      <SelectContent>
                        {unidadesDisponiveis.map(u => (
                          <SelectItem key={u.id} value={u.id}>{u.nome}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </label>

                  <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    <span style={{ fontFamily: "var(--font-mono)", fontSize: 10, letterSpacing: "1px", textTransform: "uppercase", color: "var(--fg-4)" }}>Data de Início</span>
                    <input
                      required type="date"
                      value={form.data_inicio}
                      onChange={e => setForm({ ...form, data_inicio: e.target.value })}
                      style={{
                        all: "unset", boxSizing: "border-box", width: "100%",
                        padding: "10px 12px", fontSize: 13,
                        fontFamily: "var(--font-mono)", color: "var(--fg-1)",
                        background: "var(--surface-hi)", border: "1px solid var(--border-3)",
                      }}
                    />
                  </label>

                  <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    <span style={{ fontFamily: "var(--font-mono)", fontSize: 10, letterSpacing: "1px", textTransform: "uppercase", color: "var(--fg-4)" }}>Data de Término</span>
                    <input
                      required type="date"
                      value={form.data_fim}
                      onChange={e => setForm({ ...form, data_fim: e.target.value })}
                      style={{
                        all: "unset", boxSizing: "border-box", width: "100%",
                        padding: "10px 12px", fontSize: 13,
                        fontFamily: "var(--font-mono)", color: "var(--fg-1)",
                        background: "var(--surface-hi)", border: "1px solid var(--border-3)",
                      }}
                    />
                  </label>
                </div>

                {unidadeSelecionada && (
                  <div style={{ padding: "10px 14px", border: "1px solid var(--border-3)", background: "var(--surface-hi)", display: "flex", alignItems: "center", gap: 12 }}>
                    <span style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--fg-4)", letterSpacing: "1px", textTransform: "uppercase" }}>Valor Mensal</span>
                    <span style={{ fontFamily: "var(--font-mono)", fontSize: 16, color: "var(--fg-1)", fontWeight: 700 }}>
                      {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 }).format(unidadeSelecionada.valor_mensal ?? 0)}
                    </span>
                  </div>
                )}

                <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: 10, letterSpacing: "1px", textTransform: "uppercase", color: "var(--fg-4)" }}>Observações</span>
                  <textarea
                    rows={3}
                    value={form.observacoes}
                    onChange={e => setForm({ ...form, observacoes: e.target.value })}
                    placeholder="Opcional"
                    style={{
                      all: "unset", boxSizing: "border-box", width: "100%",
                      padding: "10px 12px", fontSize: 13, resize: "vertical",
                      fontFamily: "var(--font-body)", color: "var(--fg-1)",
                      background: "var(--surface-hi)", border: "1px solid var(--border-3)",
                    }}
                  />
                </label>

                {erro && (
                  <div style={{ background: "var(--danger-bg2)", borderLeft: "2px solid var(--danger-fg)", padding: "10px 14px", fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--danger-fg)" }}>
                    {erro}
                  </div>
                )}

                <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 4 }}>
                  <button
                    type="button"
                    onClick={() => { resetForm(); setShowForm(false); setErro(null) }}
                    style={{
                      all: "unset", cursor: "pointer",
                      border: "1px solid var(--border-3)", background: "transparent",
                      color: "var(--fg-2)", padding: "10px 16px",
                      fontFamily: "var(--font-mono)", fontSize: 12,
                      letterSpacing: "0.5px", textTransform: "uppercase",
                    }}
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    style={{
                      all: "unset", cursor: loading ? "wait" : "pointer",
                      background: "var(--indigo)", color: "var(--fg-1)",
                      padding: "10px 18px",
                      fontFamily: "var(--font-mono)", fontSize: 12,
                      letterSpacing: "0.5px", textTransform: "uppercase",
                      opacity: loading ? 0.7 : 1,
                    }}
                  >
                    <span style={{ fontFamily: "var(--font-mono)", fontSize: 10, marginRight: 6 }}>
                      {loading ? "[···]" : "[✓]"}
                    </span>
                    {loading ? "Criando..." : "Criar Contrato"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Search + Vencendo filter bar */}
        <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap", alignItems: "center" }}>
          <div style={{ position: "relative", flex: "0 0 280px" }}>
            <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--fg-5)" }}>⌕</span>
            <Input
              value={q}
              onChange={e => setQ(e.target.value)}
              placeholder="Buscar por locatário ou unidade..."
              className="bg-surface-hi border-border-3 text-fg-1 font-body text-[13px] rounded-none pl-8"
            />
          </div>
          <button
            onClick={() => setOnlyVencendo(v => !v)}
            style={{
              all: "unset",
              cursor: "pointer",
              display: "inline-flex",
              alignItems: "center",
              gap: 7,
              padding: "9px 14px",
              fontFamily: "var(--font-mono)",
              fontSize: 10,
              letterSpacing: "0.5px",
              textTransform: "uppercase",
              border: `1px solid ${onlyVencendo ? "var(--warning)" : "var(--border-3)"}`,
              background: onlyVencendo ? "var(--warning-bg)" : "transparent",
              color: onlyVencendo ? "var(--warning)" : "var(--fg-4)",
            }}
          >
            <span style={{ width: 6, height: 6, background: "var(--warning)", display: "inline-block" }} />
            Vencendo · {vencendoCount}
          </button>
          {(q || onlyVencendo) && (
            <span className="font-mono text-[11px] text-fg-4">{view.length} resultado(s)</span>
          )}
        </div>

        {/* Cards desktop */}
        <div
          className="romma-desktop-only"
          style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(330px, 1fr))", gap: 12, marginBottom: 16 }}
        >
          {view.length === 0 && (
            <div style={{ gridColumn: "1 / -1", padding: "40px 24px", textAlign: "center" }}>
              <span className="font-mono text-[11px] text-fg-4">Nenhum contrato corresponde à busca.</span>
            </div>
          )}
          {view.map((contrato, i) => {
            const uni = unidades.find(u => u.id === contrato.unidade_id) ?? contrato.unidades
            const edi = edificios.find(e => e.id === uni?.edificio_id)
            const exp = isExpiring(contrato)
            const pct = pctElapsed(contrato)
            const days = daysLeft(contrato)
            const isRemoving = removingIds.has(contrato.id)
            const isAtivo = contrato.status === "ativo"
            const vencido = isAtivo && contrato.data_fim < getTodayLocal()
            return (
              <div
                key={contrato.id}
                style={{
                  border: `1px solid ${exp ? "var(--warning)" : "var(--border-3)"}`,
                  background: "var(--surface)",
                  padding: "var(--rd-panel, 16px)",
                  display: "flex",
                  flexDirection: "column",
                  gap: 14,
                  opacity: isRemoving ? 0 : 1,
                  transform: isRemoving ? "scale(0.98)" : "scale(1)",
                  transition: "opacity 220ms ease, transform 220ms ease",
                  animation: "rFade var(--dur-base, 240ms) var(--ease-crisp) both",
                  animationDelay: `${i * 30}ms`,
                }}
              >
                {/* Card top: badge + countdown */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10 }}>
                  <div style={{ minWidth: 0 }}>
                    <span className="font-mono text-[11px] text-fg-5">REF_C_{String(i + 1).padStart(3, "0")}</span>
                    <div
                      className="font-body text-[16px] font-bold text-fg-1"
                      style={{ marginTop: 4, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}
                    >
                      {contrato.locatarios?.nome_razao_social ?? "—"}
                    </div>
                    <div className="font-mono text-[11px] text-fg-4" style={{ marginTop: 2 }}>
                      {uni?.nome ?? "—"}{edi ? ` · ${edi.nome.replace(/Edifício\s*/i, "")}` : ""}
                    </div>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4, flexShrink: 0 }}>
                    <StatusBadge status={exp ? "vencendo" : contrato.status} label={exp ? `Vence em ${days}d` : undefined} />
                    <span
                      className="font-mono text-[11px]"
                      style={{ color: exp ? "var(--warning)" : "var(--fg-4)" }}
                    >
                      {days < 0 ? "Encerrado" : `${days} ${days === 1 ? "dia" : "dias"} → ${fmtData(contrato.data_fim)}`}
                    </span>
                  </div>
                </div>

                {/* Progress bar */}
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                    <span className="font-mono text-[11px] text-fg-4">{fmtData(contrato.data_inicio)}</span>
                    <span className="font-mono text-[11px] text-fg-4">{fmtData(contrato.data_fim)}</span>
                  </div>
                  <div
                    style={{ height: 4, background: "var(--surface-hi)" }}
                    role="progressbar"
                    aria-valuenow={pct}
                    aria-valuemin={0}
                    aria-valuemax={100}
                  >
                    <div style={{ height: "100%", width: `${pct}%`, background: exp ? "var(--warning)" : "var(--ds-primary)" }} />
                  </div>
                </div>

                {/* Card footer: valor + ações */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid var(--border-3)", paddingTop: 12 }}>
                  <span className="font-body text-[14px] font-bold text-fg-1">
                    {fmtBRL(uni?.valor_mensal)}<span className="font-mono text-[11px] text-fg-4 font-normal">/mês</span>
                  </span>
                  <div style={{ display: "flex", gap: 12 }}>
                    <button
                      onClick={() => router.push(`/dashboard/contratos/${contrato.id}`)}
                      style={{ all: "unset", cursor: "pointer", fontFamily: "var(--font-mono)", fontSize: 10, fontWeight: 700, color: "var(--fg-3)", letterSpacing: "1px", textTransform: "uppercase" }}
                    >
                      Ver →
                    </button>
                    {isAtivo && !vencido && (
                      <button
                        onClick={() => askCancelar(contrato)}
                        style={{ all: "unset", cursor: "pointer", fontFamily: "var(--font-mono)", fontSize: 10, fontWeight: 700, color: "var(--danger-fg)", letterSpacing: "1px", textTransform: "uppercase" }}
                      >
                        Cancelar
                      </button>
                    )}
                    {vencido && (
                      <button
                        onClick={() => askEncerrar(contrato)}
                        style={{ all: "unset", cursor: "pointer", fontFamily: "var(--font-mono)", fontSize: 10, fontWeight: 700, color: "var(--danger-fg)", letterSpacing: "1px", textTransform: "uppercase" }}
                      >
                        Encerrar
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Rows mobile */}
        <div className="romma-mobile-only mb-8" style={{ border: "1px solid var(--border-3)", background: "var(--surface)" }}>
          {view.length === 0 && (
            <div className="py-10 text-center font-mono text-[12px] text-fg-4">
              Nenhum contrato corresponde à busca.
            </div>
          )}
          {view.map((contrato, i) => {
            const uni = unidades.find(u => u.id === contrato.unidade_id) ?? contrato.unidades
            const exp = isExpiring(contrato)
            const days = daysLeft(contrato)
            return (
              <div
                key={contrato.id}
                onClick={() => router.push(`/dashboard/contratos/${contrato.id}`)}
                style={{
                  padding: "12px 16px",
                  borderTop: i > 0 ? "1px solid var(--border-3)" : "none",
                  display: "flex",
                  flexDirection: "column",
                  gap: 6,
                  cursor: "pointer",
                  WebkitTapHighlightColor: "transparent",
                  transition: "background 120ms ease",
                }}
                onPointerDown={e => e.currentTarget.style.background = "var(--surface-hi)"}
                onPointerUp={e => e.currentTarget.style.background = ""}
                onPointerLeave={e => e.currentTarget.style.background = ""}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span className="font-body text-[14px] font-bold text-fg-1">
                    {contrato.locatarios?.nome_razao_social ?? "—"}
                  </span>
                  <StatusBadge status={exp ? "vencendo" : contrato.status} label={exp ? `Vence em ${days}d` : undefined} />
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span className="font-mono text-[11px] text-fg-4">
                    {uni?.nome ?? "—"} · {fmtData(contrato.data_inicio)}→{fmtData(contrato.data_fim)}
                  </span>
                </div>
              </div>
            )
          })}
        </div>

        {/* Archive callout + toggle */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 20px", border: "1px solid var(--border-3)" }}>
          <span className="font-mono text-[11px] text-fg-4" style={{ letterSpacing: "0.5px" }}>
            Contratos encerrados são preservados como histórico imutável.
          </span>
          <button
            onClick={() => setShowArquivo(v => !v)}
            style={{
              all: "unset",
              cursor: "pointer",
              fontFamily: "var(--font-mono)",
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: "1px",
              textTransform: "uppercase",
              color: showArquivo ? "var(--indigo)" : "var(--fg-3)",
            }}
          >
            {showArquivo ? "⌃ Ocultar Arquivo" : `Ver Arquivo (${arquivo.length}) →`}
          </button>
        </div>

        {showArquivo && (
          <div style={{ marginTop: 12 }}>
            <span className="eyebrow eyebrow--indigo" style={{ marginBottom: 12, display: "block" }}>
              Arquivo · Contratos Encerrados
            </span>
            {arquivo.length === 0 ? (
              <div style={{ padding: "40px 24px", textAlign: "center", border: "1px solid var(--border-3)" }}>
                <span className="font-mono text-[12px] text-fg-4">Nenhum contrato arquivado.</span>
              </div>
            ) : (
              <div style={{ border: "1px solid var(--border-3)", background: "var(--surface)" }}>
                {arquivo.map((c, i) => {
                  const uni = unidades.find(u => u.id === c.unidade_id) ?? c.unidades
                  const edi = edificios.find(e => e.id === uni?.edificio_id)
                  return (
                    <div
                      key={c.id}
                      onClick={() => router.push(`/dashboard/contratos/${c.id}`)}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        gap: 12,
                        padding: "12px 20px",
                        borderTop: i > 0 ? "1px solid var(--border-3)" : "none",
                        opacity: 0.78,
                        cursor: "pointer",
                        transition: "background 120ms ease",
                      }}
                      onPointerDown={e => e.currentTarget.style.background = "var(--surface-hi)"}
                      onPointerUp={e => e.currentTarget.style.background = ""}
                      onPointerLeave={e => e.currentTarget.style.background = ""}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0 }}>
                        <div style={{ minWidth: 0 }}>
                          <div
                            className="font-body text-[14px] font-bold text-fg-1"
                            style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}
                          >
                            {c.locatarios?.nome_razao_social ?? "—"}
                          </div>
                          <div className="font-mono text-[11px] text-fg-4" style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {uni?.nome ?? "—"}{edi ? ` · ${edi.nome.replace(/Edifício\s*/i, "")}` : ""} · {fmtData(c.data_inicio)}→{fmtData(c.data_fim)}
                          </div>
                        </div>
                      </div>
                      <StatusBadge status={c.status} />
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}

      </div>
    </>
  )
}
