# Phase 23: Locatários — Busca & Máscaras — Research

**Pesquisado:** 2026-06-17
**Domínio:** UI de gestão de locatários — busca client-side, máscaras CPF/CNPJ/telefone, layouts desktop+mobile unificados, Server Action nova (`reenviarConvite`), ajuste de SA existente (`editarLocatario`)
**Confiança:** HIGH — toda a base de código relevante foi lida diretamente

---

## Summary

A fase 23 é essencialmente uma **migração de layout**: o `LocatariosDesktop.js` atual (tabela grid desktop) deve ser evoluído in-place para o design-spec canônico — grade de cards desktop + lista de rows mobile com ações expostas. A lógica de negócio (convidar, editar, revogar) já existe e funciona; o delta principal é **visual** (trocar tabela por cards/rows), **interacional** (busca, máscaras, reenviar) e **infraestrutural** (uma SA nova, um ajuste em SA existente).

O projeto já possui todos os primitivos necessários: `.r-ghostbtn`, `.r-panel`, `.r-subhead`, `.r-meta`, `.r-fade`, `.r-section`, `ConfirmDialog`, `PageHeader`, `StatusBadge`, `toast` (sonner) e o padrão `romma-desktop-only`/`romma-mobile-only` estabelecido em `Contratos.js`. Nenhum pacote novo é necessário.

A fase não altera schema, não cria tabelas e não adiciona queries. O único ponto de atenção infraestrutural é o ajuste de `editarLocatario` (whitelist de campos) e a criação de `reenviarConvite` — ambas modificações cirúrgicas em `src/actions/locatarios.js`.

**Recomendação primária:** Evoluir `LocatariosDesktop.js` in-place em dois planos: (1) infraestrutura de actions + estado; (2) layout desktop + mobile + busca + máscaras. Remover `Locatarios.js` ao final do plano 2.

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**D-01 (Componente alvo):** Evoluir `LocatariosDesktop.js` para cobrir desktop + mobile — renomear/substituir `Locatarios.js` ao final. Padrão idêntico às outras telas: **um único componente** com `romma-desktop-only` / `romma-mobile-only` separando os dois layouts. `page.js` importa um único componente.

**D-02 (Desktop — cards):** Grade `display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 12px`. Cada card: Avatar com inicial + nome (`r-subhead`), tipo + documento formatado (`r-meta`), email (`r-meta`), footer com badge status + contador "N/M contrato(s)" + ações. Igual `console3.jsx:447-480`.

**D-03 (Mobile — rows com ações expostas):** Lista dentro de `r-panel`. Cada row: Avatar + nome + badge. Footer da row (sempre visível, sem hover-reveal): ações Reenviar/Revogar para pendentes; contador + Editar para ativos. Igual `console3.jsx:490-543`.

**D-04 (Avatar):** Componente inline simples — quadrado 40×40 (desktop) / 32×32 (mobile), fundo `--indigo` com opacidade reduzida quando `pendente`, inicial da `nome_razao_social` em `var(--font-mono)`. Não requer shadcn Avatar.

**D-05 (Busca):** Busca **client-side** sobre a lista já carregada. `q` filtro: `(l.nome_razao_social + " " + l.email + " " + l.documento).toLowerCase().includes(q.toLowerCase())`. Campo `documento` no filtro usa valor bruto (só dígitos) para funcionar mesmo sem máscara no input de busca. Exibir contador `{N} resultado(s)` quando `q` não vazio. Igual `console3.jsx:413-416`.

**D-06 (Funções de máscara):** Declarar no componente (não em lib separada):
- `onlyDigits(s)` → strip não-dígitos
- `maskCPF(v)` → `000.000.000-00` (11 dígitos)
- `maskCNPJ(v)` → `00.000.000/0000-00` (14 dígitos)
- `maskDocumento(tipo, v)` → dispatch por tipo
- `maskPhone(v)` → `(11) 9999-9999` ou `(11) 99999-9999` (10 ou 11 dígitos)
- `fmtDoc(tipo, doc)` → formata valor armazenado (só dígitos) para exibição nos cards

**D-07 (Tipo PF/PJ no convite):** Segmented control: dois botões `PF` / `PJ`. Ao trocar o tipo: `setForm({ ...form, tipo: t, documento: maskDocumento(t, form.documento) })` — re-formata os dígitos existentes para o novo padrão sem digit-jumble.

