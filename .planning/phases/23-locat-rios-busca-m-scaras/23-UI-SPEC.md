---
phase: 23
slug: 23-locat-rios-busca-m-scaras
status: draft
shadcn_initialized: true
preset: radix-lyra / mauve / cssVariables
created: 2026-06-17
---

# Phase 23 — UI Design Contract
## Locatários: Busca & Máscaras

> Contrato visual e de interação para implementação. Gerado por gsd-ui-researcher a partir do design canônico (`console3.jsx:401-593`) e screenshots `09-locatarios.png`. Verificado contra tokens de produção em `globals.css`.

---

## Design System

| Property | Value |
|----------|-------|
| Tool | shadcn/ui |
| Preset | `radix-lyra`, `mauve`, `cssVariables: true`, `tsx: false` |
| Component library | Radix UI (via shadcn) |
| Icon library | remixicon (iconLibrary em components.json) |
| Font | Space Grotesk (body + mono alias) / Hanken Grotesk (display/headline) |
| Radius | 0 — cantos retos em todo o sistema (sharp corners) |

> Fonte: `components.json` (shadcn já inicializado), `globals.css` `@theme`.

---

## Spacing Scale

Os tokens de densidade "regular" (`--rd-*`) definidos em `globals.css` são a fonte primária. A escala de 8 pontos abaixo mapeia os `--rd-*` para consumo no executor.

| Token | Value | CSS Var | Usage nesta fase |
|-------|-------|---------|-----------------|
| xs | 4px | — | gaps inline (ex.: gap entre inicial e nome) |
| sm | 8px | — | gap entre botões de ação no footer do card |
| md | 16px | `--rd-row-x` | padding horizontal de linhas e células |
| lg | 24px | `--rd-block` | separação entre bloco busca e grade |
| xl | 32px | `--rd-gutter` | padding lateral desktop (20px mobile via `--rd-gutter-m`) |
| 2xl | 48px | — | não usado nesta fase |
| 3xl | 64px | — | padding inferior desktop (80px mobile) |

**Tokens de densidade diretamente usados:**

| Token CSS | Valor | Onde usar |
|-----------|-------|-----------|
| `--rd-page-y` | 28px | padding-top da página |
| `--rd-gutter` | 32px | padding-x desktop |
| `--rd-gutter-m` | 20px | padding-x mobile |
| `--rd-block-sm` | 16px | `margin-bottom` do bloco de busca |
| `--rd-panel` | 20px | `padding` interno dos cards e painel mobile |
| `--rd-row-y` | 12px | padding vertical de cada row mobile |
| `--rd-row-x` | 16px | padding horizontal de cada row mobile |

**Exceções:**
- Avatar: 40×40px desktop / 32×32px mobile (touch target — não múltiplo de 8, ditado pelo design canônico)
- Segmented PF/PJ: `padding: 9px 18px` por botão (ditado por `console3.jsx:565`)
- Gap da grade de cards desktop: 12px (gap fixo do `auto-fill` grid)

---

## Typography

Escala tipográfica v1.5 (`--rt-*` tokens). Apenas 4 tamanhos são necessários nesta fase.

| Role | Size | CSS Var / Class | Weight | Line Height | Font | Uso |
|------|------|-----------------|--------|-------------|------|-----|
| Subhead | 16px | `--rt-subhead` / `.r-subhead` | 600 | 1.2 | Space Grotesk (body) | Nome do locatário no card/row |
| Body | 14px | `--rt-body` / `.r-body` | 400 | 1.5 | Space Grotesk (body) | Texto do callout de convite |
| Data | 14px | `--rt-data` / `.r-data` | 400 | — | Space Grotesk (mono) | Documento formatado, email, contador contratos |
| Label | 11px | `--rt-label` / `.r-label` | 700 | — | Space Grotesk (mono) | Rótulos de campo, cabeçalhos de coluna (tabela Variante A) |
| Meta | 10px | `--rt-meta` / `.r-meta` | 400 | — | Space Grotesk (mono) | Tipo PF/PJ no card, contador de resultados da busca |

