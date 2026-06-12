"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import PageHeader from "@/components/ui/PageHeader"
import StatusBadge from "@/components/ui/StatusBadge"
import { convidarLocatario, revogarConvite, editarLocatario } from "@/actions/locatarios"
import { getLocatarios } from "@/lib/queries-client"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

function resetForm() {
  return { email: "", nome_razao_social: "", tipo: "pf", documento: "", telefone: "" }
}

function fmtDoc(tipo, doc) {
  if (!doc) return "—"
  if (tipo === "pj") return doc.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, "$1.$2.$3/$4-$5")
  return doc.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4")
}

function getInitials(name) {
  if (!name) return "?"
  return name.split(" ").slice(0, 2).map(s => s[0]).join("").toUpperCase()
}

export default function LocatariosDesktop({ initialLocatarios, contratos }) {
  const router = useRouter()
  const [locatarios, setLocatarios] = useState(initialLocatarios ?? [])
  const [showInviteForm, setShowInviteForm] = useState(false)
  const [form, setForm] = useState(resetForm())
  const [erro, setErro] = useState("")
  const [loading, setLoading] = useState(false)
  const [removingIds, setRemovingIds] = useState(new Set())
  const [editandoId, setEditandoId] = useState(null)
  const [formEdit, setFormEdit] = useState({
    nome_razao_social: "", tipo: "pf", documento: "", email: "", telefone: ""
  })

  const ativos = locatarios.filter(l => l.status_convite === "aceito").length
  const pendentes = locatarios.filter(l => l.status_convite === "pendente").length

  async function handleConvidar(e) {
    e.preventDefault()
    setLoading(true)
    setErro("")
    const { status, erroMessage } = await convidarLocatario(
      form.email, form.nome_razao_social, form.documento, form.telefone, form.tipo
    )
    setLoading(false)
    if (status === 200) {
      setLocatarios(await getLocatarios() ?? [])
      setForm(resetForm())
      setShowInviteForm(false)
    } else {
      setErro(erroMessage ?? "Erro ao enviar convite.")
    }
  }

  function handleEditarLocatario(locatario) {
    setErro("")
    setFormEdit({
      nome_razao_social: locatario.nome_razao_social ?? "",
      tipo: locatario.tipo ?? "pf",
      documento: locatario.documento ?? "",
      email: locatario.email ?? "",
      telefone: locatario.telefone ?? "",
    })
    setEditandoId(locatario.id)
  }

  function handleCancelarEdit() {
    setEditandoId(null)
    setErro("")
  }

  async function handleSalvarLocatario() {
    setLoading(true)
    setErro("")
    const { status, erroMessage } = await editarLocatario(editandoId, formEdit)
    setLoading(false)
    if (status === 200) {
      setEditandoId(null)
      setLocatarios(await getLocatarios() ?? [])
    } else {
      setErro(erroMessage ?? "Erro ao salvar locatário.")
    }
  }

  async function handleRevogar(id) {
    setErro("")
    setRemovingIds(prev => new Set([...prev, id]))
    const { status, erroMessage } = await revogarConvite(id)
    if (status !== 200) {
      setErro(erroMessage ?? "Erro ao revogar convite.")
      setRemovingIds(prev => { const n = new Set(prev); n.delete(id); return n })
      return
    }
    toast.success("Acesso revogado")
    setTimeout(() => {
      getLocatarios().then(l => setLocatarios(l ?? []))
      setRemovingIds(prev => { const n = new Set(prev); n.delete(id); return n })
    }, 200)
  }

  const GRID = "1.8fr 0.5fr 1.2fr 1.2fr 0.8fr 1.4fr 80px"

  return (
    <div className="romma-page px-4 sm:px-12 pt-6 sm:pt-12 pb-20 bg-background min-h-full">
      <PageHeader
        eyebrow="SISTEMA.03 // PESSOAS"
        title="Locatários."
        subtitle={`${ativos} ativos · ${pendentes} convites pendentes`}
        cta={{ label: "Convidar Locatário", code: "L+", onClick: () => { setErro(""); setShowInviteForm(true) } }}
      />

      {/* Table */}
      <div style={{ overflowX: "auto" }}>
      <div className="bg-surface border border-border-3" style={{ minWidth: "700px" }}>
        {/* Header */}
        <div style={{ display: "grid", gridTemplateColumns: GRID }} className="px-5 py-3 bg-[var(--surface-hi)]">
          {["Nome", "Tipo", "Documento", "Email", "Contratos", "Status", "Ações"].map(h => (
            <span key={h} className="font-mono text-[9px] font-bold tracking-[1.5px] uppercase text-fg-4">{h}</span>
          ))}
        </div>

        {/* Erro de revogar inline — abaixo do header */}
        {erro && (
          <div className="px-5 py-2 font-mono text-[11px] text-danger-fg border-t border-border-3">{erro}</div>
        )}

        {/* Rows */}
        {locatarios.length === 0 && (
          <div className="px-5 py-8 font-mono text-[12px] text-fg-4 text-center">
            Nenhum locatário cadastrado.
          </div>
        )}
        {locatarios.map((l, i) => {
          const ini = getInitials(l.nome_razao_social)
          const cs = contratos.filter(c => c.locatario_id === l.id)
          const ativosCount = cs.filter(c => c.status === "ativo").length
          const isPendente = l.status_convite === "pendente"
          const isRemoving = removingIds.has(l.id)

          return (
            <div
              key={l.id}
              style={{
                display: "grid",
                gridTemplateColumns: GRID,
                opacity: isRemoving ? 0 : 1,
                transform: isRemoving ? "scale(0.97)" : "scale(1)",
                transition: "opacity 200ms ease, transform 200ms ease",
              }}
              className={cn("px-5 py-4 items-center", i > 0 ? "border-t border-border-3" : "")}
            >
              {/* Nome + avatar */}
              <div className="flex items-center gap-3 min-w-0">
                <div className={cn("w-8 h-8 shrink-0 flex items-center justify-center border font-body font-bold text-[10px] tracking-[1px]", isPendente ? "bg-transparent border-border-2 text-fg-4" : "bg-surface border-border-2 text-fg-1")}>
                  {ini}
                </div>
                <span className="font-body font-medium text-[18px] text-fg-1 overflow-hidden text-ellipsis whitespace-nowrap">{l.nome_razao_social}</span>
              </div>

              {/* Tipo */}
              <span className="font-mono text-[10px] tracking-[0.5px] text-fg-3">
                {l.tipo?.toUpperCase()}
              </span>

              {/* Documento */}
              <span className="font-mono text-[18px] text-fg-2">
                {fmtDoc(l.tipo, l.documento)}
              </span>

              {/* Email */}
              <span className="font-mono text-[18px] text-fg-3 overflow-hidden text-ellipsis whitespace-nowrap">{l.email}</span>

              {/* Contratos */}
              <span className="font-mono text-[18px] text-fg-2">
                {ativosCount}/{cs.length}
              </span>

              {/* Status */}
              <div>
                <StatusBadge status={isPendente ? "pendente_convite" : "aceito"} />
              </div>

              {/* Ações */}
              <div className="flex gap-2">
                {isPendente ? (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRevogar(l.id)}
                    className="font-mono text-[10px] text-danger-fg uppercase tracking-[0.5px] font-bold py-[10px] px-3 h-auto"
                  >REVOGAR</Button>
                ) : (
                  <>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEditarLocatario(l)}
                      className="font-mono text-[10px] text-fg-3 uppercase tracking-[0.5px] font-bold py-[10px] px-3 h-auto"
                    >Editar</Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => router.push(`/dashboard/locatarios/${l.id}`)}
                      className="font-mono text-[10px] text-fg-3 uppercase tracking-[0.5px] font-bold py-[10px] px-3 h-auto"
                    >VER →</Button>
                  </>
                )}
              </div>
            </div>
          )
        })}
      </div>
      </div>

      {/* Invite Callout */}
      <div className="mt-8 p-6 border border-indigo flex justify-between items-center bg-[oklch(0.339_0.179_301.68_/_0.06)]">
        <div className="flex flex-col gap-1.5">
          <span className="eyebrow eyebrow--indigo">FLUXO DE CONVITE</span>
          <span className="text-[14px] text-fg-2 leading-relaxed max-w-[540px]">
            Convide um locatário pelo email. Ele recebe um token único, define a senha e o vínculo é selado. Você pode revogar antes do aceite.
          </span>
        </div>
        <Button
          onClick={() => { setErro(""); setShowInviteForm(true) }}
          className="bg-indigo text-fg-1 font-mono font-bold text-[11px] tracking-[1.4px] uppercase rounded-none"
        >Convidar →</Button>
      </div>

      {/* Edit Form Modal */}
      {editandoId !== null && (
        <div
          className="fixed inset-0 z-50 bg-[oklch(0_0_0/0.7)] flex items-center justify-center"
          onClick={e => { if (e.target === e.currentTarget) handleCancelarEdit() }}
        >
          <div className="bg-surface border border-border-2 w-[480px] p-8 flex flex-col gap-6">
            <div className="flex flex-col gap-2">
              <span className="eyebrow eyebrow--indigo">LOCATÁRIO</span>
              <h3 className="font-body font-bold text-[30px] text-fg-1 m-0">
                Editar Locatário
              </h3>
            </div>

            <div className="flex flex-col gap-4">
              <Field label="Nome / Razão Social" required>
                <Input
                  type="text"
                  required
                  value={formEdit.nome_razao_social}
                  onChange={e => setFormEdit({ ...formEdit, nome_razao_social: e.target.value })}
                  className="bg-surface-hi border-border-3 text-fg-1 font-mono text-[16px] rounded-none"
                />
              </Field>

              <Field label="Tipo">
                <Select
                  value={formEdit.tipo}
                  onValueChange={val => setFormEdit({ ...formEdit, tipo: val })}
                >
                  <SelectTrigger className="bg-surface-hi border-border-3 text-fg-1 font-mono text-[16px] rounded-none">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pf">Pessoa Física</SelectItem>
                    <SelectItem value="pj">Pessoa Jurídica</SelectItem>
                  </SelectContent>
                </Select>
              </Field>

              <Field label={formEdit.tipo === "pj" ? "CNPJ" : "CPF"} required>
                <Input
                  type="text"
                  required
                  value={formEdit.documento}
                  placeholder={formEdit.tipo === "pj" ? "00.000.000/0000-00" : "000.000.000-00"}
                  onChange={e => setFormEdit({ ...formEdit, documento: e.target.value.replace(/\D/g, "") })}
                  className="bg-surface-hi border-border-3 text-fg-1 font-mono text-[16px] rounded-none"
                />
              </Field>

              <Field label="Email" required>
                <Input
                  type="email"
                  required
                  value={formEdit.email}
                  onChange={e => setFormEdit({ ...formEdit, email: e.target.value })}
                  className="bg-surface-hi border-border-3 text-fg-1 font-mono text-[16px] rounded-none"
                />
              </Field>

              <Field label="Telefone" required>
                <Input
                  type="tel"
                  required
                  value={formEdit.telefone}
                  onChange={e => setFormEdit({ ...formEdit, telefone: e.target.value })}
                  className="bg-surface-hi border-border-3 text-fg-1 font-mono text-[16px] rounded-none"
                />
              </Field>

              {erro && (
                <span className="font-mono text-[11px] text-danger-fg">{erro}</span>
              )}

              <div className="flex gap-3 justify-end mt-2">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={handleCancelarEdit}
                  className="text-fg-3 font-mono text-[14px] border border-border-3 rounded-none px-5 py-[10px] h-auto"
                >Cancelar</Button>
                <Button
                  type="button"
                  disabled={loading}
                  onClick={handleSalvarLocatario}
                  className={cn(
                    "bg-indigo text-fg-1 font-body font-bold text-[13px] tracking-[1.2px] uppercase px-8 py-[14px] rounded-none h-auto",
                    loading ? "opacity-60 cursor-not-allowed" : "cursor-pointer"
                  )}
                >{loading ? "Salvando..." : "Salvar →"}</Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Invite Form Modal */}
      {showInviteForm && (
        <div
          className="fixed inset-0 z-50 bg-[oklch(0_0_0/0.7)] flex items-center justify-center"
          onClick={e => { if (e.target === e.currentTarget) setShowInviteForm(false) }}
        >
          <div className="bg-surface border border-border-2 w-[480px] p-8 flex flex-col gap-6">
            <div className="flex flex-col gap-2">
              <span className="eyebrow eyebrow--indigo">NOVO LOCATÁRIO</span>
              <h3 className="font-body font-bold text-[30px] text-fg-1 m-0">
                Enviar Convite
              </h3>
            </div>

            <form onSubmit={handleConvidar} className="flex flex-col gap-4">
              <Field label="Email" required>
                <Input
                  type="email"
                  required
                  value={form.email}
                  onChange={e => setForm({ ...form, email: e.target.value })}
                  className="bg-surface-hi border-border-3 text-fg-1 font-mono text-[16px] rounded-none"
                />
              </Field>

              <Field label="Nome / Razão Social" required>
                <Input
                  type="text"
                  required
                  value={form.nome_razao_social}
                  onChange={e => setForm({ ...form, nome_razao_social: e.target.value })}
                  className="bg-surface-hi border-border-3 text-fg-1 font-mono text-[16px] rounded-none"
                />
              </Field>

              <Field label="Tipo">
                <div className="flex gap-0">
                  {["pf", "pj"].map(t => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setForm({ ...form, tipo: t })}
                      className={cn(
                        "cursor-pointer py-2 px-5 font-mono font-bold text-[11px] tracking-[1px] uppercase border border-border-3",
                        form.tipo === t ? "bg-indigo text-fg-1" : "bg-surface-hi text-fg-4"
                      )}
                    >{t === "pf" ? "Pessoa Física" : "Pessoa Jurídica"}</button>
                  ))}
                </div>
              </Field>

              <Field label={form.tipo === "pj" ? "CNPJ" : "CPF"} required>
                <Input
                  type="text"
                  required
                  value={form.documento}
                  placeholder={form.tipo === "pj" ? "00.000.000/0000-00" : "000.000.000-00"}
                  onChange={e => setForm({ ...form, documento: e.target.value.replace(/\D/g, "") })}
                  className="bg-surface-hi border-border-3 text-fg-1 font-mono text-[16px] rounded-none"
                />
              </Field>

              <Field label="Telefone" required>
                <Input
                  type="tel"
                  required
                  value={form.telefone}
                  onChange={e => setForm({ ...form, telefone: e.target.value })}
                  className="bg-surface-hi border-border-3 text-fg-1 font-mono text-[16px] rounded-none"
                />
              </Field>

              {erro && (
                <span className="font-mono text-[11px] text-danger-fg">{erro}</span>
              )}

              <div className="flex gap-3 justify-end mt-2">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => { setShowInviteForm(false); setErro("") }}
                  className="text-fg-3 font-mono text-[14px] border border-border-3 rounded-none px-5 py-[10px] h-auto"
                >Cancelar</Button>
                <Button
                  type="submit"
                  disabled={loading}
                  className={cn(
                    "bg-indigo text-fg-1 font-body font-bold text-[13px] tracking-[1.2px] uppercase px-8 py-[14px] rounded-none h-auto",
                    loading ? "opacity-60 cursor-not-allowed" : "cursor-pointer"
                  )}
                >{loading ? "Enviando..." : "Enviar Convite →"}</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

function Field({ label, required, children }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="font-mono text-[10px] font-bold tracking-[1px] uppercase text-fg-4">
        {label}{required && <span className="text-danger-fg ml-0.5">*</span>}
      </label>
      {children}
    </div>
  )
}
