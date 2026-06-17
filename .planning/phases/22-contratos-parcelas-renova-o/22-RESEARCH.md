# Phase 22: Contratos & Parcelas — Renovação - Research

**Researched:** 2026-06-16
**Domain:** Refatoração de componentes React (Client Components), Server Action com lógica de datas, cards grid + timeline vertical, estado derivado client-side
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Layout Contratos (CONTR-01, CONTR-02)**
- D-01: Desktop → cards `repeat(auto-fill, minmax(330px, 1fr))`. Card contém: badge status/vencendo, locatário, unidade+edifício abreviado, datas início→fim com countdown, barra de progresso `pctElapsed` (4%–100%), valor mensal, botões "Ver →" e "Cancelar". Borda `--warning` quando `isExpiring`.
- D-02: Mobile → lista de rows clicáveis, sem cards. Cada row: locatário, unidade+datas abreviadas, badge.
- D-03: `daysLeft(c) = Math.ceil((new Date(c.data_fim) - new Date()) / 86400000)`. Cor `--warning` quando ≤7 dias.
- D-04: `pctElapsed = Math.max(4, Math.min(100, Math.round(((hoje-inicio)/(fim-inicio))*100)))`. Barra 4px, fundo `--surface-hi`, preenchimento `--primary-hover` (ou `--warning` quando expirando).

**Busca e filtro "Vencendo" (CONTR-01)**
- D-05: Client-side sobre lista carregada. `nameOf(c)` = `locatarios.nome_razao_social + unidades.nome`. Toggle "Vencendo · N" filtra `view`. Exibe `N resultado(s)` quando filtro ativo.

**Arquivo de encerrados (CONTR-04, CONTR-05)**
- D-06: Toggle inline — callout existente vira botão funcional; alterna `showArquivo`. Expande lista: encerrados + cancelados com opacidade 0.78. Cada row: ID arquivado, locatário, unidade+edifício+datas, badge, "Ver →".
- D-07: Arquivo = `contratos.status !== 'ativo'` (inclui `cancelado` + `encerrado`).

**Grade-resumo e resumo financeiro (PARC-01)**
- D-08: Grade-resumo 5 colunas desktop, 2×3 mobile: Unidade, Edifício, Valor mensal, Início, Término. Bordas `--border-3`, fundo `--surface`.
- D-09: Resumo financeiro 4 colunas: "Valor do contrato" (`parcelas.length × valor_mensal`), "Total recebido" (`pagas.length × valor_mensal`, cor `--success`), "Em aberto" (`(pendente+vencida+futura) × valor_mensal`, cor `--highlight`), "Inadimplência" (`vencidas.length × valor_mensal`; fundo `--danger-bg2` + cor `--danger-fg` quando `vencidas > 0`; senão `R$0` em `--fg-3`).
- D-10: Valor derivado de `unidade.valor_mensal` — parcelas não têm coluna valor.

**Timeline vertical (PARC-02, PARC-03)**
- D-11: Barra de progresso acima da timeline: `parc.length` células de 6px × gap 3px; cor por status: `--success`/`--danger`/`--warning`/`--surface-hi`.
- D-12: Timeline substituindo tabela. Coluna esquerda: ponto 12×12 (background: cor_status; borda `--fg-5` quando futura) + linha vertical (width:1, `--border-3`, minHeight:28). Coluna direita: "Parcela NN" + badge + botão "✓ Registrar" (pendente/vencida) + meta: "Venc · data", "Pago · data_ou_—", `fmtBRL(valor_mensal)`.
- D-13: Após `marcarParcelaComoPaga` → re-fetch parcelas + recalcular resumo financeiro via React state (sem reload). Toast "Pagamento registrado · data".

**Modal de renovação (PARC-04)**
- D-14: Botão "Renovar" no header de Parcelas.js ao lado do badge status. Abre `showRenew`.
- D-15: Modal: opções rápidas +6/+12/+24 meses (grid 3 colunas) + campo custom `input[type=number]` (min=1, max=36). Mostra "Término atual: DD/MM/AAAA". Preview "Novo término: DD/MM/AAAA" ao selecionar. Ao confirmar: fecha, chama SA, toast, re-fetch.
- D-16: SA `renovarContrato(id, meses)` em `src/actions/contratos.js`: authGuard + UUID_RE + cadeia de propriedade + buscar `data_fim` e `MAX(numero)` das parcelas existentes + UPDATE `data_fim` + INSERT parcelas futuras em lote. Datas com `T12:00:00` para evitar UTC shift. Sem re-chamar Edge Function.

### Claude's Discretion
- Numeração exata de parcelas novas (`max(numero)+1` via SQL ou via lista do frontend).
- Se o callout existente em Contratos.js precisa ser completamente substituído ou apenas ter onClick adicionado.
- Animação de entrada dos cards (`rFade`/`--ease-crisp`) — aplicar se já existir em globals.css, skip se não.
- Campo custom de meses: `input number` com `min=1 max=36`.

