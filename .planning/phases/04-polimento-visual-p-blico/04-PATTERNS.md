# Phase 4: Polimento Visual Público — Pattern Map

**Mapped:** 2026-05-26
**Files analyzed:** 9 (4 novos + 5 modificados)
**Analogs found:** 9 / 9

---

## File Classification

| Arquivo Novo / Modificado | Role | Data Flow | Analog Mais Próximo | Qualidade |
|---------------------------|------|-----------|---------------------|-----------|
| `src/app/layout.js` (mod) | config | — | self (leitura direta) | exact |
| `src/app/globals.css` (mod) | config | — | self (leitura direta) | exact |
| `src/app/page.js` (mod) | component | request-response | `src/app/login/page.js` | role-match |
| `src/app/unidades/page.js` (rewrite) | route | request-response | `src/app/dashboard/unidades/page.js` | exact |
| `src/components/features/UnidadesPublicas.js` (novo) | component | event-driven + CRUD | `src/app/unidades/page.js` (linhas 203-504) | exact |
| `src/components/features/UnidadePublicaCard.js` (novo) | component | request-response | `src/app/unidades/page.js` linhas 396-483 + `src/components/features/portal/ContratoCard.js` | exact |
| `src/components/features/UnidadeDetailSheet.js` (novo) | component | request-response | `src/app/unidades/page.js` linhas 21-201 | exact |
| `src/components/ui/UnidadeCard.js` (rewrite) | component | CRUD | `src/components/features/LocatariosDesktop.js` linhas 97-150 + 168-262 + `src/components/features/Unidades.js` linhas 16, 29-83 | role-match |
| `src/components/features/LocatariosDesktop.js` (mod) | component | CRUD | `src/components/features/Unidades.js` linhas 16, 29-83 + self (modal de convite linhas 168-262) | exact |

---

## Pattern Assignments

### `src/app/layout.js` (config)

**Analog:** self — leitura direta.

**Remoção de JetBrains Mono** (linhas 1 e 15-18 e 34):
```javascript
// ANTES (linha 1):
import { Public_Sans, Space_Grotesk, Hanken_Grotesk, JetBrains_Mono } from "next/font/google";

// DEPOIS: remover Public_Sans e JetBrains_Mono do import
import { Space_Grotesk, Hanken_Grotesk } from "next/font/google";

// REMOVER bloco inteiro (linhas 15-18):
// const jetbrainsMono = JetBrains_Mono({
//   variable: "--font-jetbrains-mono",
//   subsets: ["latin"],
// });

// ANTES (linha 34):
className={`${HankenGrotesks.variable} ${spaceGrotesk.variable} ${jetbrainsMono.variable} h-full antialiased`}

// DEPOIS: remover jetbrainsMono.variable
className={`${HankenGrotesks.variable} ${spaceGrotesk.variable} h-full antialiased`}
```

> `Public_Sans` (linha 1) é dead import identificado no RESEARCH.md — remover junto.

---

### `src/app/globals.css` (config)

**Analog:** self — leitura direta.

**Atualização de `--font-mono`** (linhas 20 e 129):
```css
/* ANTES (linha 20, bloco @theme): */
--font-mono: var(--font-jetbrains-mono), monospace;

/* DEPOIS: */
--font-mono: var(--font-space-grotesk), sans-serif;

/* ANTES (linha 129, bloco :root): */
--font-mono:     var(--font-jetbrains-mono), monospace;

/* DEPOIS: */
--font-mono:     var(--font-space-grotesk), sans-serif;
```

> Nenhuma alteração necessária nos ~50 componentes que usam `font-mono` — eles herdam via CSS var automaticamente.

---

### `src/app/page.js` (modificação — D-02)

**Analog:** `src/app/login/page.js`

**Padrão next/image com `fill` para rasters** (login/page.js linhas 30-36):
```javascript
// Para <img> em containers de altura definida (Detalhe_Arquitetonico.png, data_regional_demand_graph.png):
import Image from 'next/image'

<div className="relative overflow-hidden"> {/* container já existente */}
  <Image
    src="/Detalhe_Arquitetonico.png"
    alt=""
    fill
    className="object-cover opacity-20"
    sizes="100vw"
    priority
  />
</div>
```

**Padrão next/image com width/height para ícones SVG** (Open Question Q1 do RESEARCH.md):

Duas opções válidas — planner escolhe:

