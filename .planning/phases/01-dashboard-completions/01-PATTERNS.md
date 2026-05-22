# Phase 1: Dashboard Completions — Pattern Map

**Mapped:** 2026-05-21
**Files analyzed:** 5 (targets) + 1 (analog)
**Analogs found:** 5 / 5 (todos mapeiam para o mesmo analog canônico)

---

## Contexto da Migração

Esta fase é primariamente uma **migração de estilos** — todos os componentes alvos já têm lógica funcional. O trabalho é substituir `style={{}}` inline por classes Tailwind v4.

**Analog único dominante:** `src/app/login/page.js` é o **único arquivo do projeto que já usa Tailwind v4 + CSS tokens corretamente**. Todos os cinco arquivos alvo mapeiam para ele. Não há outros análogos Tailwind na codebase — `login/page.js` é a referência canônica.

**Nota importante:** CONTEXT.md menciona `ContratosDesktop.js` — este arquivo NÃO EXISTE. O arquivo ativo é `Contratos.js`. PATTERNS.md usa o nome correto.

---

## File Classification

| Arquivo Alvo | Role | Data Flow | Analog | Match Quality |
|---|---|---|---|---|
| `src/app/dashboard/page.js` | component (Server) | request-response (render-only) | `src/app/login/page.js` | role-match (ambos são componentes de página com layout complexo) |
| `src/components/features/Contratos.js` | component (Client) | CRUD | `src/app/login/page.js` | partial (formulário + estado de loading + error banner) |
| `src/components/features/Parcelas.js` | component (Client) | CRUD | `src/app/login/page.js` | partial (tabela + botão de ação com estado) |
| `src/components/features/LocatariosDesktop.js` | component (Client) | CRUD | `src/app/login/page.js` | partial (formulário em modal + grid de tabela + botões de ação) |
| `src/components/features/Unidades.js` | component (Client) | CRUD | `src/app/login/page.js` | partial (maior esforço — HTML puro, UI a ser construída do zero) |

---

## Pattern Assignments

### `src/app/dashboard/page.js` (Server Component, render-only)

**Analog:** `src/app/login/page.js`

**Escopo de trabalho:**
1. Migrar inline styles para Tailwind v4 em todo o arquivo
2. Trocar `value` e `label` dos tiles 02 (MRR) e 03 (Receita Esperada)
3. Substituir `.romma-desktop-only` por `hidden md:block` e `.romma-mobile-only` por `flex flex-col h-screen md:hidden`
4. Manter `.romma-page` como classe CSS global complementar (animação fadeIn sem equivalente Tailwind)
5. Manter `style={{ gridTemplateColumns: COL }}` para valores de grid complexos — exceção justificada ao D-01

**Padrão de tile (migração DASH-01 / DASH-02)** — baseado em `login/page.js` linhas 283-306:

```jsx
// ANTES (inline styles — page.js linhas 188-200):
<div style={{
  padding: 28, display: "flex", flexDirection: "column", gap: 8,
  position: "relative", borderRight: i < 3 ? "1px solid var(--border-3)" : "none",
  background: m.warn ? "var(--warning-bg)" : "transparent",
}}>
  <span className="font-mono" style={{ position: "absolute", top: 16, right: 16, fontSize: 9, color: "var(--fg-5)" }}>{m.idx}</span>
  <div className="font-mono" style={{ fontSize: 11, color: m.warn ? "var(--warning)" : "var(--fg-4)", letterSpacing: 1, textTransform: "uppercase" }}>{m.label}</div>
  <div className="font-display" style={{ fontWeight: 700, fontSize: 48, letterSpacing: -2.4, color: m.warn ? "var(--warning)" : "var(--fg-1)", lineHeight: 1 }}>{m.value}</div>
  <div className="font-mono" style={{ fontSize: 11, color: m.warn ? "var(--warning)" : "var(--fg-4)" }}>{m.sub}</div>
</div>

// DEPOIS (Tailwind v4 — padrão de cn() de login/page.js linhas 117-120 e 260-263):
import { cn } from "@/lib/utils"

<div className={cn(
  "p-7 flex flex-col gap-2 relative",
  i < 3 ? "border-r border-border-3" : "",
  m.warn ? "bg-warning-bg" : "bg-transparent"
)}>
  <span className="font-mono absolute top-4 right-4 text-[9px] text-fg-5">{m.idx}</span>
  <div className={cn("font-mono text-[11px] tracking-[1px] uppercase", m.warn ? "text-warning" : "text-fg-4")}>{m.label}</div>
  <div className={cn("font-display font-bold text-[48px] leading-none tracking-[-2.4px]", m.warn ? "text-warning" : "text-fg-1")}>{m.value}</div>
  <div className={cn("font-mono text-[11px]", m.warn ? "text-warning" : "text-fg-4")}>{m.sub}</div>
</div>
```