### Deferred Ideas (OUT OF SCOPE)
- "Expandir contrato" (somar unidade) — cortado.
- Reajuste IGP-M no detalhe — removido.
- Realtime no detalhe de parcelas.
- Filtro de arquivo por período/locatário.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| CONTR-01 | Proprietário busca contratos por locatário/unidade e filtra por "vencendo" (≤7 dias) | Estado client-side (`q`, `onlyVencendo`) sobre dados já carregados; `nameOf()` usa join existente em `getContratos()` |
| CONTR-02 | Cada contrato exibe contagem regressiva de dias e barra de progresso | Derivado client-side de `data_inicio`/`data_fim`; sem coluna nova no banco |
| CONTR-03 | Formulário de novo contrato mostra valor da unidade selecionada | Já implementado em Contratos.js:269-276; preservar durante refatoração |
| CONTR-04 | Cancelar contrato exige confirmação e muda status para "encerrado" preservando histórico | `cancelarContrato` SA existente muda para `cancelado`; ambos aparecem no arquivo |
| CONTR-05 | Seção alternável de "arquivo de encerrados" | Novo state `showArquivo`; callout existente vira botão funcional |
| PARC-01 | Detalhe exibe grade-resumo + resumo financeiro | Estado derivado de `unidade.valor_mensal` × contagens por status |
| PARC-02 | Parcelas em timeline vertical com barra de progresso | Substituição completa da tabela existente em Parcelas.js |
| PARC-03 | Registrar pagamento atualiza resumo financeiro ao vivo | SA `marcarParcelaComoPaga` existente + re-fetch local sem reload |
| PARC-04 | Renovar contrato via modal estende data_fim + append parcelas futuras | Nova SA `renovarContrato` em contratos.js; INSERT em lote via supabaseAdmin |
</phase_requirements>

---

## Summary

Esta fase é primariamente uma **refatoração visual profunda** de dois componentes existentes (`Contratos.js` e `Parcelas.js`) mais a criação de uma nova Server Action (`renovarContrato`). Não há mudança de schema, novas tabelas, nem Edge Functions envolvidas.

O `Contratos.js` atual é uma tabela simples que precisa ser convertida para layout de cards no desktop (variante B do design), com busca client-side, filtro "Vencendo" e arquivo de encerrados via toggle inline. O código existente já tem `isExpiring()`, `ConfirmDialog`, `StatusBadge` e o padrão de animação `removingIds` que devem ser preservados e expandidos.

O `Parcelas.js` atual é uma tabela simples que precisa de redesign completo: grade-resumo (5 colunas), resumo financeiro derivado (4 colunas), barra de progresso de células + timeline vertical substituindo a tabela, e modal de renovação. A lógica de `marcarComoPaga` já existe e funciona — apenas precisa ser integrada ao novo estado de resumo financeiro para recalcular ao vivo.

A SA `renovarContrato` é nova mas segue exatamente o mesmo padrão de `marcarParcelaComoPaga` e `cancelarContrato` já estabelecidos: `authGuard()` local + `UUID_RE` + cadeia de propriedade 4 níveis + operações com `supabaseAdmin`. A lógica de geração de datas usa `T12:00:00` para evitar UTC shift — padrão já documentado no CONTEXT.md (D-16).

**Primary recommendation:** Implementar em 3 waves independentes: (1) SA `renovarContrato`, (2) redesign de `Parcelas.js`, (3) redesign de `Contratos.js`. A SA pode ser testada isoladamente antes dos componentes.

---

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Busca + filtro "Vencendo" | Frontend Client (React state) | — | Dados já carregados; filtro client-side evita round-trip |
| Cálculo de countdown e progresso | Frontend Client (derivado) | — | Sem coluna no banco; derivado de `data_inicio`/`data_fim` |
| Arquivo de encerrados | Frontend Client (toggle state) | — | Dados já no fetch de `getContratos()`; filtro por status |
| Resumo financeiro | Frontend Client (derivado) | — | Valor = `unidade.valor_mensal`; cálculos sobre array de parcelas |
| Timeline de parcelas | Frontend Client (render) | — | Dados de `getParcelasByContrato`; sem estado extra |
| Registrar pagamento | Server Action (parcelas.js) | Frontend (re-fetch) | Mutação segura com cadeia de propriedade; SA existente |
| Renovação de contrato | Server Action (contratos.js) | Frontend (modal+re-fetch) | UPDATE + INSERT em lote; nova SA no arquivo existente |
| Query de contratos | API / Supabase (client query) | — | `getContratos()` já faz join locatarios + unidades |
| Query de parcelas | API / Supabase (client query) | — | `getParcelasByContrato()` retorna todos os campos necessários |

---

## Standard Stack

### Core (sem instalação — tudo já no projeto)

| Biblioteca | Versão | Propósito | Por que é padrão aqui |
|------------|--------|-----------|----------------------|
| React 19 (Client Components) | 19.2.4 | Estado local, re-renders, derivações | `'use client'` em Contratos.js e Parcelas.js |
| Next.js App Router | ^16.2.4 | Server Actions (`'use server'`) | `renovarContrato` como SA em contratos.js |
| supabaseAdmin | já configurado | Operações de escrita com bypass de RLS | Padrão de todos os SAs existentes |
| shadcn/ui (Button, Input) | ^4.2.0 | Botões e inputs do modal de renovação | Já usado em ambos os componentes |
| sonner (toast) | já instalado | Feedback de ações | `toast.success()` já em uso nos dois componentes |
| StatusBadge | componente local | Badge colorido por status | Já importado; suporta "vencendo" |
| ConfirmDialog | componente local | Modal de confirmação destrutiva | Já usado em Contratos.js para cancelar/encerrar |

### Tokens CSS disponíveis (verificados em globals.css)

[VERIFIED: leitura direta de src/app/globals.css]

| Token | Valor | Uso nesta fase |
|-------|-------|----------------|
| `--warning` | oklch(0.769 0.165 70.08) | Borda card expirando, countdown, progresso |
| `--warning-bg` | oklch(0.21 0.02 70) | Fundo do toggle "Vencendo" ativo |
| `--danger-fg` | oklch(0.826 0.073 22.5) | Inadimplência: cor do texto |
| `--danger-bg2` | oklch(0.27 0.13 27.38) | Inadimplência: fundo da célula |
| `--success` | oklch(0.696 0.17 162.5) | Total recebido, parcelas pagas, botão registrar |
| `--highlight` | oklch(0.7245 0.0998 82.35) | Em aberto (dourado) |
| `--primary-hover` | oklch(from --primary-2 l+0.25 c h) | Preenchimento da barra de progresso do contrato |
| `--surface-hi` | oklch(0.218 0 0) | Fundo da barra de progresso vazia, cabeçalhos |
| `--surface` | oklch(0.182 0 0) | Fundo dos cards, grade-resumo |
| `--border-3` | oklch(0.387 0 0 / 0.4) | Bordas de cards, grade, linha vertical timeline |
| `--indigo` | alias de `--primary` | Eyebrow do modal "Renovação" |
| `--fg-5` | oklch(from bg + 0.148) | Borda do ponto "futura" na timeline |

