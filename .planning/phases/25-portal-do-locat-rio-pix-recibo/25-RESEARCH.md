# Phase 25: Portal do Locatário — PIX & Recibo - Research

**Researched:** 2026-06-17
**Domain:** Next.js 16 App Router — Server Actions, jsPDF client-side PDF, static asset QR, Vitest unit tests
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

- **D-01:** QR estático único — um asset de imagem fixo bundlado no app + uma string de código copia-e-cola constante. Não há geração de BR Code nem QR por-proprietário.
- **D-02:** Nova Server Action dedicada ao Locatário em `src/actions/parcelas.js`, separada de `marcarParcelaComoPaga`. Cadeia: parcela → contrato → locatário → `usuario_id` = usuário autenticado. Cross-tenant → 404.
- **D-03:** Guard escrito test-first (Vitest). Casos: dono legítimo paga (200), parcela de outro locatário (404), inexistente (404), não autenticado (401), já paga/não-pagável (no-op via `.in('status', ['pendente','vencida'])`).
- **D-04:** Update define `status='paga'` + `data_pagamento` (hoje) na mesma tabela `parcelas`.
- **D-05:** Sem migração de schema. `forma_pix` = constante `"PIX"`. `codigo_autenticacao` derivado deterministicamente de `parcela.id` (+ `data_pagamento`), mesmo formato que o parcela gera no recibo sempre igual.
- **D-06:** jsPDF via `await import('jspdf')` dentro do handler de clique (client-side only). Já adicionado ao `package.json` como dependência pelo processo de pesquisa (v4.2.1).
- **D-07:** Sync refresh-based. Sem realtime novo. Limitação conhecida de RLS em UPDATE documentada em CLAUDE.md.
- **D-08:** Buscar TODAS as parcelas (incluindo `futura`) para progresso. Destaque = parcela não-paga mais próxima (`pendente`/`vencida`; `futura` com `data_fechamento <= hoje` também elegível se pg_cron não rodou ainda, mas na prática `pendente` já cobre). "Pagar Agora" só para `pendente`/`vencida`.

### Claude's Discretion

- Estilo/layout exato do destaque, do modal PIX e do recibo PDF → definido em `/gsd-ui-phase 25`.
- Naming exato da nova Server Action e da função de derivação do código de autenticação.

### Deferred Ideas (OUT OF SCOPE)

- **PORT-F1:** Processamento real de pagamento PIX (gateway).
- **PIX-F1:** Geração de QR Code PIX real (BR Code).
- **Dream D3:** QR Code de acesso.
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| PORT-04 | Portal exibe próximo vencimento em destaque (valor, parcela X/N, dias restantes) + progresso do contrato (pagas/total, % adimplente) + grade-resumo + histórico de parcelas | D-08: nova query `getTodasParcelasPortal` sem `.neq('status','futura')`; cálculo client-side de pagas/total + dias restantes |
| PORT-05 | "Pagar Agora" abre modal PIX com QR estático, copia-e-cola, nota de demo; confirmar marca como paga | D-01 QR em `public/`; `navigator.clipboard.writeText`; chamada à nova Server Action |
| PORT-06 | Baixa reflete no painel do Proprietário via persistência em `parcelas`; guard de propriedade parcela→contrato→locatário→usuário; cross-tenant 404 | D-02/D-03/D-04: nova action `confirmarPagamentoLocatario`, guard 3-hop, test-first Vitest |
| PORT-07 | Parcelas pagas têm "Baixar comprovante" gerando PDF no browser (valor, parcela, locatário, unidade, datas, forma PIX, código de autenticação) | D-06 jsPDF v4.2.1 via import dinâmico; D-05 código derivado de parcela.id |
</phase_requirements>

---

## Summary

A fase adiciona o primeiro caminho de escrita do Locatário. Todas as mudanças são incrementais sobre código existente: o portal já carrega locatário → contrato → parcelas no `PortalDashboard.js`; só precisamos (1) buscar todas as parcelas em vez das não-futuras, (2) adicionar uma Server Action com guard de propriedade no lado do Locatário, (3) abrir um modal PIX com asset estático, e (4) gerar um PDF client-side com jsPDF via import dinâmico.

O padrão de guard test-first está completamente definido pelo arquivo `test/unit/actions/parcelas.test.js` + `test/helpers/supabaseMock.js` já existentes — a nova action espelha `marcarParcelaComoPaga` mas troca a cadeia de 4 hops (parcela → contrato → unidade → edificio com `proprietario_id`) por uma cadeia de 3 hops (parcela → contrato → locatário com `usuario_id`). O mock helper `supabaseMock.js` já suporta `mockAdmin.single.mockResolvedValueOnce` em sequência — padrão usado nos helpers `setupOwnerSingles4()` — e apenas precisa de extensão mínima para o novo helper `setupOwnerSingles3()`.