**Mudanças de dados DASH-01 / DASH-02** (array `metricas` em `page.js` linhas 77-82):

```jsx
// ANTES:
{ idx: "02", label: "Contratos Ativos",   value: ativos,          sub: `${fmtBRL(mrr)} / mês` },
{ idx: "03", label: "Parcelas Pendentes", value: parcelas.length, sub: fmtBRL(totalPendente) },

// DEPOIS (DASH-01 — MRR como valor principal, contagem como sub):
{ idx: "02", label: "MRR", value: mrr >= 1000 ? `R$${(mrr/1000).toFixed(1)}k` : fmtBRL(mrr), sub: `${ativos} contrato(s) ativo(s)` },

// DEPOIS (DASH-02 — Receita Esperada em BRL, contagem como sub):
{ idx: "03", label: "Receita Esperada", value: fmtBRL(totalPendente), sub: `${parcelas.length} parcela(s) em aberto` },
```

**Padrão de banner de alerta vencendo** — copiar de `login/page.js` linhas 77-92 (ErrorBanner):

```jsx
// Banner de erro em login/page.js (linhas 77-92):
<div className="bg-[rgba(147,0,10,0.22)] border-l-2 border-danger-fg px-4 py-3 flex items-start gap-3">

// Equivalente para banner "Vencendo" em page.js (linhas 204-229):
// ANTES:
<div style={{ background: "var(--warning-bg)", borderLeft: "2px solid var(--warning)", padding: "16px 24px", marginBottom: 32, display: "flex", justifyContent: "space-between", alignItems: "center" }}>

// DEPOIS:
<div className="bg-warning-bg border-l-2 border-warning px-6 py-4 mb-8 flex justify-between items-center">
  <div>
    <span className="eyebrow eyebrow--warning mb-1">ATENÇÃO · CONTRATOS A VENCER</span>
    <span className="text-[13px] text-warning">{/* lista de contratos */}</span>
  </div>
  <Link href="/dashboard/contratos" className="font-mono text-[12px] text-warning border border-warning px-4 py-2 tracking-[0.5px] shrink-0 ml-6 no-underline">
    Renovar →
  </Link>
</div>
```

**Padrão de header de página** — de `login/page.js` linhas 40-46 (eyebrow + heading):

```jsx
// login/page.js linhas 66-75 (EyebrowRail) + 207-210 (heading):
<div className="flex flex-col gap-3 mb-12">
  <span className="eyebrow eyebrow--indigo">CONSOLE.OS // VISÃO DO PROPRIETÁRIO</span>
  <h2 className="font-display font-bold text-[48px] leading-none tracking-[-2.4px] text-fg-1 m-0">Visão Geral.</h2>
</div>
```

**Responsividade:** substituir seletores CSS globais por breakpoints Tailwind:

```jsx
// ANTES:
<div className="romma-desktop-only">...</div>
<div className="romma-mobile-only">...</div>

// DEPOIS:
<div className="hidden md:block romma-page">...</div>
<div className="flex flex-col h-screen md:hidden">...</div>
```

---

### `src/components/features/Contratos.js` (Client Component, CRUD)

**Analog:** `src/app/login/page.js`

**Escopo de trabalho:** Migrar 100% dos inline styles. Maior arquivo (~411 linhas). Instalar shadcn `<Input>`, `<Select>`, `<Button>` antes de migrar.

**Padrão de imports** (manter os existentes — linhas 1-10 de `Contratos.js` — e adicionar):

```jsx
// Adicionar ao bloco de imports existente:
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"   // após shadcn add button
import { Input } from "@/components/ui/input"     // após shadcn add input
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"  // após shadcn add select
```