### Classes de utilidade disponíveis (verificadas em globals.css)

[VERIFIED: leitura direta de src/app/globals.css linhas 419-469]

| Classe | Propósito | Uso nesta fase |
|--------|-----------|----------------|
| `.r-subhead` | font-body 600 16px | Nome do locatário no card |
| `.r-data` | font-mono 14px | Datas, valores numéricos |
| `.r-meta` | font-mono 10px | IDs, sub-captions, "N resultado(s)" |
| `.r-label` | font-mono 700 11px uppercase | Cabeçalhos de célula na grade-resumo |
| `.r-body` | font-body 400 14px | Texto do body do modal |
| `.r-section` | font-display 700 20px | Título "Cronograma de Parcelas" |
| `.r-panel` | surface + border-3 | Container da timeline, arquivo |
| `.r-rowlink` | hover highlight + cursor pointer | Rows do arquivo de encerrados |
| `.r-ghostbtn` | all:unset + cursor:pointer | Botões ghost inline ("Ver →", "✓ Registrar") |
| `.r-eyebrow` + `.indigo` | eyebrow colorido | Header do modal de renovação |
| `.r-fade` | animação de entrada | Wrapper do card (se quiser animar) |
| `.romma-page` | rFade 320ms na página | Já usado nos wrappers de página |
| `rFade` | keyframe translateY(8px→0) | Disponível para cards com `animation: rFade` |

### Tokens de densidade disponíveis (verificados em globals.css)

[VERIFIED: leitura direta de src/app/globals.css linhas 396-404]

```css
--rd-gutter:   32px;   /* padding horizontal desktop */
--rd-gutter-m: 20px;   /* padding horizontal mobile */
--rd-page-y:   28px;   /* padding topo */
--rd-block:    24px;   /* gap entre blocos maiores */
--rd-block-sm: 16px;   /* gap entre blocos menores */
--rd-panel:    20px;   /* padding interno de painel */
--rd-cell:     20px;   /* padding de célula de métrica */
--rd-row-y:    12px;   /* padding vertical de linha */
--rd-row-x:    16px;   /* padding horizontal de linha */
```

### Sem instalação de pacotes

Esta fase não requer instalação de nenhum pacote externo. Todo o stack está presente.

---

## Package Legitimacy Audit

Não aplicável — esta fase não instala nenhum pacote externo.

---

## Architecture Patterns

### System Architecture Diagram

```
Browser (Client Component)
  │
  ├─ Contratos.js
  │    ├─ useEffect → getContratos() [join locatarios + unidades]
  │    ├─ state: contratos, q, onlyVencendo, showArquivo, removingIds
  │    ├─ derivados: ativos, arquivo, view (filtrado), vencendoCount
  │    ├─ cards desktop (grid auto-fill 330px) — render condicional sm:
  │    ├─ rows mobile — render condicional
  │    ├─ [Cancelar] → cancelarContrato SA → re-fetch
  │    └─ [Ver Arquivo →] toggle → lista encerrados+cancelados
  │
  └─ Parcelas.js
       ├─ useEffect → getParcelasByContrato() + getContratos() + ...
       ├─ state: parcelas, contrato, locatario, unidade, showRenew, renewMonths
       ├─ derivados: pagas, pendentes, vencidas, totalContrato, totalPago, emAberto
       ├─ grade-resumo (5 colunas desktop / 2×3 mobile)
       ├─ resumo financeiro (4 colunas)
       ├─ barra de progresso (N células × status)
       ├─ timeline vertical (ponto + linha + meta)
       ├─ [✓ Registrar] → marcarParcelaComoPaga SA → setParcelas(re-fetch)
       └─ [Renovar] → modal → renovarContrato SA → re-fetch contrato + parcelas

Server Actions (src/actions/contratos.js)
  ├─ cancelarContrato(id) — existente
  ├─ encerrarContrato(id) — existente
  └─ renovarContrato(id, meses) — NOVA
       ├─ authGuard() + UUID_RE
       ├─ cadeia: contratos → unidades.edificio_id → edificios.proprietario_id
       ├─ SELECT data_fim, MAX(numero) parcelas, last data_fechamento
       ├─ calcular nova data_fim (setMonth com T12:00:00)
       ├─ gerar array de novas parcelas (futura, mensalmente até nova data_fim)
       ├─ UPDATE contratos SET data_fim
       └─ INSERT parcelas em lote

Supabase (supabaseAdmin)
  ├─ contratos (UPDATE data_fim)
  └─ parcelas (INSERT em lote)
```

### Estrutura de Arquivos Afetados

```
src/
├─ actions/
│   └─ contratos.js          # +renovarContrato export (nova função ao final)
├─ components/features/
│   ├─ Contratos.js          # Redesign completo (cards + busca + arquivo)
│   └─ Parcelas.js           # Redesign completo (grade + resumo + timeline + modal)
└─ lib/
    └─ queries-client.js     # Sem mudança (getContratos e getParcelasByContrato ok)
```

### Pattern 1: Cards Desktop + Rows Mobile no mesmo componente

**O que é:** Render condicional baseado em breakpoint — sem hook de detecção de tamanho de tela, apenas CSS `display: none` / `display: grid` via Tailwind responsivo.

**Quando usar:** Quando desktop e mobile têm layouts radicalmente diferentes (cards vs. rows).

**Exemplo (baseado em console3.jsx:95-158):**