O único risco técnico real é o import dinâmico do jsPDF: o pacote expõe um export `{ jsPDF }` via named export no build ES, mas `await import('jspdf')` em Next.js App Router dentro de um `'use client'` retorna o módulo com `.jsPDF` ou `.default` dependendo do bundler. Isso precisa ser tratado com `const { jsPDF: JsPDF } = await import('jspdf')`.

**Primary recommendation:** Implementar nesta ordem: (1) test-first guard da nova action, (2) nova query `getTodasParcelasPortal`, (3) extensão do `PortalDashboard` com destaque + progresso, (4) modal PIX com QR estático, (5) PDF com jsPDF dinâmico.

---

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Destaque próximo vencimento + progresso | Browser / Client | — | Cálculo sobre dados já carregados; sem nova lógica server-side |
| Buscar todas as parcelas (incl. futura) | API / Backend (RLS anon) | — | `queries-client.js` via supabase-browser; locatário autenticado só vê seu contrato via RLS |
| Confirmar pagamento (nova action) | API / Backend (supabaseAdmin) | — | Escrita bypass RLS, guard manual parcela→contrato→locatário→usuario_id |
| Modal PIX + copia-e-cola | Browser / Client | — | UI pura; QR é asset estático em `public/` |
| Geração de PDF (jsPDF) | Browser / Client | — | Client-side only via import dinâmico para evitar crash SSR |
| Sync para painel do Proprietário | Database / Storage | — | Refresh-based; mesma linha em `parcelas`; sem camada extra |

---

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| jsPDF | 4.2.1 [VERIFIED: npm registry] | PDF client-side no browser | Decidido em D-06; já instalado |
| Vitest | 4.1.8 [VERIFIED: package.json] | Testes unitários das Server Actions | Stack de teste existente do projeto |
| supabaseAdmin | @supabase/supabase-js ^2.99.2 | Escrita bypass RLS na action do Locatário | Padrão de mutations do projeto |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| navigator.clipboard API | browser native | Copiar código PIX para clipboard | No handler do botão "Copiar código" dentro de `'use client'` |
| sonner (toast) | ^2.0.7 | Feedback após pagamento confirmado | Já usado em `Parcelas.js`, `LocatariosDesktop.js` — trazer para o portal |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| jsPDF | @react-pdf/renderer | React-PDF tem DX melhor mas é mais pesado e requer mais setup; jsPDF decidido em D-06 |
| navigator.clipboard | document.execCommand | execCommand obsoleto; clipboard API é padrão — com fallback para contextos sem HTTPS se necessário |

**Installation:**
jsPDF já instalado via `slopcheck install jspdf` durante a pesquisa e adicionado a `package.json` como `"jspdf": "^4.2.1"`.

**Version verification:** `npm view jspdf version` → `4.2.1` (publicado 2026-03-17). [VERIFIED: npm registry]

---

## Package Legitimacy Audit

| Package | Registry | Age | Downloads | Source Repo | slopcheck | Disposition |
|---------|----------|-----|-----------|-------------|-----------|-------------|
| jspdf | npm | ~12 anos | Alto (biblioteca estabelecida) | github.com/parallax/jsPDF | [OK] | Approved |

**Packages removed due to slopcheck [SLOP] verdict:** none
**Packages flagged as suspicious [SUS]:** none

---

## Architecture Patterns

### System Architecture Diagram

```
PortalDashboard.js (Client Component)
  │
  ├── useEffect → getLocatarioByUserId() → supabase-browser (RLS)
  ├── useEffect → getContratoAtivoByLocatario() → supabase-browser (RLS)
  ├── useEffect → getTodasParcelasPortal() → supabase-browser (RLS) [NOVO — sem .neq futura]
  │
  ├── VencimentoDestaque (novo) — derivado do state parcelas
  │     └── "Pagar Agora" → abre PixModal
  │
  ├── PixModal (novo) — state local: open/parcela/copiado
  │     ├── <img src="/pix-qr.png"> (asset estático em public/)
  │     ├── Botão copiar → navigator.clipboard.writeText(PIX_CODE_CONST)
  │     └── Confirmar → confirmarPagamentoLocatario(parcela.id)
  │           └── Server Action (src/actions/parcelas.js)
  │                 ├── authGuard() → supabase-server.auth.getUser()
  │                 ├── hop 1: supabaseAdmin parcelas → contrato_id
  │                 ├── hop 2: supabaseAdmin contratos → locatario_id
  │                 ├── hop 3: supabaseAdmin locatarios → usuario_id === user.id
  │                 └── update parcelas SET status=paga, data_pagamento=hoje
  │                       WHERE id=? AND status IN (pendente, vencida)
  │
  ├── ContratoCard (estender) — adicionar grade-resumo completo
  │
  └── ParcelsTable (estender) — adicionar coluna "Ação" com:
        ├── "Pagar Agora" (pendente/vencida)
        └── "Baixar comprovante" (paga) → handleBaixarRecibo(parcela)
              └── await import('jspdf') → { jsPDF }
                    → new jsPDF() → doc.text(...) → doc.save(...)
```

