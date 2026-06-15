# Phase 19: Unidades — Modal Unificado & Foto de Capa - Pattern Map

**Mapped:** 2026-06-14
**Files analyzed:** 8 new/modified files
**Analogs found:** 8 / 8

---

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|---|---|---|---|---|
| `src/components/ui/UnifiedUnidadeModal.js` | component (modal) | request-response | `src/components/features/Unidades.js` (form block) + `.planning/design/js/console2.jsx` `UnitFormModal` | exact (prototype) |
| `src/components/ui/CoverPhotoField.js` (or inline in modal) | component (field) | file-I/O | `.planning/design/js/console2.jsx` `CoverPhotoField` | exact (prototype) |
| `src/components/features/Unidades.js` (refactor) | component (feature screen) | CRUD + event-driven | `src/components/features/Unidades.js` (current) | self-refactor |
| `src/components/ui/UnidadeCard.js` (modify) | component (card) | request-response | `src/components/ui/UnidadeCard.js` (current) | self-modify |
| `src/actions/unidades.js` (extend) | server action | CRUD | `src/actions/unidades.js` (current) | self-extend |
| `src/lib/queries-client.js` (extend `getUnidades`) | utility / query | CRUD | `src/lib/queries-client.js` (current) | self-extend |
| `e2e/crud-unidades.spec.js` (update selectors) | test | request-response | `e2e/crud-unidades.spec.js` (current) | self-update |
| `e2e/toast-unidades.spec.js` (update delete flow) | test | request-response | `e2e/toast-unidades.spec.js` (current) | self-update |

---

## Pattern Assignments

### `src/components/ui/UnifiedUnidadeModal.js` (component, request-response)

**Primary analog:** `.planning/design/js/console2.jsx` `UnitFormModal` (lines 83–117)
**Supporting analog:** `src/components/features/Unidades.js` (form state, reset, submit handler)
**Supporting analog:** `src/components/ui/ConfirmDialog.js` (backdrop class, modal container style)

**Props API (locked by D-01, D-07, UNID-03):**
```javascript
// mode: "create" | "edit"
// initial: unidade object or null
// edificios: array of { id, nome }
// onClose: () => void
// onSaved: () => void   (parent reloads list after this)
export default function UnifiedUnidadeModal({ mode, initial, edificios, onClose, onSaved })
```

**'use client' directive + imports pattern** (copy from `src/components/features/Unidades.js` lines 1–13, adapted):
```javascript
"use client"

import { useState, useRef, useEffect } from "react"
import { toast } from "sonner"
import { createClient } from "@/lib/supabase-browser"
import { criarUnidade, editarUnidade } from "@/actions/unidades"
```

**Form state pattern** (from `src/components/features/Unidades.js` lines 41–49 — single object, not per-field):
```javascript
const [form, setForm] = useState({
  nome: initial?.nome ?? "",
  descricao: initial?.descricao ?? "",
  area_m2: initial?.area_m2 ?? "",
  valor_mensal: initial?.valor_mensal ?? "",
  valor_visivel: initial?.valor_visivel ?? false,
  status: initial?.status ?? "disponivel",
  edificio_id: initial?.edificio_id ?? "",
  foto_url: initial?.foto_url ?? null,
})

function resetForm() {
  setForm({ nome: "", descricao: "", area_m2: "", valor_mensal: "",
            valor_visivel: false, status: "disponivel",
            edificio_id: "", foto_url: null })
}
```

**Loading + erro state pattern** (from `src/components/features/Unidades.js` lines 39–40):
```javascript
const [loading, setLoading] = useState(false)
const [erro, setErro] = useState(null)
```

**Submit handler pattern — create with foto (new 3-step flow per RESEARCH Pitfall 1):**
```javascript
async function handleSubmit(e) {
  e.preventDefault()
  setLoading(true)
  setErro(null)

  try {
    if (mode === "create") {
      // Step 1: create unit (no foto_url yet)
      const res = await criarUnidade({ ...form, foto_url: null })
      if (res.status !== 200) { setErro(res.erroMessage); return }
      const unidadeId = res.id  // criarUnidade must return { status: 200, id }

      // Step 2: upload photo if user selected one
      let fotoPath = form.foto_url  // may be '/images/unidade-exemplo.jpg' or null
      if (fileToUpload) {
        const supabase = createClient()
        const ext = fileToUpload.name.split('.').pop()
        const path = `${unidadeId}/${crypto.randomUUID()}.${ext}`
        const { data, error: uploadErr } = await supabase.storage
          .from('unidades-fotos')
          .upload(path, fileToUpload, { contentType: fileToUpload.type, upsert: false })
        if (uploadErr) { setErro("Erro ao enviar foto."); return }
        fotoPath = data.path
      }

      // Step 3: patch foto_url if we have one
      if (fotoPath) {
        await editarUnidade(unidadeId, { foto_url: fotoPath })
      }
    } else {
      // Edit: upload new photo first if changed, then patch everything
      let fotoPath = form.foto_url
      if (fileToUpload) {
        const supabase = createClient()
        const ext = fileToUpload.name.split('.').pop()
        const path = `${initial.id}/${crypto.randomUUID()}.${ext}`
        const { data, error: uploadErr } = await supabase.storage
          .from('unidades-fotos')
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
```