```jsx
// Source: .planning/design/js/console3.jsx linhas 95-133 (cards) e 152-158 (rows mobile)

{/* Desktop: cards (hidden no mobile via sm:hidden) */}
<div className="hidden sm:grid" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(330px, 1fr))", gap: 12 }}>
  {view.map((c) => (
    <div
      key={c.id}
      style={{
        border: `1px solid ${isExpiring(c) ? "var(--warning)" : "var(--border-3)"}`,
        background: "var(--surface)",
        padding: "var(--rd-panel)",
        display: "flex",
        flexDirection: "column",
        gap: 14,
        opacity: removingIds.has(c.id) ? 0 : 1,
        transform: removingIds.has(c.id) ? "scale(0.98)" : "scale(1)",
        transition: "opacity 220ms ease, transform 220ms ease",
      }}
    >
      {/* conteúdo do card */}
    </div>
  ))}
</div>

{/* Mobile: rows (hidden no desktop) */}
<div className="sm:hidden r-panel">
  {view.map((c, i) => (
    <div
      key={c.id}
      onClick={() => router.push(`/dashboard/contratos/${c.id}`)}
      className="r-rowlink"
      style={{ padding: "12px var(--rd-row-x)", borderTop: i > 0 ? "1px solid var(--border-3)" : "none", ... }}
    >
      {/* conteúdo da row */}
    </div>
  ))}
</div>
```

[VERIFIED: console3.jsx linhas 95-158 + padrão Tailwind responsivo existente no codebase]

### Pattern 2: Barra de Progresso Segmentada (Parcelas)

**O que é:** N células de altura fixa coloridas por status — cada célula representa uma parcela.

**Exemplo (baseado em console3.jsx:296-298):**

```jsx
// Source: .planning/design/js/console3.jsx linha 297
<div style={{ display: "flex", gap: 3, marginBottom: "var(--rd-block-sm)" }}>
  {parcelas.map((p) => (
    <div
      key={p.id}
      style={{
        flex: 1,
        height: 6,
        background:
          p.status === "paga"    ? "var(--success)"    :
          p.status === "vencida" ? "var(--danger)"     :
          p.status === "pendente"? "var(--warning)"    :
                                   "var(--surface-hi)",
      }}
    />
  ))}
</div>
```

### Pattern 3: Timeline Vertical

**O que é:** Layout flex com coluna de ponto+linha à esquerda e conteúdo à direita. Ponto é quadrado (não círculo — regra do design system).

**Exemplo (baseado em console3.jsx:302-326):**

```jsx
// Source: .planning/design/js/console3.jsx linhas 302-326
{parcelas.map((p, i) => {
  const col = p.status === "paga"     ? "var(--success)"  :
              p.status === "vencida"  ? "var(--danger)"   :
              p.status === "pendente" ? "var(--warning)"  : "var(--fg-5)";
  return (
    <div key={p.id} style={{ display: "flex", gap: 16 }}>
      {/* Coluna esquerda: ponto + linha */}
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
        <span style={{
          width: 12, height: 12, flexShrink: 0, marginTop: 3,
          background: p.status === "futura" ? "transparent" : col,
          border: p.status === "futura" ? "1px solid var(--fg-5)" : "none",
        }} />
        {i < parcelas.length - 1 && (
          <span style={{ flex: 1, width: 1, background: "var(--border-3)", minHeight: 28 }} />
        )}
      </div>
      {/* Coluna direita: dados */}
      <div style={{ flex: 1, paddingBottom: i < parcelas.length - 1 ? 18 : 0 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 }}>
          <span className="r-subhead" style={{ fontSize: 15 }}>Parcela {String(p.numero).padStart(2, "0")}</span>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            {(p.status === "pendente" || p.status === "vencida") && (
              <button
                onClick={() => marcarComoPaga(p)}
                className="r-ghostbtn"
                style={{
                  fontFamily: "var(--font-mono)", fontSize: 10, fontWeight: 700,
                  color: "var(--success)", letterSpacing: "0.5px", textTransform: "uppercase",
                  border: "1px solid color-mix(in oklch, var(--success) 40%, transparent)",
                  padding: "5px 9px",
                }}
              >
                ✓ Registrar
              </button>
            )}
            <StatusBadge status={p.status} />
          </div>
        </div>
        <div className="r-meta" style={{ marginTop: 5, display: "flex", gap: 14, flexWrap: "wrap" }}>
          <span>Venc · <span style={{ color: p.status === "vencida" ? "var(--danger-fg)" : "var(--fg-3)" }}>{fmtData(p.data_vencimento)}</span></span>
          <span>Pago · <span style={{ color: p.data_pagamento ? "var(--success)" : "var(--fg-5)" }}>{p.data_pagamento ? fmtData(p.data_pagamento) : "—"}</span></span>
          <span style={{ color: "var(--fg-2)" }}>{fmtBRL(unidade?.valor_mensal)}</span>
        </div>
      </div>
    </div>
  );
})}
```

### Pattern 4: Lógica de Datas para renovarContrato

**O que é:** Geração de novas parcelas mensais a partir do mês seguinte ao último `data_fechamento` existente.

**Implementação detalhada (D-16):**