**Botões de ação ghost (Reenviar / Revogar / Editar):**
- `font-family: var(--font-mono)`, `font-size: 10px`, `font-weight: 700`, `letter-spacing: 0.5px`, `text-transform: uppercase`
- Implementar via classe `.r-ghostbtn` + `style={{ all: "unset" }}`

**Campo de busca:**
- `font-size: 13px`, `font-family: var(--font-body)`

**Eyebrow do callout / modais:**
- Classe `.eyebrow .eyebrow--indigo` ou `.r-eyebrow.indigo`

**Títulos de modal:**
- `.r-section` (20px) para título "Enviar Convite" / "Editar Locatário"

---

## Color

Sistema Obsidian Blueprint (dark-only hardcoded). Tokens de produção em `globals.css`.

| Role | Token CSS | Valor aprox. | Usage nesta fase |
|------|-----------|--------------|-----------------|
| Dominant (60%) | `--background` / `--ds-background` | `oklch(0.239 0 0)` | Fundo da página |
| Secondary (30%) | `--surface` | `oklch(0.182 0 0)` | Cards desktop, painel mobile (`r-panel`) |
| Surface hi | `--surface-hi` | `oklch(0.218 0 0)` | Fundo do campo de busca, cabeçalho de tabela (Var. A), fundo de inputs |
| Accent (10%) | `--indigo` / `--primary` | `oklch(0.54 0.178 301.8)` | CTA "Convidar Locatário", botão ativo do segmented PF/PJ, borda do callout, eyebrow dos modais, botão "Reenviar" (estado normal) |
| Border | `--border-3` | `oklch(0.387 0 0 / 0.4)` | Bordas de cards, separadores de row, inputs |
| Destructive | `--danger-fg` | `oklch(0.826 0.073 22.5)` | Botão "Revogar" (sempre visível, pendentes apenas) |
| Success | `--success` | `oklch(0.696 0.17 162.5)` | Estado "✓ Reenviado" (2200ms) |
| fg-1 | `--fg-1` | `oklch(1 0 0)` | Nome do locatário (subhead), texto de modal |
| fg-2 | `--fg-2` | calc(l+0.55) | Documento formatado, body text callout |
| fg-3 | `--fg-3` | calc(l+0.45) | Email, botão "Editar", texto de ações ativos |
| fg-4 | `--fg-4` | calc(l+0.317) | Meta/label, placeholder da busca, tipo PF/PJ |
| fg-5 | `--fg-5` | calc(l+0.148) | Ícone `⌕` no campo de busca |

**Accent reservado para:**
- Botão CTA "Convidar Locatário" (background `--indigo`)
- Segmented: botão ativo PF/PJ (background `--indigo`)
- Borda do callout de convite (`border: 1px solid var(--indigo)`)
- Background do callout: `oklch(0.339 0.179 301.68 / 0.06)` (indigo 6% opacidade)
- Eyebrow dos modais (`eyebrow--indigo`)
- Botão "Reenviar" em estado normal (cor `--indigo`)
- Badge "CONVITE PENDENTE" usa `--warning` (amarelo) — não indigo

**Avatar — lógica de cor:**
- Locatário `status_convite === 'aceito'`: fundo `var(--surface)`, borda `var(--border-2)`, texto `var(--fg-1)`
- Locatário `status_convite === 'pendente'`: fundo `transparent`, borda `var(--border-2)`, texto `var(--fg-4)` (dim)

---

## Layout & Componentes

### Estrutura da página

