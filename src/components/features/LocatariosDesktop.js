"use client"

import { useState } from "react"
import PageHeader from "@/components/ui/PageHeader"
import StatusBadge from "@/components/ui/StatusBadge"
import ConfirmDialog from "@/components/ui/ConfirmDialog"
import { convidarLocatario, revogarConvite, editarLocatario, reenviarConvite } from "@/actions/locatarios"
import { getLocatarios } from "@/lib/queries-client"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

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

function onlyDigits(s) { return s ? s.replace(/\D/g, "") : "" }

function maskCPF(v) {
  const d = v.slice(0, 11)
  if (d.length <= 3) return d
  if (d.length <= 6) return `${d.slice(0,3)}.${d.slice(3)}`
  if (d.length <= 9) return `${d.slice(0,3)}.${d.slice(3,6)}.${d.slice(6)}`
  return `${d.slice(0,3)}.${d.slice(3,6)}.${d.slice(6,9)}-${d.slice(9,11)}`
}

function maskCNPJ(v) {
  const d = v.slice(0, 14)
  if (d.length <= 2) return d
  if (d.length <= 5) return `${d.slice(0,2)}.${d.slice(2)}`
  if (d.length <= 8) return `${d.slice(0,2)}.${d.slice(2,5)}.${d.slice(5)}`
  if (d.length <= 12) return `${d.slice(0,2)}.${d.slice(2,5)}.${d.slice(5,8)}/${d.slice(8)}`
  return `${d.slice(0,2)}.${d.slice(2,5)}.${d.slice(5,8)}/${d.slice(8,12)}-${d.slice(12,14)}`
}

function maskDocumento(tipo, v) {
  return tipo === "pf" ? maskCPF(onlyDigits(v)) : maskCNPJ(onlyDigits(v))
}

function maskPhone(v) {
  const d = onlyDigits(v).slice(0, 11)
  if (!d.length) return ""
  if (d.length <= 2) return `(${d}`
  if (d.length <= 6) return `(${d.slice(0,2)}) ${d.slice(2)}`
  if (d.length <= 10) return `(${d.slice(0,2)}) ${d.slice(2,6)}-${d.slice(6)}`
  return `(${d.slice(0,2)}) ${d.slice(2,7)}-${d.slice(7)}`
}

function Avatar({ nome, pendente, size = 40 }) {
  return (
    <div style={{
      width: size, height: size, flexShrink: 0,
      display: "flex", alignItems: "center", justifyContent: "center",
      border: "1px solid var(--border-2)",
      background: pendente ? "transparent" : "var(--surface)",
      color: pendente ? "var(--fg-4)" : "var(--fg-1)",
      fontFamily: "var(--font-mono)",
      fontSize: size === 40 ? 14 : 11,
      fontWeight: 700,
    }}>
      {getInitials(nome)}
    </div>
  )
}

