"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import PageHeader from "@/components/ui/PageHeader"
import StatusBadge from "@/components/ui/StatusBadge"
import { convidarLocatario, revogarConvite } from "@/actions/locatarios"
import { getLocatarios } from "@/lib/queries-client"

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

  async function handleRevogar(id) {
    const { status, erroMessage } = await revogarConvite(id)
    if (status === 200) {
      setLocatarios(await getLocatarios() ?? [])
    } else {
      alert(erroMessage ?? "Erro ao revogar convite.")
    }
  }

  const GRID = "1.8fr 0.5fr 1.2fr 1.2fr 0.8fr 1.4fr 80px"

  return (
    <div className="romma-desktop-only romma-page" style={{ padding: 48, background: "var(--background)", minHeight: "100%" }}>
      <PageHeader
        eyebrow="SISTEMA.03 // PESSOAS"
        title="Locatários."
        subtitle={`${ativos} ativos · ${pendentes} convites pendentes`}
        cta={{ label: "Convidar Locatário", code: "L+", onClick: () => setShowInviteForm(true) }}
      />

      {/* Table */}
      <div style={{ background: "var(--surface)", border: "1px solid var(--border-3)" }}>
        {/* Header */}
        <div style={{
          display: "grid", gridTemplateColumns: GRID,
          padding: "12px 20px", background: "oklch(0.26 0 0)"
        }}>
          {["Nome", "Tipo", "Documento", "Email", "Contratos", "Status", "Ações"].map(h => (
            <span key={h} style={{
              fontFamily: "var(--font-mono)", fontSize: 9, fontWeight: 700,
              letterSpacing: 1.5, textTransform: "uppercase", color: "var(--fg-4)"
            }}>{h}</span>
          ))}
        </div>

        {/* Rows */}
        {locatarios.length === 0 && (
          <div style={{ padding: "32px 20px", fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--fg-4)", textAlign: "center" }}>
            Nenhum locatário cadastrado.
          </div>
        )}
        {locatarios.map((l, i) => {
          const ini = getInitials(l.nome_razao_social)
          const cs = contratos.filter(c => c.locatario_id === l.id)
          const ativosCount = cs.filter(c => c.status === "ativo").length
          const isPendente = l.status_convite === "pendente"

          return (
            <div key={l.id} style={{
              display: "grid", gridTemplateColumns: GRID,
              padding: "16px 20px", alignItems: "center",
              borderTop: i > 0 ? "1px solid var(--border-3)" : 0
            }}>
              {/* Nome + avatar */}
              <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0 }}>
                <div style={{
                  width: 32, height: 32, flexShrink: 0,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  background: isPendente ? "transparent" : "var(--surface)",
                  border: "1px solid var(--border-2)",
                  fontFamily: "var(--font-body)", fontWeight: 700, fontSize: 10, letterSpacing: 1,
                  color: isPendente ? "var(--fg-4)" : "var(--fg-1)"
                }}>{ini}</div>
                <span style={{
                  fontFamily: "var(--font-body)", fontWeight: 500, fontSize: 13,
                  color: "var(--fg-1)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap"
                }}>{l.nome_razao_social}</span>
              </div>

              {/* Tipo */}
              <span style={{ fontFamily: "var(--font-mono)", fontSize: 10, letterSpacing: 0.5, color: "var(--fg-3)" }}>
                {l.tipo?.toUpperCase()}
              </span>

              {/* Documento */}
              <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--fg-2)" }}>
                {fmtDoc(l.tipo, l.documento)}
              </span>

              {/* Email */}
              <span style={{
                fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--fg-3)",
                overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap"
              }}>{l.email}</span>

              {/* Contratos */}
              <span style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--fg-2)" }}>
                {ativosCount}/{cs.length}
              </span>

              {/* Status */}
              <div>
                <StatusBadge status={isPendente ? "pendente_convite" : "aceito"} />
              </div>

              {/* Ações */}
              <div style={{ display: "flex", gap: 8 }}>
                {isPendente ? (
                  <button
                    onClick={() => handleRevogar(l.id)}
                    style={{
                      all: "unset", cursor: "pointer",
                      fontFamily: "var(--font-mono)", fontSize: 10, letterSpacing: 0.5,
                      color: "var(--danger)", fontWeight: 700
                    }}
                  >REVOGAR</button>
                ) : (
                  <button
                    onClick={() => router.push(`/dashboard/locatarios/${l.id}`)}
                    style={{
                      all: "unset", cursor: "pointer",
                      fontFamily: "var(--font-mono)", fontSize: 10,
                      letterSpacing: 0.5, color: "var(--fg-3)", fontWeight: 700
                    }}
                  >VER →</button>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Invite Callout */}
      <div style={{
        marginTop: 32, padding: 24,
        border: "1px solid var(--indigo)",
        display: "flex", justifyContent: "space-between", alignItems: "center",
        background: "oklch(0.339 0.179 301.68 / 0.06)"
      }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <span className="eyebrow eyebrow--indigo">FLUXO DE CONVITE</span>
          <span style={{ fontSize: 13, color: "var(--fg-2)", lineHeight: 1.5, maxWidth: 540 }}>
            Convide um locatário pelo email. Ele recebe um token único, define a senha e o vínculo é selado. Você pode revogar antes do aceite.
          </span>
        </div>
        <button
          onClick={() => setShowInviteForm(true)}
          style={{
            all: "unset", cursor: "pointer", padding: "12px 20px",
            background: "var(--indigo)", color: "var(--fg-1)",
            fontWeight: 700, fontSize: 11, letterSpacing: 1.4, textTransform: "uppercase"
          }}
        >Convidar →</button>
      </div>

      {/* Invite Form Modal */}
      {showInviteForm && (
        <div style={{
          position: "fixed", inset: 0, zIndex: 50,
          background: "oklch(0 0 0 / 0.7)",
          display: "flex", alignItems: "center", justifyContent: "center"
        }} onClick={e => { if (e.target === e.currentTarget) setShowInviteForm(false) }}>
          <div style={{
            background: "var(--surface)", border: "1px solid var(--border-2)",
            width: 480, padding: 32, display: "flex", flexDirection: "column", gap: 24
          }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <span className="eyebrow eyebrow--indigo">NOVO LOCATÁRIO</span>
              <h3 style={{ fontFamily: "var(--font-body)", fontWeight: 700, fontSize: 20, color: "var(--fg-1)", margin: 0 }}>
                Enviar Convite
              </h3>
            </div>

            <form onSubmit={handleConvidar} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <Field label="Email" required>
                <input
                  type="email" required value={form.email}
                  onChange={e => setForm({ ...form, email: e.target.value })}
                  style={inputStyle}
                />
              </Field>

              <Field label="Nome / Razão Social" required>
                <input
                  type="text" required value={form.nome_razao_social}
                  onChange={e => setForm({ ...form, nome_razao_social: e.target.value })}
                  style={inputStyle}
                />
              </Field>

              <Field label="Tipo">
                <div style={{ display: "flex", gap: 0 }}>
                  {["pf", "pj"].map(t => (
                    <button
                      key={t} type="button"
                      onClick={() => setForm({ ...form, tipo: t })}
                      style={{
                        all: "unset", cursor: "pointer", padding: "8px 20px",
                        fontFamily: "var(--font-mono)", fontWeight: 700, fontSize: 11, letterSpacing: 1,
                        textTransform: "uppercase",
                        background: form.tipo === t ? "var(--indigo)" : "var(--surface-hi)",
                        color: form.tipo === t ? "var(--fg-1)" : "var(--fg-4)",
                        border: "1px solid var(--border-3)"
                      }}
                    >{t === "pf" ? "Pessoa Física" : "Pessoa Jurídica"}</button>
                  ))}
                </div>
              </Field>

              <Field label={form.tipo === "pj" ? "CNPJ" : "CPF"} required>
                <input
                  type="text" required value={form.documento}
                  placeholder={form.tipo === "pj" ? "00.000.000/0000-00" : "000.000.000-00"}
                  onChange={e => setForm({ ...form, documento: e.target.value.replace(/\D/g, "") })}
                  style={inputStyle}
                />
              </Field>

              <Field label="Telefone" required>
                <input
                  type="tel" required value={form.telefone}
                  onChange={e => setForm({ ...form, telefone: e.target.value })}
                  style={inputStyle}
                />
              </Field>

              {erro && (
                <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--danger)" }}>{erro}</span>
              )}

              <div style={{ display: "flex", gap: 12, justifyContent: "flex-end", marginTop: 8 }}>
                <button
                  type="button" onClick={() => { setShowInviteForm(false); setErro("") }}
                  style={{
                    all: "unset", cursor: "pointer", padding: "10px 20px",
                    fontFamily: "var(--font-body)", fontWeight: 700, fontSize: 11,
                    letterSpacing: 1.2, textTransform: "uppercase",
                    border: "1px solid var(--border-3)", color: "var(--fg-3)"
                  }}
                >Cancelar</button>
                <button
                  type="submit" disabled={loading}
                  style={{
                    all: "unset", cursor: loading ? "wait" : "pointer",
                    padding: "10px 24px", background: "var(--indigo)",
                    fontFamily: "var(--font-body)", fontWeight: 700, fontSize: 11,
                    letterSpacing: 1.2, textTransform: "uppercase", color: "var(--fg-1)",
                    opacity: loading ? 0.6 : 1
                  }}
                >{loading ? "Enviando..." : "Enviar Convite →"}</button>
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
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <label style={{
        fontFamily: "var(--font-mono)", fontSize: 10, fontWeight: 700,
        letterSpacing: 1, textTransform: "uppercase", color: "var(--fg-4)"
      }}>{label}{required && <span style={{ color: "var(--danger)", marginLeft: 2 }}>*</span>}</label>
      {children}
    </div>
  )
}

const inputStyle = {
  all: "unset", display: "block", width: "100%", boxSizing: "border-box",
  padding: "10px 12px", background: "var(--surface-hi)",
  border: "1px solid var(--border-3)", color: "var(--fg-1)",
  fontFamily: "var(--font-mono)", fontSize: 13
}