```javascript
// Source: CONTEXT.md D-16 + padrão da Edge Function gerar-parcelas

export async function renovarContrato(id, meses) {
  const { err, user } = await authGuard()
  if (err) return err
  if (!UUID_RE.test(id)) return { status: 400, erroMessage: 'ID inválido.' }
  if (!Number.isInteger(meses) || meses < 1 || meses > 36)
    return { status: 400, erroMessage: 'Meses inválido.' }

  // 1. Cadeia de propriedade
  const { data: contrato } = await supabaseAdmin
    .from('contratos').select('data_fim, unidade_id').eq('id', id).single()
  // ... verificar unidade → edificio → proprietario_id = user.id ...

  // 2. Buscar última parcela (numero e data_fechamento)
  const { data: ultimaParcela } = await supabaseAdmin
    .from('parcelas')
    .select('numero, data_fechamento')
    .eq('contrato_id', id)
    .order('numero', { ascending: false })
    .limit(1)
    .single()

  // 3. Calcular nova data_fim
  const d = new Date(contrato.data_fim + 'T12:00:00')
  d.setMonth(d.getMonth() + meses)
  const novaDataFim = d.toISOString().slice(0, 10)

  // 4. Gerar novas parcelas mensalmente
  const novasParcelas = []
  let nextNum = ultimaParcela.numero + 1
  // Próximo fechamento = dia 1 do mês seguinte ao último
  const baseDate = new Date(ultimaParcela.data_fechamento + 'T12:00:00')
  baseDate.setMonth(baseDate.getMonth() + 1)
  baseDate.setDate(1)

  const fimDate = new Date(novaDataFim + 'T12:00:00')

  while (baseDate <= fimDate) {
    const fechamento = baseDate.toISOString().slice(0, 10)
    const venc = new Date(baseDate)
    venc.setDate(venc.getDate() + 7)
    const vencimento = venc.toISOString().slice(0, 10)
    novasParcelas.push({
      contrato_id: id,
      numero: nextNum++,
      data_fechamento: fechamento,
      data_vencimento: vencimento,
      status: 'futura',
    })
    baseDate.setMonth(baseDate.getMonth() + 1)
  }

  // 5. UPDATE + INSERT em lote
  await supabaseAdmin.from('contratos').update({ data_fim: novaDataFim }).eq('id', id)
  if (novasParcelas.length > 0) {
    await supabaseAdmin.from('parcelas').insert(novasParcelas)
  }
  return { status: 200 }
}
```

**Pitfall crítico de data:** Usar `new Date('2026-01-01')` (sem hora) interpreta como UTC midnight, que em fuso UTC-3 vira 2025-12-31. Sempre usar `+ 'T12:00:00'` ao construir datas de parcelas. [VERIFIED: CONTEXT.md D-16 e padrão da Edge Function existente]

### Pattern 5: Resumo Financeiro Derivado

**O que é:** Cálculos puramente client-side sobre o array `parcelas` e `unidade.valor_mensal`.

```javascript
// Source: console3.jsx linhas 232-236 + CONTEXT.md D-09
const valorMensal = unidade?.valor_mensal ?? 0
const pagas        = parcelas.filter(p => p.status === "paga")
const vencidas     = parcelas.filter(p => p.status === "vencida")
const emAberto     = parcelas.filter(p => p.status === "pendente" || p.status === "vencida" || p.status === "futura")

const totalContrato = parcelas.length * valorMensal
const totalPago     = pagas.length * valorMensal
const totalEmAberto = emAberto.length * valorMensal
const totalInadimplencia = vencidas.length * valorMensal
```

**Quando `marcarParcelaComoPaga` retorna 200:** re-fetch `getParcelasByContrato(contratoId)` e `setParcelas(...)` — React recalcula os derivados automaticamente via re-render.

### Anti-Patterns a Evitar

- **Não usar `useState` por campo no modal de renovação** — usar objeto único `{ meses: 12, custom: "" }`.
- **Não usar `window.innerWidth` para detectar mobile** — usar Tailwind responsive (`hidden sm:block`).
- **Não construir datas com `new Date('YYYY-MM-DD')` sem hora** — sempre `+ 'T12:00:00'`.
- **Não inserir parcelas com `numero` baseado em `parcelas.length`** — usar `ultimaParcela.numero + 1` (sequencial real no banco).
- **Não chamar a Edge Function `gerar-parcelas` na renovação** — `renovarContrato` faz INSERT direto via supabaseAdmin.
- **Não compartilhar `authGuard()` entre arquivos de actions** — redeclarar localmente em cada arquivo (padrão estabelecido no projeto).

---

## Don't Hand-Roll

| Problema | Não Construir | Usar Em Vez | Por quê |
|----------|---------------|-------------|---------|
| Modal de confirmação | Novo modal custom | `ConfirmDialog` existente | Já tem as props `danger`, `confirmLabel`, `onConfirm` |
| Toast de sucesso | Sistema de notificação custom | `toast` do sonner | Já integrado, `toast.success()` usado no projeto |
| Badge de status | Badge custom | `StatusBadge` com `status="vencendo"` | Já suporta todos os estados incluindo "vencendo" |
| Formatação de moeda | `Intl.NumberFormat` inline | `fmtBRL` de `@/lib/utils` | Já usado em ambos os componentes |
| Formatação de data | `toLocaleDateString` inline | `fmtData` de `@/lib/utils` | Já usado em ambos os componentes |
| Cadeia de propriedade | Verificação ad-hoc | Padrão de 4 queries (parcela→contrato→unidade→edificio→proprietario_id) | Replicar exatamente como em `marcarParcelaComoPaga` (parcelas.js:20-37) |

---

## Pontos de Decisão sob "Claude's Discretion"

### D-A: Numeração de parcelas novas — SQL vs. frontend

**Opção 1 (SQL):** `SELECT numero FROM parcelas WHERE contrato_id = id ORDER BY numero DESC LIMIT 1` na SA.
**Opção 2 (frontend):** passar `nextNum` como parâmetro para a SA.

**Recomendação:** Opção 1 (SQL). A SA deve ser autossuficiente e atômica — o frontend não deve ditar numeração que depende do estado atual do banco. CONTEXT.md D-16 já especifica `SELECT numero FROM parcelas ... ORDER BY numero DESC LIMIT 1`.

### D-B: Callout do arquivo — substituir ou adicionar onClick