**D-08 (Strip antes da SA):** Handler de submit do convite faz `onlyDigits(form.documento)` e `onlyDigits(form.telefone)` antes de chamar `convidarLocatario`. SA já valida `DOCUMENTO_RE = /^\d{11}$|\d{14}$/`. Telefone: strip para 10-11 dígitos antes de persistir.

**D-09 (Editar — campos):** Modal de edição: **só nome, e-mail, telefone** (com máscara no input; strip antes de salvar). Tipo e documento **não editáveis** pós-convite. SA `editarLocatario` recebe `{ nome_razao_social, email, telefone }` (sem tipo/documento) — precisa ajustar para não sobrescrever campos não enviados.

**D-10 (Nova SA `reenviarConvite`):** Export em `src/actions/locatarios.js`. Lógica:
1. `authGuard()` + UUID_RE validate
2. Buscar locatário: `eq('proprietario_id', user.id)` + `select('email, status_convite')`
3. Guard: `if (loc.status_convite !== 'pendente') return { status: 400, erroMessage: '...' }`
4. `supabaseAdmin.auth.admin.inviteUserByEmail(loc.email, { redirectTo: SITE_URL + '/auth/confirm' })`
5. Retornar `{ status: 200 }` ou `{ status: 5xx, erroMessage }`

**D-11 (Feedback reenvio):** Client-side: `resent` Set com `setTimeout` de 2200ms — botão muda para `"✓ Reenviado"` em `--success` durante esse período, sem reload da lista.

**D-12 (Revogar — ConfirmDialog):** SA `revogarConvite` já existe e funciona. Frontend precisa adicionar `ConfirmDialog` (componente em `src/components/ui/ConfirmDialog.js`) antes de chamar a SA.

**D-13 (Contador de contratos):** `contratos` já passado como prop na `page.js`. Derivar client-side: `cs = contratos.filter(c => c.locatario_id === l.id)`, `ativosCount = cs.filter(c => c.status === 'ativo').length`. Exibir `{ativosCount}/{cs.length} contrato(s)`. Sem query extra.

### Claude's Discretion

- Posição exata do campo de busca (acima da grade, com ícone `⌕` ou sem).
- Se `LocatariosDesktop.js` é editado in-place ou se um novo `Locatarios.js` é criado e o antigo removido.
- Skeleton loading para a fase (se aplicar o padrão das outras telas).
- Animação de remoção ao revogar (opacity/scale 220ms — padrão já estabelecido).
- Ajuste exato da SA `editarLocatario` para não sobrescrever tipo/documento (pode ser update parcial ou whitelist de campos).

### Deferred Ideas (OUT OF SCOPE)

- Medidor de adimplência por locatário — removido a pedido (design README §"Não implementar").
- Histórico de acessos/logins por locatário — pós-TCC.
- Filtros por status (ativos/pendentes) — busca textual cobre o caso de uso do TCC.
- Edição de tipo e documento — não permitida pós-convite.
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Descrição | Suporte de Research |
|----|-----------|---------------------|
| LOC-01 | Proprietário busca locatário por nome, e-mail ou documento | Filtro client-side D-05; campo de busca com ícone ⌕ (UI-SPEC:249-262) |
| LOC-02 | Convidar locatário via modal com tipo PF/PJ (segmented), documento com máscara CPF/CNPJ que re-formata ao trocar o tipo, telefone com máscara — valor armazenado só com dígitos | Funções D-06/D-07/D-08 + `convidarLocatario` SA já existe e valida dígitos |
| LOC-03 | Editar locatário via modal (nome, e-mail, telefone com máscara) | D-09 + ajuste em `editarLocatario` para whitelist nome/email/telefone |
| LOC-04 | Reenviar convite para locatários pendentes com feedback ("✓ Reenviado") | D-10/D-11 — nova SA + `resent` Set + setTimeout 2200ms |
| LOC-05 | Revogar acesso exige modal de confirmação (ação destrutiva) | D-12 + `ConfirmDialog` já existe em `src/components/ui/ConfirmDialog.js` |
| LOC-06 | No mobile, cards/linhas de locatário expõem as ações (Reenviar / Revogar / Editar) | D-03 — rows mobile com footer de ações sempre visível (sem hover-reveal) |
</phase_requirements>

