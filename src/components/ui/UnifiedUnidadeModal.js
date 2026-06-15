"use client"

import { useState, useRef, useEffect } from "react"
import { toast } from "sonner"
import { createClient } from "@/lib/supabase-browser"
import { criarUnidade, editarUnidade } from "@/actions/unidades"

/* ── Field primitives ──────────────────────────────────────────────────── */
function FLabel({ children }) {
  return (
    <span style={{
      fontFamily: "var(--font-mono)", fontSize: 10, letterSpacing: "1px",
      textTransform: "uppercase", color: "var(--fg-4)"
    }}>
      {children}
    </span>
  )
}

function FInput({ style, ...props }) {
  const [focused, setFocused] = useState(false)
  return (
    <input
      {...props}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      style={{
        all: "unset", boxSizing: "border-box", width: "100%",
        padding: "10px 12px", fontSize: 14,
        fontFamily: "var(--font-body)", color: "var(--fg-1)",
        background: "var(--surface-hi)",
        border: `1px solid ${focused ? "var(--primary)" : "var(--border-3)"}`,
        transition: "border-color var(--dur-fast)",
        ...style
      }}
    />
  )
}

function FSelect({ value, onChange, children }) {
  const [focused, setFocused] = useState(false)
  return (
    <div style={{ position: "relative" }}>
      <select
        value={value}
        onChange={onChange}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        style={{
          all: "unset", boxSizing: "border-box", width: "100%",
          padding: "10px 34px 10px 12px", fontSize: 13,
          fontFamily: "var(--font-mono)", color: "var(--fg-1)",
          background: "var(--surface-hi)", cursor: "pointer",
          border: `1px solid ${focused ? "var(--primary)" : "var(--border-3)"}`,
          transition: "border-color var(--dur-fast)"
        }}
      >
        {children}
      </select>
      <span style={{
        position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)",
        pointerEvents: "none", fontFamily: "var(--font-mono)", fontSize: 10,
        color: "var(--fg-4)"
      }}>▾</span>
    </div>
  )
}

function FormField({ label, children }) {
  return (
    <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <FLabel>{label}</FLabel>
      {children}
    </label>
  )
}

function ErrLine({ children }) {
  return (
    <div style={{
      background: "var(--danger-bg2)", borderLeft: "2px solid var(--danger-fg)",
      padding: "10px 14px", fontFamily: "var(--font-mono)",
      fontSize: 12, color: "var(--danger-fg)"
    }}>
      {children}
    </div>
  )
}

function FormCheck({ checked, onClick, label }) {
  return (
    <div onClick={onClick} style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
      <span style={{
        width: 16, height: 16, flexShrink: 0,
        border: `1px solid ${checked ? "var(--indigo)" : "var(--border-3)"}`,
        background: checked ? "var(--indigo)" : "transparent",
        display: "flex", alignItems: "center", justifyContent: "center"
      }}>
        {checked && (
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
            <path d="M1.5 5L4 7.5L8.5 2.5" stroke="white" strokeWidth="1.5" strokeLinecap="square" />
          </svg>
        )}
      </span>
      <FLabel>{label}</FLabel>
    </div>
  )
}