**Backdrop + container pattern** (from `src/components/ui/ConfirmDialog.js` lines 22–31 — uses `romma-modal-backdrop` class):
```javascript
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
      {/* header, form, actions */}
    </div>
  </div>
)
```

**Modal header pattern** (from `.planning/design/js/console2.jsx` lines 94–97):
```javascript
<div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
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
    style={{ all: "unset", cursor: "pointer", width: 30, height: 30,
             border: "1px solid var(--border-3)", display: "flex",
             alignItems: "center", justifyContent: "center",
             color: "var(--fg-3)", fontFamily: "var(--font-mono)" }}
  >✕</button>
</div>
```

**Field primitives (FLabel, FInput, FSelect, FormField, FormCheck, ErrLine)** (from `.planning/design/js/console2.jsx` lines 5–43 — adapt inline, no `useState` for focus in FInput since project uses inline styles not Tailwind):
```javascript
// These become small local functions at the top of UnifiedUnidadeModal.js
function FLabel({ children }) {
  return <span style={{ fontFamily: "var(--font-mono)", fontSize: 10, letterSpacing: "1px", textTransform: "uppercase", color: "var(--fg-4)" }}>{children}</span>
}
function FInput({ style, ...props }) {
  const [focused, setFocused] = useState(false)
  return <input {...props}
    onFocus={() => setFocused(true)}
    onBlur={() => setFocused(false)}
    style={{ all: "unset", boxSizing: "border-box", width: "100%", padding: "10px 12px",
             fontSize: 14, fontFamily: "var(--font-body)", color: "var(--fg-1)",
             background: "var(--surface-hi)",
             border: `1px solid ${focused ? "var(--primary)" : "var(--border-3)"}`,
             transition: "border-color var(--dur-fast)", ...style }} />
}
function FSelect({ value, onChange, children }) {
  const [focused, setFocused] = useState(false)
  return (
    <div style={{ position: "relative" }}>
      <select value={value} onChange={onChange}
        onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
        style={{ all: "unset", boxSizing: "border-box", width: "100%",
                 padding: "10px 34px 10px 12px", fontSize: 13,
                 fontFamily: "var(--font-mono)", color: "var(--fg-1)",
                 background: "var(--surface-hi)", cursor: "pointer",
                 border: `1px solid ${focused ? "var(--primary)" : "var(--border-3)"}`,
                 transition: "border-color var(--dur-fast)" }}>
        {children}
      </select>
      <span style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)",
                     pointerEvents: "none", fontFamily: "var(--font-mono)", fontSize: 10,
                     color: "var(--fg-4)" }}>▾</span>
    </div>
  )
}
function FormField({ label, children }) {
  return <label style={{ display: "flex", flexDirection: "column", gap: 6 }}><FLabel>{label}</FLabel>{children}</label>
}
function ErrLine({ children }) {
  return <div style={{ background: "var(--danger-bg2)", borderLeft: "2px solid var(--danger-fg)",
                       padding: "10px 14px", fontFamily: "var(--font-mono)",
                       fontSize: 12, color: "var(--danger-fg)" }}>{children}</div>
}
function FormCheck({ checked, onClick, label }) {
  return (
    <div onClick={onClick} style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
      <span style={{ width: 16, height: 16, flexShrink: 0,
                     border: `1px solid ${checked ? "var(--indigo)" : "var(--border-3)"}`,
                     background: checked ? "var(--indigo)" : "transparent",
                     display: "flex", alignItems: "center", justifyContent: "center" }}>
        {checked && <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
          <path d="M1.5 5L4 7.5L8.5 2.5" stroke="white" strokeWidth="1.5" strokeLinecap="square" />
        </svg>}
      </span>
      <FLabel>{label}</FLabel>
    </div>
  )
}
```

**Form layout pattern** (from `.planning/design/js/console2.jsx` lines 98–113):
```javascript
<form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
  <CoverPhotoField ... />
  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
    <FormField label="Edifício">
      <FSelect value={form.edificio_id} onChange={(e) => setForm({ ...form, edificio_id: e.target.value })}>
        {edificios.map(ed => <option key={ed.id} value={ed.id}>{ed.nome}</option>)}
      </FSelect>
    </FormField>
    <FormField label="Nome da unidade">
      <FInput value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })}
              placeholder="Ex: Sala 1208" required />
    </FormField>
    {/* area_m2, valor_mensal, status, descricao ... */}
  </div>
  <FormCheck checked={form.valor_visivel}
             onClick={() => setForm({ ...form, valor_visivel: !form.valor_visivel })}
             label="Exibir valor publicamente" />
  {erro && <ErrLine>{erro}</ErrLine>}
  <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 4 }}>
    <button type="button" onClick={onClose} style={{ all: "unset", cursor: "pointer",
      border: "1px solid var(--border-3)", background: "transparent", color: "var(--fg-2)",
      padding: "10px 16px", fontFamily: "var(--font-mono)", fontSize: 12,
      letterSpacing: "0.5px", textTransform: "uppercase" }}>
      Cancelar
    </button>
    <button type="submit" disabled={loading} style={{ all: "unset", cursor: loading ? "wait" : "pointer",
      background: "var(--indigo)", color: "var(--fg-1)", border: "none",
      padding: "10px 18px", fontFamily: "var(--font-mono)", fontSize: 12,
      letterSpacing: "0.5px", textTransform: "uppercase" }}>
      <span style={{ fontFamily: "var(--font-mono)", fontSize: 10, marginRight: 6 }}>[✓]</span>
      {loading ? "Salvando..." : (mode === "edit" ? "Salvar Alterações" : "Criar Unidade")}
    </button>
  </div>
</form>
```