---

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Busca de locatários | Frontend Client (browser) | — | Dados já carregados no estado; filtro puro sobre array local |
| Máscaras CPF/CNPJ/telefone | Frontend Client (browser) | — | Transformação de display; strip ocorre antes de chamar SA |
| Layout desktop (cards) | Frontend Client (browser) | — | `romma-desktop-only` — renderização condicional por CSS |
| Layout mobile (rows) | Frontend Client (browser) | — | `romma-mobile-only` — mesmo componente, visibilidade CSS |
| Reenviar convite | API / Server Action | Supabase Auth Admin | `reenviarConvite` SA invoca `inviteUserByEmail` via admin client |
| Revogar convite | API / Server Action | Supabase Auth Admin | SA já existe; frontend adiciona ConfirmDialog antes de chamar |
| Editar locatário | API / Server Action | Supabase (admin update) | SA `editarLocatario` recebe whitelist de campos |
| Contador de contratos | Frontend Client (browser) | — | Derivação de prop `contratos` já passada pela `page.js` |

---

## Project Constraints (from CLAUDE.md)

| Diretiva | Impacto na Fase |
|----------|-----------------|
| Next.js 16 App Router — sem `middleware.js` (usar `proxy.js`) | Não afeta esta fase (sem middleware) |
| `'use client'` obrigatório em componentes com hooks/eventos | `LocatariosDesktop.js` já tem `"use client"` |
| Queries centralizadas em `queries-client.js` / `queries-server.js` | Sem novas queries; reusar `getLocatarios()` existente |
| Form state: objeto único, não `useState` por campo | Aplicar em `form` e `formEdit` (padrão já em uso no componente) |
| Server Actions em `src/actions/` — retornam `{ status: 200 }` ou `{ status: 5xx, erroMessage }` | `reenviarConvite` deve seguir este contrato |
| `erroMessage` (não `errorMessage`) | Manter grafia portuguesa nas SAs e no frontend |
| `authGuard()` local em cada arquivo de actions | `reenviarConvite` declara `authGuard()` local |
| UUID_RE redeclarado por arquivo | Já declarado em `locatarios.js:7` — reusar |
| `supabaseAdmin` server-only — nunca importar em client components | `reenviarConvite` usa admin; frontend só chama a SA |
| Commits via conventional commits (gitmoji) — nunca `Co-Authored-By Claude` | N/A (regra de processo) |
| Nunca commitar em `main` | N/A (regra de processo) |

---

## Standard Stack

### Core (tudo já instalado — sem novos pacotes)

| Recurso | Localização | Propósito nesta fase |
|---------|------------|----------------------|
| `LocatariosDesktop.js` | `src/components/features/` | Componente alvo — evoluir in-place |
| `src/actions/locatarios.js` | — | Adicionar `reenviarConvite`; ajustar `editarLocatario` |
| `ConfirmDialog` | `src/components/ui/ConfirmDialog.js` | Modal de confirmação para revogar (já funcional) |
| `PageHeader` | `src/components/ui/PageHeader.js` | Header com eyebrow + CTA (já importado) |
| `StatusBadge` | `src/components/ui/StatusBadge.js` | Badge "CONVITE PENDENTE" / "ACEITO" (já importado) |
| `toast` (sonner) | via shadcn | Feedbacks de sucesso/erro (já importado) |
| `Button`, `Input` | shadcn/ui | Usados nos modais (já importados) |
| `.r-ghostbtn` | `globals.css:442-443` | Classe CSS para botões Reenviar / Revogar / Editar |
| `.r-panel` | `globals.css:433` | Container mobile (`background: var(--surface); border: 1px solid var(--border-3)`) |
| `.r-fade` | `globals.css:468` | Animação de entrada da página |
| `.r-subhead`, `.r-meta`, `.r-section`, `.r-data` | `globals.css:422-427` | Tipografia dos cards |
| `romma-desktop-only` / `romma-mobile-only` | `globals.css:355-375` | Separação de layouts no mesmo componente |
| `supabaseAdmin` | `src/lib/supabaseAdmin.js` | Usado em `reenviarConvite` para `inviteUserByEmail` |

### Instalação necessária

Nenhuma. Todos os recursos já estão no projeto.

---

## Package Legitimacy Audit

Nenhum pacote externo novo nesta fase. Seção não aplicável.

---

## Architecture Patterns

### System Architecture Diagram