### Recommended Project Structure

Sem pastas novas — tudo se encaixa na estrutura existente:

```
src/
├── actions/
│   └── parcelas.js              # adicionar confirmarPagamentoLocatario (nova export)
├── components/features/portal/
│   ├── PortalDashboard.js       # estender estado + getTodasParcelasPortal
│   ├── ContratoCard.js          # estender com progresso + grade-resumo
│   ├── ParcelsTable.js          # estender com coluna de ações
│   └── PixModal.js              # NOVO — modal PIX + QR + copiar + confirmar
├── lib/
│   └── queries-client.js        # adicionar getTodasParcelasPortal
public/
│   └── pix-qr.png               # NOVO — QR estático único
test/unit/actions/
│   └── parcelas.test.js         # estender com casos confirmarPagamentoLocatario
```

### Pattern 1: Guard 3-hop do Locatário (espelho do 4-hop do Proprietário)

**What:** Cadeia de ownership: parcela → contrato → locatário, verificando `locatario.usuario_id === user.id`.
**When to use:** Toda action do Locatário que escreve em registros vinculados ao seu contrato.

```javascript
// Source: espelho direto de src/actions/parcelas.js marcarParcelaComoPaga
// com cadeia invertida para o lado do Locatário

'use server'

import supabaseAdmin from '@/lib/supabaseAdmin'
import { createServer } from '@/lib/supabase-server'

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

async function authGuardLocatario() {
  const supabase = await createServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { err: { status: 401, erroMessage: 'Não autenticado.' } }
  return { user }
}

export async function confirmarPagamentoLocatario(id) {
  const { err, user } = await authGuardLocatario()
  if (err) return err

  if (!UUID_RE.test(id)) return { status: 400, erroMessage: 'ID inválido.' }

  // Hop 1 — parcela existe?
  const { data: parcela, error: e1 } = await supabaseAdmin
    .from('parcelas').select('contrato_id').eq('id', id).single()
  if (e1 || !parcela) return { status: 404, erroMessage: 'Parcela não encontrada.' }

  // Hop 2 — contrato existe?
  const { data: contrato, error: e2 } = await supabaseAdmin
    .from('contratos').select('locatario_id').eq('id', parcela.contrato_id).single()
  if (e2 || !contrato) return { status: 404, erroMessage: 'Parcela não encontrada.' }

  // Hop 3 — locatário pertence ao usuário autenticado?
  const { data: locatario, error: e3 } = await supabaseAdmin
    .from('locatarios').select('usuario_id').eq('id', contrato.locatario_id).single()
  if (e3 || !locatario || locatario.usuario_id !== user.id)
    return { status: 404, erroMessage: 'Parcela não encontrada.' }

  const { error } = await supabaseAdmin
    .from('parcelas')
    .update({ status: 'paga', data_pagamento: new Date().toISOString().split('T')[0] })
    .eq('id', id)
    .in('status', ['pendente', 'vencida'])
  if (error) return { status: 500, erroMessage: error.message }
  return { status: 200 }
}
```

**Key difference from Proprietário guard:** O guard do Proprietário vai até `edificios` e filtra por `proprietario_id`. O guard do Locatário para em `locatarios` e compara `usuario_id === user.id`. Cross-tenant retorna 404 (não 403) — mascaramento padrão do projeto.

### Pattern 2: Import Dinâmico do jsPDF em Client Component

**What:** Evitar crash SSR ao importar jsPDF, que acessa `window`/`document` na inicialização.
**When to use:** Qualquer biblioteca browser-only em componente `'use client'` no App Router.

