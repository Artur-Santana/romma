"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { getContratos, getLocatarios, getUnidades, getEdificios } from "@/lib/queries-client"
import { fmtData } from "@/lib/utils"
import StatusBadge from "@/components/ui/StatusBadge"
import ConfirmDialog from "@/components/ui/ConfirmDialog"
import PageHeader from "@/components/ui/PageHeader"
import { gerarParcelas, criarContrato, cancelarContrato, encerrarContrato } from "@/actions/contratos"

function isExpiring(c) {
  if (c.status !== "ativo") return false
  const diff = (new Date(c.data_fim) - new Date()) / 86400000
  return diff >= 0 && diff <= 7
}

const COL = "100px 1.6fr 1.6fr 1fr 1fr 1.2fr 80px"

const inputStyle = {
  background: "var(--surface-hi)",
  border: "1px solid var(--border-3)",
  color: "var(--fg-1)",
  padding: "10px 14px",
  fontSize: 13,
  fontFamily: "var(--font-mono)",
  width: "100%",
  boxSizing: "border-box",
}

const actionBtnStyle = {
  border: "none", background: "transparent",
  fontFamily: "var(--font-mono)", fontSize: 10,
  fontWeight: 700, letterSpacing: 1, color: "var(--fg-3)",
  cursor: "pointer", padding: 0, textTransform: "uppercase",
}