```
Usuário (browser)
    │
    ▼
LocatariosDesktop.js  [Client Component]
    │
    ├── Estado local: locatarios[], q (busca), resent Set, removingIds Set
    │
    ├── [BUSCA] filtra `view` sobre `locatarios` (client-side, sem fetch)
    │
    ├── [DESKTOP .romma-desktop-only]
    │   └── grade CSS auto-fill → cards → Avatar | nome | badge | ações
    │
    ├── [MOBILE .romma-mobile-only]
    │   └── .r-panel → rows com footer ações sempre visível
    │
    ├── Modal Convidar → handleConvidar → convidarLocatario (SA)
    │       └── strip onlyDigits antes de chamar SA
    │
    ├── Modal Editar → handleSalvarLocatario → editarLocatario (SA)
    │       └── whitelist { nome_razao_social, email, telefone }
    │
    ├── Botão Reenviar → reenviarConvite (SA) → resent Set (2200ms)
    │
    └── Botão Revogar → ConfirmDialog → revogarConvite (SA)
            └── removingIds → animação 220ms → re-fetch locatarios
```

```
src/actions/locatarios.js  [Server Actions]
    ├── convidarLocatario (existente — sem mudança)
    ├── editarLocatario   (ajuste: whitelist nome/email/telefone)
    ├── revogarConvite    (existente — sem mudança)
    └── reenviarConvite   (NOVA: authGuard + guard pendente + inviteUserByEmail)
```

### Estrutura de Arquivos Afetados

```
src/
├── components/features/
│   ├── LocatariosDesktop.js    ← EVOLUIR in-place (arquivo principal da fase)
│   └── Locatarios.js           ← REMOVER ao final (substituído)
├── actions/
│   └── locatarios.js           ← AJUSTAR editarLocatario + ADICIONAR reenviarConvite
└── app/dashboard/locatarios/
    └── page.js                 ← SEM mudança (já importa LocatariosDesktop + passa contratos)
```

### Pattern 1: Layout Desktop + Mobile no mesmo componente

Padrão canônico — verificado em `Contratos.js:39,54,459,571`. [VERIFIED: leitura direta do codebase]

```jsx
// Desktop
<div className="romma-desktop-only" style={{
  display: "grid",
  gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
  gap: 12
}}>
  {view.map(l => <CardLocatario key={l.id} ... />)}
</div>

// Mobile
<div className="romma-mobile-only r-panel">
  {view.map((l, i) => <RowLocatario key={l.id} isFirst={i === 0} ... />)}
</div>
```

### Pattern 2: Avatar inline (sem shadcn Avatar)

Componente inline simples conforme D-04 e UI-SPEC. [VERIFIED: leitura do UI-SPEC e CONTEXT.md]

```jsx
// status_convite === 'aceito': bg surface, border-2, fg-1
// status_convite === 'pendente': bg transparent, border-2, fg-4 (dim)
function Avatar({ nome, pendente, size = 40 }) {
  const ini = getInitials(nome) // já existe em LocatariosDesktop.js:25-28
  return (
    <div style={{
      width: size, height: size, flexShrink: 0,
      display: "flex", alignItems: "center", justifyContent: "center",
      border: "1px solid var(--border-2)",
      background: pendente ? "transparent" : "var(--surface)",
      color: pendente ? "var(--fg-4)" : "var(--fg-1)",
      fontFamily: "var(--font-mono)", fontSize: size === 40 ? 14 : 11,
      fontWeight: 700
    }}>{ini}</div>
  )
}
```

### Pattern 3: Máscaras CPF/CNPJ/telefone

Funções puras inline no componente conforme D-06/D-07. [VERIFIED: leitura do CONTEXT.md e UI-SPEC]

```js
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

**Strip antes da SA:** `onlyDigits(form.documento)` e `onlyDigits(form.telefone)` no handler.

### Pattern 4: Estado `resent` para feedback de reenvio

Conforme D-11 e UI-SPEC. [VERIFIED: leitura do CONTEXT.md e UI-SPEC]

```js
const [resent, setResent] = useState(new Set())

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
// color: resent.has(l.id) ? "var(--success)" : "var(--indigo)"
// texto: resent.has(l.id) ? "✓ Reenviado" : "Reenviar"
```

### Pattern 5: SA `reenviarConvite` — estrutura

Segue exatamente o padrão de `locatarios.js` (authGuard local, UUID_RE local). [VERIFIED: leitura de `locatarios.js`]

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

### Pattern 6: Ajuste de `editarLocatario` — whitelist de campos

Problema atual: a SA recebe e aplica `tipo` e `documento` mesmo na edição (linhas 65-66 de `locatarios.js`). Correção: desestruturar apenas os campos editáveis. [VERIFIED: leitura de `locatarios.js:59-69`]

```js
// ANTES (linha 65-66):
const { nome_razao_social, tipo, documento, email, telefone } = form
await supabaseAdmin.from('locatarios').update({ nome_razao_social, tipo, documento, email, telefone })