**Padrão de header de tabela** — `HeaderCell` (linhas 38-50 de `Contratos.js`):

```jsx
// ANTES (HeaderCell com style inline):
function HeaderCell({ children }) {
  return (
    <div style={{ padding: "12px 20px", fontFamily: "var(--font-mono)", fontSize: 10, fontWeight: 700, letterSpacing: 1.4, textTransform: "uppercase", color: "var(--fg-4)" }}>
      {children}
    </div>
  )
}

// DEPOIS (HeaderCell com Tailwind):
function HeaderCell({ children }) {
  return (
    <div className="px-5 py-3 font-mono text-[10px] font-bold tracking-[1.4px] uppercase text-fg-4">
      {children}
    </div>
  )
}
```

**Container de tabela** (linhas 291-292 de `Contratos.js`):

```jsx
// ANTES:
<div style={{ border: "1px solid var(--border-3)", background: "var(--surface)", marginBottom: 32 }}>
  <div style={{ display: "grid", gridTemplateColumns: COL, background: "oklch(0.26 0 0)", borderBottom: "1px solid var(--border-3)" }}>

// DEPOIS (gridTemplateColumns mantido como style — exceção justificada):
<div className="border border-border-3 bg-surface mb-8">
  <div style={{ display: "grid", gridTemplateColumns: COL }} className="bg-[oklch(0.26_0_0)] border-b border-border-3">
```

**Linha de tabela** (linhas 316-325 de `Contratos.js`):

```jsx
// ANTES:
<div style={{ display: "grid", gridTemplateColumns: COL, borderTop: i > 0 ? "1px solid var(--border-3)" : 0, alignItems: "center" }}>

// DEPOIS:
<div style={{ display: "grid", gridTemplateColumns: COL }} className={cn("items-center", i > 0 ? "border-t border-border-3" : "")}>
```

**Padrão de inputs do formulário** — copiar de `login/page.js` linhas 128-148 (Field component):

```jsx
// ANTES (inputStyle definido em Contratos.js linhas 20-29):
const inputStyle = { background: "var(--surface-hi)", border: "1px solid var(--border-3)", color: "var(--fg-1)", padding: "10px 14px", fontSize: 13, fontFamily: "var(--font-mono)", width: "100%", boxSizing: "border-box" }
<input style={inputStyle} />

// DEPOIS (shadcn Input com overrides de token):
<Input className="bg-surface-hi border-border-3 text-fg-1 font-mono text-[13px] rounded-none" />
// shadcn Select equivalente para <select>:
<Select value={form.locatario_id} onValueChange={v => setForm({ ...form, locatario_id: v })}>
  <SelectTrigger className="bg-surface-hi border-border-3 text-fg-1 font-mono text-[13px] rounded-none">
    <SelectValue placeholder="Selecionar locatário..." />
  </SelectTrigger>
  <SelectContent>
    {locatarios.map(l => <SelectItem key={l.id} value={l.id}>{l.nome_razao_social}</SelectItem>)}
  </SelectContent>
</Select>
```

**Botões de ação de linha** — copiar de `login/page.js` linhas 274-281 (botão ghost):

```jsx
// ANTES (actionBtnStyle em Contratos.js linhas 31-36):
<button style={actionBtnStyle}>VER →</button>
<button style={{ ...actionBtnStyle, color: "var(--danger)" }}>CANC</button>

// DEPOIS (shadcn Button variant ghost):
<Button variant="ghost" size="sm" className="font-mono text-[10px] text-fg-3 uppercase tracking-[1px] font-bold p-0 h-auto">VER →</Button>
<Button variant="ghost" size="sm" className="font-mono text-[10px] text-danger-fg uppercase tracking-[1px] font-bold p-0 h-auto">CANC</Button>
```

**Botão de submit com estado de loading** — copiar de `login/page.js` linhas 283-306:

```jsx
// login/page.js linhas 283-306 (botão submit com cn() e estados):
<button
  type="submit"
  disabled={isLoading}
  className={cn(
    "w-full px-6 py-[18px] border-0 flex items-center justify-between transition-[background,box-shadow] duration-300 text-foreground",
    isSuccess ? "bg-success" : "bg-primary",
    isLoading ? "cursor-default shadow-none" : "shadow-[0_0_16px_0_var(--primary-glow)] cursor-pointer"
  )}
>

// Equivalente para Contratos.js (submit de criação de contrato):
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
```

