# Phase 23: Locatários — Busca & Máscaras — Pattern Map

**Mapeado:** 2026-06-17
**Arquivos analisados:** 3 (1 componente principal + 1 SA + 1 page.js)
**Análogos encontrados:** 3 / 3

---

## File Classification

| Arquivo novo/modificado | Role | Data Flow | Análogo mais próximo | Qualidade |
|------------------------|------|-----------|----------------------|-----------|
| `src/components/features/LocatariosDesktop.js` | component | request-response + event-driven | `src/components/features/Contratos.js` | exact |
| `src/actions/locatarios.js` | service (Server Actions) | request-response | `src/actions/locatarios.js` (si mesmo) | exact |
| `src/components/features/Locatarios.js` | — | — | removido ao final do Plano 2 | n/a |

---

## Pattern Assignments

### `src/components/features/LocatariosDesktop.js` (component, request-response + event-driven)

**Análogo primário:** `src/components/features/Contratos.js`
**Análogo secundário:** `src/components/features/LocatariosDesktop.js` (arquivo atual a evoluir)

---

#### Padrão de imports (linhas 1-16 de `Contratos.js`)

```js
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
```

**Aplicar em `LocatariosDesktop.js`:** trocar queries/actions pelo conjunto de locatários, acrescentar `reenviarConvite` nos imports de actions. Remover `Select` (não necessário — segmented control usa `<button>`). Não importar `useEffect` (dados chegam por SSR prop `initialLocatarios`).

---

#### Padrão de estado local (linhas 99-112 de `Contratos.js`)

```js
const [contratos, setContratos] = useState([])
const [showForm, setShowForm] = useState(false)
const [form, setForm] = useState({ data_inicio: "", data_fim: "", observacoes: "", unidade_id: "", locatario_id: "" })
const [erro, setErro] = useState(null)
const [loading, setLoading] = useState(false)
const [loadingInicial, setLoadingInicial] = useState(true)
const [confirmDialog, setConfirmDialog] = useState(null)
const [removingIds, setRemovingIds] = useState(new Set())
const [q, setQ] = useState("")
```

**Adaptar para `LocatariosDesktop.js`:** reusar o estado já existente (linhas 32-41 do arquivo atual). Adicionar:

```js
const [q, setQ] = useState("")           // busca
const [resent, setResent] = useState(new Set())  // feedback "✓ Reenviado"
const [confirmRevogarId, setConfirmRevogarId] = useState(null) // revogar com confirm
```

`view` como derivação (sem useState):

```js
const view = locatarios.filter(l =>
  !q ||
  (l.nome_razao_social + " " + l.email + " " + l.documento)
    .toLowerCase()
    .includes(q.toLowerCase())
)
```

---

#### Padrão layout desktop — `romma-desktop-only` com grade de cards (linhas 457-568 de `Contratos.js`)

```jsx
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
    const isRemoving = removingIds.has(contrato.id)
    return (
      <div
        key={contrato.id}
        style={{
          border: "1px solid var(--border-3)",
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
        {/* conteúdo do card */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid var(--border-3)", paddingTop: 12 }}>
          {/* footer com ações */}
          <button
            style={{ all: "unset", cursor: "pointer", fontFamily: "var(--font-mono)", fontSize: 10, fontWeight: 700, color: "var(--fg-3)", letterSpacing: "1px", textTransform: "uppercase" }}
          >Ver →</button>
          <button
            style={{ all: "unset", cursor: "pointer", fontFamily: "var(--font-mono)", fontSize: 10, fontWeight: 700, color: "var(--danger-fg)", letterSpacing: "1px", textTransform: "uppercase" }}
          >Cancelar</button>
        </div>
      </div>
    )
  })}
</div>
```

**Adaptar para cards de locatários:** `minmax(300px, 1fr)` (D-02). Cada card contém Avatar + nome (`r-subhead`) + tipo + documento (`r-meta`) + email (`r-meta`) + footer com badge + contador `{ativosCount}/{cs.length}` + botões ghost com `style={{ all: "unset", ... }}`.

---

#### Padrão layout mobile — `romma-mobile-only` com rows (linhas 570-613 de `Contratos.js`)