function HeaderCell({ children }) {
  return (
    <div style={{
      padding: "12px 20px",
      fontFamily: "var(--font-mono)",
      fontSize: 10, fontWeight: 700,
      letterSpacing: 1.4, textTransform: "uppercase",
      color: "var(--fg-4)",
    }}>
      {children}
    </div>
  )
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
  const [confirmDialog, setConfirmDialog] = useState(null)

  useEffect(() => {
    async function carregar() {
      const [u, l, c, e] = await Promise.all([getUnidades(), getLocatarios(), getContratos(), getEdificios()])
      setUnidades(u ?? [])
      setLocatarios(l ?? [])
      setContratos(c ?? [])
      setEdificios(e ?? [])
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
      if (parcResult.status !== 200) setErro(parcResult.erroMessage ?? "Erro ao gerar parcelas.")
      const [c, u] = await Promise.all([getContratos(), getUnidades()])
      setContratos(c ?? [])
      setUnidades(u ?? [])
      resetForm()
      setShowForm(false)
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
    const result = await cancelarContrato(contrato.id, contrato.unidade_id)
    if (result.status !== 200) { setErro(result.erroMessage); return }
    setErro(null)
    const [c, u] = await Promise.all([getContratos(), getUnidades()])
    setContratos(c ?? [])
    setUnidades(u ?? [])
  }

  async function confirmarEncerramento(contrato) {
    setConfirmDialog(null)
    const res = await encerrarContrato(contrato.id, contrato.unidade_id)
    if (res.status !== 200) { setErro(res.erroMessage); return }
    setErro(null)
    const [c, u] = await Promise.all([getContratos(), getUnidades()])
    setContratos(c ?? [])
    setUnidades(u ?? [])
  }

  const ativos = contratos.filter(c => c.status === "ativo").length
  const encerrados = contratos.filter(c => c.status === "encerrado").length

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

      <div className="romma-page" style={{ padding: "48px 48px 80px", background: "var(--background)", minHeight: "100%" }}>

        <PageHeader
          eyebrow="SISTEMA.02 // VÍNCULOS"
          title="Contratos."
          subtitle={`${ativos} ativos · ${encerrados} encerrados`}
          cta={{ label: showForm ? "Fechar" : "Novo Contrato", code: showForm ? "×" : "C+", onClick: () => setShowForm(v => !v) }}
        />

        {/* New contract form */}
        {showForm && (
          <div style={{
            border: "1px solid var(--indigo)", padding: 32,
            marginBottom: 32, background: "var(--surface)",
          }}>
            <span className="eyebrow eyebrow--indigo" style={{ marginBottom: 20 }}>NOVO CONTRATO</span>
            <form onSubmit={handleCriarContrato}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
                <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: 10, letterSpacing: 1, color: "var(--fg-4)", textTransform: "uppercase" }}>Locatário</span>
                  <select
                    required
                    value={form.locatario_id}
                    onChange={e => setForm({ ...form, locatario_id: e.target.value })}
                    style={inputStyle}
                  >
                    <option value="">Selecionar locatário...</option>
                    {locatarios.map(l => (
                      <option key={l.id} value={l.id}>{l.nome_razao_social}</option>
                    ))}
                  </select>
                </label>
                <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: 10, letterSpacing: 1, color: "var(--fg-4)", textTransform: "uppercase" }}>Unidade (disponíveis)</span>
                  <select
                    required
                    value={form.unidade_id}
                    onChange={e => setForm({ ...form, unidade_id: e.target.value })}
                    style={inputStyle}
                  >
                    <option value="">Selecionar unidade...</option>
                    {unidadesDisponiveis.map(u => (
                      <option key={u.id} value={u.id}>{u.nome}</option>
                    ))}
                  </select>
                </label>
                <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: 10, letterSpacing: 1, color: "var(--fg-4)", textTransform: "uppercase" }}>Data de Início</span>
                  <input
                    required
                    type="date"
                    value={form.data_inicio}
                    onChange={e => setForm({ ...form, data_inicio: e.target.value })}
                    style={inputStyle}
                  />
                </label>
                <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: 10, letterSpacing: 1, color: "var(--fg-4)", textTransform: "uppercase" }}>Data de Término</span>
                  <input
                    required
                    type="date"
                    value={form.data_fim}
                    onChange={e => setForm({ ...form, data_fim: e.target.value })}
                    style={inputStyle}
                  />
                </label>
              </div>

              {unidadeSelecionada && (
                <div style={{
                  padding: "12px 16px", marginBottom: 16,
                  border: "1px solid var(--border-3)", background: "var(--surface-hi)",
                  display: "flex", alignItems: "center", gap: 16,
                }}>
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--fg-4)", letterSpacing: 1, textTransform: "uppercase" }}>Valor Mensal</span>
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: 14, color: "var(--fg-1)", fontWeight: 700 }}>
                    {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 }).format(unidadeSelecionada.valor_mensal ?? 0)}
                  </span>
                </div>
              )}

              <label style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 20 }}>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: 10, letterSpacing: 1, color: "var(--fg-4)", textTransform: "uppercase" }}>Observações</span>
                <textarea
                  rows={3}
                  value={form.observacoes}
                  onChange={e => setForm({ ...form, observacoes: e.target.value })}
                  placeholder="Opcional"
                  style={{ ...inputStyle, resize: "vertical", fontFamily: "var(--font-body)" }}
                />
              </label>

              {erro && (
                <div style={{ padding: "10px 16px", marginBottom: 16, background: "var(--danger-bg2)", border: "1px solid var(--danger)", fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--danger)" }}>
                  {erro}
                </div>
              )}

              <div style={{ display: "flex", gap: 12 }}>
                <button
                  type="submit"
                  disabled={loading}
                  style={{
                    border: "none", background: "var(--indigo)", padding: "14px 32px",
                    fontFamily: "var(--font-body)", fontWeight: 700, fontSize: 12,
                    letterSpacing: 1.2, textTransform: "uppercase",
                    color: "var(--fg-1)", cursor: loading ? "not-allowed" : "pointer",
                    opacity: loading ? 0.6 : 1,
                  }}
                >
                  {loading ? "Criando..." : "Criar Contrato"}
                </button>
                <button
                  type="button"
                  onClick={() => { resetForm(); setShowForm(false); setErro(null) }}
                  style={{
                    border: "1px solid var(--border-3)", background: "transparent", padding: "14px 24px",
                    fontFamily: "var(--font-body)", fontWeight: 700, fontSize: 12,
                    letterSpacing: 1.2, textTransform: "uppercase",
                    color: "var(--fg-3)", cursor: "pointer",
                  }}
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Contracts table */}
        <div style={{ border: "1px solid var(--border-3)", background: "var(--surface)", marginBottom: 32 }}>
          <div style={{ display: "grid", gridTemplateColumns: COL, background: "oklch(0.26 0 0)", borderBottom: "1px solid var(--border-3)" }}>
            <HeaderCell>ID</HeaderCell>
            <HeaderCell>Locatário</HeaderCell>
            <HeaderCell>Unidade</HeaderCell>
            <HeaderCell>Início</HeaderCell>
            <HeaderCell>Término</HeaderCell>
            <HeaderCell>Status</HeaderCell>
            <HeaderCell>Ações</HeaderCell>
          </div>

          {contratos.length === 0 && (
            <div style={{ padding: "48px 20px", textAlign: "center", fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--fg-4)", letterSpacing: 0.5 }}>
              Nenhum contrato cadastrado.
            </div>
          )}

          {contratos.map((contrato, i) => {
            const loc = locatarios.find(l => l.id === contrato.locatario_id) ?? contrato.locatarios
            const uni = unidades.find(u => u.id === contrato.unidade_id) ?? contrato.unidades
            const edi = edificios.find(e => e.id === uni?.edificio_id)
            const expiring = isExpiring(contrato)
            const isAtivo = contrato.status === "ativo"
            const vencido = isAtivo && contrato.data_fim < new Date().toISOString().split("T")[0]

            return (
              <div
                key={contrato.id}
                style={{
                  display: "grid", gridTemplateColumns: COL,
                  borderTop: i > 0 ? "1px solid var(--border-3)" : 0,
                  alignItems: "center",
                }}
              >
                <div style={{ padding: "14px 20px" }}>
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--fg-4)", letterSpacing: 0.3 }}>
                    REF_C_{String(i + 1).padStart(3, "0")}
                  </span>
                </div>

                <div style={{ padding: "14px 20px", overflow: "hidden" }}>
                  <span style={{
                    fontSize: 13, color: "var(--fg-1)", fontWeight: 500,
                    display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                  }}>
                    {loc?.nome_razao_social ?? "—"}
                  </span>
                </div>

                <div style={{ padding: "14px 20px", overflow: "hidden", display: "flex", flexDirection: "column", gap: 2 }}>
                  <span style={{ fontSize: 12, color: "var(--fg-1)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {uni?.nome ?? "—"}
                  </span>
                  {edi && (
                    <span style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--fg-4)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {edi.nome.replace(/Edifício\s*/i, "")}
                    </span>
                  )}
                </div>

                <div style={{ padding: "14px 20px" }}>
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--fg-3)" }}>
                    {fmtData(contrato.data_inicio)}
                  </span>
                </div>

                <div style={{ padding: "14px 20px" }}>
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: expiring ? "var(--warning)" : "var(--fg-3)" }}>
                    {fmtData(contrato.data_fim)}
                  </span>
                </div>

                <div style={{ padding: "14px 20px" }}>
                  <StatusBadge status={expiring ? "vencendo" : contrato.status} />
                </div>

                <div style={{ padding: "14px 12px", display: "flex", flexDirection: "column", gap: 6, alignItems: "flex-start" }}>
                  <button
                    onClick={() => router.push(`/dashboard/contratos/${contrato.id}`)}
                    style={actionBtnStyle}
                  >
                    VER →
                  </button>
                  {isAtivo && !vencido && (
                    <button onClick={() => askCancelar(contrato)} style={{ ...actionBtnStyle, color: "var(--danger)" }}>
                      CANC
                    </button>
                  )}
                  {vencido && (
                    <button onClick={() => askEncerrar(contrato)} style={{ ...actionBtnStyle, color: "var(--warning)" }}>
                      ENC
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>

        {/* Archive callout */}
        <div style={{
          display: "flex", justifyContent: "space-between", alignItems: "center",
          padding: "16px 24px", border: "1px solid var(--border-3)", color: "var(--fg-3)",
        }}>
          <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, letterSpacing: 0.5 }}>
            Contratos encerrados são preservados como histórico imutável.
          </span>
          <button style={{
            border: "none", background: "transparent", cursor: "pointer",
            fontFamily: "var(--font-mono)", fontWeight: 700, fontSize: 10,
            letterSpacing: 1.4, color: "var(--fg-2)", textTransform: "uppercase",
          }}>
            Ver Arquivo →
          </button>
        </div>

      </div>
    </>
  )
}