```
<div class="r-fade" style="padding: var(--rd-page-y) var(--rd-gutter) 64px">   ← desktop
<div class="r-fade" style="padding: var(--rd-page-y) var(--rd-gutter-m) 80px"> ← mobile
  <PageHeader eyebrow="SISTEMA.03 // PESSOAS" title="Locatários." subtitle="N ativos · M convites pendentes"
              cta={{ label: "Convidar Locatário", code: "L+" }} />
  
  <!-- Busca -->
  <div style="margin-bottom: var(--rd-block-sm)">
    <input placeholder="Buscar por nome, e-mail ou documento..." /> ← ícone ⌕ à esquerda
    {q && <span class="r-meta">{N} resultado(s)</span>}
  </div>

  <!-- DESKTOP ONLY (.romma-desktop-only) -->
  <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 12px">
    {cards de locatário}
  </div>

  <!-- MOBILE ONLY (.romma-mobile-only) -->
  <div class="r-panel">
    {rows de locatário com ações no footer}
  </div>

  <!-- Callout de convite (ambos os layouts) -->
  <div style="margin-top: var(--rd-block); padding: 16px 20px; border: 1px solid var(--indigo); background: oklch(0.339 0.179 301.68 / 0.06)">
    <eyebrow>FLUXO DE CONVITE</eyebrow>
    <p class="r-body">Convide um locatário pelo e-mail...</p>
    <button>Convidar →</button>
  </div>
</div>
```

### Card desktop (`.romma-desktop-only`)

```
<div style="border: 1px solid var(--border-3); background: var(--surface); padding: var(--rd-panel);
            display: flex; flex-direction: column; gap: 12px;
            opacity: isRem ? 0 : 1; transform: isRem ? scale(0.98) : scale(1);
            transition: opacity 220ms ease, transform 220ms ease">
  
  <!-- Header do card -->
  <div style="display: flex; align-items: center; gap: 12px">
    <Avatar size={40} dim={pendente} />   ← 40×40, inicial, lógica de cor acima
    <div style="flex: 1; min-width: 0">
      <div class="r-subhead" style="overflow: hidden; text-overflow: ellipsis; white-space: nowrap">
        {nome_razao_social}
      </div>
      <div class="r-meta">{tipo.toUpperCase()} · {fmtDoc(tipo, documento)}</div>
    </div>
  </div>

  <!-- Email -->
  <div class="r-meta" style="overflow: hidden; text-overflow: ellipsis; white-space: nowrap">
    {email}
  </div>

  <!-- Footer com badge + ações -->
  <div style="display: flex; justify-content: space-between; align-items: center;
              border-top: 1px solid var(--border-3); padding-top: 12px; gap: 10px">
    <div style="display: flex; gap: 12px; align-items: center; min-width: 0">
      <StatusBadge status={pendente ? "pendente_convite" : "aceito"} />
      <span class="r-meta">{ativosCount}/{cs.length} contrato(s)</span>
    </div>
    <!-- Ações -->
    {pendente ? (
      <div style="display: flex; gap: 10px">
        <button class="r-ghostbtn" style="color: resent ? var(--success) : var(--indigo)">
          {resent ? "✓ Reenviado" : "Reenviar"}
        </button>
        <button class="r-ghostbtn" style="color: var(--danger-fg)">Revogar</button>
      </div>
    ) : (
      <button class="r-ghostbtn" style="color: var(--fg-3)">Editar</button>
    )}
  </div>
</div>
```

### Row mobile (`.romma-mobile-only`)

```
<div class="r-panel">
  {locatarios.map((l, i) => (
    <div style="padding: 12px var(--rd-row-x); border-top: i>0 ? 1px solid var(--border-3) : none;
                display: flex; flex-direction: column; gap: 10px;
                opacity: isRem ? 0 : 1; transition: opacity 220ms ease">
      
      <!-- Header da row -->
      <div style="display: flex; align-items: center; gap: 10px">
        <Avatar size={32} dim={pendente} />
        <div style="flex: 1; min-width: 0">
          <div class="r-subhead" style="font-size: 14px">{nome_razao_social}</div>
          <div class="r-meta">{tipo.toUpperCase()} · {fmtDoc(tipo, documento)}</div>
        </div>
        <StatusBadge status={...} />
      </div>

      <!-- Footer com ações — SEMPRE VISÍVEL (sem hover-reveal) -->
      <div style="display: flex; gap: 8px; border-top: 1px solid var(--border-3); padding-top: 10px">
        {pendente ? (
          <>
            <button class="r-ghostbtn" style="color: resent ? var(--success) : var(--indigo); padding: 4px 0">
              {resent ? "✓ Reenviado" : "Reenviar convite"}
            </button>
            <span style="flex: 1" />
            <button class="r-ghostbtn" style="color: var(--danger-fg); padding: 4px 0">Revogar</button>
          </>
        ) : (
          <>
            <span class="r-meta">{ativosCount}/{cs.length} contrato(s)</span>
            <span style="flex: 1" />
            <button class="r-ghostbtn" style="color: var(--fg-3); padding: 4px 0">Editar</button>
          </>
        )}
      </div>
    </div>
  ))}
</div>
```