```javascript
// Source: [ASSUMED] — padrão de import dinâmico para libs browser-only em Next.js App Router
// Verificado via inspecção do package.json do jsPDF (exports.node vs exports.browser)

async function handleBaixarRecibo(parcela, contrato, locatario) {
  const { jsPDF } = await import('jspdf')
  const doc = new jsPDF()

  // Campos do recibo (PORT-07): valor, parcela X/N, locatário, unidade, datas, forma PIX, código auth
  const codigoAuth = gerarCodigoAuth(parcela.id, parcela.data_pagamento)

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(16)
  doc.text('COMPROVANTE DE PAGAMENTO', 105, 20, { align: 'center' })

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(11)
  doc.text(`Locatário: ${locatario.nome_razao_social}`, 20, 40)
  doc.text(`Unidade: ${contrato.unidades?.nome ?? '—'}`, 20, 50)
  doc.text(`Parcela: ${parcela.numero} / ${totalParcelas}`, 20, 60)
  doc.text(`Valor: ${fmtBRL(contrato.unidades?.valor_mensal)}`, 20, 70)
  doc.text(`Vencimento: ${fmtData(parcela.data_vencimento)}`, 20, 80)
  doc.text(`Pagamento: ${fmtData(parcela.data_pagamento)}`, 20, 90)
  doc.text(`Forma: PIX`, 20, 100)
  doc.text(`Código de autenticação: ${codigoAuth}`, 20, 110)

  doc.save(`recibo-parcela-${parcela.numero}.pdf`)
}
```

**Nota sobre named exports:** O build ES do jsPDF v4 exporta `{ jsPDF }` como named export. O destructuring `const { jsPDF } = await import('jspdf')` é correto. Não usar `import('jspdf').default` — o default export não está documentado nesta versão.

### Pattern 3: Derivação Determinística do Código de Autenticação

**What:** Hash curto uppercase derivado de `parcela.id` + `data_pagamento`, sem coluna nova.
**When to use:** Geração do recibo PDF (D-05).

```javascript
// Source: [ASSUMED] — padrão de hash deterministico client-side sem dependência nova
function gerarCodigoAuth(parcelaId, dataPagamento) {
  // Combina id e data para tornar o código único por data de pagamento
  const raw = `${parcelaId}-${dataPagamento ?? ''}`
  // Soma simples dos char codes como hash leve (sem crypto dependency)
  let h = 0
  for (let i = 0; i < raw.length; i++) {
    h = ((h << 5) - h + raw.charCodeAt(i)) >>> 0
  }
  // Retorna 8 caracteres uppercase alfanuméricos (ex: "A3F2B1C9")
  return h.toString(36).toUpperCase().padStart(8, '0').slice(-8)
}
```

**Alternativa mais robusta** (se o simples parecer fraco para a banca): `btoa(parcelaId.slice(0,8) + (dataPagamento ?? '')).replace(/[^A-Z0-9]/gi,'').toUpperCase().slice(0,8)` — sem dependência, determinístico, legível. A escolha exata fica em "Claude's Discretion".

### Pattern 4: Query com Todas as Parcelas (D-08)

**What:** Variante de `getParcelasPortal` sem `.neq('status', 'futura')`.
**When to use:** Para contadores de progresso (pagas/total) e cálculo do destaque.

```javascript
// Source: [VERIFIED: codebase] — extensão de src/lib/queries-client.js linha 141
export async function getTodasParcelasPortal(contratoId) {
  const { data, error } = await supabase
    .from('parcelas')
    .select('id, numero, data_vencimento, data_fechamento, data_pagamento, status')
    .eq('contrato_id', contratoId)
    .order('data_vencimento', { ascending: true })  // asc para encontrar próximo facilmente
  if (error) throw new Error(error.message)
  return data ?? []
}
```

**Nota:** Incluir `data_fechamento` para o comprovante PDF (PORT-07 lista "datas") e para saber se parcela futura já fechou.

### Pattern 5: Cálculo de Destaque e Progresso (client-side)

```javascript
// Source: [ASSUMED] — lógica de date math pura, sem library
function calcularProgresso(parcelas) {
  const total = parcelas.length
  const pagas = parcelas.filter(p => p.status === 'paga').length
  const pct = total > 0 ? Math.round((pagas / total) * 100) : 0

  // Próximo vencimento = parcela não-paga com menor data_vencimento (pendente/vencida)
  // Futura também elegível caso pg_cron não tenha rodado, mas "Pagar Agora" só para pendente/vencida
  const pagaveis = parcelas.filter(p => ['pendente', 'vencida'].includes(p.status))
  const proximaPagavel = pagaveis.sort(
    (a, b) => new Date(a.data_vencimento) - new Date(b.data_vencimento)
  )[0] ?? null

  // Dias restantes até vencimento (negativo = vencida)
  const diasRestantes = proximaPagavel
    ? Math.ceil((new Date(proximaPagavel.data_vencimento) - new Date()) / 86400000)
    : null

  return { total, pagas, pct, proximaPagavel, diasRestantes }
}
```

### Anti-Patterns to Avoid