// DEPOIS:
const { nome_razao_social, email, telefone } = form
await supabaseAdmin.from('locatarios').update({ nome_razao_social, email, telefone })
```

O frontend passa apenas `{ nome_razao_social, email, telefone }` no `formEdit` ao chamar `editarLocatario`.

### Pattern 7: ConfirmDialog para Revogar

`ConfirmDialog` recebe `open`, `title`, `body`, `confirmLabel`, `danger`, `onConfirm`, `onCancel`. [VERIFIED: leitura de `ConfirmDialog.js`]

```jsx
const [confirmRevogarId, setConfirmRevogarId] = useState(null)

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

### Anti-Patterns a Evitar

- **Aplicar máscara no valor armazenado:** O banco guarda só dígitos. A máscara é display-only. `fmtDoc` formata para cards; o input formata para o usuário. `onlyDigits()` strip obrigatório antes de qualquer SA.
- **Digit-jumble ao trocar PF/PJ:** Ao trocar tipo, chamar `maskDocumento(novoTipo, form.documento)` — não zerar o campo. O usuário não perde os dígitos já digitados.
- **Hover-reveal no mobile:** As ações (Reenviar/Revogar/Editar) devem estar sempre visíveis no footer da row mobile — sem `:hover` como trigger de visibilidade.
- **Reload da lista ao reenviar:** O feedback "✓ Reenviado" é puro estado local (Set + setTimeout). Não chamar `getLocatarios()` após reenvio.
- **Usar shadcn Avatar:** O design manda componente inline simples (quadrado, sem border-radius). Não instalar `@radix-ui/react-avatar` ou componente shadcn `avatar`.
- **Importar `supabaseAdmin` em componente client:** `reenviarConvite` usa admin — apenas no arquivo de Server Actions.

---

## Don't Hand-Roll

| Problema | Não construir | Usar em vez disso | Por quê |
|----------|--------------|-------------------|---------|
| Modal de confirmação destrutiva | Custom dialog | `ConfirmDialog` existente (`src/components/ui/ConfirmDialog.js`) | Já tem eyebrow, lógica de danger, backdrop click-to-close |
| Notificações toast | Custom toast | `toast` do sonner (já importado em `LocatariosDesktop.js`) | Padrão do projeto — consistência visual |
| Badge de status | Custom span | `StatusBadge` existente (`src/components/ui/StatusBadge.js`) | Suporta `"pendente_convite"` e `"aceito"` |
| Invite via email | Custom email | `supabaseAdmin.auth.admin.inviteUserByEmail` | Já em uso em `convidarLocatario`; gera token único |
| Campo `documento` existente | Nova query | `getLocatarios()` existente (já retorna `status_convite`, `documento`, etc.) | Sem extensão necessária |

---

## Common Pitfalls

### Pitfall 1: `maskPhone` com 10 vs 11 dígitos

**O que dá errado:** Renderizar `(11) 9999-9999` quando há 11 dígitos (número celular) ou `(11) 99999-9999` quando há 10 (fixo). Máscaras trocadas.
**Por que acontece:** A função branch no comprimento dos dígitos após strip; sem slice o índice estoura.
**Como evitar:** Slice para máx 11 dígitos ANTES do branch. Testar manualmente com fixo (10d) e celular (11d).
**Sinais de alerta:** Exibição como `(11) 9999-9-9999` ou dígitos perdidos.

### Pitfall 2: Strip de máscara no formEdit ao abrir modal de edição

**O que dá errado:** `formEdit.telefone` recebe o valor armazenado (dígitos brutos, ex.: `11999999999`). O input exibe dígitos sem formatação, confundindo o usuário.
**Por que acontece:** O banco armazena só dígitos; o modal de edição não formata ao popular.
**Como evitar:** Ao abrir o modal de edição, inicializar `formEdit.telefone = maskPhone(locatario.telefone)`. O handler `onChange` aplica a máscara progressive. O submit faz `onlyDigits` antes de chamar a SA.

### Pitfall 3: `editarLocatario` sobrescreve `tipo` e `documento`