- **Opção A (recomendada):** `<Image>` com `unoptimized` para SVGs:
  ```javascript
  <Image src="/icon_qr_01.svg" alt="" width={28} height={28} unoptimized />
  ```
- **Opção B:** manter `<img>` nos 4 SVGs de ícone com eslint-disable explícito:
  ```javascript
  {/* eslint-disable-next-line @next/next/no-img-element */}
  <img src="/icon_qr_01.svg" alt="" className="w-7" />
  ```

**8 ocorrências a migrar em `src/app/page.js`:**

| Linha | Arquivo | Tipo | Dimensões sugeridas |
|-------|---------|------|---------------------|
| 13 | `Detalhe_Arquitetonico.png` | raster bg | `fill` em container relativo |
| 52 | `Detalhe_Arquitetonico.png` | raster | `fill` em container relativo |
| 66 | `horizontal_divider.svg` | SVG decorativo | `width={X} height={Y}` (medir asset) |
| 81 | `icon_qr_01.svg` | SVG ícone | `width={28} height={28}` |
| 96 | `icon_doc_02.svg` | SVG ícone | `width={20} height={20}` (classe `w-5`) |
| 112 | `icon_conect_03.svg` | SVG ícone | `width={28} height={28}` |
| 128 | `icon_graph_04.svg` | SVG ícone | `width={28} height={28}` |
| 166 | `data_regional_demand_graph.png` | raster gráfico | `fill` em container relativo |

---

### `src/app/unidades/page.js` (rewrite — thin shell)

**Analog:** `src/app/dashboard/unidades/page.js` (linhas 1-5)

**Padrão thin shell** (dashboard/unidades/page.js):
```javascript
import Unidades from "@/components/features/Unidades";

export default function UnidadesPage() {
  return <Unidades />;
}
```

**Aplicação para /unidades pública:**
```javascript
import UnidadesPublicas from "@/components/features/UnidadesPublicas"

export default function UnidadesPage() {
  return <UnidadesPublicas />
}
```

> Server Component puro — sem `'use client'`, sem props, sem estado. Todo o estado e data fetching vai para `UnidadesPublicas.js`.

---

### `src/components/features/UnidadesPublicas.js` (novo — Client Component principal)

**Analog:** `src/app/unidades/page.js` linhas 203-504 (o componente `UnidadesPublicas` atual será extraído e portado para Tailwind v4)

**Padrão de imports** (basear em `src/components/features/Unidades.js` linhas 1-12):
```javascript
'use client'

import { useState, useEffect } from 'react'
import { getUnidades, getEdificios } from '@/lib/queries-client'
import { createClient } from '@/lib/supabase-browser'
import RealtimeDot from '@/components/ui/RealtimeDot'
import StatusBadge from '@/components/ui/StatusBadge'
import { fmtBRL } from '@/lib/utils'
import UnidadePublicaCard from '@/components/features/UnidadePublicaCard'
import UnidadeDetailSheet from '@/components/features/UnidadeDetailSheet'
```

**Padrão de estado** (unidades/page.js linhas 204-209):
```javascript
const [unidades, setUnidades] = useState([])
const [edificios, setEdificios] = useState([])
const [activeTab, setActiveTab] = useState('todos')
const [selected, setSelected] = useState(null)
const [removedIds, setRemovedIds] = useState(new Set())
const [removingId, setRemovingId] = useState(null)
```

**Padrão Realtime + data loading** (unidades/page.js linhas 211-227):
```javascript
useEffect(() => {
  async function load() {
    const [u, e] = await Promise.all([getUnidades(), getEdificios()])
    setUnidades(u ?? [])
    setEdificios(e ?? [])
  }
  load()

  const supabase = createClient()
  const channel = supabase
    .channel('public-unidades')
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'unidades' }, () => load())
    .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'unidades' }, () => load())
    .subscribe()

  return () => { supabase.removeChannel(channel) }
}, [])
```

**Migração de inline styles para Tailwind v4** — exemplos de equivalência:
```javascript
// ANTES (inline styles do arquivo atual):
style={{ background: 'var(--background)', height: '100dvh', display: 'flex', flexDirection: 'column', position: 'relative', overflow: 'hidden' }}
// DEPOIS (Tailwind v4):
className="bg-background h-dvh flex flex-col relative overflow-hidden"

// ANTES:
style={{ padding: '20px 20px 24px', borderBottom: '1px solid var(--border-2)', display: 'flex', flexDirection: 'column', gap: 8 }}
// DEPOIS:
className="px-5 pt-5 pb-6 border-b border-[var(--border-2)] flex flex-col gap-2"
```