- **Importar jsPDF no topo do arquivo:** `import { jsPDF } from 'jspdf'` em qualquer arquivo processado pelo SSR do Next.js vai crashar em Vercel — jsPDF acessa `window` na inicialização. Sempre usar `await import('jspdf')` dentro do handler de clique.
- **Importar supabaseAdmin em Client Components:** O arquivo tem `import 'server-only'` que lança em componentes client. A action do Locatário fica exclusivamente em `src/actions/parcelas.js`.
- **Usar `getSession()` para validação server-side:** `CONCERNS.md` item 7 documenta que `getSession()` lê do storage não verificado. Usar `supabase.auth.getUser()` no `authGuardLocatario`.
- **Passar `locatario_id` como argumento da action:** O `locatario_id` deve ser derivado server-side via a cadeia de ownership — nunca confiar no valor enviado pelo cliente (previne IDOR).
- **Retornar 403 para cross-tenant:** O projeto usa 404 como mascaramento — não revela que o recurso existe mas não pertence ao usuário.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| PDF gerado no browser | HTML→canvas→print | jsPDF v4.2.1 | Já decidido em D-06; handles layout, fontes, save para download |
| Cópia para clipboard | execCommand | navigator.clipboard.writeText() | API moderna, sem flash de seleção; HTTPS já garantido na Vercel |
| Hash deterministico de string | crypto library | Djb2 inline (ver Pattern 3) | Não precisa de criptografia real — apenas identificador reproduzível |

**Key insight:** jsPDF produz PDF válido com 5–10 linhas de código. Qualquer solução custom vai replicar o trabalho de serialização PDF já feito na lib.

---

## Common Pitfalls

### Pitfall 1: `await import('jspdf')` retorna módulo sem `.jsPDF` no bundle de produção

**What goes wrong:** Em desenvolvimento o import dinâmico funciona; em produção (Vercel, bundler otimizado) o export pode ser wrapped diferente.
**Why it happens:** jsPDF v4 exporta como named ES module. O Next.js pode gerar um módulo com `{ default: { jsPDF } }` ou `{ jsPDF }` dependendo de como o tree-shaking processa o pacote.
**How to avoid:** Usar defensive destructuring:
```javascript
const mod = await import('jspdf')
const JsPDF = mod.jsPDF ?? mod.default?.jsPDF ?? mod.default
const doc = new JsPDF()
```
**Warning signs:** `TypeError: JsPDF is not a constructor` em produção mas não em dev.

### Pitfall 2: `supabaseMock.js` não tem `neq` nem `maybeSingle` no builder

**What goes wrong:** O helper de test `supabaseMock.js` expõe `from, select, insert, update, delete, eq, in, single` — mas a nova query `getTodasParcelasPortal` não usa `neq`, então isso não afeta diretamente os testes da action. Porém se os testes precisarem mockar `maybeSingle`, o builder precisa de extensão.
**Why it happens:** O builder foi criado para cobrir apenas os métodos usados até agora.
**How to avoid:** A action `confirmarPagamentoLocatario` usa apenas `.single()` na cadeia — o builder existente é suficiente para os testes da action. Para o Wave 0 (testes da action), o mock atual basta.

### Pitfall 3: `getContratoAtivoByLocatario` não seleciona `locatario_id` nem dados do locatário

**What goes wrong:** O select atual é `'id, data_inicio, data_fim, status, observacoes, unidades(nome, valor_mensal)'` — não inclui `locatario_id`. O recibo PDF (PORT-07) precisa do nome do locatário. `PortalDashboard.js` já tem `locatario` no state — usar isso em vez de estender a query do contrato.
**Why it happens:** O contrato foi modelado para exibição, não para geração de documentos.
**How to avoid:** Passar `locatario` (já no state do `PortalDashboard`) como prop para o componente que gera o PDF. Não duplicar a query.

### Pitfall 4: pg_cron e status `futura` stale

**What goes wrong:** pg_cron roda às 06:00/06:05 UTC. Uma parcela com `data_fechamento <= hoje` pode ainda estar com status `futura` se o cron ainda não rodou hoje. O destaque calculado client-side deve filtrar por `['pendente', 'vencida']` para "Pagar Agora" — não por `futura`.
**Why it happens:** Latência de até ~24h na transição automática de status (documentado em ARCHITECTURE.md).
**How to avoid:** D-08 já define isso corretamente: "Pagar Agora" aparece para parcelas `pendente`/`vencida`. Para o destaque informativo (próximo vencimento em destaque), mostrar a parcela `futura` com menor `data_vencimento` como informação, mas sem o botão "Pagar Agora".

### Pitfall 5: QR em `src/` vs `public/`