```jsx
{/* Rows mobile */}
<div className="romma-mobile-only mb-8" style={{ border: "1px solid var(--border-3)", background: "var(--surface)" }}>
  {view.length === 0 && (
    <div className="py-10 text-center font-mono text-[12px] text-fg-4">
      Nenhum contrato corresponde à busca.
    </div>
  )}
  {view.map((contrato, i) => (
    <div
      key={contrato.id}
      style={{
        padding: "12px 16px",
        borderTop: i > 0 ? "1px solid var(--border-3)" : "none",
        display: "flex",
        flexDirection: "column",
        gap: 6,
        cursor: "pointer",
        transition: "background 120ms ease",
      }}
      onPointerDown={e => e.currentTarget.style.background = "var(--surface-hi)"}
      onPointerUp={e => e.currentTarget.style.background = ""}
      onPointerLeave={e => e.currentTarget.style.background = ""}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        {/* nome + badge */}
      </div>
      {/* sub-info */}
    </div>
  ))}
</div>
```

**Adaptar para locatários (D-03):** rows mobile com footer de ações **sempre visível** (sem `cursor: pointer` na row toda — ações no footer). Estrutura: Avatar 32×32 + nome + badge no header; footer da row com botões Reenviar/Revogar (pendentes) ou contador + Editar (aceitos). Usar `.r-panel` (classe CSS via `globals.css:433`) para o container.

---

#### Padrão de ConfirmDialog (linhas 236-244 de `Contratos.js`)

```jsx
<ConfirmDialog
  open={!!confirmDialog}
  title={confirmDialog?.title}
  body={confirmDialog?.body}
  danger={confirmDialog?.danger ?? true}
  confirmLabel={confirmDialog?.confirmLabel}
  onConfirm={confirmDialog?.onConfirm}
  onCancel={() => setConfirmDialog(null)}
/>
```

**Adaptar para revogar locatário (D-12):** estado simples `confirmRevogarId` (ID ou null):

```jsx
<ConfirmDialog
  open={confirmRevogarId !== null}
  title="Revogar acesso?"
  body={`O convite/acesso de ${locatarios.find(l => l.id === confirmRevogarId)?.nome_razao_social} será revogado. Esta ação não pode ser desfeita.`}
  confirmLabel="Revogar Acesso"
  danger={true}
  onCancel={() => setConfirmRevogarId(null)}
  onConfirm={() => { handleRevogar(confirmRevogarId); setConfirmRevogarId(null) }}
/>
```

**Props de `ConfirmDialog` verificadas** (`src/components/ui/ConfirmDialog.js` linhas 6-13): `open`, `title`, `body`, `confirmLabel`, `cancelLabel`, `danger`, `onConfirm`, `onCancel`.

---

#### Padrão de animação removingIds (linhas 486-489 de `Contratos.js`)

```js
opacity: isRemoving ? 0 : 1,
transform: isRemoving ? "scale(0.98)" : "scale(1)",
transition: "opacity 220ms ease, transform 220ms ease",
```

**Já implementado** em `LocatariosDesktop.js:154-157` — manter idêntico.

---

#### Padrão de feedback temporário `resent` Set (D-11 — sem análogo direto no codebase, baseado no padrão `removingIds`)

```js
// Estado
const [resent, setResent] = useState(new Set())

// Handler
async function handleReenviar(id) {
  const { status, erroMessage } = await reenviarConvite(id)
  if (status !== 200) {
    toast.error(erroMessage ?? "Erro ao reenviar convite.")
    return
  }
  setResent(s => new Set([...s, id]))
  setTimeout(() => setResent(s => {
    const n = new Set(s); n.delete(id); return n
  }), 2200)
}

// No botão:
<button
  style={{
    all: "unset",
    cursor: "pointer",
    fontFamily: "var(--font-mono)",
    fontSize: 10,
    fontWeight: 700,
    letterSpacing: "0.5px",
    textTransform: "uppercase",
    color: resent.has(l.id) ? "var(--success)" : "var(--indigo)",
    padding: "4px 0",
  }}
  onClick={() => handleReenviar(l.id)}
>
  {resent.has(l.id) ? "✓ Reenviado" : "Reenviar"}
</button>
```