> Referência de tokens Tailwind v4 disponíveis: `bg-background`, `bg-surface`, `bg-surface-hi`, `text-fg-1..5`, `border-border-3`, `text-indigo`, `bg-indigo`, `font-mono`, `font-body`, `font-display`.

---

### `src/components/features/UnidadePublicaCard.js` (novo)

**Analog primário:** `src/app/unidades/page.js` linhas 396-483 (o card inline atual — extrair e portar)
**Analog de estilo Tailwind v4:** `src/components/features/portal/ContratoCard.js` (linhas 1-52)

**Props esperadas:** `{ unidade, edificio, onSelect, isRemoving }`

**Padrão de card com button reset** (baseado em ContratoCard.js + padrão do card inline atual):
```javascript
import StatusBadge from '@/components/ui/StatusBadge'
import { fmtBRL } from '@/lib/utils'

function refOf(u) {
  return 'UN-' + u.id.slice(0, 6).toUpperCase()
}

export default function UnidadePublicaCard({ unidade, edificio, onSelect, isRemoving }) {
  return (
    <button
      style={{ all: 'unset', cursor: 'pointer', display: 'block', width: '100%', boxSizing: 'border-box' }}
      className={`px-5 py-5 border-t border-border-3 transition-opacity ${isRemoving ? 'opacity-0' : ''}`}
      onClick={() => onSelect(unidade)}
    >
      <div className="flex justify-between items-start gap-3 mb-2">
        <div className="flex flex-col gap-0.5">
          <span className="font-mono text-[9px] text-fg-5 tracking-[0.8px] uppercase">
            {refOf(unidade)}
          </span>
          <span className="font-display font-bold text-[22px] tracking-[-0.8px] text-fg-1 leading-tight">
            {unidade.nome}
          </span>
          {edificio && (
            <span className="text-[12px] text-fg-3 mt-0.5">{edificio.nome}</span>
          )}
        </div>
        <div className="flex flex-col items-end gap-1 shrink-0">
          {unidade.area_m2 && (
            <span className="font-mono text-[9px] text-fg-5 tracking-[0.5px] uppercase whitespace-nowrap">
              {unidade.area_m2}m²
            </span>
          )}
          <StatusBadge status="disponivel" />
        </div>
      </div>
      {/* Valor mensal + CTA */}
      <div className="pt-3 border-t border-border-3 flex justify-between items-baseline">
        <div>
          {unidade.valor_visivel ? (
            <span>
              <span className="font-display font-medium text-[22px] tracking-[-0.8px] text-fg-1">
                {fmtBRL(unidade.valor_mensal)}
              </span>
              <span className="font-mono text-[10px] text-fg-4 ml-1.5">/mês</span>
            </span>
          ) : (
            <span className="font-mono text-[12px] text-fg-3 tracking-[0.5px] uppercase">
              Valor sob consulta
            </span>
          )}
        </div>
        <span className="font-display font-bold text-[10px] text-indigo uppercase tracking-[0.5px]">
          Detalhes →
        </span>
      </div>
    </button>
  )
}
```

> `style={{ all: 'unset', ... }}` é a exceção canônica do projeto para reset de botão (documentada em CLAUDE.md). Não viola D-04.

---

### `src/components/features/UnidadeDetailSheet.js` (novo)

**Analog:** `src/app/unidades/page.js` linhas 21-201 (o componente `UnitDetailSheet` inline — extrair e portar)

**Props esperadas:** `{ unidade, edificio, onClose, onSimular }`

**Padrão de overlay fixed + bottom sheet** (unidades/page.js linhas 21-36 — MIGRAR para Tailwind):
```javascript
// ANTES (inline style do UnitDetailSheet atual):
// Overlay: position:'absolute', inset:0, background:'oklch(0 0 0/0.65)', display:'flex', alignItems:'flex-end', zIndex:50
// DEPOIS (Tailwind — fixed cobre viewport inteiro, intencional per RESEARCH Pitfall 4):
<div
  className="fixed inset-0 z-50 bg-[oklch(0_0_0/0.65)] flex items-end"
  onClick={onClose}
>
```