export default function LocatariosDesktop({ initialLocatarios, contratos }) {
  const [locatarios, setLocatarios] = useState(initialLocatarios ?? [])
  const [showInviteForm, setShowInviteForm] = useState(false)
  const [form, setForm] = useState(resetForm())
  const [erro, setErro] = useState("")
  const [loading, setLoading] = useState(false)
  const [removingIds, setRemovingIds] = useState(new Set())
  const [editandoId, setEditandoId] = useState(null)
  const [formEdit, setFormEdit] = useState({ nome_razao_social: "", email: "", telefone: "" })
  const [q, setQ] = useState("")
  const [resent, setResent] = useState(new Set())
  const [confirmRevogarId, setConfirmRevogarId] = useState(null)

  const ativos = locatarios.filter(l => l.status_convite === "aceito").length
  const pendentes = locatarios.filter(l => l.status_convite === "pendente").length

  const view = locatarios.filter(l =>
    !q || (l.nome_razao_social + " " + l.email + " " + l.documento)
      .toLowerCase().includes(q.toLowerCase())
  )

  async function handleConvidar(e) {
    e.preventDefault()
    setLoading(true)
    setErro("")
    const { status, erroMessage } = await convidarLocatario(
      form.email, form.nome_razao_social, onlyDigits(form.documento), onlyDigits(form.telefone), form.tipo
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
      email: locatario.email ?? "",
      telefone: maskPhone(locatario.telefone ?? ""),
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
    const { status, erroMessage } = await editarLocatario(editandoId, {
      nome_razao_social: formEdit.nome_razao_social,
      email: formEdit.email,
      telefone: onlyDigits(formEdit.telefone),
    })
    setLoading(false)
    if (status === 200) {
      setEditandoId(null)
      setLocatarios(await getLocatarios() ?? [])
    } else {
      setErro(erroMessage ?? "Erro ao salvar locatário.")
    }
  }

  async function handleRevogar(id) {
    setRemovingIds(prev => new Set([...prev, id]))
    const { status, erroMessage } = await revogarConvite(id)
    if (status !== 200) {
      toast.error(erroMessage ?? "Erro ao revogar convite.")
      setRemovingIds(prev => { const n = new Set(prev); n.delete(id); return n })
      return
    }
    toast.success("Acesso revogado")
    setTimeout(() => {
      getLocatarios().then(l => setLocatarios(l ?? []))
      setRemovingIds(prev => { const n = new Set(prev); n.delete(id); return n })
    }, 200)
  }

  async function handleReenviar(id) {
    const { status, erroMessage } = await reenviarConvite(id)
    if (status !== 200) {
      toast.error(erroMessage ?? "Erro ao reenviar convite.")
      return
    }
    setResent(s => new Set([...s, id]))
    setTimeout(() => setResent(s => { const n = new Set(s); n.delete(id); return n }), 2200)
  }

  const ghostBtn = (color) => ({
    all: "unset", cursor: "pointer",
    fontFamily: "var(--font-mono)", fontSize: 10, fontWeight: 700,
    letterSpacing: "0.5px", textTransform: "uppercase", padding: "4px 0",
    color,
  })

  return (
    <div className="romma-page px-4 sm:px-12 pt-6 sm:pt-12 pb-20 bg-background min-h-full">
      <PageHeader
        eyebrow="SISTEMA.03 // PESSOAS"
        title="Locatários."
        subtitle={`${ativos} ativos · ${pendentes} convites pendentes`}
        cta={{ label: "Convidar Locatário", code: "L+", onClick: () => { setErro(""); setShowInviteForm(true) } }}
      />

      {/* Search */}
      <div style={{ position: "relative", marginBottom: 16 }}>
        <span style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "var(--fg-5)", fontSize: 11, pointerEvents: "none" }}>⌕</span>
        <input
          style={{ all: "unset", display: "block", width: "100%", boxSizing: "border-box", padding: "9px 12px 9px 30px", fontSize: 13, fontFamily: "var(--font-body)", background: "var(--surface-hi)", border: "1px solid var(--border-3)", color: "var(--fg-1)" }}
          placeholder="Buscar por nome, e-mail ou documento..."
          value={q}
          onChange={e => setQ(e.target.value)}
        />
      </div>
      {q && <span className="r-meta" style={{ display: "block", marginBottom: 12 }}>{view.length} resultado(s)</span>}

      {/* Desktop — cards grid */}
      <div className="romma-desktop-only" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 12 }}>
        {view.length === 0 && (
          <div style={{ gridColumn: "1 / -1", textAlign: "center", fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--fg-4)", padding: "32px 0" }}>
            Nenhum locatário encontrado.
          </div>
        )}
        {view.map((l, i) => {
          const cs = contratos.filter(c => c.locatario_id === l.id)
          const ativosCount = cs.filter(c => c.status === "ativo").length
          const isPendente = l.status_convite === "pendente"
          const isRemoving = removingIds.has(l.id)

          return (
            <div
              key={l.id}
              style={{
                border: "1px solid var(--border-3)",
                background: "var(--surface)",
                padding: "var(--rd-panel, 20px)",
                display: "flex", flexDirection: "column", gap: 12,
                animation: `rFade var(--dur-base, 240ms) var(--ease-crisp) both`,
                animationDelay: `${i * 30}ms`,
                opacity: isRemoving ? 0 : 1,
                transform: isRemoving ? "scale(0.97)" : "scale(1)",
                transition: "opacity 220ms ease, transform 220ms ease",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
                <Avatar nome={l.nome_razao_social} pendente={isPendente} size={40} />
                <div style={{ minWidth: 0 }}>
                  <div className="r-subhead" style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{l.nome_razao_social}</div>
                  <div className="r-meta">{l.tipo?.toUpperCase()} · {fmtDoc(l.tipo, l.documento)}</div>
                </div>
              </div>
              <div className="r-meta" style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{l.email}</div>
              <div style={{ borderTop: "1px solid var(--border-3)", paddingTop: 12, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                  <StatusBadge status={isPendente ? "pendente_convite" : "aceito"} />
                  <span className="r-meta">{ativosCount}/{cs.length} contrato(s)</span>
                </div>
                <div style={{ display: "flex", gap: 12 }}>
                  {isPendente ? (
                    <>
                      <button style={ghostBtn(resent.has(l.id) ? "var(--success)" : "var(--indigo)")} onClick={() => handleReenviar(l.id)}>
                        {resent.has(l.id) ? "✓ Reenviado" : "Reenviar"}
                      </button>
                      <button style={ghostBtn("var(--danger-fg)")} onClick={() => setConfirmRevogarId(l.id)}>Revogar</button>
                    </>
                  ) : (
                    <button style={ghostBtn("var(--fg-3)")} onClick={() => handleEditarLocatario(l)}>Editar</button>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Mobile — rows */}
      <div className="romma-mobile-only r-panel">
        {view.length === 0 && (
          <div style={{ textAlign: "center", fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--fg-4)", padding: "32px 0" }}>
            Nenhum locatário encontrado.
          </div>
        )}
        {view.map((l, i) => {
          const cs = contratos.filter(c => c.locatario_id === l.id)
          const ativosCount = cs.filter(c => c.status === "ativo").length
          const isPendente = l.status_convite === "pendente"
          const isRemoving = removingIds.has(l.id)

          return (
            <div
              key={l.id}
              style={{
                padding: "12px var(--rd-row-x, 16px)",
                borderTop: i > 0 ? "1px solid var(--border-3)" : "none",
                display: "flex", flexDirection: "column", gap: 10,
                opacity: isRemoving ? 0 : 1,
                transition: "opacity 220ms ease",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <Avatar nome={l.nome_razao_social} pendente={isPendente} size={32} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="r-subhead" style={{ fontSize: 14, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{l.nome_razao_social}</div>
                  <div className="r-meta">{l.tipo?.toUpperCase()} · {fmtDoc(l.tipo, l.documento)}</div>
                </div>
                <StatusBadge status={isPendente ? "pendente_convite" : "aceito"} />
              </div>
              <div style={{ borderTop: "1px solid var(--border-3)", paddingTop: 10, display: "flex", gap: 8, alignItems: "center" }}>
                {isPendente ? (
                  <>
                    <button style={ghostBtn(resent.has(l.id) ? "var(--success)" : "var(--indigo)")} onClick={() => handleReenviar(l.id)}>
                      {resent.has(l.id) ? "✓ Reenviado" : "Reenviar convite"}
                    </button>
                    <div style={{ flex: 1 }} />
                    <button style={ghostBtn("var(--danger-fg)")} onClick={() => setConfirmRevogarId(l.id)}>Revogar</button>
                  </>
                ) : (
                  <>
                    <span className="r-meta">{ativosCount}/{cs.length} contrato(s)</span>
                    <div style={{ flex: 1 }} />
                    <button style={ghostBtn("var(--fg-3)")} onClick={() => handleEditarLocatario(l)}>Editar</button>
                  </>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* ConfirmDialog — revogar */}
      <ConfirmDialog
        open={confirmRevogarId !== null}
        title="Revogar acesso?"
        body={`O convite/acesso de ${locatarios.find(l => l.id === confirmRevogarId)?.nome_razao_social} será revogado. Esta ação não pode ser desfeita.`}
        confirmLabel="Revogar Acesso"
        danger
        onCancel={() => setConfirmRevogarId(null)}
        onConfirm={() => { handleRevogar(confirmRevogarId); setConfirmRevogarId(null) }}
      />

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

      {/* Edit Modal */}
      {editandoId !== null && (
        <div
          className="romma-modal-backdrop"
          onClick={e => { if (e.target === e.currentTarget) handleCancelarEdit() }}
        >
          <div className="bg-surface border border-border-2 w-full max-w-[480px] p-6 sm:p-8 flex flex-col gap-6">
            <div className="flex flex-col gap-2">
              <span className="eyebrow eyebrow--indigo">LOCATÁRIO</span>
              <h3 className="font-body font-bold text-[30px] text-fg-1 m-0">Editar Locatário</h3>
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
                  placeholder="(11) 99999-9999"
                  value={formEdit.telefone}
                  onChange={e => setFormEdit({ ...formEdit, telefone: maskPhone(e.target.value) })}
                  className="bg-surface-hi border-border-3 text-fg-1 font-mono text-[16px] rounded-none"
                />
              </Field>
              {erro && <span className="font-mono text-[11px] text-danger-fg">{erro}</span>}
              <div className="flex flex-col sm:flex-row gap-3 sm:justify-end mt-2">
                <Button type="button" variant="ghost" onClick={handleCancelarEdit}
                  className="w-full sm:w-auto text-fg-3 font-mono text-[14px] border border-border-3 rounded-none px-5 py-[10px] h-auto"
                >Cancelar</Button>
                <Button type="button" disabled={loading} onClick={handleSalvarLocatario}
                  className={cn("w-full sm:w-auto bg-indigo text-fg-1 font-body font-bold text-[13px] tracking-[1.2px] uppercase px-8 py-[14px] rounded-none h-auto", loading ? "opacity-60 cursor-not-allowed" : "cursor-pointer")}
                >{loading ? "Salvando..." : "Salvar →"}</Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Invite Modal */}
      {showInviteForm && (
        <div
          className="romma-modal-backdrop"
          onClick={e => { if (e.target === e.currentTarget) setShowInviteForm(false) }}
        >
          <div className="bg-surface border border-border-2 w-full max-w-[480px] p-6 sm:p-8 flex flex-col gap-6">
            <div className="flex flex-col gap-2">
              <span className="eyebrow eyebrow--indigo">NOVO LOCATÁRIO</span>
              <h3 className="font-body font-bold text-[30px] text-fg-1 m-0">Enviar Convite</h3>
            </div>
            <form onSubmit={handleConvidar} className="flex flex-col gap-4">
              <Field label="Email" required>
                <Input type="email" required value={form.email}
                  onChange={e => setForm({ ...form, email: e.target.value })}
                  className="bg-surface-hi border-border-3 text-fg-1 font-mono text-[16px] rounded-none"
                />
              </Field>
              <Field label="Nome / Razão Social" required>
                <Input type="text" required value={form.nome_razao_social}
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
                      onClick={() => setForm({ ...form, tipo: t, documento: maskDocumento(t, form.documento) })}
                      className={cn(
                        "cursor-pointer py-2 px-5 font-mono font-bold text-[11px] tracking-[1px] uppercase border border-border-3",
                        form.tipo === t ? "bg-indigo text-fg-1" : "bg-surface-hi text-fg-4"
                      )}
                    >{t === "pf" ? "Pessoa Física" : "Pessoa Jurídica"}</button>
                  ))}
                </div>
              </Field>
              <Field label={form.tipo === "pj" ? "CNPJ" : "CPF"} required>
                <Input type="text" required
                  value={form.documento}
                  placeholder={form.tipo === "pj" ? "00.000.000/0000-00" : "000.000.000-00"}
                  onChange={e => setForm({ ...form, documento: maskDocumento(form.tipo, e.target.value) })}
                  className="bg-surface-hi border-border-3 text-fg-1 font-mono text-[16px] rounded-none"
                />
              </Field>
              <Field label="Telefone" required>
                <Input type="tel" required
                  placeholder="(11) 99999-9999"
                  value={form.telefone}
                  onChange={e => setForm({ ...form, telefone: maskPhone(e.target.value) })}
                  className="bg-surface-hi border-border-3 text-fg-1 font-mono text-[16px] rounded-none"
                />
              </Field>
              {erro && <span className="font-mono text-[11px] text-danger-fg">{erro}</span>}
              <div className="flex flex-col sm:flex-row gap-3 sm:justify-end mt-2">
                <Button type="button" variant="ghost"
                  onClick={() => { setShowInviteForm(false); setErro("") }}
                  className="w-full sm:w-auto text-fg-3 font-mono text-[14px] border border-border-3 rounded-none px-5 py-[10px] h-auto"
                >Cancelar</Button>
                <Button type="submit" disabled={loading}
                  className={cn("w-full sm:w-auto bg-indigo text-fg-1 font-body font-bold text-[13px] tracking-[1.2px] uppercase px-8 py-[14px] rounded-none h-auto", loading ? "opacity-60 cursor-not-allowed" : "cursor-pointer")}
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