**Derivado do padrão `removingIds`** (mesmo mecanismo de Set + setTimeout, apenas sem opacity animation — só mudança de texto/cor).

---

#### Padrão de funções de máscara (inline no componente, D-06)

```js
// Declarar antes do export default, junto com fmtDoc e getInitials
function onlyDigits(s) { return s ? s.replace(/\D/g, "") : "" }

function maskCPF(v) {
  const d = onlyDigits(v).slice(0, 11)
  if (d.length <= 3) return d
  if (d.length <= 6) return `${d.slice(0,3)}.${d.slice(3)}`
  if (d.length <= 9) return `${d.slice(0,3)}.${d.slice(3,6)}.${d.slice(6)}`
  return `${d.slice(0,3)}.${d.slice(3,6)}.${d.slice(6,9)}-${d.slice(9,11)}`
}

function maskCNPJ(v) {
  const d = onlyDigits(v).slice(0, 14)
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
  if (d.length <= 2) return d.length ? `(${d}` : ""
  if (d.length <= 6) return `(${d.slice(0,2)}) ${d.slice(2)}`
  if (d.length <= 10) return `(${d.slice(0,2)}) ${d.slice(2,6)}-${d.slice(6)}`
  return `(${d.slice(0,2)}) ${d.slice(2,7)}-${d.slice(7,11)}`
}
```

**Ponto de atenção:** `onlyDigits` já existe parcialmente no componente atual (linha 391: `e.target.value.replace(/\D/g, "")`). Extrair para função nomeada.

---

#### Padrão do campo de busca (D-05)

```jsx
// Acima da grade, antes do div romma-desktop-only
<div style={{ marginBottom: "var(--rd-block-sm, 16px)" }}>
  <div style={{ position: "relative" }}>
    <span style={{
      position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)",
      fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--fg-5)",
      pointerEvents: "none"
    }}>⌕</span>
    <input
      value={q}
      onChange={e => setQ(e.target.value)}
      placeholder="Buscar por nome, e-mail ou documento..."
      style={{
        all: "unset", boxSizing: "border-box", width: "100%",
        padding: "9px 12px 9px 30px", fontSize: 13,
        fontFamily: "var(--font-body)", color: "var(--fg-1)",
        background: "var(--surface-hi)", border: "1px solid var(--border-3)"
      }}
    />
  </div>
  {q && <span className="r-meta" style={{ marginTop: 6, display: "block" }}>{view.length} resultado(s)</span>}
</div>
```

---

#### Padrão de segmented control PF/PJ (linhas 370-383 de `LocatariosDesktop.js` — já existe)

```jsx
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
    >{t === "pf" ? "PF" : "PJ"}</button>
  ))}
</div>
```

**Mudança necessária:** adicionar `documento: maskDocumento(t, form.documento)` no `onClick` (D-07). Linha atual (375) só faz `setForm({ ...form, tipo: t })` — sem re-formatar o documento.

---

#### Padrão de strip antes de chamar SA (D-08)

```js
// No handleConvidar, antes de chamar convidarLocatario:
const { status, erroMessage } = await convidarLocatario(
  form.email,
  form.nome_razao_social,
  onlyDigits(form.documento),  // strip aqui
  onlyDigits(form.telefone),   // strip aqui
  form.tipo
)
```

---

#### Padrão de modal de edição — abertura com maskPhone (D-09 + Pitfall 2)

```js
// handleEditarLocatario — inicializar formEdit com telefone já formatado
function handleEditarLocatario(locatario) {
  setErro("")
  setFormEdit({
    nome_razao_social: locatario.nome_razao_social ?? "",
    email: locatario.email ?? "",
    telefone: maskPhone(locatario.telefone ?? ""),  // formatar ao abrir
  })
  setEditandoId(locatario.id)
}
```

**Remover** campos `tipo` e `documento` do `formEdit` (D-09) — não editáveis. Strip no submit:

```js
async function handleSalvarLocatario() {
  setLoading(true)
  setErro("")
  const { status, erroMessage } = await editarLocatario(editandoId, {
    nome_razao_social: formEdit.nome_razao_social,
    email: formEdit.email,
    telefone: onlyDigits(formEdit.telefone),  // strip antes de salvar
  })
  // ...
}
```

---

#### Avatar inline (D-04 — sem análogo direto; baseado em avatar existente nas linhas 161-164 de `LocatariosDesktop.js`)

```jsx
// Componente inline — declarar logo abaixo das funções de máscara
function Avatar({ nome, pendente, size = 40 }) {
  const ini = getInitials(nome)
  return (
    <div style={{
      width: size,
      height: size,
      flexShrink: 0,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      border: "1px solid var(--border-2)",
      background: pendente ? "transparent" : "var(--surface)",
      color: pendente ? "var(--fg-4)" : "var(--fg-1)",
      fontFamily: "var(--font-mono)",
      fontSize: size === 40 ? 14 : 11,
      fontWeight: 700,
    }}>{ini}</div>
  )
}
```

**Analogia:** o avatar já existe inline nas linhas 162-164 do `LocatariosDesktop.js` atual (via `div` com classes Tailwind). Extrair para função `Avatar` para reusar em desktop (40×40) e mobile (32×32).

---

### `src/actions/locatarios.js` (Server Actions, request-response)

**Análogo:** si mesmo (`src/actions/locatarios.js`) — padrões já estabelecidos.

---

#### Padrão de cabeçalho e guards (linhas 1-9)

```js
"use server"

import supabaseAdmin from "@/lib/supabaseAdmin"
import { createServer } from "@/lib/supabase-server"
import { isProprietario } from "@/lib/auth"

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const DOCUMENTO_RE = /^\d{11}$|^\d{14}$/
```

**Manter idêntico.** `reenviarConvite` reutiliza `UUID_RE` já declarado.

---

#### Padrão de authGuard inline (linhas 60-64 de `editarLocatario`)

```js
const supabase = await createServer()
const { data: { user } } = await supabase.auth.getUser()
if (!user) return { status: 401, erroMessage: 'Não autenticado.' }
if (!await isProprietario(supabase)) return { status: 403, erroMessage: 'Sem permissão.' }
if (!UUID_RE.test(id)) return { status: 400, erroMessage: 'ID inválido.' }
```

**Aplicar em `reenviarConvite`:** bloco idêntico nas primeiras linhas da SA.

---

#### Padrão de fetch com `proprietario_id` guard (linhas 98-100 de `revogarConvite`)

```js
const { data: loc, error: fetchErr } = await supabaseAdmin
    .from('locatarios')
    .select('usuario_id, status_convite')
    .eq('id', id)
    .eq('proprietario_id', user.id)
    .single()
if (fetchErr || !loc) return { status: 404, erroMessage: 'Locatário não encontrado.' }
```

**Aplicar em `reenviarConvite`:** select `'email, status_convite'` em vez de `'usuario_id, status_convite'`.

---

#### Nova SA `reenviarConvite` — estrutura completa

```js
export async function reenviarConvite(id) {
  const supabase = await createServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { status: 401, erroMessage: 'Não autenticado.' }
  if (!await isProprietario(supabase)) return { status: 403, erroMessage: 'Sem permissão.' }
  if (!UUID_RE.test(id)) return { status: 400, erroMessage: 'ID inválido.' }
  const { data: loc, error: fetchErr } = await supabaseAdmin
    .from('locatarios')
    .select('email, status_convite')
    .eq('id', id)
    .eq('proprietario_id', user.id)
    .single()
  if (fetchErr || !loc) return { status: 404, erroMessage: 'Locatário não encontrado.' }
  if (loc.status_convite !== 'pendente') return { status: 400, erroMessage: 'Convite já foi aceito.' }
  const siteUrl = process.env.SITE_URL
  if (!siteUrl) return { status: 500, erroMessage: 'Configuração de servidor inválida.' }
  const { error } = await supabaseAdmin.auth.admin.inviteUserByEmail(loc.email, {
    redirectTo: `${siteUrl}/auth/confirm`
  })
  if (error) return { status: 500, erroMessage: error.message }
  return { status: 200 }
}
```

---

#### Ajuste em `editarLocatario` — whitelist (linha 65-66, Pitfall 3)

```js
// ANTES (linha 65-66):
const { nome_razao_social, tipo, documento, email, telefone } = form
await supabaseAdmin.from('locatarios').update({ nome_razao_social, tipo, documento, email, telefone })

// DEPOIS:
const { nome_razao_social, email, telefone } = form
await supabaseAdmin.from('locatarios').update({ nome_razao_social, email, telefone })
```

---

## Shared Patterns

### Autenticação em Server Actions
**Fonte:** `src/actions/locatarios.js` linhas 60-64 (padrão estabelecido em todas as SAs existentes)
**Aplicar em:** `reenviarConvite`

```js
const supabase = await createServer()
const { data: { user } } = await supabase.auth.getUser()
if (!user) return { status: 401, erroMessage: 'Não autenticado.' }
if (!await isProprietario(supabase)) return { status: 403, erroMessage: 'Sem permissão.' }
if (!UUID_RE.test(id)) return { status: 400, erroMessage: 'ID inválido.' }
```

### Retorno de Server Actions
**Fonte:** todas as SAs em `src/actions/locatarios.js`
**Aplicar em:** `reenviarConvite`

```js
return { status: 200 }
// ou
return { status: 4xx|5xx, erroMessage: '...' }
// ATENÇÃO: "erroMessage" (não "errorMessage") — grafia estabelecida no projeto
```

### Ghost buttons com `style={{ all: "unset" }}`
**Fonte:** `src/components/features/Contratos.js` linhas 541-553
**Aplicar em:** todos os botões de ação nos cards e rows de `LocatariosDesktop.js`

```js
style={{
  all: "unset",
  cursor: "pointer",
  fontFamily: "var(--font-mono)",
  fontSize: 10,
  fontWeight: 700,
  color: "var(--fg-3)",       // ou var(--danger-fg) para destrutivo, var(--indigo) para reenviar
  letterSpacing: "1px",
  textTransform: "uppercase",
}}
```

### Animação rFade em cards
**Fonte:** `src/components/features/Contratos.js` linha 489
**Aplicar em:** cada card de locatário no layout desktop

```js
animation: "rFade var(--dur-base, 240ms) var(--ease-crisp) both",
animationDelay: `${i * 30}ms`,
```

### Feedback de erro via `toast.error` + `setErro`
**Fonte:** `src/components/features/LocatariosDesktop.js` linhas 58-59, 98-99
**Aplicar em:** `handleReenviar` (toast.error), `handleRevogar` (setErro), `handleSalvarLocatario` (setErro)

---

## Arquivos sem análogo novo

Todos os arquivos desta fase têm análogos diretos no codebase. Nenhum arquivo requer pesquisa em `RESEARCH.md` para padrões externos.

---

## Decisões de implementação para o Planner

| Decisão | Ação concreta |
|---------|---------------|
| Segmented PF/PJ re-formata documento | Mudar `onClick` da linha 375 de `LocatariosDesktop.js`: adicionar `documento: maskDocumento(t, form.documento)` |
| `formEdit` sem tipo/documento | Remover campos `tipo` e `documento` de `formEdit` (linhas 39-41) e do modal de edição (linhas 262-284) |
| Modal edição inicializa telefone com máscara | Linha 70: mudar `telefone: locatario.telefone ?? ""` para `telefone: maskPhone(locatario.telefone ?? "")` |
| `handleConvidar` faz strip | Linha 50-51: envolver `form.documento` e `form.telefone` com `onlyDigits()` |
| Tabela substituída por grade de cards | Remover bloco `<div style={{ overflowX: "auto" }}>` (linhas 121-221) e substituir por cards desktop + rows mobile |
| `Locatarios.js` removido | Deletar arquivo ao final do Plano 2 — `page.js` já importa `LocatariosDesktop` (verificado linha 2 de `page.js`) |

---

## Metadata

**Escopo de busca de análogos:** `src/components/features/`, `src/actions/`, `src/app/dashboard/locatarios/`, `src/components/ui/`
**Arquivos lidos:** 6 (`LocatariosDesktop.js`, `locatarios.js`, `Contratos.js` parcial, `Unidades.js` grep, `ConfirmDialog.js`, `page.js`)
**Data do mapeamento:** 2026-06-17