**What goes wrong:** Colocar o QR em `src/assets/` e importar com `import qrSrc from './pix-qr.png'` requer configuração de `next.config.js`. Em `public/` é direto via `<img src="/pix-qr.png">`.
**Why it happens:** Next.js 16 App Router tem processamento de assets especial para `src/`.
**How to avoid:** Usar `public/pix-qr.png` com caminho absoluto `/pix-qr.png` no atributo `src` da `<img>`. [VERIFIED: codebase] — o projeto já usa `public/` para todos os assets estáticos (hero-building.png, etc.).

---

## Code Examples

### Guard 3-hop Locatário — estrutura de teste (espelha parcelas.test.js)

```javascript
// Source: [VERIFIED: codebase] — extensão de test/unit/actions/parcelas.test.js

// Helper: 3-hop ownership para confirmarPagamentoLocatario
function setupLocatarioOwnerSingles3(userId) {
  // Hop 1: parcelas → contrato_id
  mockAdmin.single.mockResolvedValueOnce({ data: { contrato_id: 'c-id-1' }, error: null })
  // Hop 2: contratos → locatario_id
  mockAdmin.single.mockResolvedValueOnce({ data: { locatario_id: 'l-id-1' }, error: null })
  // Hop 3: locatarios → usuario_id (matches user)
  mockAdmin.single.mockResolvedValueOnce({ data: { usuario_id: userId }, error: null })
}

function setupLocatarioCrossTenantSingles3(userId) {
  mockAdmin.single.mockResolvedValueOnce({ data: { contrato_id: 'c-id-other' }, error: null })
  mockAdmin.single.mockResolvedValueOnce({ data: { locatario_id: 'l-id-other' }, error: null })
  // usuario_id diferente do user autenticado
  mockAdmin.single.mockResolvedValueOnce({ data: { usuario_id: 'outro-usuario-uuid' }, error: null })
}

describe('confirmarPagamentoLocatario', () => {
  it('happy path — locatário dono, marca como paga (200)', async () => {
    setupLocatarioOwnerSingles3(mockUser.id)
    setupUpdateThenable()
    const result = await confirmarPagamentoLocatario(validId)
    expect(result).toEqual({ status: 200 })
  })

  it('cross-tenant — usuario_id diferente → 404, update não executado', async () => {
    setupLocatarioCrossTenantSingles3(mockUser.id)
    const result = await confirmarPagamentoLocatario(validId)
    expect(result).toEqual({ status: 404, erroMessage: 'Parcela não encontrada.' })
    expect(mockAdmin.update).not.toHaveBeenCalled()
  })

  it('não autenticado → 401', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } })
    const result = await confirmarPagamentoLocatario(validId)
    expect(result.status).toBe(401)
  })

  it('UUID inválido → 400', async () => {
    const result = await confirmarPagamentoLocatario('not-a-uuid')
    expect(result).toEqual({ status: 400, erroMessage: 'ID inválido.' })
  })

  it('parcela inexistente (hop 1 null) → 404', async () => {
    mockAdmin.single.mockResolvedValueOnce({ data: null, error: null })
    const result = await confirmarPagamentoLocatario(validId)
    expect(result).toEqual({ status: 404, erroMessage: 'Parcela não encontrada.' })
  })

  it('parcela já paga — update filtra por .in(status) — retorna 200 sem erro (no-op)', async () => {
    // O update usa .in('status', ['pendente','vencida']) — se parcela já paga, 0 rows afetadas
    // mas não há erro, então action retorna 200. Comportamento correto de no-op.
    setupLocatarioOwnerSingles3(mockUser.id)
    setupUpdateThenable()
    const result = await confirmarPagamentoLocatario(validId)
    expect(result).toEqual({ status: 200 })
    // verificação visual/E2E deve confirmar que UI reflete estado correto após reload
  })
})
```

**Nota importante:** O authGuard do Locatário NÃO chama `isProprietario` — diferente do Proprietário. O mock `mockIsProprietario` não precisa ser configurado para os testes da nova action. O `vi.mock('@/lib/auth')` pode ser omitido ou mantido com mock irrelevante.

### jsPDF — import dinâmico defensivo