/* ── Cover photo field (inline) ────────────────────────────────────────── */
function CoverPhotoField({ preview, setPreview, fileToUpload, setFileToUpload, setFotoUrl, setErro }) {
  const [drag, setDrag] = useState(false)
  const inputRef = useRef(null)

  function openPicker(e) {
    e?.stopPropagation()
    inputRef.current?.click()
  }

  function handleFileSelect(file) {
    if (!file) return
    if (!file.type.startsWith("image/")) {
      setErro("Apenas imagens são aceitas.")
      return
    }
    if (file.size > 2 * 1024 * 1024) {
      setErro("Arquivo deve ter menos de 2MB.")
      return
    }
    // Revoke previous object URL before setting a new one
    if (preview && !preview.startsWith("/") && !preview.startsWith("http")) {
      URL.revokeObjectURL(preview)
    }
    setErro(null)
    setFotoUrl(null)          // real upload will produce a storage path at submit
    setFileToUpload(file)
    setPreview(URL.createObjectURL(file))
  }

  function handleUsarExemplo(e) {
    e.stopPropagation()
    if (preview && !preview.startsWith("/") && !preview.startsWith("http")) {
      URL.revokeObjectURL(preview)
    }
    setFileToUpload(null)
    setFotoUrl("/images/unidade-exemplo.jpg")   // persist the example path on save
    setPreview("/images/unidade-exemplo.jpg")
  }

  function handleRemover() {
    if (preview && !preview.startsWith("/") && !preview.startsWith("http")) {
      URL.revokeObjectURL(preview)
    }
    setFileToUpload(null)
    setFotoUrl(null)
    setPreview(null)
  }

  return (
    <div>
      <FLabel>Foto de capa</FLabel>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        style={{ display: "none" }}
        onChange={(e) => handleFileSelect(e.target.files[0])}
      />
      {preview ? (
        <div style={{
          position: "relative", height: 150, marginTop: 6,
          border: "1px solid var(--border-3)", overflow: "hidden"
        }}>
          <img
            src={preview}
            alt=""
            style={{
              width: "100%", height: "100%", objectFit: "cover",
              filter: preview === "/images/unidade-exemplo.jpg"
                ? "grayscale(0.3) contrast(1.1) brightness(0.7)"
                : "none"
            }}
          />
          <div style={{
            position: "absolute", inset: 0,
            background: "linear-gradient(180deg, transparent, rgba(0,0,0,0.5))"
          }} />
          <div style={{ position: "absolute", bottom: 10, right: 10, display: "flex", gap: 6 }}>
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              style={{
                all: "unset", cursor: "pointer", fontFamily: "var(--font-mono)",
                fontSize: 10, fontWeight: 700, color: "var(--fg-1)",
                letterSpacing: "0.5px", textTransform: "uppercase",
                padding: "6px 10px", background: "rgba(0,0,0,0.55)",
                border: "1px solid var(--border-2)"
              }}
            >
              Trocar
            </button>
            <button
              type="button"
              onClick={handleRemover}
              style={{
                all: "unset", cursor: "pointer", fontFamily: "var(--font-mono)",
                fontSize: 10, fontWeight: 700, color: "var(--danger-fg)",
                letterSpacing: "0.5px", textTransform: "uppercase",
                padding: "6px 10px", background: "rgba(0,0,0,0.55)",
                border: "1px solid color-mix(in oklch, var(--destructive) 40%, transparent)"
              }}
            >
              Remover
            </button>
          </div>
        </div>
      ) : (
        <div
          onClick={openPicker}
          onDragOver={(e) => { e.preventDefault(); setDrag(true) }}
          onDragLeave={() => setDrag(false)}
          onDrop={(e) => { e.preventDefault(); setDrag(false); handleFileSelect(e.dataTransfer.files[0]) }}
          style={{
            marginTop: 6, height: 130, cursor: "pointer",
            border: `1px dashed ${drag ? "var(--indigo)" : "var(--border-2)"}`,
            background: drag ? "oklch(0.339 0.179 301.68 / 0.08)" : "var(--surface-hi)",
            display: "flex", flexDirection: "column", alignItems: "center",
            justifyContent: "center", gap: 10, transition: "all var(--dur-fast)"
          }}
        >
          <span style={{
            width: 30, height: 30, border: "1px solid var(--border-2)",
            display: "flex", alignItems: "center", justifyContent: "center",
            color: "var(--fg-4)", fontFamily: "var(--font-mono)"
          }}>⤓</span>
          <span className="r-meta" style={{ color: "var(--fg-4)" }}>
            Arraste uma imagem aqui
          </span>
          {/* Primary upload action */}
          <button
            type="button"
            onClick={openPicker}
            style={{
              all: "unset", cursor: "pointer", fontFamily: "var(--font-mono)",
              fontSize: 11, fontWeight: 700, color: "var(--fg-1)",
              letterSpacing: "0.5px", textTransform: "uppercase",
              padding: "8px 16px", border: "1px solid var(--indigo)",
              background: "oklch(0.339 0.179 301.68 / 0.18)",
            }}
          >
            Selecionar imagem
          </button>
          {/* Secondary, clearly de-emphasised */}
          <button
            type="button"
            onClick={handleUsarExemplo}
            style={{
              all: "unset", cursor: "pointer", fontFamily: "var(--font-mono)",
              fontSize: 9.5, color: "var(--fg-5)", letterSpacing: "0.5px",
              textTransform: "uppercase", textDecoration: "underline",
            }}
          >
            ou usar foto de exemplo
          </button>
        </div>
      )}
    </div>
  )
}