**Banner de erro no formulário** — copiar de `login/page.js` linhas 77-92:

```jsx
// ANTES (Contratos.js linhas 253-257):
{erro && (
  <div style={{ padding: "10px 16px", marginBottom: 16, background: "var(--danger-bg2)", border: "1px solid var(--danger)", fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--danger)" }}>
    {erro}
  </div>
)}

// DEPOIS (baseado em ErrorBanner de login/page.js linhas 77-92):
{erro && (
  <div className="bg-[var(--danger-bg2)] border border-[var(--danger-bg)] border-l-2 border-l-danger-fg px-4 py-3 font-mono text-[12px] text-danger-fg mb-4">
    {erro}
  </div>
)}
// Nota: --danger-bg2 e --danger não estão no @theme inline — usar arbitrary values como exceção.
```

**Container do formulário de novo contrato** (linhas 171-175 de `Contratos.js`):

```jsx
// ANTES:
<div style={{ border: "1px solid var(--indigo)", padding: 32, marginBottom: 32, background: "var(--surface)" }}>

// DEPOIS:
<div className="border border-indigo p-8 mb-8 bg-surface">
```

---

### `src/components/features/Parcelas.js` (Client Component, CRUD)

**Analog:** `src/app/login/page.js`

**Escopo de trabalho:** Componente mais simples (~184 linhas). Tabela + botão de ação. Bom ponto de partida para validar o padrão de migração.

**Container de tabela** (linhas 106-107 de `Parcelas.js`):

```jsx
// ANTES:
<div style={{ border: "1px solid var(--border-3)", background: "var(--surface)", marginBottom: 32 }}>
  <div style={{ display: "grid", gridTemplateColumns: COL, background: "oklch(0.26 0 0)", borderBottom: "1px solid var(--border-3)" }}>

// DEPOIS:
<div className="border border-border-3 bg-surface mb-8">
  <div style={{ display: "grid", gridTemplateColumns: COL }} className="bg-[oklch(0.26_0_0)] border-b border-border-3">
```

**`HeaderCell`** (linhas 13-24 de `Parcelas.js` — padrão idêntico ao de `Contratos.js`):

```jsx
// DEPOIS (mesma receita do HeaderCell de Contratos.js):
function HeaderCell({ children }) {
  return <div className="px-5 py-3 font-mono text-[10px] font-bold tracking-[1.4px] uppercase text-fg-4">{children}</div>
}
```

**Linha de tabela** (linhas 122-130 de `Parcelas.js`):

```jsx
// ANTES:
<div style={{ display: "grid", gridTemplateColumns: COL, borderTop: i > 0 ? "1px solid var(--border-3)" : 0, alignItems: "center" }}>

// DEPOIS:
<div style={{ display: "grid", gridTemplateColumns: COL }} className={cn("items-center", i > 0 ? "border-t border-border-3" : "")}>
```

**Texto condicional por status** (linhas 143-148 de `Parcelas.js`):

```jsx
// ANTES (color: parcela.status === "vencida" ? "var(--danger)" : "var(--fg-3)"):
<span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: parcela.status === "vencida" ? "var(--danger)" : "var(--fg-3)" }}>

// DEPOIS (cn() de login/page.js linhas 117-120):
<span className={cn("font-mono text-[11px]", parcela.status === "vencida" ? "text-danger-fg" : "text-fg-3")}>
// Nota: usar text-danger-fg (mapeado no @theme) em vez de text-danger (não mapeado).
```

**Botão de ação "Marcar Paga"** (linhas 163-176 de `Parcelas.js`):

```jsx
// ANTES:
<button style={{ border: "1px solid var(--success)", background: "transparent", padding: "8px 16px", cursor: "pointer", fontFamily: "var(--font-mono)", fontSize: 10, fontWeight: 700, letterSpacing: 1, color: "var(--success)", textTransform: "uppercase" }}>
  Marcar Paga
</button>

// DEPOIS (shadcn Button variant outline):
<Button variant="outline" size="sm" className="border-success text-success font-mono text-[10px] uppercase tracking-[1px] font-bold rounded-none h-auto py-2 px-4">
  Marcar Paga
</Button>
```