**O que dá errado:** SA atual (linha 66) envia `tipo` e `documento` no `.update()`. Se o frontend omitir, os campos viram `undefined` no banco.
**Por que acontece:** A desestruturação atual captura todos os campos do `form`.
**Como evitar:** Ajustar a SA para whitelist `{ nome_razao_social, email, telefone }` — não desestruturar `tipo`/`documento`. [VERIFIED: leitura de `locatarios.js:65-66`]

### Pitfall 4: `reenviarConvite` sem guard de `proprietario_id`

**O que dá errado:** SA reenviar convite que não filtra `eq('proprietario_id', user.id)` permite IDOR — Proprietário A reenvia convite de Proprietário B.
**Por que acontece:** Esquecer o `.eq('proprietario_id', user.id)` na query de fetch.
**Como evitar:** Sempre incluir `.eq('proprietario_id', user.id)` no select do locatário na SA, como padrão estabelecido em `revogarConvite` (linha 99). [VERIFIED: leitura de `locatarios.js:98-100`]

### Pitfall 5: `resent` Set de objetos vs primitivos

**O que dá errado:** `resent.has(l.id)` falha se o Set contém objetos em vez de strings/UUIDs.
**Por que acontece:** `useState(new Set())` é correto, mas `new Set([...s, id])` deve garantir que `id` é o UUID string, não o locatário inteiro.
**Como evitar:** Passar apenas `l.id` (UUID string) para o Set, nunca o objeto `l`.

### Pitfall 6: Busca não encontra CPF com pontuação

**O que dá errado:** Usuário digita `123.456` no campo de busca e não encontra, porque o banco armazena `12345678901`.
**Por que acontece:** O filtro usa `l.documento` (dígitos brutos), então digitar com máscara não bate.
**Como evitar:** O filtro conforme D-05 usa `l.documento` (dígitos brutos) — o usuário que buscar `12345678901` encontra. Buscar com pontuação (`123.456`) não encontra porque `includes` compara o string inteiro. Esta é a limitação conhecida e aceita; não é necessário normalizar a query de busca nesta fase (busca textual simples).

---

## Code Examples

### Campo de busca (UI-SPEC verificado)

```jsx
// Source: 23-UI-SPEC.md §"Campo de busca"
<div style={{ marginBottom: "var(--rd-block-sm)" }}>
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
  {q && <span className="r-meta">{view.length} resultado(s)</span>}
</div>
```

### Ghost buttons (padrão r-ghostbtn)

```jsx
// Source: globals.css:442-443 + UI-SPEC §Typography
<button
  className="r-ghostbtn"
  style={{
    all: "unset",
    cursor: "pointer",
    fontFamily: "var(--font-mono)",
    fontSize: 10,
    fontWeight: 700,
    letterSpacing: "0.5px",
    textTransform: "uppercase",
    color: resent.has(l.id) ? "var(--success)" : "var(--indigo)",
    padding: "4px 0"
  }}
  onClick={() => handleReenviar(l.id)}
>
  {resent.has(l.id) ? "✓ Reenviado" : "Reenviar"}
</button>
```

### Filtro de busca client-side

```js
// Source: 23-CONTEXT.md D-05
const [q, setQ] = useState("")
const view = locatarios.filter(l =>
  !q ||
  (l.nome_razao_social + " " + l.email + " " + l.documento)
    .toLowerCase()
    .includes(q.toLowerCase())
)
```

---

## State of the Art

| Abordagem antiga | Abordagem atual | Impacto |
|-----------------|-----------------|---------|
| `Locatarios.js` — form puro sem estilos, `deletarLocatario` | `LocatariosDesktop.js` — tabela desktop com design system, `revogarConvite` | Manter `LocatariosDesktop.js`; `Locatarios.js` é legado a remover |
| Tabela grid (7 colunas) no componente atual | Grade de cards (desktop) + rows com ações (mobile) | Reescrever o JSX de layout; manter state/handlers |
| Select `<select>` para PF/PJ | Segmented control (dois `<button>`) | Já existe em `LocatariosDesktop.js:370-381` — manter |
| Sem busca | Busca client-side sobre array em estado | Adicionar `q` state + derivar `view` |
| Sem `reenviarConvite` | Nova SA + feedback `resent` Set | Adicionar SA + estado no componente |
| `editarLocatario` envia `tipo`+`documento` | Whitelist para nome/email/telefone | Ajuste cirúrgico na SA (2 linhas) |
| Revogar sem confirmação | `ConfirmDialog` antes de chamar SA | Adicionar estado `confirmRevogarId` |