---

### `src/components/ui/CoverPhotoField.js` (component, file-I/O)

**Primary analog:** `.planning/design/js/console2.jsx` `CoverPhotoField` (lines 46–80)

**Note:** May be inline in `UnifiedUnidadeModal.js` — the planner decides. Phase 20 does not reuse `CoverPhotoField` directly. The patterns below apply whether inline or extracted.

**State + ref pattern:**
```javascript
// fileToUpload is kept in the parent modal's scope so submit handler can access it
// CoverPhotoField manages preview URL only
const [preview, setPreview] = useState(initial?.foto_url ?? null)
const [fileToUpload, setFileToUpload] = useState(null)  // File object, null if example
const [drag, setDrag] = useState(false)
const inputRef = useRef(null)
```

**File select + validation + object URL pattern** (from RESEARCH.md Pattern 4):
```javascript
function handleFileSelect(file) {
  if (!file) return
  if (!file.type.startsWith('image/')) {
    setErro('Apenas imagens são aceitas.')
    return
  }
  if (file.size > 2 * 1024 * 1024) {
    setErro('Arquivo deve ter menos de 2MB.')
    return
  }
  // Revoke previous object URL to avoid memory leak
  if (preview && !preview.startsWith('/')) URL.revokeObjectURL(preview)
  setFileToUpload(file)
  setPreview(URL.createObjectURL(file))
}
```

**Cleanup on modal close** (revoke object URL — call from `onClose` wrapper in parent):
```javascript
useEffect(() => {
  return () => {
    if (preview && !preview.startsWith('/') && !preview.startsWith('http')) {
      URL.revokeObjectURL(preview)
    }
  }
}, [preview])
```

**Foto de exemplo pattern** (from CONTEXT.md D-09, UI-SPEC line 316):
```javascript
function handleUsarExemplo(e) {
  e.stopPropagation()
  if (preview && !preview.startsWith('/')) URL.revokeObjectURL(preview)
  setFileToUpload(null)  // no file to upload — path is static /public asset
  setPreview('/images/unidade-exemplo.jpg')
}
```

**Dropzone render pattern** (from `.planning/design/js/console2.jsx` lines 65–79):
```javascript
{/* State 1: no photo */}
<div
  onClick={() => inputRef.current?.click()}
  onDragOver={(e) => { e.preventDefault(); setDrag(true) }}
  onDragLeave={() => setDrag(false)}
  onDrop={(e) => { e.preventDefault(); setDrag(false); handleFileSelect(e.dataTransfer.files[0]) }}
  style={{
    marginTop: 6, height: 110, cursor: "pointer",
    border: `1px dashed ${drag ? "var(--indigo)" : "var(--border-2)"}`,
    background: drag ? "oklch(0.339 0.179 301.68 / 0.08)" : "var(--surface-hi)",
    display: "flex", flexDirection: "column", alignItems: "center",
    justifyContent: "center", gap: 8, transition: "all var(--dur-fast)",
  }}
>
  <span style={{ width: 30, height: 30, border: "1px solid var(--border-2)",
                 display: "flex", alignItems: "center", justifyContent: "center",
                 color: "var(--fg-4)", fontFamily: "var(--font-mono)" }}>⤓</span>
  <span className="r-meta">Arraste uma imagem ou clique para enviar</span>
  <button type="button" onClick={handleUsarExemplo}
          style={{ all: "unset", cursor: "pointer", fontFamily: "var(--font-mono)",
                   fontSize: 10, color: "var(--indigo)", letterSpacing: "0.5px",
                   textTransform: "uppercase" }}>
    ou usar foto de exemplo
  </button>
</div>
<input ref={inputRef} type="file" accept="image/*" style={{ display: "none" }}
       onChange={(e) => handleFileSelect(e.target.files[0])} />
```