**Botão "← Contratos"** (linhas 70-80 de `Parcelas.js`):

```jsx
// ANTES:
<button onClick={...} style={{ border: "1px solid var(--border-3)", background: "transparent", padding: "10px 20px", marginBottom: 40, fontFamily: "var(--font-mono)", fontSize: 10, fontWeight: 700, letterSpacing: 1.2, textTransform: "uppercase", color: "var(--fg-3)", cursor: "pointer" }}>
  ← Contratos
</button>

// DEPOIS:
<Button variant="outline" onClick={() => router.push("/dashboard/contratos")} className="border-border-3 bg-transparent text-fg-3 font-mono text-[10px] uppercase tracking-[1.2px] font-bold rounded-none mb-10 h-auto py-[10px] px-5">
  ← Contratos
</Button>
```

---

### `src/components/features/LocatariosDesktop.js` (Client Component, CRUD)

**Analog:** `src/app/login/page.js`

**Escopo de trabalho:** Tabela + modal de convite com formulário. O padrão de `Field` em `login/page.js` (linhas 113-153) é o match mais próximo para o `Field` helper interno.

**Padrão de `Field` helper interno** — copiar de `login/page.js` linhas 113-153:

```jsx
// LocatariosDesktop.js linhas 302-319 (Field helper + inputStyle):
function Field({ label, required, children }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <label style={{ fontFamily: "var(--font-mono)", fontSize: 10, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", color: "var(--fg-4)" }}>{label}{required && <span style={{ color: "var(--danger)", marginLeft: 2 }}>*</span>}</label>
      {children}
    </div>
  )
}

// DEPOIS (baseado em login/page.js Field linhas 113-153):
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
// inputStyle substituído por className no <Input> shadcn:
// className="bg-surface-hi border-border-3 text-fg-1 font-mono text-[13px] rounded-none"
```

**Container de tabela** (linhas 74-79 de `LocatariosDesktop.js` — padrão sem grid COL pois usa GRID constante):

```jsx
// ANTES:
<div style={{ background: "var(--surface)", border: "1px solid var(--border-3)" }}>
  <div style={{ display: "grid", gridTemplateColumns: GRID, padding: "12px 20px", background: "oklch(0.26 0 0)" }}>

// DEPOIS (GRID mantido como style — exceção justificada):
<div className="bg-surface border border-border-3">
  <div style={{ display: "grid", gridTemplateColumns: GRID }} className="px-5 py-3 bg-[oklch(0.26_0_0)]">
```

**Linhas da tabela** (linhas 101-105 de `LocatariosDesktop.js`):

```jsx
// ANTES:
<div style={{ display: "grid", gridTemplateColumns: GRID, padding: "16px 20px", alignItems: "center", borderTop: i > 0 ? "1px solid var(--border-3)" : 0 }}>

// DEPOIS:
<div style={{ display: "grid", gridTemplateColumns: GRID }} className={cn("px-5 py-4 items-center", i > 0 ? "border-t border-border-3" : "")}>
```

**Avatar do locatário** (linhas 107-116 de `LocatariosDesktop.js`):

```jsx
// ANTES:
<div style={{ width: 32, height: 32, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", background: isPendente ? "transparent" : "var(--surface)", border: "1px solid var(--border-2)", fontFamily: "var(--font-body)", fontWeight: 700, fontSize: 10, letterSpacing: 1, color: isPendente ? "var(--fg-4)" : "var(--fg-1)" }}>{ini}</div>

// DEPOIS:
<div className={cn("w-8 h-8 shrink-0 flex items-center justify-center border font-body font-bold text-[10px] tracking-[1px]", isPendente ? "bg-transparent border-[var(--border-2)] text-fg-4" : "bg-surface border-[var(--border-2)] text-fg-1")}>
  {ini}
</div>
// Nota: --border-2 não está no @theme inline — usar arbitrary value como exceção justificada.
```

**Botões de ação de linha** — copiar de `login/page.js` linhas 274-281:

```jsx
// ANTES (LocatariosDesktop.js linhas 151-168):
<button style={{ all: "unset", cursor: "pointer", fontFamily: "var(--font-mono)", fontSize: 10, letterSpacing: 0.5, color: "var(--danger)", fontWeight: 700 }}>REVOGAR</button>
<button style={{ all: "unset", cursor: "pointer", fontFamily: "var(--font-mono)", fontSize: 10, letterSpacing: 0.5, color: "var(--fg-3)", fontWeight: 700 }}>VER →</button>

// DEPOIS:
<Button variant="ghost" size="sm" className="font-mono text-[10px] text-danger-fg uppercase tracking-[0.5px] font-bold p-0 h-auto">REVOGAR</Button>
<Button variant="ghost" size="sm" className="font-mono text-[10px] text-fg-3 uppercase tracking-[0.5px] font-bold p-0 h-auto">VER →</Button>
```

**Modal de convite** (linhas 199-204 de `LocatariosDesktop.js` — overlay + container):

```jsx
// ANTES:
<div style={{ position: "fixed", inset: 0, zIndex: 50, background: "oklch(0 0 0 / 0.7)", display: "flex", alignItems: "center", justifyContent: "center" }}>
  <div style={{ background: "var(--surface)", border: "1px solid var(--border-2)", width: 480, padding: 32, display: "flex", flexDirection: "column", gap: 24 }}>

// DEPOIS:
<div className="fixed inset-0 z-50 bg-[oklch(0_0_0/0.7)] flex items-center justify-center">
  <div className="bg-surface border border-[var(--border-2)] w-[480px] p-8 flex flex-col gap-6">
// Nota: --border-2 não mapeado no @theme inline — arbitrary value como exceção.
```

**Toggle PF/PJ** (linhas 234-248 de `LocatariosDesktop.js`):

```jsx
// ANTES:
<button style={{ all: "unset", cursor: "pointer", padding: "8px 20px", fontFamily: "var(--font-mono)", fontWeight: 700, fontSize: 11, letterSpacing: 1, textTransform: "uppercase", background: form.tipo === t ? "var(--indigo)" : "var(--surface-hi)", color: form.tipo === t ? "var(--fg-1)" : "var(--fg-4)", border: "1px solid var(--border-3)" }}>

// DEPOIS (cn() de login/page.js linhas 260-263):
<button
  type="button"
  onClick={() => setForm({ ...form, tipo: t })}
  className={cn(
    "cursor-pointer py-2 px-5 font-mono font-bold text-[11px] tracking-[1px] uppercase border border-border-3",
    form.tipo === t ? "bg-indigo text-fg-1" : "bg-surface-hi text-fg-4"
  )}
>
  {t === "pf" ? "Pessoa Física" : "Pessoa Jurídica"}
</button>
```

---

### `src/components/features/Unidades.js` (Client Component, CRUD — maior esforço)

**Analog:** `src/app/login/page.js` + estrutura de `Contratos.js` (para referência de layout tabela+formulário)

**Escopo de trabalho:** Arquivo com HTML puro sem nenhum estilo (~173 linhas). Não é migração — é construção de UI do zero. Usar `Contratos.js` como referência de estrutura visual (formulário + tabela com `UnidadeCard`).

**Estrutura alvo** — baseada no padrão de `Contratos.js` e `login/page.js`:

```jsx
// Unidades.js DEPOIS — estrutura de alto nível:
return (
  <div className="romma-page p-12 bg-background min-h-full">
    {/* Header — mesmo padrão de Contratos.js com PageHeader */}
    <PageHeader
      eyebrow="U.LIST · UNIDADES"
      title="Unidades."
      subtitle={`${disponiveis} disponíveis · ${alugadas} alugadas`}
      cta={{ label: showForm ? "Fechar" : "Nova Unidade", code: showForm ? "×" : "U+", onClick: () => setShowForm(v => !v) }}
    />

    {/* Formulário de criação — padrão de Contratos.js */}
    {showForm && (
      <div className="border border-indigo p-8 mb-8 bg-surface">
        <span className="eyebrow eyebrow--indigo mb-5">NOVA UNIDADE</span>
        <form onSubmit={insertUnidade}>
          <div className="grid grid-cols-2 gap-4 mb-4">
            {/* shadcn Select para edificio_id */}
            {/* shadcn Input para nome, descricao, area_m2, valor_mensal */}
            {/* shadcn Select para status */}
            {/* Checkbox customizado para valor_visivel — ver padrão abaixo */}
          </div>
        </form>
      </div>
    )}

    {erro && <div className="bg-[var(--danger-bg2)] border-l-2 border-danger-fg px-4 py-3 font-mono text-[12px] text-danger-fg mb-4">{erro}</div>}

    {/* Lista de unidades como cards */}
    <div className="flex flex-col gap-0 border border-border-3 bg-surface">
      {unidades.map(unidade => <UnidadeCard key={unidade.id} ... />)}
    </div>
  </div>
)
```