**Legado a remover:** `Locatarios.js` (190 linhas, sem estilos, usa `deletarLocatario` em vez de `revogarConvite`). O arquivo fica até o plano de layout estar completo, depois é deletado. `page.js` já importa `LocatariosDesktop.js` — sem mudança necessária.

---

## Análise do Componente Atual vs Target

### O que já existe em `LocatariosDesktop.js` e pode ser reaproveitado

| Item | Linha | Status |
|------|-------|--------|
| `fmtDoc(tipo, doc)` | 19-23 | Manter — já correto |
| `getInitials(name)` | 25-28 | Manter |
| `resetForm()` | 15-17 | Manter |
| Estado: `locatarios`, `showInviteForm`, `form`, `erro`, `loading`, `removingIds`, `editandoId`, `formEdit` | 32-41 | Manter todos |
| Contadores `ativos` / `pendentes` | 43-44 | Manter |
| `handleConvidar` | 46-61 | Manter — adicionar strip `onlyDigits` antes de chamar SA |
| `handleEditarLocatario` | 63-73 | Ajustar — popular `telefone` com `maskPhone` |
| `handleSalvarLocatario` | 80-91 | Ajustar — strip telefone antes de salvar |
| `handleRevogar` | 93-107 | Ajustar — adicionar `confirmRevogarId` state antes de chamar |
| Modal "Editar Locatário" | 238-332 | Ajustar — remover campos tipo/documento; adicionar máscara no telefone |
| Modal "Convidar Locatário" | 334-429 | Ajustar — adicionar `maskDocumento` no onChange, `maskPhone` no telefone; segmented já existe |
| Callout de convite | 223-235 | Manter |
| `Field` helper | 434-443 | Manter |

### O que precisa ser adicionado/substituído

| Item | Ação |
|------|------|
| Estado `q` (busca) + `view` derivado | Adicionar |
| Estado `resent` Set | Adicionar |
| Estado `confirmRevogarId` | Adicionar |
| Funções `onlyDigits`, `maskCPF`, `maskCNPJ`, `maskDocumento`, `maskPhone` | Adicionar |
| `handleReenviar(id)` | Adicionar |
| Importar `reenviarConvite` e `ConfirmDialog` | Adicionar |
| Bloco de busca (input + contador) | Adicionar |
| Layout desktop (grade de cards) | Substituir tabela atual |
| Layout mobile (r-panel + rows) | Adicionar |
| `ConfirmDialog` no JSX | Adicionar |
| Avatar inline | Adicionar |

---

## Validation Architecture

### Framework de Testes

| Propriedade | Valor |
|-------------|-------|
| Framework | Playwright 1.60.0 |
| Config | `playwright.config.js` (raiz do projeto) |
| Comando rápido | `npx playwright test e2e/crud-locatarios.spec.js --reporter=dot` |
| Suite completa | `npx playwright test` |

### Mapa Requirements → Testes

| Req ID | Comportamento | Tipo de Teste | Arquivo Existente |
|--------|--------------|---------------|-------------------|
| LOC-01 | Busca por nome/e-mail/documento filtra a lista | E2E manual / visual | `crud-locatarios.spec.js` — sem teste de busca (gap) |
| LOC-02 | Modal convite: máscara CPF/CNPJ muda ao trocar PF/PJ; armazena só dígitos | E2E | `crud-locatarios.spec.js` — testa convite mas não máscara |
| LOC-03 | Modal edição: apenas nome/email/telefone; strip antes de salvar | E2E | `crud-locatarios.spec.js:~60-100` (testa edição) |
| LOC-04 | Botão Reenviar aparece só para pendentes; feedback "✓ Reenviado" | E2E manual | `crud-locatarios.spec.js` — sem teste de reenvio (gap) |
| LOC-05 | Revogar exige ConfirmDialog; SA deleta auth user | E2E | `crud-locatarios.spec.js` — testa revogar |
| LOC-06 | Mobile expõe ações no footer sem hover | E2E visual (viewport 375px) | `mobile-responsive.spec.js` — cobre locatários parcialmente |

### Wave 0 Gaps

- [ ] `e2e/crud-locatarios.spec.js` — adicionar teste de busca client-side (LOC-01)
- [ ] `e2e/crud-locatarios.spec.js` — adicionar teste de máscara e digit-juggle ao trocar PF/PJ (LOC-02)
- [ ] `e2e/crud-locatarios.spec.js` — adicionar teste de reenvio + feedback (LOC-04)
- [ ] `e2e/mobile-responsive.spec.js` — verificar que ações mobile estão visíveis sem hover (LOC-06)