O callout existente em Contratos.js:433-445 tem `disabled` e `opacity-50 cursor-not-allowed`. Para ativar:
**Recomendação:** Remover `disabled`, `opacity-50`, `cursor-not-allowed` e adicionar `onClick={() => setShowArquivo(v => !v)}`. Texto vira dinâmico: `showArquivo ? "⌃ Ocultar Arquivo" : `Ver Arquivo (${encerrados}) →`` . Mudança mínima e segura.

### D-C: Animação de entrada dos cards

`rFade` keyframe e `.r-fade` estão disponíveis em globals.css (verificado linha 458/467). O `romma-page` wrapper já usa `animation: rFade 320ms`. Para animar cada card individualmente ao carregar, aplicar `animation: rFade var(--dur-base) var(--ease-crisp)` inline no div do card com um pequeno `animationDelay` escalonado (ex.: `i * 30ms`). Verificar se `--dur-base` existe.

### D-D: Input de meses custom

`<Input type="number" min={1} max={36} value={renewCustom} onChange={e => setRenewCustom(Number(e.target.value))} />` é suficiente. Usar o componente `Input` do shadcn para consistência visual.

---

## Common Pitfalls

### Pitfall 1: UTC Shift em datas de parcelas

**O que dá errado:** `new Date('2026-06-01')` interpreta como UTC midnight → em fuso UTC-3 (horário de Brasília) se torna `2026-05-31T21:00:00-03:00` → `toISOString().slice(0,10)` retorna `'2026-06-01'` mas `getDate()` no fuso local retorna 31.
**Por que acontece:** JavaScript interpreta strings de data sem hora como UTC.
**Como evitar:** Sempre sufixar com `'T12:00:00'`: `new Date(dateString + 'T12:00:00')`. Meio-dia UTC é sempre o mesmo dia em qualquer fuso da América do Sul.
**Sinal de alerta:** Parcelas geradas com `data_fechamento` um dia antes do esperado.

### Pitfall 2: Resumo financeiro não atualiza após registrar pagamento

**O que dá errado:** `marcarComoPaga` atualiza `setParcelas` mas o resumo financeiro (totalPago, etc.) usa valores derivados que não re-renderizam porque são calculados fora do render.
**Por que acontece:** Se as derivações forem declaradas fora do componente ou não como expressões inline no render.
**Como evitar:** Calcular `pagas`, `vencidas`, `emAberto`, `totalPago`, etc. diretamente no corpo do componente (não em `useEffect`) — são expressões puras de `parcelas.filter(...)`, re-calculadas automaticamente em cada re-render após `setParcelas`.

### Pitfall 3: `getContratos()` retorna todos os contratos (ativos + encerrados)

**O que dá errado:** A tabela de contratos ativa mostra encerrados/cancelados.
**Por que acontece:** `getContratos()` não filtra por status — retorna tudo.
**Como evitar:** Manter `const contratosAtivos = contratos.filter(c => c.status === "ativo")` para o grid de cards. `const arquivo = contratos.filter(c => c.status !== "ativo")` para o arquivo. Padrão já existente em Contratos.js:180-182.

### Pitfall 4: `data_fim` de contratos comparada como string pode dar errado com timezone

**O que dá errado:** `isExpiring()` usa `new Date(c.data_fim)` sem `T12:00:00` — pode dar 1 dia de erro.
**Por que acontece:** Mesma razão do Pitfall 1.
**Como evitar:** Em `isExpiring` e `daysLeft`, usar `new Date(c.data_fim + 'T12:00:00')`. O código atual em Contratos.js:43 usa `new Date(c.data_fim)` — corrigir ao redesenhar.

### Pitfall 5: `numero` de parcelas novas calculado com `parcelas.length`

**O que dá errado:** Se parcelas foram deletadas (ex.: `cancelarContrato` deleta as futuras), `parcelas.length` pode ser menor que `MAX(numero)`.
**Por que acontece:** O numero deve ser sequencial real, não contagem de linhas.
**Como evitar:** Sempre usar `SELECT numero FROM parcelas ORDER BY numero DESC LIMIT 1` na SA — D-16 já especifica isso.

### Pitfall 6: Modal de renovação fecha sem aguardar SA

**O que dá errado:** `setShowRenew(false)` antes de `await renovarContrato(...)` — se a SA falhar, modal já fechou e o usuário não vê o erro.
**Como evitar:** Fechar modal apenas após `result.status === 200`. Mostrar estado de loading no botão "Confirmar" durante a SA.

---

## Code Examples

### Grade-resumo (5 colunas desktop / 2×3 mobile)

```jsx
// Source: console3.jsx linhas 266-273
const summaryItems = [
  { label: "Unidade", value: unidade?.nome },
  { label: "Edifício", value: edificio?.nome },
  { label: "Valor mensal", value: fmtBRL(unidade?.valor_mensal) },
  { label: "Início", value: fmtData(contrato?.data_inicio) },
  { label: "Término", value: fmtData(contrato?.data_fim) },
]

<div style={{
  display: "grid",
  gridTemplateColumns: "repeat(5, 1fr)",  /* mobile: 1fr 1fr via inline className */
  border: "1px solid var(--border-3)",
  marginBottom: "var(--rd-block)"
}}>
  {summaryItems.map((s, i) => (
    <div
      key={s.label}
      style={{
        padding: "var(--rd-cell)",
        borderRight: i < 4 ? "1px solid var(--border-3)" : "none",
        /* mobile: i % 2 === 0 ? borderRight : none + borderTop quando i >= 2 */
      }}
    >
      <div className="r-label" style={{ fontSize: 10, marginBottom: 8 }}>{s.label}</div>
      <div className="r-subhead" style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 18 }}>
        {s.value ?? "—"}
      </div>
    </div>
  ))}
</div>
```

### Resumo financeiro (4 colunas)