### Campo de busca

```
<div style="position: relative; flex: mobile ? '1 1 100%' : '0 0 300px'">
  <span style="position: absolute; left: 12px; top: 50%; transform: translateY(-50%);
               font-family: var(--font-mono); font-size: 11px; color: var(--fg-5)">⌕</span>
  <input
    placeholder="Buscar por nome, e-mail ou documento..."
    style="all: unset; box-sizing: border-box; width: 100%;
           padding: 9px 12px 9px 30px; font-size: 13px; font-family: var(--font-body);
           color: var(--fg-1); background: var(--surface-hi); border: 1px solid var(--border-3)"
  />
</div>
{q && <span class="r-meta">{view.length} resultado(s)</span>}
```

### Modal Convidar Locatário

```
<div class="romma-modal-backdrop" onClick={fecharSeFora}>
  <div style="background: var(--surface); border: 1px solid var(--border-2);
              width: 100%; max-width: 480px; padding: 28px; display: flex; flex-direction: column; gap: 6px">
    <span class="eyebrow eyebrow--indigo">NOVO LOCATÁRIO</span>
    <h3 class="r-section" style="margin-bottom: 20px">Enviar Convite</h3>
    <form style="display: flex; flex-direction: column; gap: 14px">
      <Field label="Email *">          → type="email" required
      <Field label="Nome / Razão Social *"> → type="text" required
      <Field label="Tipo">
        <!-- Segmented PF/PJ -->
        <div style="display: flex">
          <button style="padding: 9px 18px; font-mono 11px 700 uppercase letter-spacing:1px;
                         border: 1px solid var(--border-3);
                         background: ativo ? var(--indigo) : var(--surface-hi);
                         color: ativo ? var(--fg-1) : var(--fg-4)">
            Pessoa Física
          </button>
          <button ...>Pessoa Jurídica</button>
        </div>
      </Field>
      <Field label="CPF * / CNPJ *">  → placeholder "000.000.000-00" ou "00.000.000/0000-00"
                                       → onChange: setForm({ ...form, documento: maskDocumento(tipo, v) })
      <Field label="Telefone *">       → placeholder "(11) 99999-9999"
                                       → onChange: setForm({ ...form, telefone: maskPhone(v) })
      <!-- Erro inline -->
      <Cancelar /> + <Enviar Convite →> (bg-indigo, desabilitado durante loading)
    </form>
  </div>
</div>
```

**Input style dentro dos modais:**
`background: var(--surface-hi); border: 1px solid var(--border-3); color: var(--fg-1); font-family: var(--font-mono); font-size: 14px; padding: 9px 12px; width: 100%; box-sizing: border-box; all: unset + reconstruir`

Ou via shadcn `<Input className="bg-surface-hi border-border-3 text-fg-1 font-mono text-[14px] rounded-none" />`

### Modal Editar Locatário

Idêntico ao de convidar, exceto:
- Eyebrow: "LOCATÁRIO"
- Título: "Editar Locatário"
- Campos editáveis: **somente** Nome / Razão Social, Email, Telefone (com máscara)
- Tipo e Documento: **não aparecem** (não editáveis pós-convite — D-09)
- Botão de submit: "Salvar →"

### Modal Confirmar Revogar (ConfirmDialog)

Usar `ConfirmDialog` existente ou modal inline com o padrão:

```
title: "Revogar acesso?"
body: "O convite/acesso de {nome_razao_social} será revogado. Esta ação não pode ser desfeita."
confirmLabel: "Revogar Acesso"
danger: true   → botão de confirmação em var(--danger-fg) ou variante destrutiva
```

---

## Máscaras — Especificação Exata

Funções puras declaradas inline no componente (não em lib):

| Função | Comportamento |
|--------|---------------|
| `onlyDigits(s)` | Remove todos os não-dígitos: `s.replace(/\D/g, '')` |
| `maskCPF(v)` | 11 dígitos → `000.000.000-00` |
| `maskCNPJ(v)` | 14 dígitos → `00.000.000/0000-00` |
| `maskDocumento(tipo, v)` | `tipo === 'pf'` → `maskCPF(onlyDigits(v))`, senão `maskCNPJ(onlyDigits(v))` |
| `maskPhone(v)` | 10 dígitos → `(11) 9999-9999`, 11 dígitos → `(11) 99999-9999` |
| `fmtDoc(tipo, doc)` | Formata valor armazenado (só dígitos) para exibição nos cards — já existe em `LocatariosDesktop.js:19-24` |

**Trocar PF ↔ PJ:** `setForm({ ...form, tipo: t, documento: maskDocumento(t, form.documento) })` — re-formata dígitos existentes sem digit-jumble.

**Antes de chamar a Server Action:** `onlyDigits(form.documento)` e `onlyDigits(form.telefone)` — armazena só dígitos.

---

## Animações & Interações

| Interação | Comportamento |
|-----------|---------------|
| Remoção (revogar) | `opacity: 0`, `transform: scale(0.98)`, `transition: 220ms ease` → após 220ms remove da lista |
| Feedback reenvio | `resent` Set com `setTimeout` 2200ms — muda cor `--indigo` → `--success` + texto "✓ Reenviado", sem reload |
| Entrada da página | `.r-fade` (keyframe `rFade`: `translateY(8px)` → `0`, 220ms) |
| Modal abertura | `romma-modal-backdrop` — sem animação adicional (padrão existente) |
| `prefers-reduced-motion` | `.r-fade` com `animation: none` (já declarado em `globals.css`) |
| `@media print` | `.r-fade` com `animation: none` (já declarado em `globals.css`) |

---

## Copywriting Contract

| Elemento | Texto exato |
|----------|-------------|
| Eyebrow da página | `SISTEMA.03 // PESSOAS` |
| Título da página | `Locatários.` |
| Subtitle da página | `{N} ativos · {M} convites pendentes` |
| CTA primário | `Convidar Locatário` (com code `L+`) |
| Campo busca placeholder | `Buscar por nome, e-mail ou documento...` |
| Contador de resultados | `{N} resultado(s)` (visível apenas quando `q` não vazio) |
| Empty state | `Nenhum locatário cadastrado.` (fonte mono 12px, `fg-4`, centralizado) |
| Empty state busca | `Nenhum locatário encontrado.` (grade desktop, `gridColumn: 1 / -1`) |
| Botão ação — pendente | `Reenviar` (desktop) / `Reenviar convite` (mobile) |
| Botão ação — reenvio OK | `✓ Reenviado` (em `--success`, 2200ms) |
| Botão ação — revogar | `Revogar` |
| Botão ação — ativo | `Editar` |
| Eyebrow callout | `FLUXO DE CONVITE` |
| Texto callout | `Convide um locatário pelo e-mail. Ele recebe um token único, define a senha e o vínculo é selado. Você pode revogar antes do aceite.` |
| CTA callout | `Convidar →` |
| Modal convite — eyebrow | `NOVO LOCATÁRIO` |
| Modal convite — título | `Enviar Convite` |
| Modal convite — CTA | `Enviar Convite →` |
| Modal convite — loading | `Enviando...` |
| Modal edição — eyebrow | `LOCATÁRIO` |
| Modal edição — título | `Editar Locatário` |
| Modal edição — CTA | `Salvar →` |
| Modal edição — loading | `Salvando...` |
| Cancelar (ambos modais) | `Cancelar` |
| Confirmação revogar — título | `Revogar acesso?` |
| Confirmação revogar — body | `O convite/acesso de {nome_razao_social} será revogado. Esta ação não pode ser desfeita.` |
| Confirmação revogar — CTA | `Revogar Acesso` |
| Toast sucesso revogar | `Acesso revogado` (já em produção em `LocatariosDesktop.js:102`) |
| Toast sucesso convidar | `Convite enviado` |
| Toast sucesso editar | `Locatário atualizado` |
| Erro inline form | Usar `erroMessage` da SA (ex.: `"E-mail já cadastrado."`, `"Locatário já existe."`) |
| Label segmented — PF | `Pessoa Física` |
| Label segmented — PJ | `Pessoa Jurídica` |
| Placeholder CPF | `000.000.000-00` |
| Placeholder CNPJ | `00.000.000/0000-00` |
| Placeholder telefone | `(11) 99999-9999` |

