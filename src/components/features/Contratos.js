"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { getContratos, getLocatarios, getUnidades, getEdificios } from "@/lib/queries-client"
import { fmtData, cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
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
const COL_STYLE = { gridTemplateColumns: COL }

function HeaderCell({ children }) {
  return (
    <div className="px-5 py-3 font-mono text-[10px] font-bold tracking-[1.4px] uppercase text-fg-4">
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
    const result = await cancelarContrato(contrato.id)
    if (result.status !== 200) { setErro(result.erroMessage); return }
    setErro(null)
    const [c, u] = await Promise.all([getContratos(), getUnidades()])
    setContratos(c ?? [])
    setUnidades(u ?? [])
  }

  async function confirmarEncerramento(contrato) {
    setConfirmDialog(null)
    const res = await encerrarContrato(contrato.id)
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

      <div className="romma-page px-12 pt-12 pb-20 bg-background min-h-full">

        <PageHeader
          eyebrow="SISTEMA.02 // VÍNCULOS"
          title="Contratos."
          subtitle={`${ativos} ativos · ${encerrados} encerrados`}
          cta={{ label: showForm ? "Fechar" : "Novo Contrato", code: showForm ? "×" : "C+", onClick: () => setShowForm(v => !v) }}
        />

        {/* New contract form */}
        {showForm && (
          <div className="border border-indigo p-8 mb-8 bg-surface">
            <span className="eyebrow eyebrow--indigo mb-5 block">NOVO CONTRATO</span>
            <form onSubmit={handleCriarContrato}>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <label className="flex flex-col gap-1.5">
                  <span className="font-mono text-[10px] tracking-[1px] text-fg-4 uppercase">Locatário</span>
                  <Select
                    required
                    value={form.locatario_id}
                    onValueChange={v => setForm({ ...form, locatario_id: v })}
                  >
                    <SelectTrigger className="bg-surface-hi border-border-3 text-fg-1 font-mono text-[13px] rounded-none">
                      <SelectValue placeholder="Selecionar locatário..." />
                    </SelectTrigger>
                    <SelectContent>
                      {locatarios.map(l => (
                        <SelectItem key={l.id} value={l.id}>{l.nome_razao_social}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </label>
                <label className="flex flex-col gap-1.5">
                  <span className="font-mono text-[10px] tracking-[1px] text-fg-4 uppercase">Unidade (disponíveis)</span>
                  <Select
                    required
                    value={form.unidade_id}
                    onValueChange={v => setForm({ ...form, unidade_id: v })}
                  >
                    <SelectTrigger className="bg-surface-hi border-border-3 text-fg-1 font-mono text-[13px] rounded-none">
                      <SelectValue placeholder="Selecionar unidade..." />
                    </SelectTrigger>
                    <SelectContent>
                      {unidadesDisponiveis.map(u => (
                        <SelectItem key={u.id} value={u.id}>{u.nome}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </label>
                <label className="flex flex-col gap-1.5">
                  <span className="font-mono text-[10px] tracking-[1px] text-fg-4 uppercase">Data de Início</span>
                  <Input
                    required
                    type="date"
                    value={form.data_inicio}
                    onChange={e => setForm({ ...form, data_inicio: e.target.value })}
                    className="bg-surface-hi border-border-3 text-fg-1 font-mono text-[13px] rounded-none"
                  />
                </label>
                <label className="flex flex-col gap-1.5">
                  <span className="font-mono text-[10px] tracking-[1px] text-fg-4 uppercase">Data de Término</span>
                  <Input
                    required
                    type="date"
                    value={form.data_fim}
                    onChange={e => setForm({ ...form, data_fim: e.target.value })}
                    className="bg-surface-hi border-border-3 text-fg-1 font-mono text-[13px] rounded-none"
                  />
                </label>
              </div>

              {unidadeSelecionada && (
                <div className="px-4 py-3 mb-4 border border-border-3 bg-surface-hi flex items-center gap-4">
                  <span className="font-mono text-[10px] text-fg-4 tracking-[1px] uppercase">Valor Mensal</span>
                  <span className="font-mono text-[14px] text-fg-1 font-bold">
                    {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 }).format(unidadeSelecionada.valor_mensal ?? 0)}
                  </span>
                </div>
              )}

              <label className="flex flex-col gap-1.5 mb-5">
                <span className="font-mono text-[10px] tracking-[1px] text-fg-4 uppercase">Observações</span>
                <textarea
                  rows={3}
                  value={form.observacoes}
                  onChange={e => setForm({ ...form, observacoes: e.target.value })}
                  placeholder="Opcional"
                  className="bg-surface-hi border border-border-3 text-fg-1 font-body text-[13px] px-3.5 py-2.5 w-full resize-y focus:outline-none"
                />
              </label>

              {erro && (
                <div className="bg-[var(--danger-bg2)] border border-[var(--danger-bg)] border-l-2 border-l-danger-fg px-4 py-3 font-mono text-[12px] text-danger-fg mb-4">
                  {erro}
                </div>
              )}

              <div className="flex gap-3">
                <Button
                  type="submit"
                  disabled={loading}
                  className={cn(
                    "bg-indigo text-fg-1 font-body font-bold text-[12px] tracking-[1.2px] uppercase px-8 py-[14px] rounded-none",
                    loading ? "opacity-60 cursor-not-allowed" : "cursor-pointer"
                  )}
                >
                  {loading ? "Criando..." : "Criar Contrato"}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => { resetForm(); setShowForm(false); setErro(null) }}
                  className="border border-border-3 bg-transparent text-fg-3 font-body font-bold text-[12px] tracking-[1.2px] uppercase px-6 py-[14px] rounded-none cursor-pointer"
                >
                  Cancelar
                </Button>
              </div>
            </form>
          </div>
        )}

        {/* Contracts table */}
        <div className="border border-border-3 bg-surface mb-8">
          <div style={COL_STYLE} className="grid bg-[oklch(0.26_0_0)] border-b border-border-3">
            <HeaderCell>ID</HeaderCell>
            <HeaderCell>Locatário</HeaderCell>
            <HeaderCell>Unidade</HeaderCell>
            <HeaderCell>Início</HeaderCell>
            <HeaderCell>Término</HeaderCell>
            <HeaderCell>Status</HeaderCell>
            <HeaderCell>Ações</HeaderCell>
          </div>

          {contratos.length === 0 && (
            <div className="py-12 px-5 text-center font-mono text-[12px] text-fg-4 tracking-[0.5px]">
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
                style={COL_STYLE}
                className={cn("grid items-center", i > 0 ? "border-t border-border-3" : "")}
              >
                <div className="px-5 py-3.5">
                  <span className="font-mono text-[11px] text-fg-4 tracking-[0.3px]">
                    REF_C_{String(i + 1).padStart(3, "0")}
                  </span>
                </div>

                <div className="px-5 py-3.5 overflow-hidden">
                  <span className="text-[13px] text-fg-1 font-medium block overflow-hidden text-ellipsis whitespace-nowrap">
                    {loc?.nome_razao_social ?? "—"}
                  </span>
                </div>

                <div className="px-5 py-3.5 overflow-hidden flex flex-col gap-0.5">
                  <span className="text-[12px] text-fg-1 overflow-hidden text-ellipsis whitespace-nowrap">
                    {uni?.nome ?? "—"}
                  </span>
                  {edi && (
                    <span className="font-mono text-[10px] text-fg-4 overflow-hidden text-ellipsis whitespace-nowrap">
                      {edi.nome.replace(/Edifício\s*/i, "")}
                    </span>
                  )}
                </div>

                <div className="px-5 py-3.5">
                  <span className="font-mono text-[11px] text-fg-3">
                    {fmtData(contrato.data_inicio)}
                  </span>
                </div>

                <div className="px-5 py-3.5">
                  <span className={cn("font-mono text-[11px]", expiring ? "text-warning" : "text-fg-3")}>
                    {fmtData(contrato.data_fim)}
                  </span>
                </div>

                <div className="px-5 py-3.5">
                  <StatusBadge status={expiring ? "vencendo" : contrato.status} />
                </div>

                <div className="px-3 py-3.5 flex flex-col gap-1.5 items-start">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => router.push(`/dashboard/contratos/${contrato.id}`)}
                    className="font-mono text-[10px] text-fg-3 uppercase tracking-[1px] font-bold p-0 h-auto"
                  >
                    VER →
                  </Button>
                  {isAtivo && !vencido && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => askCancelar(contrato)}
                      className="font-mono text-[10px] text-danger-fg uppercase tracking-[1px] font-bold p-0 h-auto"
                    >
                      CANC
                    </Button>
                  )}
                  {vencido && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => askEncerrar(contrato)}
                      className="font-mono text-[10px] text-danger-fg uppercase tracking-[1px] font-bold p-0 h-auto"
                    >
                      ENC
                    </Button>
                  )}
                </div>
              </div>
            )
          })}
        </div>

        {/* Archive callout */}
        <div className="flex justify-between items-center px-6 py-4 border border-border-3 text-fg-3">
          <span className="font-mono text-[11px] tracking-[0.5px]">
            Contratos encerrados são preservados como histórico imutável.
          </span>
          <Button
            variant="ghost"
            className="font-mono font-bold text-[10px] tracking-[1.4px] text-fg-2 uppercase p-0 h-auto"
          >
            Ver Arquivo →
          </Button>
        </div>

      </div>
    </>
  )
}