```jsx
// Source: console3.jsx linhas 276-289
const valorMensal = unidade?.valor_mensal ?? 0
const totalContrato = parcelas.length * valorMensal
const totalPago     = pagas.length * valorMensal
const totalEmAberto = emAberto.length * valorMensal
const totalInadimplencia = vencidas.length * valorMensal

const financeiro = [
  { l: "Valor do contrato", v: fmtBRL(totalContrato), s: `${parcelas.length} parcelas`, ok: false, gold: false, danger: false },
  { l: "Total recebido",    v: fmtBRL(totalPago),     s: `${pagas.length} pagas`,       ok: true },
  { l: "Em aberto",         v: fmtBRL(totalEmAberto), s: `${emAberto.length} parcelas`, gold: true },
  { l: "Inadimplência",     v: vencidas.length > 0 ? fmtBRL(totalInadimplencia) : "R$0",
    s: `${vencidas.length} vencida(s)`, danger: vencidas.length > 0 },
]

<div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", border: "1px solid var(--border-3)" }}>
  {financeiro.map((m, i) => (
    <div
      key={m.l}
      style={{
        padding: "14px var(--rd-cell)",
        background: m.danger ? "var(--danger-bg2)" : "transparent",
        borderRight: i < 3 ? "1px solid var(--border-3)" : "none",
      }}
    >
      <div className="r-label" style={{
        fontSize: 9.5, marginBottom: 7,
        color: m.danger ? "var(--danger-fg)" : m.gold ? "var(--highlight)" : m.ok ? "var(--success)" : "var(--fg-4)"
      }}>{m.l}</div>
      <div style={{
        fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 24, letterSpacing: "-1px",
        color: m.danger ? "var(--danger-fg)" : m.gold ? "var(--highlight)" : m.ok ? "var(--success)" : "var(--fg-1)"
      }}>{m.v}</div>
      <div className="r-meta" style={{ marginTop: 4 }}>{m.s}</div>
    </div>
  ))}
</div>
```

### Preview do novo término no modal de renovação

```jsx
// Derivado de console3.jsx:239 + CONTEXT.md D-15
function previewNovoTermino(meses) {
  if (!contrato?.data_fim || !meses) return null
  const d = new Date(contrato.data_fim + 'T12:00:00')
  d.setMonth(d.getMonth() + meses)
  return fmtData(d.toISOString().slice(0, 10))
}
// Uso: ao clicar em +6/+12/+24, calcular preview antes de confirmar
```

---

## State of the Art

| Abordagem Antiga | Abordagem Atual | Quando Mudou | Impacto |
|-----------------|-----------------|--------------|---------|
| Tabela `<table>` para dados tabulares | Grid CSS + lista flex para layouts mistos | Padrão do projeto desde Phase 17 | Mais flexível para mobile; sem acessibilidade de tabela nativa |
| Dados de valor armazenados em `parcelas` | Valor derivado de `unidade.valor_mensal` | Design decision desta fase | Sem coluna `valor` em parcelas; cálculos são multiplicações simples |

**Descontinuado:**
- `COL = "72px 1fr 1fr 1fr 1.2fr 120px"` com `gridStyle` — substituído pela timeline vertical em Parcelas.js.
- `COL = "116px 1.6fr 1.6fr 1fr 1fr 1.2fr 96px"` com tabela — substituído pelos cards desktop em Contratos.js.

---

## Assumptions Log

| # | Claim | Seção | Risco se Errado |
|---|-------|-------|-----------------|
| A1 | `getContratos()` retorna `locatarios(nome_razao_social)` e `unidades(nome)` no join | Standard Stack | Busca client-side `nameOf()` precisaria de query extra |
| A2 | `StatusBadge` aceita `status="vencendo"` sem modificação | Don't Hand-Roll | Precisaria adicionar suporte ao componente |
| A3 | `fmtBRL` e `fmtData` estão em `@/lib/utils` | Code Examples | Imports errados nos componentes |

**Nota:** A1 foi verificada diretamente em `queries-client.js:21` — confirmado. A2 foi verificada em Contratos.js:394 — confirmado. A3 foi verificada em Contratos.js:6 e Parcelas.js:8 — confirmado. Nenhuma assumption permanece por verificar.

---

## Open Questions

1. **`--dur-base` existe em globals.css?**
   - O que sabemos: `--ease-crisp` existe (linha 130). `rFade` usa `var(--dur-base)` em `.r-fade` (linha 467).
   - Incerteza: se `--dur-base` está definido no globals.css (não verificado na seção de variáveis).
   - Recomendação: Usar valor literal `200ms` ou `320ms` nas animações dos cards se `--dur-base` não estiver disponível. O planner deve incluir grep de `--dur-base` no Wave 0.

2. **Supabase RLS permite INSERT em `parcelas` via supabaseAdmin?**
   - O que sabemos: `supabaseAdmin` usa service role key (bypass RLS). Todos os INSERTs de parcelas existentes usam a Edge Function (Deno), não o supabaseAdmin diretamente.
   - Incerteza: se há alguma constraint ou trigger no banco que impeça INSERT direto via admin key.
   - Recomendação: Testar `renovarContrato` com 1 parcela antes de implementar o INSERT em lote. Em caso de erro, verificar triggers no Supabase Dashboard.

---

## Environment Availability

Step 2.6: SKIPPED — fase é puramente de código/componentes React e Server Actions. Sem dependências externas além do Supabase já configurado e em produção.

---

## Validation Architecture

### Test Framework

| Propriedade | Valor |
|-------------|-------|
| Framework | Playwright ^1.60.0 |
| Config file | `playwright.config.js` (verificar na raiz) |
| Quick run | `npx playwright test --project=chromium` |
| Full suite | `npx playwright test` |

### Phase Requirements → Test Map