**Checkbox customizado para `valor_visivel`** — copiar de `login/page.js` linhas 252-273:

```jsx
// login/page.js linhas 252-273 (custom checkbox com cn()):
<div
  role="checkbox"
  aria-checked={remember}
  tabIndex={0}
  onClick={() => setRemember(v => !v)}
  onKeyDown={e => e.key === " " && setRemember(v => !v)}
  className="flex items-center gap-2 cursor-pointer"
>
  <div className={cn(
    "w-4 h-4 border flex items-center justify-center shrink-0 transition-all duration-150",
    remember ? "border-primary bg-primary" : "border-[rgba(255,255,255,0.25)] bg-transparent"
  )}>
    {remember && <svg>...</svg>}
  </div>
  <span className="font-body text-xs text-muted-foreground tracking-[1px] uppercase">MANTER SESSÃO ATIVA</span>
</div>

// Equivalente para valor_visivel em Unidades.js:
<div
  role="checkbox"
  aria-checked={form.valor_visivel}
  tabIndex={0}
  onClick={() => setForm({ ...form, valor_visivel: !form.valor_visivel })}
  onKeyDown={e => e.key === " " && setForm({ ...form, valor_visivel: !form.valor_visivel })}
  className="flex items-center gap-2 cursor-pointer"
>
  <div className={cn(
    "w-4 h-4 border flex items-center justify-center shrink-0",
    form.valor_visivel ? "border-indigo bg-indigo" : "border-border-3 bg-transparent"
  )}>
    {form.valor_visivel && <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M1.5 5L4 7.5L8.5 2.5" stroke="white" strokeWidth="1.5" strokeLinecap="square" strokeLinejoin="miter" /></svg>}
  </div>
  <span className="font-mono text-[10px] text-fg-4 tracking-[1px] uppercase">Exibir valor publicamente</span>
</div>
```

**Nota sobre `UnidadeCard`:** Verificar se `src/components/ui/UnidadeCard.js` tem inline styles — se sim, migrar junto (D-06). Se não tiver, manter como está.

---

## Shared Patterns (aplicar a todos os arquivos migrados)

### 1. Import de `cn()`

**Fonte:** `src/app/login/page.js` linha 7
**Aplicar a:** todos os 5 arquivos migrados
**Quando já não estiver importado, adicionar:**

```jsx
import { cn } from "@/lib/utils"
```

### 2. Classes condicionais com `cn()`

**Fonte:** `src/app/login/page.js` linhas 117-120 e 260-263
**Aplicar a:** todos os componentes com estado visual condicional (warn, loading, erro, status)

```jsx
// Padrão base:
className={cn("classes-base", condicao ? "classes-true" : "classes-false")}

// Exemplo de login/page.js linhas 117-120:
className={cn(
  "font-body font-bold text-xs tracking-[2px] uppercase transition-colors duration-200",
  focused ? "text-primary" : "text-muted-foreground"
)}
```

### 3. Substituição de `.romma-desktop-only` / `.romma-mobile-only`

**Fonte:** `src/app/login/page.js` linha 29 (padrão `hidden lg:block`)
**Aplicar a:** `page.js` e qualquer componente que use essas classes

```jsx
// .romma-desktop-only → hidden md:block
// .romma-mobile-only  → flex flex-col h-screen md:hidden
// .romma-page         → manter como classe CSS complementar (animação — sem equivalente Tailwind)
```

### 4. Eyebrow como classe CSS global

**Fonte:** `src/app/login/page.js` (não usa — usa componente EyebrowRail inline) vs. `page.js` (usa classe `.eyebrow.eyebrow--indigo`)
**Decisão:** Manter a classe CSS global `.eyebrow.eyebrow--indigo` nos componentes migrados. Ela é definida em `globals.css` e não viola D-01 (que proíbe `style={{}}`, não classes CSS globais).