**Preview render pattern** (from `.planning/design/js/console2.jsx` lines 56–63):
```javascript
{/* State 2: has photo */}
<div style={{ position: "relative", height: 150, marginTop: 6,
              border: "1px solid var(--border-3)", overflow: "hidden" }}>
  <img src={preview} alt=""
       style={{ width: "100%", height: "100%", objectFit: "cover",
                filter: preview === '/images/unidade-exemplo.jpg'
                  ? "grayscale(0.3) contrast(1.1) brightness(0.7)"
                  : "none" }} />
  <div style={{ position: "absolute", inset: 0,
                background: "linear-gradient(180deg, transparent, rgba(0,0,0,0.5))" }} />
  <div style={{ position: "absolute", bottom: 10, right: 10, display: "flex", gap: 6 }}>
    <button type="button" onClick={() => inputRef.current?.click()}
            style={{ all: "unset", cursor: "pointer", fontFamily: "var(--font-mono)",
                     fontSize: 10, fontWeight: 700, color: "var(--fg-1)",
                     letterSpacing: "0.5px", textTransform: "uppercase",
                     padding: "6px 10px", background: "rgba(0,0,0,0.55)",
                     border: "1px solid var(--border-2)" }}>Trocar</button>
    <button type="button" onClick={() => { /* revogar + resetar preview */ }}
            style={{ all: "unset", cursor: "pointer", fontFamily: "var(--font-mono)",
                     fontSize: 10, fontWeight: 700, color: "var(--danger-fg)",
                     letterSpacing: "0.5px", textTransform: "uppercase",
                     padding: "6px 10px", background: "rgba(0,0,0,0.55)",
                     border: "1px solid color-mix(in oklch, var(--destructive) 40%, transparent)" }}>Remover</button>
  </div>
</div>
```

**Signed URL on read pattern** (from RESEARCH.md Pattern 2 — for edit mode, initial `foto_url` is a storage path):
```javascript
// Resolve initial foto_url to displayable URL on mount (edit mode only)
useEffect(() => {
  if (!initial?.foto_url) return
  if (initial.foto_url.startsWith('/')) {
    setPreview(initial.foto_url)  // static /public asset — use directly
    return
  }
  // Storage path → generate signed URL
  const supabase = createClient()
  supabase.storage
    .from('unidades-fotos')
    .createSignedUrl(initial.foto_url, 3600)
    .then(({ data, error }) => {
      if (!error) setPreview(data.signedUrl)
    })
}, [])  // only on mount — re-generate on reload, not on timer
```

---

### `src/components/features/Unidades.js` (refactor — feature screen)

**Primary analog:** `src/components/features/Unidades.js` (current, full file)
**Supporting analog:** `.planning/design/js/console2.jsx` `UnidadesScreen` (lines 119–200+)

**Modal state pattern** (replaces `showForm` / `editandoId` — from `.planning/design/js/console2.jsx` line 124):
```javascript
// Replace showForm + editandoId + formEdit with:
const [modal, setModal] = useState(null)  // null | { mode: "create" | "edit", initial: unidade | null }
const [confirmDelete, setConfirmDelete] = useState(null)  // null | unidade object
```

**Filter state pattern** (from `.planning/design/js/console2.jsx` lines 127–129):
```javascript
const [query, setQuery] = useState("")
const [fStatus, setFStatus] = useState("all")
const [fEd, setFEd] = useState("all")
```

**Metrics derivation pattern** (from `.planning/design/js/console2.jsx` lines 132–135 + RESEARCH.md Pattern 5):
```javascript
// Derived from full `unidades` list — not from `filtered`
const totalM2 = unidades.reduce((s, u) => s + (u.area_m2 || 0), 0)
const mrrRealizado = unidades.filter(u => u.status === 'alugada')
                             .reduce((s, u) => s + (u.valor_mensal || 0), 0)
const potencialEmAberto = unidades.filter(u => u.status === 'disponivel')
                                  .reduce((s, u) => s + (u.valor_mensal || 0), 0)
const valoresOcultos = unidades.filter(u => !u.valor_visivel).length
```

**Filtered list pattern** (from `.planning/design/js/console2.jsx` lines 137–142):
```javascript
const filtered = unidades.filter(u => {
  if (fEd !== 'all' && u.edificio_id !== fEd) return false
  if (fStatus !== 'all' && u.status !== fStatus) return false
  if (query && !u.nome.toLowerCase().includes(query.toLowerCase())) return false
  return true
})
```

**Delete handler with Storage cleanup + ConfirmDialog + animation** (from `src/components/features/Unidades.js` lines 85–100, extended per RESEARCH.md Pattern 3):
```javascript
async function handleDeletarUnidade(unidade) {
  // Best-effort Storage cleanup before DB delete
  if (unidade.foto_url && !unidade.foto_url.startsWith('/')) {
    const supabase = createClient()
    await supabase.storage.from('unidades-fotos').remove([unidade.foto_url]).catch(() => {})
  }
  setRemovingIds(prev => new Set([...prev, unidade.id]))
  const result = await deletarUnidade(unidade.id)
  if (result.status !== 200) {
    setErro(result.erroMessage)
    setRemovingIds(prev => { const n = new Set(prev); n.delete(unidade.id); return n })
    return
  }
  toast.success("Unidade removida")
  setTimeout(() => {
    getUnidades().then(u => setUnidades(u ?? []))
    setRemovingIds(prev => { const n = new Set(prev); n.delete(unidade.id); return n })
  }, 220)
}
```