/* ── UnifiedUnidadeModal ───────────────────────────────────────────────── */
export default function UnifiedUnidadeModal({ mode, initial, edificios, onClose, onSaved }) {
  const [form, setForm] = useState({
    nome: initial?.nome ?? "",
    descricao: initial?.descricao ?? "",
    area_m2: initial?.area_m2 ?? "",
    valor_mensal: initial?.valor_mensal ?? "",
    valor_visivel: initial?.valor_visivel ?? false,
    status: initial?.status ?? "disponivel",
    edificio_id: initial?.edificio_id ?? (edificios?.[0]?.id ?? ""),
    foto_url: initial?.foto_url ?? null,
  })
  const [loading, setLoading] = useState(false)
  const [erro, setErro] = useState(null)

  // Cover photo state — lives here so handleSubmit can access fileToUpload
  const [preview, setPreview] = useState(null)
  const [fileToUpload, setFileToUpload] = useState(null)

  function resetForm() {
    setForm({
      nome: "", descricao: "", area_m2: "", valor_mensal: "",
      valor_visivel: false, status: "disponivel",
      edificio_id: edificios?.[0]?.id ?? "", foto_url: null
    })
    setPreview(null)
    setFileToUpload(null)
  }

  // Resolve initial foto_url to displayable preview on mount (edit mode)
  useEffect(() => {
    if (!initial?.foto_url) return
    if (initial.foto_url.startsWith("/")) {
      setPreview(initial.foto_url)
      return
    }
    // Storage path → signed URL
    const supabase = createClient()
    supabase.storage
      .from("unidades-fotos")
      .createSignedUrl(initial.foto_url, 3600)
      .then(({ data, error }) => {
        if (!error && data?.signedUrl) setPreview(data.signedUrl)
      })
  }, []) // only on mount

  // Revoke object URL on unmount to avoid memory leak
  useEffect(() => {
    return () => {
      if (preview && !preview.startsWith("/") && !preview.startsWith("http")) {
        URL.revokeObjectURL(preview)
      }
    }
  }, [preview])

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    setErro(null)

    try {
      if (mode === "create") {
        // Step 1: create unit — pass static example path if chosen, else null
        const fotoInicial = (form.foto_url?.startsWith("/")) ? form.foto_url : null
        const res = await criarUnidade({ ...form, foto_url: fotoInicial })
        if (res.status !== 200) { setErro(res.erroMessage); return }
        const unidadeId = res.id

        // Step 2: upload real file if user chose one
        let fotoPath = fotoInicial
        if (fileToUpload) {
          const supabase = createClient()
          const ext = fileToUpload.name.split(".").pop()
          const path = `${unidadeId}/${crypto.randomUUID()}.${ext}`
          const { data, error: uploadErr } = await supabase.storage
            .from("unidades-fotos")
            .upload(path, fileToUpload, { contentType: fileToUpload.type, upsert: false })
          if (uploadErr) { setErro("Erro ao enviar foto."); return }
          fotoPath = data.path
        }

        // Step 3: patch foto_url if we have a storage path
        if (fotoPath && !fotoPath.startsWith("/") && fileToUpload) {
          await editarUnidade(unidadeId, { foto_url: fotoPath })
        }
      } else {
        // Edit mode: upload new photo first if changed, then patch everything
        let fotoPath = form.foto_url
        if (fileToUpload) {
          const supabase = createClient()
          const ext = fileToUpload.name.split(".").pop()
          const path = `${initial.id}/${crypto.randomUUID()}.${ext}`
          const { data, error: uploadErr } = await supabase.storage
            .from("unidades-fotos")
            .upload(path, fileToUpload, { contentType: fileToUpload.type, upsert: false })
          if (uploadErr) { setErro("Erro ao enviar foto."); return }
          fotoPath = data.path
        }
        const res = await editarUnidade(initial.id, { ...form, foto_url: fotoPath })
        if (res.status !== 200) { setErro(res.erroMessage); return }
      }

      toast.success(mode === "create" ? "Unidade criada com sucesso" : "Unidade atualizada")
      onSaved()
      onClose()
    } finally {
      setLoading(false)
    }
  }

  return (
    <div onClick={onClose} className="romma-modal-backdrop z-[100]">
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: 560, maxWidth: "100%",
          background: "var(--background)",
          border: "1px solid var(--border-3)",
          padding: 28,
        }}
      >
        {/* Header */}
        <div style={{
          display: "flex", justifyContent: "space-between",
          alignItems: "flex-start", marginBottom: 20
        }}>
          <div>
            <span className="eyebrow eyebrow--indigo" style={{ marginBottom: 6, display: "block" }}>
              {mode === "edit" ? "EDITAR UNIDADE" : "NOVA UNIDADE"}
            </span>
            <h3 className="r-section">
              {mode === "edit" ? (form.nome || "Unidade") : "Cadastrar Unidade"}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              all: "unset", cursor: "pointer", width: 30, height: 30,
              border: "1px solid var(--border-3)", display: "flex",
              alignItems: "center", justifyContent: "center",
              color: "var(--fg-3)", fontFamily: "var(--font-mono)"
            }}
          >✕</button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {/* Cover photo field */}
          <CoverPhotoField
            preview={preview}
            setPreview={setPreview}
            fileToUpload={fileToUpload}
            setFileToUpload={setFileToUpload}
            setFotoUrl={(v) => setForm(f => ({ ...f, foto_url: v }))}
            setErro={setErro}
          />

          {/* Fields grid */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            <FormField label="Edifício">
              <FSelect
                value={form.edificio_id}
                onChange={(e) => setForm({ ...form, edificio_id: e.target.value })}
              >
                {edificios.map((ed) => (
                  <option key={ed.id} value={ed.id}>{ed.nome}</option>
                ))}
              </FSelect>
            </FormField>

            <FormField label="Nome da unidade">
              <FInput
                value={form.nome}
                onChange={(e) => setForm({ ...form, nome: e.target.value })}
                placeholder="Ex: Sala 1208"
                required
              />
            </FormField>

            <FormField label="Área (m²)">
              <FInput
                type="number"
                value={form.area_m2}
                onChange={(e) => setForm({ ...form, area_m2: e.target.value })}
                placeholder="0"
              />
            </FormField>

            <FormField label="Valor mensal (R$)">
              <FInput
                type="number"
                value={form.valor_mensal}
                onChange={(e) => setForm({ ...form, valor_mensal: e.target.value })}
                placeholder="0"
              />
            </FormField>

            <FormField label="Status">
              <FSelect
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value })}
              >
                <option value="disponivel">Disponível</option>
                <option value="alugada">Alugada</option>
              </FSelect>
            </FormField>

            <FormField label="Descrição">
              <FInput
                value={form.descricao}
                onChange={(e) => setForm({ ...form, descricao: e.target.value })}
                placeholder="Opcional"
              />
            </FormField>
          </div>

          {/* Visibility checkbox */}
          <FormCheck
            checked={form.valor_visivel}
            onClick={() => setForm({ ...form, valor_visivel: !form.valor_visivel })}
            label="Exibir valor publicamente"
          />

          {/* Error line */}
          {erro && <ErrLine>{erro}</ErrLine>}

          {/* Action bar */}
          <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 4 }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                all: "unset", cursor: "pointer",
                border: "1px solid var(--border-3)", background: "transparent",
                color: "var(--fg-2)", padding: "10px 16px",
                fontFamily: "var(--font-mono)", fontSize: 12,
                letterSpacing: "0.5px", textTransform: "uppercase"
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
                border: "none", padding: "10px 18px",
                fontFamily: "var(--font-mono)", fontSize: 12,
                letterSpacing: "0.5px", textTransform: "uppercase"
              }}
            >
              <span style={{ fontFamily: "var(--font-mono)", fontSize: 10, marginRight: 6 }}>
                {loading ? "[···]" : "[✓]"}
              </span>
              {loading ? "Salvando..." : (mode === "edit" ? "Salvar Alterações" : "Criar Unidade")}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