```jsx
// Correto — usar classe CSS global:
<span className="eyebrow eyebrow--indigo">SISTEMA.02 // VÍNCULOS</span>

// Errado — não recriar inline:
<span style={{ fontFamily: "var(--font-mono)", fontSize: 10, textTransform: "uppercase", ... }}>
```

### 5. Token de danger — usar `text-danger-fg`

**Fonte:** `src/app/login/page.js` linhas 79, 84 (`border-danger-fg`, `text-danger-fg`)
**Aplicar a:** todos os casos de `color: "var(--danger)"` nos arquivos migrados

```jsx
// ATENÇÃO: --danger NÃO está mapeado no @theme inline.
// Usar text-danger-fg (mapeado como --color-danger-fg)
// Para backgrounds, usar arbitrary value como exceção: bg-[var(--danger-bg)]
```

### 6. `gridTemplateColumns` complexos — exceção justificada ao D-01

**Fonte:** RESEARCH.md (Pitfall 3)
**Aplicar a:** `Contratos.js` (`COL = "100px 1.6fr 1.6fr 1fr 1fr 1.2fr 80px"`), `Parcelas.js` (`COL = "60px 1fr 1fr 1fr 1.2fr 120px"`), `LocatariosDesktop.js` (`GRID = "1.8fr 0.5fr 1.2fr 1.2fr 0.8fr 1.4fr 80px"`)

```jsx
// Correto — manter style para gridTemplateColumns, migrar o resto:
<div style={{ display: "grid", gridTemplateColumns: COL }} className="items-center border-t border-border-3">

// Errado — tentar expressar em Tailwind arbitrary values:
// Não existe classe Tailwind para "100px 1.6fr 1.6fr 1fr 1fr 1.2fr 80px"
```

### 7. Fontes como classes utilitárias Tailwind

**Fonte:** `src/app/login/page.js` linhas 13, 43, 44, 55, 58

```jsx
// Substituições diretas:
// fontFamily: "var(--font-mono)"    → className="font-mono"
// fontFamily: "var(--font-body)"    → className="font-body"
// fontFamily: "var(--font-display)" → className="font-display"
// fontFamily: "var(--font-headline-hanken)" → className="font-headline-hanken"
```

### 8. Tokens de tamanho de fonte como arbitrary values Tailwind

**Fonte:** `src/app/login/page.js` linha 55 (`text-[44px]`), linha 13 (`text-xs`)

```jsx
// Para tamanhos sem classe Tailwind padrão, usar arbitrary values:
// fontSize: 9  → text-[9px]
// fontSize: 10 → text-[10px]   (ou text-xs se 12px for aceitável)
// fontSize: 11 → text-[11px]
// fontSize: 13 → text-[13px]
// fontSize: 48 → text-[48px]
// fontSize: 36 → text-[36px]
```

---

## Wave 0 — Pré-requisitos antes de qualquer migração

Conforme RESEARCH.md: nenhum primitivo shadcn está instalado. Executar antes de iniciar qualquer arquivo:

```bash
npx shadcn@latest add button
npx shadcn@latest add input
npx shadcn@latest add select
```

Verificar após install: `ls src/components/ui/` deve listar `button.jsx`, `input.jsx`, `select.jsx`.

---

## No Analog Found / Excluded

Arquivos identificados no CONTEXT.md que foram excluídos do escopo:

| Arquivo | Motivo |
|---|---|
| `src/components/features/Locatarios.js` | CÓDIGO MORTO — não importado em nenhuma rota do dashboard. Excluir do escopo da Fase 1. Candidato à deleção na Fase 3. |
| `src/components/features/GestaoEdificios.js` | CÓDIGO MORTO — não conectado a nenhuma rota do dashboard. Excluir do escopo da Fase 1. Candidato à deleção na Fase 3. |

---

## Metadata

**Analog search scope:** `src/app/`, `src/components/features/`, `src/components/ui/`
**Files scanned:** 7 (login/page.js, dashboard/page.js, Contratos.js, Parcelas.js, LocatariosDesktop.js, Unidades.js, Locatarios.js — leitura direta; GestaoEdificios.js — excluído por código morto)
**Pattern extraction date:** 2026-05-21
**Analog único:** `src/app/login/page.js` — único arquivo com Tailwind v4 + CSS tokens corretos na codebase