**Metrics bar render pattern** (from `.planning/design/js/console2.jsx` lines 164–177):
```javascript
<div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)",
              border: "1px solid var(--border-3)", marginBottom: "var(--rd-block-sm)" }}>
  {[
    { l: "Área total", v: totalM2.toLocaleString("pt-BR") + " m²", s: unidades.length + " unidades", gold: false },
    { l: "MRR realizado", v: fmtBRLk(mrrRealizado), s: alugadas + " alugadas", gold: false },
    { l: "Potencial em aberto", v: fmtBRLk(potencialEmAberto), s: disponiveis + " disponíveis", gold: true },
    { l: "Valores ocultos", v: String(valoresOcultos), s: "não exibidos no site", gold: false },
  ].map((m, i) => (
    <div key={m.l} style={{ padding: "14px var(--rd-cell)",
                            borderRight: i < 3 ? "1px solid var(--border-3)" : "none" }}>
      <div className="r-label" style={{ fontSize: 9.5, marginBottom: 7,
                                        color: m.gold ? "var(--highlight)" : "var(--fg-4)" }}>{m.l}</div>
      <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 26,
                    letterSpacing: "-1px",
                    color: m.gold ? "var(--highlight)" : "var(--fg-1)" }}>{m.v}</div>
      <div className="r-meta" style={{ marginTop: 4 }}>{m.s}</div>
    </div>
  ))}
</div>
```

**Filter bar render pattern** (from `.planning/design/js/console2.jsx` lines 180–194):
```javascript
<div style={{ display: "flex", gap: 8, marginBottom: "var(--rd-block-sm)", flexWrap: "wrap", alignItems: "center" }}>
  {/* Search input */}
  <div style={{ position: "relative", flex: "0 0 240px" }}>
    <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)",
                   fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--fg-5)" }}>⌕</span>
    <input value={query} onChange={(e) => setQuery(e.target.value)}
           placeholder="Buscar unidade..."
           style={{ all: "unset", boxSizing: "border-box", width: "100%",
                    padding: "9px 12px 9px 30px", fontSize: 13,
                    fontFamily: "var(--font-body)", color: "var(--fg-1)",
                    background: "var(--surface-hi)", border: "1px solid var(--border-3)" }} />
  </div>
  {/* Status toggle buttons */}
  <div style={{ display: "flex", gap: 4 }}>
    {[{ id: "all", l: "Todos" }, { id: "disponivel", l: "Disponível" }, { id: "alugada", l: "Alugada" }].map(s => (
      <button key={s.id} onClick={() => setFStatus(s.id)}
              style={{ all: "unset", cursor: "pointer", padding: "8px 12px",
                       fontFamily: "var(--font-mono)", fontSize: 10, letterSpacing: "0.5px",
                       textTransform: "uppercase",
                       border: `1px solid ${fStatus === s.id ? "var(--indigo)" : "var(--border-3)"}`,
                       background: fStatus === s.id ? "oklch(0.339 0.179 301.68 / 0.18)" : "transparent",
                       color: fStatus === s.id ? "var(--fg-1)" : "var(--fg-4)" }}>{s.l}</button>
    ))}
  </div>
  {/* Building select */}
  <div style={{ flex: "0 0 200px" }}>
    <FSelect value={fEd} onChange={(e) => setFEd(e.target.value)}>
      <option value="all">Todos os edifícios</option>
      {listaEdificios.map(ed => <option key={ed.id} value={ed.id}>{ed.nome}</option>)}
    </FSelect>
  </div>
  {/* Result count — only when filter active */}
  {(query || fEd !== "all" || fStatus !== "all") && (
    <span className="r-meta">{filtered.length} resultado(s)</span>
  )}
</div>
```

**Card grid render pattern** (from `.planning/design/js/console2.jsx` line 196 — Variant B):
```javascript
<div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
              gap: 12, alignItems: "start" }}>
  {filtered.length === 0 && (
    <div style={{ padding: "40px 24px", textAlign: "center", gridColumn: "1 / -1" }}>
      <span className="r-meta">
        {unidades.length === 0
          ? "Nenhuma unidade cadastrada. Clique em Nova Unidade para começar."
          : "Nenhuma unidade corresponde aos filtros."}
      </span>
    </div>
  )}
  {filtered.map(unidade => {
    const isRemoving = removingIds.has(unidade.id)
    return (
      <div key={unidade.id} style={{
        opacity: isRemoving ? 0 : 1,
        transform: isRemoving ? "scale(0.97)" : "scale(1)",
        transition: "opacity 220ms ease, transform 220ms ease",
      }}>
        <UnidadeCard
          unidade={unidade}
          onEditar={(u) => setModal({ mode: "edit", initial: u })}
          onDeletar={(u) => setConfirmDelete(u)}
        />
      </div>
    )
  })}
</div>
```

**ConfirmDialog usage pattern** (from `src/components/ui/ConfirmDialog.js` — pass these props for delete):
```javascript
<ConfirmDialog
  open={confirmDelete !== null}
  title="Remover unidade?"
  body={`A unidade ${confirmDelete?.nome} será removida permanentemente. Esta ação não pode ser desfeita.`}
  confirmLabel="Remover Unidade"
  cancelLabel="Cancelar"
  danger={true}
  onConfirm={() => { handleDeletarUnidade(confirmDelete); setConfirmDelete(null) }}
  onCancel={() => setConfirmDelete(null)}
/>
```