| Req ID | Comportamento | Tipo de Teste | Comando Automatizado | Arquivo Existe? |
|--------|--------------|---------------|---------------------|-----------------|
| CONTR-01 | Busca por locatário filtra cards | E2E manual | Verificação visual no browser | — |
| CONTR-02 | Card mostra countdown e barra | E2E manual | Verificação visual no browser | — |
| CONTR-03 | Formulário mostra valor da unidade | E2E manual | Verificação visual no browser | — |
| CONTR-04 | Cancelar muda status (não deleta) | E2E manual | Verificação visual no browser | — |
| CONTR-05 | Toggle abre arquivo de encerrados | E2E manual | Verificação visual no browser | — |
| PARC-01 | Grade-resumo e resumo financeiro corretos | E2E manual | Verificação visual no browser | — |
| PARC-02 | Timeline substituiu tabela | E2E manual | Verificação visual no browser | — |
| PARC-03 | Registrar pagamento atualiza resumo ao vivo | E2E manual | Verificação visual no browser | — |
| PARC-04 | renovarContrato insere parcelas sem sobrescrever pagas | E2E manual | Verificar no Supabase Dashboard | — |

**Nota:** O projeto usa Playwright para E2E mas os testes desta fase são primariamente de verificação visual e comportamento de estado — adequados para checklist manual no browser. O requisito crítico testável programaticamente é a SA `renovarContrato` (verificar que parcelas pagas não são alteradas e novas parcelas têm `status='futura'` com `numero` sequencial correto).

---

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Aplica | Controle Padrão |
|---------------|--------|-----------------|
| V2 Authentication | sim | `authGuard()` local em cada SA |
| V4 Access Control | sim | Cadeia de propriedade 4 níveis (parcela→contrato→unidade→edificio→proprietario_id) |
| V5 Input Validation | sim | `UUID_RE` para IDs; `Number.isInteger(meses)` + range 1-36 para renovação |
| V6 Cryptography | não | Sem operações criptográficas |

### Threat Patterns Conhecidos para este Stack

| Pattern | STRIDE | Mitigação Padrão |
|---------|--------|-----------------|
| IDOR em renovarContrato (outro usuário renova contrato alheio) | Tampering | Cadeia de propriedade: `contratos.unidade_id → unidades.edificio_id → edificios.proprietario_id = user.id` |
| Injeção via `meses` (NaN, -1, 999) | Tampering | Validar `Number.isInteger(meses) && meses >= 1 && meses <= 36` antes de qualquer query |
| INSERT de parcelas sem autenticação | Elevation of Privilege | `authGuard()` + `isProprietario()` antes de qualquer operação |

---

## Project Constraints (from CLAUDE.md)

| Diretiva | Impacto nesta fase |
|----------|-------------------|
| Next.js 16 — App Router — `'use client'` obrigatório em componentes com hooks | Contratos.js e Parcelas.js já têm `'use client'`; manter |
| `middleware.js` renomeado para `proxy.js` | Não relevante para esta fase |
| Queries Supabase centralizadas em `queries-client.js` (browser) | `getContratos` e `getParcelasByContrato` já lá; não mover inline |
| Form state: objeto único, não `useState` por campo | Modal de renovação deve usar `const [renew, setRenew] = useState({ meses: 0, custom: '' })` |
| Server Actions em `src/actions/` — retornam `{ status: 200 }` ou `{ status: 5xx, erroMessage }` | `renovarContrato` deve seguir exatamente este padrão |
| `erroMessage` (não `errorMessage`) | Nome do campo de erro na SA |
| `authGuard()` local declarado em cada arquivo de actions | Redeclarar em contratos.js (já existe lá) |
| `UUID_RE` redeclarado por arquivo de action | Já em contratos.js:9; usar o existente |
| `supabaseAdmin` — server-only, nunca importar em client components | Apenas a SA importa supabaseAdmin |
| Commits via extensão vivaxy.vscode-conventional-commits | Não relevante para o planner |
| Nunca commitar em `main` — sempre em branch | Branch atual `gsd/phase-21-...` — planner deve verificar/criar branch |

---

## Sources

### Primary (HIGH confidence)
- `src/components/features/Contratos.js` — código atual completo, lido diretamente [VERIFIED]
- `src/components/features/Parcelas.js` — código atual completo, lido diretamente [VERIFIED]
- `src/actions/contratos.js` — todas as SAs existentes, padrões de authGuard e cadeia [VERIFIED]
- `src/actions/parcelas.js` — `marcarParcelaComoPaga`, modelo para `renovarContrato` [VERIFIED]
- `src/lib/queries-client.js` — `getContratos`, `getParcelasByContrato` [VERIFIED]
- `src/app/globals.css` — todos os tokens, classes utilitárias, animações [VERIFIED]
- `.planning/design/js/console3.jsx` — design de referência completo [VERIFIED]
- `.planning/design/styles/app.css` — tokens de densidade `--rd-*` e escala `--rt-*` [VERIFIED]
- `.planning/phases/22-contratos-parcelas-renova-o/22-CONTEXT.md` — decisões D-01 a D-16 [VERIFIED]

### Secondary (MEDIUM confidence)
- `.planning/REQUIREMENTS.md` — CONTR-01 a PARC-04 com descrições completas [VERIFIED]
- `.planning/design/README.md` — variante B escolhida, lista de features [VERIFIED]

---

## Metadata

**Confidence breakdown:**
- Standard Stack: HIGH — todos os componentes e tokens verificados por leitura direta dos arquivos
- Architecture: HIGH — padrões de SA estabelecidos no codebase; sem ambiguidade
- Pitfalls: HIGH — baseados no código real e nas decisões do CONTEXT.md
- Lógica de datas (renovarContrato): MEDIUM — padrão bem documentado no CONTEXT.md D-16, mas comportamento de loops com `setMonth` tem edge cases (meses com menos dias)

**Research date:** 2026-06-16
**Valid until:** 2026-07-16 (stack estável; sem dependências externas voláteis)