**Shell do sheet** (portar linhas 37-50 do UnitDetailSheet para Tailwind):
```javascript
  <div
    className="w-full max-h-[85dvh] overflow-auto bg-background border-t border-indigo px-5 pt-6 pb-8 flex flex-col gap-4"
    onClick={e => e.stopPropagation()}
  >
    {/* drag handle */}
    <div className="self-center w-8 h-[3px] bg-fg-5" />
    {/* ... conteúdo */}
  </div>
```

**Placeholder de imagem** (D-03 — Claude's Discretion — planner escolhe opção):
```javascript
// Opção A (recomendada pelo RESEARCH — reuso de asset existente):
import Image from 'next/image'
// Container substituindo o SVG grid inline (unidades/page.js linhas 94-108):
<div className="relative h-40 border border-border-3 overflow-hidden">
  <Image
    src="/Detalhe_Arquitetonico.png"
    alt=""
    fill
    className="object-cover opacity-10"
    sizes="100vw"
  />
</div>

// Opção B (novo asset em /public/images/unidade-placeholder.webp):
<div className="relative h-40 border border-border-3 overflow-hidden">
  <Image
    src="/images/unidade-placeholder.webp"
    alt=""
    fill
    className="object-cover opacity-10"
    sizes="100vw"
  />
</div>
```

> `fill` requer container pai com `position: relative` (classe `relative`) e `height` definida (classe `h-40`). Sem altura, container colapsa — ver RESEARCH Pitfall 1.

**Padrão de botões de ação** (unidades/page.js linhas 153-193 — portar para Tailwind):
```javascript
<div className="flex flex-col gap-2">
  <button
    style={{ all: 'unset', cursor: 'pointer', display: 'block', width: '100%', boxSizing: 'border-box' }}
    className="py-[14px] px-5 bg-indigo font-display font-bold text-[13px] text-fg-1 text-center tracking-[0.5px]"
    onClick={() => onSimular(unidade.id)}
  >
    Tenho interesse →
  </button>
  <button
    style={{ all: 'unset', cursor: 'pointer', display: 'block', width: '100%', boxSizing: 'border-box' }}
    className="py-[14px] px-5 border border-border-3 font-display font-bold text-[13px] text-fg-3 text-center"
    onClick={onClose}
  >
    Voltar
  </button>
</div>
```

---

### `src/components/ui/UnidadeCard.js` (rewrite — D-07/D-08)

**Analog de design visual:** `src/components/features/LocatariosDesktop.js` linhas 97-150 (linha da tabela com dados formatados + botões de ação)
**Analog de modal de edição:** `src/components/features/LocatariosDesktop.js` linhas 168-262 (modal de convite)
**Analog de estado de edição:** `src/components/features/Unidades.js` linhas 16, 29-36, 51-83

**Sobre interface de props (D-08 — Claude's Discretion):**

O `UnidadeCard.js` atual recebe 14 props individuais (linhas 2-20). O RESEARCH.md deixa a abordagem em aberto. Recomendação baseada no padrão do projeto:

- **Opção A — Objeto único (mais limpa):** `{ unidade, editandoId, formEdit, onEditar, onSalvar, onDeletar, onFormChange }`
- **Opção B — Manter props individuais** (compatível com `Unidades.js` existente sem refatorar o parent)

**Padrão de modo leitura** (basear em LocatariosDesktop.js linhas 100-146):
```javascript
// Modo leitura — estrutura com eyebrow + título + dados formatados + botões
<div className="border-t border-border-3 px-5 py-4">
  <div className="flex justify-between items-start gap-3">
    <div className="flex flex-col gap-1">
      <span className="font-mono text-[9px] text-fg-5 tracking-[0.8px] uppercase">
        {/* ref da unidade */}
      </span>
      <span className="font-display font-bold text-[18px] tracking-[-0.6px] text-fg-1">
        {unidade.nome}
      </span>
    </div>
    <div className="flex gap-2">
      <Button variant="ghost" size="sm"
        className="font-mono text-[10px] text-fg-3 uppercase tracking-[0.5px] font-bold p-0 h-auto"
        onClick={() => onEditar(unidade)}
      >EDITAR</Button>
      <Button variant="ghost" size="sm"
        className="font-mono text-[10px] text-danger-fg uppercase tracking-[0.5px] font-bold p-0 h-auto"
        onClick={() => onDeletar(unidade.id)}
      >REMOVER</Button>
    </div>
  </div>
</div>
```

**Padrão de modo edição** (basear em Unidades.js linhas 120-248 — form com Input/Select shadcn):
```javascript
// Modo edição inline — shadcn Input/Select + botões Salvar/Cancelar
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'

// Campo padrão (Unidades.js linha 146-155):
<label className="flex flex-col gap-1.5">
  <span className="font-mono text-[10px] tracking-[1px] uppercase text-fg-4">Nome da unidade</span>
  <Input
    type="text"
    value={formEdit.nome}
    onChange={(e) => onFormChange({ ...formEdit, nome: e.target.value })}
    className="h-9 rounded-none border-border-3 bg-surface text-fg-1"
  />
</label>
```

---

### `src/components/features/LocatariosDesktop.js` (modificação — D-09)

> **ALERTA DE ESCOPO — D-09 foi subestimado no CONTEXT.md.**
>
> CONTEXT.md afirma: "o componente já tem a lógica de edição implementada — só falta o botão."
> RESEARCH.md confirma: `editandoId`, `formEdit`, `handleEditarLocatario` NÃO existem neste arquivo (grep com zero matches).
>
> **Escopo real:** implementar ~50-80 linhas novas. Não apenas adicionar um botão.

**Analog para estado de edição:** `src/components/features/Unidades.js` linhas 16, 29-36, 51-83

**Padrão de estado** (Unidades.js linhas 16, 29-36):
```javascript
// Adicionar junto com os outros useState existentes em LocatariosDesktop.js (linha 31-34):
const [editandoId, setEditandoId] = useState(null)
const [formEdit, setFormEdit] = useState({
  nome_razao_social: '', tipo: 'pf', documento: '', email: '', telefone: ''
})
```

**Padrão de handlers de edição** (Unidades.js linhas 51-83, adaptado para locatários):
```javascript
function handleEditarLocatario(locatario) {
  setFormEdit({
    nome_razao_social: locatario.nome_razao_social,
    tipo: locatario.tipo,
    documento: locatario.documento,
    email: locatario.email,
    telefone: locatario.telefone,
  })
  setEditandoId(locatario.id)
}

async function handleSalvarLocatario() {
  setLoading(true)
  setErro('')
  const { status, erroMessage } = await editarLocatario(editandoId, formEdit)
  setLoading(false)
  if (status === 200) {
    setEditandoId(null)
    setLocatarios(await getLocatarios() ?? [])
  } else {
    setErro(erroMessage ?? 'Erro ao salvar.')
  }
}
```

**Padrão de modal de edição** (usar shell do modal de convite existente — LocatariosDesktop.js linhas 168-262):
```javascript
// Trigger no botão da linha (linha 143-146 — substituir botão "VER →" para locatários aceitos):
<Button
  variant="ghost"
  size="sm"
  onClick={() => handleEditarLocatario(l)}
  className="font-mono text-[10px] text-fg-3 uppercase tracking-[0.5px] font-bold p-0 h-auto"
>EDITAR</Button>

// Modal (copiar estrutura do showInviteForm — linhas 168-262 — trocando:
// showInviteForm → showEditForm / editandoId
// handleConvidar → handleSalvarLocatario
// convidarLocatario → editarLocatario (import adicional)
// campos do form de convite → campos do formEdit
// "NOVO LOCATÁRIO" → "EDITAR LOCATÁRIO"
```

**Import adicional necessário:**
```javascript
// Adicionar ao import de actions (linha 7):
import { convidarLocatario, revogarConvite, editarLocatario } from "@/actions/locatarios"
```

**Comportamento de trigger:** Botão "EDITAR" aparece apenas quando `!isPendente` (linha 139). Locatários pendentes mantêm apenas "REVOGAR".

---

## Shared Patterns

### Button Reset (exceção canônica D-04)
**Fonte:** `src/app/unidades/page.js` (múltiplos locais) + CLAUDE.md
**Aplicar em:** `UnidadePublicaCard.js`, `UnidadeDetailSheet.js`
```javascript
style={{ all: 'unset', cursor: 'pointer', display: 'block', width: '100%', boxSizing: 'border-box' }}
```
> Esta é a ÚNICA exceção permitida à proibição de inline styles (D-01 Fase 1). Documentada em CLAUDE.md.

### Field Helper Reusável
**Fonte:** `src/components/features/LocatariosDesktop.js` linhas 267-276
**Aplicar em:** qualquer formulário novo em `LocatariosDesktop.js` (modal de edição) e `UnidadeCard.js` (modo edição)
```javascript
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
```

### Server Action Contract
**Fonte:** `src/actions/locatarios.js` (padrão uniforme no projeto)
**Aplicar em:** todos os handlers que chamam Server Actions
```javascript
const { status, erroMessage } = await editarLocatario(id, form)
// nota: 'erroMessage' (português) — nunca 'errorMessage'
if (status === 200) { /* sucesso */ } else { setErro(erroMessage ?? 'Erro.') }
```

### Tokens de Tipografia Tailwind v4
**Fonte:** `src/components/features/portal/ContratoCard.js` + `src/components/features/LocatariosDesktop.js`
**Aplicar em:** todos os novos componentes e rewrites

| Uso | Classe Tailwind v4 |
|-----|--------------------|
| Eyebrow / label de campo | `font-mono text-[9px] text-fg-5 tracking-[1px] uppercase` |
| Label de campo (maior) | `font-mono text-[10px] text-fg-4 tracking-[1px] uppercase` |
| Título principal | `font-display font-bold text-[32px] tracking-[-1.6px] text-fg-1 leading-tight` |
| Título de card | `font-display font-bold text-[22px] tracking-[-0.8px] text-fg-1` |
| Valor monetário | `font-display font-medium text-[22px] tracking-[-0.8px] text-fg-1` |
| Texto de corpo | `font-body text-[13px] text-fg-2 leading-[1.55]` |

### Tokens de Paleta Obsidian Blueprint
**Fonte:** `src/app/globals.css` linhas 8-27 + 113-115
```
--indigo = var(--primary) = oklch(0.339 0.1793 301.68)  → classe: bg-indigo, text-indigo, border-indigo
--color-highlight = oklch(0.7245 0.0998 82.35) = dourado #C5A059 → classe: bg-highlight, text-highlight
--surface, --surface-hi → bg-surface, bg-surface-hi
--border-3 → border-border-3
```

### Utility Classes do Projeto
**Fonte:** `src/app/globals.css` + uso em `LocatariosDesktop.js`
```javascript
className="eyebrow eyebrow--indigo"   // label com linha indigo
className="romma-desktop-only"        // visível só em desktop
className="romma-page"                // container de página
```

### Padrão de Erro + Loading
**Fonte:** `src/components/features/LocatariosDesktop.js` linhas 33-34
```javascript
const [erro, setErro] = useState('')    // 'erro' em português
const [loading, setLoading] = useState(false)  // 'loading' em inglês
```

---

## Arquivos Sem Analog

Nenhum arquivo desta fase está sem analog — todos os padrões necessários existem na codebase.

---

## Notas de Implementação

### Ordem de execução de menor risco (per RESEARCH.md)
1. `layout.js` + `globals.css` — remoção JetBrains Mono (sem impacto em componentes)
2. `src/app/page.js` — migração `<img>` → `<Image>`
3. `UnidadeCard.js` — rewrite (componente isolado, parent `Unidades.js` já existente não muda)
4. `UnidadePublicaCard.js` + `UnidadeDetailSheet.js` — subcomponentes (independentes)
5. `UnidadesPublicas.js` + `unidades/page.js` — componente principal + thin shell
6. `LocatariosDesktop.js` — implementação de edição (maior risco, validar D-09 scope)

### Decisões abertas para o planejador

| Decisão | Opções | Referência |
|---------|--------|------------|
| SVGs de ícone em `page.js` | `<Image unoptimized>` vs `<img>` + eslint-disable | Pattern Assignment `page.js` acima |
| Placeholder de imagem (D-03) | Reuso `/Detalhe_Arquitetonico.png` vs novo `/public/images/unidade-placeholder.webp` | Pattern Assignment `UnidadeDetailSheet.js` acima |
| Interface de props `UnidadeCard` (D-08) | Objeto único vs 14 props individuais | Pattern Assignment `UnidadeCard.js` acima |

---

## Metadata

**Diretórios buscados:** `src/app/`, `src/components/features/`, `src/components/ui/`, `src/actions/`, `src/lib/`
**Arquivos lidos:** 12
**Data de mapeamento:** 2026-05-26