---

### `src/components/ui/UnidadeCard.js` (modify — card component)

**Primary analog:** `src/components/ui/UnidadeCard.js` (current, full file)

**New prop API** (remove inline editing props, add `foto_url`-aware rendering and simpler callbacks):
```javascript
export default function UnidadeCard({ unidade, onEditar, onDeletar }) {
  // unidade now includes foto_url (string path or null)
  // onEditar(unidade) — parent opens modal
  // onDeletar(unidade) — parent opens ConfirmDialog (pass full object, not just id)
```

**Signed URL hook for foto_url** (from RESEARCH.md Pattern 2 — inline hook, not shared):
```javascript
function useFotoSignedUrl(fotoUrl) {
  const [signedUrl, setSignedUrl] = useState(null)
  useEffect(() => {
    if (!fotoUrl) return
    if (fotoUrl.startsWith('/')) { setSignedUrl(fotoUrl); return }
    const supabase = createClient()
    supabase.storage.from('unidades-fotos').createSignedUrl(fotoUrl, 3600)
      .then(({ data, error }) => { if (!error) setSignedUrl(data.signedUrl) })
  }, [fotoUrl])
  return signedUrl
}
```

**Card layout — Variant B** (from `.planning/design/js/console2.jsx` lines 198–230, inline styles replacing Tailwind classes):
```javascript
// Card: border: 1px solid var(--border-3); background: var(--surface)
// Internal: flexDirection: column, gap: 14px
// Name line: r-subhead + r-meta (building · area), status badge on right
// Value line: r-data valor_mensal + r-meta "/mês" + micro action buttons
```

**Micro action buttons** (replacing shadcn Button — pure inline style):
```javascript
<button onClick={() => onEditar(unidade)}
        style={{ all: "unset", cursor: "pointer", fontFamily: "var(--font-mono)",
                 fontSize: 10, fontWeight: 700, color: "var(--fg-3)",
                 letterSpacing: "0.5px", textTransform: "uppercase",
                 padding: "5px 9px", border: "1px solid var(--border-3)" }}>
  Editar
</button>
<button onClick={() => onDeletar(unidade)}
        style={{ all: "unset", cursor: "pointer", fontFamily: "var(--font-mono)",
                 fontSize: 10, fontWeight: 700, color: "var(--danger-fg)",
                 letterSpacing: "0.5px", textTransform: "uppercase",
                 padding: "5px 9px",
                 border: "1px solid color-mix(in oklch, var(--destructive) 30%, transparent)" }}>
  Remover
</button>
```

---

### `src/actions/unidades.js` (extend — server action)

**Primary analog:** `src/actions/unidades.js` (current, full file — lines 1–85)

**Auth guard pattern** (lines 10–16 — copy verbatim, declare locally per file convention):
```javascript
async function authGuard() {
  const supabase = await createServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { err: { status: 401, erroMessage: 'Não autenticado.' } }
  if (!await isProprietario(supabase)) return { err: { status: 403, erroMessage: 'Sem permissão.' } }
  return { user }
}
```

**`criarUnidade` extension** (lines 18–39, add `foto_url` destructuring + return `id`):
```javascript
// Change line 22 destructuring to include foto_url:
const { nome, descricao, area_m2, valor_mensal, status, valor_visivel, edificio_id, foto_url } = form

// Change insert (line 33) to include foto_url and return id:
const { data, error } = await supabaseAdmin.from('unidades').insert({
  nome: nome.trim(), descricao, area_m2, valor_mensal,
  status, valor_visivel: Boolean(valor_visivel), edificio_id,
  foto_url: foto_url ?? null,
}).select('id').single()
if (error) return { status: 500, erroMessage: error.message }
return { status: 200, id: data.id }  // expose id for upload path construction
```

**`editarUnidade` extension** (lines 41–66, add `foto_url` to patch):
```javascript
// Change line 55 destructuring to include foto_url:
const { nome, descricao, area_m2, valor_mensal, status, valor_visivel, foto_url } = form

// Change patch object (line 59) to include foto_url:
const patch = { descricao, area_m2, valor_mensal, status }
if (nome !== undefined) patch.nome = nome.trim()
if (valor_visivel !== undefined) patch.valor_visivel = Boolean(valor_visivel)
if (foto_url !== undefined) patch.foto_url = foto_url  // add this line
```

**`deletarUnidade` extension** (lines 68–85, add `foto_url` select + Storage cleanup):
```javascript
// Change line 75 select to include foto_url:
const { data: unidade, error: fetchUnidadeErr } = await supabaseAdmin
  .from('unidades').select('edificio_id, foto_url').eq('id', id).single()

// Add before the delete call (after edificio ownership check):
if (unidade.foto_url && !unidade.foto_url.startsWith('/')) {
  await supabaseAdmin.storage
    .from('unidades-fotos')
    .remove([unidade.foto_url])
    .catch(() => {})  // best-effort — do not block on Storage error
}
```

---

### `src/lib/queries-client.js` (extend `getUnidades`)

**Primary analog:** `src/lib/queries-client.js` (current, lines 5–8)