```javascript
// Source: [ASSUMED] — defensive import para Next.js App Router
async function handleBaixarRecibo(parcela, locatario, contrato, totalParcelas) {
  try {
    const mod = await import('jspdf')
    const JsPDF = mod.jsPDF ?? mod.default?.jsPDF ?? mod.default
    if (!JsPDF) throw new Error('jsPDF não carregou')
    const doc = new JsPDF()
    // ... adicionar conteúdo ...
    doc.save(`recibo-parcela-${String(parcela.numero).padStart(2,'0')}.pdf`)
  } catch (e) {
    // fallback: mostrar erro inline no portal
    setErro('Não foi possível gerar o comprovante. Tente novamente.')
  }
}
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `middleware.js` Next.js | `proxy.js` (Node runtime) | Next.js 16 | Crítico — CLAUDE.md documenta: nunca criar `middleware.js` |
| `getSession()` para auth server-side | `getUser()` | supabase-js v2 | `getSession` lê local storage sem verificar assinatura |

**Deprecated/outdated:**
- `import('jspdf').then(m => m.default)`: Em v4 o default export não é `jsPDF` diretamente em todos os bundlers — usar defensive destructuring descrito em Pattern 2.

---

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | `await import('jspdf')` em handler de clique em `'use client'` evita crash SSR em produção Vercel | Pitfall 1, Pattern 2 | Baixo — padrão documentado pela comunidade Next.js; jsPDF tem export `node` separado do `browser` |
| A2 | `const { jsPDF } = await import('jspdf')` é a destructuring correta no Next.js 16 | Pattern 2, Code Examples | Médio — mitigado pelo defensive import `mod.jsPDF ?? mod.default?.jsPDF` |
| A3 | Hash Djb2 inline é suficiente como "código de autenticação" para fins de TCC | Pattern 3 | Baixo — é demonstração acadêmica, não precisa ser criptograficamente seguro |
| A4 | `neq` não é necessário no mock builder para os testes da nova action | Pitfall 2 | Baixo — ação usa apenas `.single()` na chain; confirmado via leitura do código |
| A5 | O portal usa Tailwind classes (não inline+CSS vars) | Architecture Patterns | Zero — documentado explicitamente em CONVENTIONS.md ("Inconsistências"), CONTEXT.md e todos os componentes do portal lidos |

---

## Open Questions

1. **Número total de parcelas para "parcela X/N" no destaque e recibo**
   - What we know: `getTodasParcelasPortal` retorna todas as parcelas; `parcelas.length` é o total.
   - What's unclear: Se um contrato for renovado (PARC-04 append de novas parcelas), `parcela.numero` pode não ser contínuo com o total. Mas como Port-07 diz "parcela X/N", usar `parcela.numero` / `parcelas.length` é suficiente para TCC.
   - Recommendation: Usar `parcelas.length` como N e `parcela.numero` como X.

2. **Fallback de clipboard em HTTP (teste local sem HTTPS)**
   - What we know: `navigator.clipboard.writeText` requer contexto seguro (HTTPS ou localhost).
   - What's unclear: Se os testes E2E do Playwright rodam em HTTP localhost, o botão copiar pode falhar.
   - Recommendation: Verificar que os testes E2E do portal rodam via `localhost` (que é contexto seguro para clipboard). Adicionar `try/catch` no handler de clipboard para feedback de erro.

---

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| jsPDF | PORT-07 PDF client-side | ✓ | 4.2.1 | — (já instalado) |
| Vitest | D-03 test-first | ✓ | 4.1.8 | — |
| navigator.clipboard | PORT-05 copia-e-cola | ✓ (HTTPS Vercel / localhost) | browser native | try/catch + feedback de erro |
| Supabase (projeto) | PORT-06 persistência | ✓ | projeto configurado | — |

**Missing dependencies with no fallback:** nenhum.

---

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Vitest 4.1.8 |
| Config file | `vitest.config.mjs` |
| Quick run command | `npm run test:unit` |
| Full suite command | `npm run test:unit` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| PORT-06 | Guard: dono legítimo → 200 | unit | `npm run test:unit -- --reporter=verbose` | ❌ Wave 0 (adicionar ao parcelas.test.js) |
| PORT-06 | Guard: cross-tenant → 404 | unit | `npm run test:unit` | ❌ Wave 0 |
| PORT-06 | Guard: não autenticado → 401 | unit | `npm run test:unit` | ❌ Wave 0 |
| PORT-06 | Guard: UUID inválido → 400 | unit | `npm run test:unit` | ❌ Wave 0 |
| PORT-06 | Guard: parcela inexistente → 404 | unit | `npm run test:unit` | ❌ Wave 0 |
| PORT-04 | Destaque exibe próximo vencimento | E2E (manual/playwright) | `npm run test:e2e` (portal.spec.js estendido) | ❌ Wave 0 |
| PORT-05 | Modal PIX abre, botão copiar funciona | E2E manual | verificação visual | manual-only |
| PORT-07 | Botão "Baixar comprovante" aciona download | E2E manual | verificação visual (download não testável trivialmente em Playwright) | manual-only |

### Sampling Rate

- **Per task commit:** `npm run test:unit`
- **Per wave merge:** `npm run test:unit`
- **Phase gate:** unit suite green antes de `/gsd-verify-work`

### Wave 0 Gaps

- [ ] `test/unit/actions/parcelas.test.js` — estender com `describe('confirmarPagamentoLocatario', ...)` cobrindo os 5 casos de PORT-06 (D-03)
- [ ] O framework e os mocks existentes (`supabaseMock.js`, `server-only-stub.js`) são suficientes — sem instalação nova necessária

---

## Project Constraints (from CLAUDE.md)

| Directive | Impact em Phase 25 |
|-----------|-------------------|
| Nunca criar `middleware.js` | Irrelevante (não há proxy novo) |
| `'use client'` obrigatório para hooks/eventos | `PixModal.js`, `PortalDashboard.js` — todos já são client components |
| `supabaseAdmin` server-only | A nova action usa apenas em `src/actions/parcelas.js` |
| Server Actions retornam `{ status }` / `erroMessage` (não `errorMessage`) | Nova action segue o mesmo padrão |
| `UUID_RE` redeclarado por arquivo | Redeclarar em `parcelas.js` — já está lá |
| Form state: objeto único `useState` | Modal PIX tem estado simples (open/loading) — usar objeto único |
| Portal usa Tailwind (exceção documentada) | Todos os componentes novos do portal usam Tailwind classes |
| git: nunca commitar na `main`, criar branch primeiro | Responsabilidade do executor |
| Terminologia: Locatário (não Inquilino), Parcela (não Pagamento), etc. | Labels do UI e comentários de código |

---

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | sim | `supabase.auth.getUser()` no `authGuardLocatario` |
| V3 Session Management | não | Portal usa sessão gerida pelo Supabase Auth |
| V4 Access Control | sim — crítico | Guard 3-hop server-side via `supabaseAdmin` |
| V5 Input Validation | sim | UUID_RE regex + `.in('status',...)` como whitelist |
| V6 Cryptography | não | Código de autenticação é display-only, não segredo |

### Known Threat Patterns

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| IDOR — locatário tenta pagar parcela de outro | Elevation of Privilege | Guard 3-hop: verificar `locatario.usuario_id === user.id` server-side |
| Forçar parcela paga como "pendente" novamente | Tampering | Action só usa `.in('status', ['pendente','vencida'])` — não há ação de "desmarcar" |
| Enviar `locatario_id` falso pelo cliente | Tampering | ID derivado server-side, nunca aceito como argumento |
| PDF com dados de outro locatário | Information Disclosure | PDF gerado client-side com dados já carregados via RLS (locatário só vê seu contrato) |

---

## Sources

### Primary (HIGH confidence)

- `src/actions/parcelas.js` — template exato do guard 4-hop e padrão de update com `.in(status)` [VERIFIED: codebase]
- `test/unit/actions/parcelas.test.js` + `test/helpers/supabaseMock.js` — estrutura de teste e mock builder [VERIFIED: codebase]
- `src/components/features/portal/PortalDashboard.js`, `ContratoCard.js`, `ParcelsTable.js` — componentes a estender [VERIFIED: codebase]
- `src/lib/queries-client.js` L141–149 — `getParcelasPortal` com `.neq('status','futura')` [VERIFIED: codebase]
- `vitest.config.mjs` — `test/unit/**/*.test.js`, environment `node` [VERIFIED: codebase]
- `package.json` — jsPDF `^4.2.1` adicionado; Vitest `^4.1.8` [VERIFIED: codebase]
- `node_modules/jspdf/types/index.d.ts` — API: `setFont`, `setFontSize`, `text`, `save`, `output` [VERIFIED: npm registry]
- `node_modules/jspdf/package.json` exports — `{ node: jspdf.node.min.js, browser: jspdf.es.min.js, default: jspdf.es.min.js }` [VERIFIED: npm registry]

### Secondary (MEDIUM confidence)

- github.com/parallax/jsPDF README — API básica `new jsPDF()`, `.text()`, `.save()` [CITED: github.com/parallax/jsPDF]
- `npm view jspdf` — versão 4.2.1, publicado 2026-03-17 [VERIFIED: npm registry]
- `slopcheck install jspdf` — resultado `[OK]` [VERIFIED: npm registry]

### Tertiary (LOW confidence)

- Padrão de import dinâmico `await import('jspdf')` em Next.js App Router — inferido do comportamento padrão de import dinâmico do Next.js + análise do `package.json` exports do jsPDF [ASSUMED]

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — jsPDF verificado no registry, instalado e inspecionado; resto é código existente do projeto
- Architecture: HIGH — todo baseado em código existente lido diretamente
- Guard pattern: HIGH — espelho exato do código em `parcelas.js` e `parcelas.test.js`
- jsPDF import dinâmico em produção: MEDIUM — comportamento do bundler Next.js 16 não testado neste ambiente

**Research date:** 2026-06-17
**Valid until:** 2026-07-17 (jsPDF estável; stack Next.js 16 estável no escopo do TCC)