**Ações destrutivas nesta fase:**

| Ação | Trigger | Confirmação |
|------|---------|-------------|
| Revogar convite/acesso | Botão "Revogar" (visível só em pendentes) | Modal `ConfirmDialog` com `danger: true` antes de chamar SA |

---

## Filtro de Busca — Lógica

```js
// Filtro client-side sobre lista já carregada
const view = locatarios.filter(l =>
  !q ||
  (l.nome_razao_social + " " + l.email + " " + l.documento)
    .toLowerCase()
    .includes(q.toLowerCase())
)
// l.documento é armazenado como dígitos brutos — funciona com ou sem máscara no input
```

---

## Contador de Contratos — Derivação

```js
// Prop contratos já presente em page.js (getContratos existente)
const cs = contratos.filter(c => c.locatario_id === l.id)
const ativosCount = cs.filter(c => c.status === "ativo").length
// Exibir: `{ativosCount}/{cs.length} contrato(s)`
```

---

## Estado de Convite Reenviado — Feedback Visual

```js
const [resent, setResent] = useState(new Set())

function reenviar(id) {
  setResent(s => new Set([...s, id]))
  setTimeout(() => setResent(s => { const n = new Set(s); n.delete(id); return n }), 2200)
}
// Botão: resent.has(l.id) ? "✓ Reenviado" (--success) : "Reenviar" (--indigo)
```

---

## Registry Safety

| Registry | Blocks Used | Safety Gate |
|----------|-------------|-------------|
| shadcn official | Button, Input, Select, SelectContent, SelectItem, SelectTrigger, SelectValue | not required |
| shadcn official | toast (sonner via shadcn) | not required |

**Nenhum registry de terceiros** declarado ou necessário nesta fase.

Componentes existentes reutilizados (não são shadcn registry):
- `PageHeader` (`src/components/ui/PageHeader.js`)
- `StatusBadge` (`src/components/ui/StatusBadge.js`)
- `ConfirmDialog` (existente, verificar caminho)

---

## Componente Alvo

| Arquivo | Ação |
|---------|------|
| `src/components/features/LocatariosDesktop.js` | Evoluir in-place: adicionar busca, grade de cards desktop, rows mobile com ações expostas, máscaras, reenviar SA, ConfirmDialog para revogar |
| `src/components/features/Locatarios.js` | Remover / substituir após evolução — `page.js` importará apenas o componente evoluído |
| `src/actions/locatarios.js` | Adicionar `reenviarConvite` SA; ajustar `editarLocatario` para whitelist nome/email/telefone |
| `src/app/dashboard/locatarios/page.js` | Atualizar import se componente renomeado |

---

## Checker Sign-Off

- [ ] Dimension 1 Copywriting: PASS
- [ ] Dimension 2 Visuals: PASS
- [ ] Dimension 3 Color: PASS
- [ ] Dimension 4 Typography: PASS
- [ ] Dimension 5 Spacing: PASS
- [ ] Dimension 6 Registry Safety: PASS

**Approval:** pending