**Change:** Add `foto_url` to the SELECT string (line 6):
```javascript
// Before (line 6):
const { data } = await supabase.from('unidades').select('id, edificio_id, nome, descricao, area_m2, valor_mensal, valor_visivel, status')

// After:
const { data } = await supabase.from('unidades').select('id, edificio_id, nome, descricao, area_m2, valor_mensal, valor_visivel, status, foto_url')
```

**Null safety convention** (from CLAUDE.md / CONTEXT.md Established Patterns — always `?? []` on array returns):
```javascript
// Calling side in Unidades.js:
setUnidades(await getUnidades() ?? [])
```

---

### `e2e/crud-unidades.spec.js` (update selectors)

**Primary analog:** `e2e/crud-unidades.spec.js` (current, lines 1–105)

**File structure to preserve** (lines 1–37):
```javascript
// Keep: imports, admin client setup, test.describe wrapper, test.use viewport
// Keep: beforeEach login + navigate pattern
// Keep: beforeAll/afterAll cleanup pattern
// Keep: E2E- prefix convention for test data
// Keep: login() helper import from './helpers.js'
```

**Selector changes required (Pitfall 6 from RESEARCH.md):**

```javascript
// OLD — form inline (lines 40–52):
await page.getByRole('button', { name: 'Nova Unidade' }).click()
await page.fill('input[placeholder="Nome da unidade"]', 'E2E-Sala 301')
await page.getByRole('button', { name: 'Criar Unidade' }).click()

// NEW — modal flow:
await page.getByRole('button', { name: 'Nova Unidade' }).click()
// Modal appears — wait for it
await expect(page.locator('.romma-modal-backdrop')).toBeVisible()
// Fields are now inside the modal
await page.fill('input[placeholder="Ex: Sala 1208"]', 'E2E-Sala 301')
// Select edificio via native <select> (FSelect uses native select, not shadcn combobox)
await page.selectOption('select', { label: 'Edifício Teste E2E' })
await page.fill('input[placeholder="0"][type="number"]', '50')  // area_m2 — disambiguate by order
await page.getByRole('button', { name: 'Criar Unidade' }).click()

// OLD — edit inline (lines 55–62):
await page.getByText('E2E-Sala 301').locator('../..').getByRole('button', { name: 'Editar' }).click()
await page.fill('input[value="E2E-Sala 301"]', 'E2E-Sala 301 Editada')
await page.getByRole('button', { name: 'Salvar' }).click()

// NEW — modal edit:
await page.getByText('E2E-Sala 301').locator('../..').getByRole('button', { name: 'Editar' }).click()
await expect(page.locator('.romma-modal-backdrop')).toBeVisible()
const nomeInput = page.locator('.romma-modal-backdrop input[placeholder="Ex: Sala 1208"]')
await nomeInput.fill('E2E-Sala 301 Editada')
await page.getByRole('button', { name: 'Salvar Alterações' }).click()

// OLD — delete without confirm (line 65):
await page.getByText('E2E-Sala 301 Editada').locator('../..').getByRole('button', { name: 'Remover' }).click()

// NEW — delete with ConfirmDialog:
await page.getByText('E2E-Sala 301 Editada').locator('../..').getByRole('button', { name: 'Remover' }).click()
await expect(page.locator('.romma-modal-backdrop')).toBeVisible()  // ConfirmDialog uses same backdrop
await page.getByRole('button', { name: 'Remover Unidade' }).click()
```

**New tests to add (Wave 0 gaps from RESEARCH.md):**
```javascript
test('métricas visíveis na tela de unidades', async ({ page }) => {
  await expect(page.getByText('Área total')).toBeVisible()
  await expect(page.getByText('MRR realizado')).toBeVisible()
  await expect(page.getByText('Potencial em aberto')).toBeVisible()
  await expect(page.getByText('Valores ocultos')).toBeVisible()
})

test('busca por nome filtra cards ao vivo', async ({ page }) => {
  await page.fill('input[placeholder="Buscar unidade..."]', 'E2E-')
  // result count appears when filter active
  await expect(page.locator('text=/resultado/i')).toBeVisible()
})

test('ConfirmDialog aparece antes do delete', async ({ page }) => {
  const row = page.getByText('E2E-Sala Disponivel').locator('../..')
  await row.getByRole('button', { name: 'Remover' }).click()
  await expect(page.locator('.romma-modal-backdrop')).toBeVisible()
  await expect(page.getByText('Remover unidade?')).toBeVisible()
  // Cancel — don't actually delete
  await page.getByRole('button', { name: 'Cancelar' }).click()
  await expect(page.locator('.romma-modal-backdrop')).not.toBeVisible()
})
```

---

### `e2e/toast-unidades.spec.js` (update delete flow)

**Primary analog:** `e2e/toast-unidades.spec.js` (current, lines 77–91)

**Selector change required** (line 86 — delete now requires ConfirmDialog confirmation):
```javascript
// OLD (line 86):
await row.getByRole('button', { name: 'Remover' }).click()
// toast check immediately follows

// NEW — add ConfirmDialog step:
await row.getByRole('button', { name: 'Remover' }).click()
await expect(page.locator('.romma-modal-backdrop')).toBeVisible()
await page.getByRole('button', { name: 'Remover Unidade' }).click()
// then toast check
await expect(page.getByText('Unidade removida')).toBeVisible({ timeout: 10_000 })
```