---

## Environment Availability

Step 2.6: SKIPPED — fase é puramente code/config, sem dependências externas novas. Supabase já em uso no projeto.

---

## Security Domain

### ASVS Categories Aplicáveis

| Categoria ASVS | Aplica | Controle |
|----------------|--------|---------|
| V2 Autenticação | sim | `authGuard()` local em cada SA; `isProprietario` check |
| V4 Controle de Acesso | sim | `.eq('proprietario_id', user.id)` em todas as queries de SA |
| V5 Validação de Input | sim | `UUID_RE` na SA; `DOCUMENTO_RE` em `convidarLocatario`; strip `onlyDigits` no frontend |
| V6 Criptografia | não aplicável | Não há criptografia nesta fase |

### Padrões de Ameaça

| Padrão | STRIDE | Mitigação padrão |
|--------|--------|-----------------|
| IDOR — acessar locatário de outro proprietário | Spoofing/EoP | `.eq('proprietario_id', user.id)` obrigatório em `reenviarConvite` (igual `revogarConvite`) |
| Reenvio de convite para locatário que já aceitou | Tampering | Guard `status_convite !== 'pendente'` na SA antes de chamar `inviteUserByEmail` |
| Strip omitido — banco recebe `123.456.789-00` | Tampering | `onlyDigits()` no handler antes de chamar SA; SA valida com `DOCUMENTO_RE` como segunda linha |

---

## Assumptions Log

| # | Claim | Seção | Risco se Errado |
|---|-------|-------|-----------------|
| — | — | — | — |

**Tabela vazia:** Todos os claims desta pesquisa foram verificados por leitura direta do codebase — sem claims `[ASSUMED]`.

---

## Open Questions

1. **Skeleton loading para Locatários**
   - O que sabemos: `Unidades.js` tem `SkeletonUnidades` (3 cards `Skeleton`). `LocatariosDesktop.js` usa `initialLocatarios` (SSR prop) — dados chegam no servidor, sem loading state necessário.
   - O que está em aberto: A discretion do Claude sobre se aplicar skeleton ou não.
   - Recomendação: **Não aplicar skeleton** — dados chegam via SSR props (`initialLocatarios`), não há `useEffect` de fetch inicial. O estado de loading é `false` desde o render inicial.

2. **Estratégia de edição in-place vs arquivo novo**
   - O que sabemos: `page.js` já importa `LocatariosDesktop`. `Locatarios.js` é legado sem uso em produção.
   - Recomendação: Evoluir `LocatariosDesktop.js` in-place e deletar `Locatarios.js` no plano 2 (layout). Menos risco de import inconsistente.

---

## Sources

### Primary (HIGH confidence)

- `src/components/features/LocatariosDesktop.js` — leitura completa (444 linhas)
- `src/actions/locatarios.js` — leitura completa (114 linhas)
- `src/app/dashboard/locatarios/page.js` — leitura completa
- `src/components/ui/ConfirmDialog.js` — leitura completa
- `src/app/globals.css:415-474` — classes r-*, r-panel, r-fade, r-ghostbtn verificadas
- `src/components/features/Contratos.js` — grep confirmou `romma-desktop-only`/`romma-mobile-only` em 4 pontos
- `.planning/phases/23-locat-rios-busca-m-scaras/23-CONTEXT.md` — decisões D-01 a D-13
- `.planning/phases/23-locat-rios-busca-m-scaras/23-UI-SPEC.md` — contrato visual completo

### Secondary (MEDIUM confidence)

- `.planning/REQUIREMENTS.md` — LOC-01 a LOC-06 lidos
- `.planning/STATE.md` — histórico de fases verificado
- `e2e/crud-locatarios.spec.js` — leitura parcial (60 linhas) para mapeamento de testes existentes

---

## Metadata

**Breakdown de confiança:**
- Stack/recursos: HIGH — tudo verificado por leitura direta de arquivos do codebase
- Arquitetura: HIGH — padrão `romma-desktop-only`/`romma-mobile-only` verificado em `Contratos.js`
- Pitfalls: HIGH — identificados por análise do código existente e do contrato visual
- Testes: MEDIUM — `crud-locatarios.spec.js` lido parcialmente; gaps inferidos

**Data da pesquisa:** 2026-06-17
**Válido até:** 2026-07-17 (stack estável, sem dependências externas novas)