---

## Shared Patterns

### Authentication (Server Actions)

**Source:** `src/actions/unidades.js` lines 10–16
**Apply to:** All server action functions in `src/actions/unidades.js`

```javascript
async function authGuard() {
  const supabase = await createServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { err: { status: 401, erroMessage: 'Não autenticado.' } }
  if (!await isProprietario(supabase)) return { err: { status: 403, erroMessage: 'Sem permissão.' } }
  return { user }
}
// Usage at top of every exported action:
const { err, user } = await authGuard()
if (err) return err
```

### Error Handling — Server Actions

**Source:** `src/actions/unidades.js` lines 37–38
**Apply to:** All `criarUnidade`, `editarUnidade`, `deletarUnidade` error paths

```javascript
if (error) return { status: 500, erroMessage: error.message }
return { status: 200 }
// Note: erroMessage (not errorMessage) — project canonical spelling (CLAUDE.md)
```

### Error Handling — Client Components

**Source:** `src/components/features/Unidades.js` lines 263–267
**Apply to:** `UnifiedUnidadeModal.js` (ErrLine), `Unidades.js` (refactored)

```javascript
// ErrLine render (inline style, not Tailwind):
{erro && (
  <div style={{ background: "var(--danger-bg2)", borderLeft: "2px solid var(--danger-fg)",
                padding: "10px 14px", fontFamily: "var(--font-mono)",
                fontSize: 12, color: "var(--danger-fg)" }}>
    {erro}
  </div>
)}
```

### Toast Notifications

**Source:** `src/components/features/Unidades.js` line 95
**Apply to:** `Unidades.js` (refactored) and `UnifiedUnidadeModal.js`

```javascript
import { toast } from "sonner"
toast.success("Unidade removida")          // delete — in Unidades.js
toast.success("Unidade criada com sucesso") // create — in modal
toast.success("Unidade atualizada")         // edit — in modal
```

### Supabase Browser Client (Storage + signed URLs)

**Source:** `src/lib/supabase-browser.js` (full file, 7 lines)
**Apply to:** `UnifiedUnidadeModal.js` (upload), `UnidadeCard.js` (signed URL), `Unidades.js` (cleanup)

```javascript
import { createClient } from "@/lib/supabase-browser"
// Always call createClient() inline — do not module-level instantiate in Client Components
const supabase = createClient()
```

### Inline Style Convention (Phase 19)

**Source:** `.planning/design/js/console2.jsx` + `src/app/globals.css` tokens
**Apply to:** All new components in Phase 19

Per UI-SPEC line 29: do NOT use Tailwind utility classes in new components in this phase. Use inline styles + CSS vars. Exception: existing utility classes like `romma-modal-backdrop`, `r-fade`, `r-meta`, `r-label`, `r-section`, `r-subhead`, `r-data`, `eyebrow eyebrow--indigo`, `eyebrow eyebrow--danger` are CSS class utilities defined in `globals.css` — these are used as `className` strings.

### UUID Validation

**Source:** `src/actions/unidades.js` line 8
**Apply to:** Any new server action function that receives an `id` param

```javascript
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
// Declared per-file (not imported from shared) — project convention
if (!UUID_RE.test(id)) return { status: 400, erroMessage: 'ID inválido.' }
```

---

## No Analog Found

All files have close analogs. No entries in this section.

---

## Key Critical Notes for Planner

1. **`criarUnidade` must return `{ status: 200, id: data.id }`** — the current implementation returns `{ status: 200 }` only. The 3-step upload flow (create → upload → patch foto_url) requires the `id` from step 1. This is the single most impactful change.

2. **Storage path = `{unidade_id}/{uuid}.{ext}`** — NOT `{edificio_id}/{uuid}.{ext}`. The RLS function `storage_unidade_owned_by_auth` extracts segment[1] as `unidade_id`. Using `edificio_id` in segment 1 would block all uploads silently.

3. **`getUnidades` SELECT must include `foto_url`** — currently missing (queries-client.js line 6). Cards cannot display photos and delete handler cannot clean up Storage without it.

4. **`editarUnidade` patch must include `foto_url`** — currently missing from the patch object (actions/unidades.js line 59).

5. **E2E tests use shadcn `combobox` for Select in current code; `UnifiedUnidadeModal` uses native `<select>` (FSelect pattern)** — Playwright selector strategy changes from `getByRole('combobox')` to `page.selectOption('select', ...)`.

6. **`deletarUnidade` in `Unidades.js` must receive the full `unidade` object** (not just `id`) so the Storage cleanup can read `foto_url` before calling the server action.

---

## Metadata

**Analog search scope:** `src/components/features/`, `src/components/ui/`, `src/actions/`, `src/lib/`, `e2e/`, `.planning/design/js/`
**Files scanned:** 8 source files + 1 prototype design file
**Pattern extraction date:** 2026-06-14
