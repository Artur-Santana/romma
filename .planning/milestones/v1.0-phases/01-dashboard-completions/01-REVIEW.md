---
phase: 01
status: findings
critical_count: 3
warning_count: 3
info_count: 2
files_reviewed:
  - e2e/dashboard.spec.js
  - src/app/dashboard/page.js
  - src/components/features/Contratos.js
  - src/components/features/LocatariosDesktop.js
  - src/components/features/Parcelas.js
  - src/components/features/Unidades.js
  - src/components/ui/ConfirmDialog.js
  - src/components/ui/MobileNav.js
  - src/components/ui/OwnerSidebar.js
  - src/components/ui/PageHeader.js
  - src/components/ui/RealtimeDot.js
  - src/components/ui/TopStrip.js
  - src/components/ui/button.jsx
  - src/components/ui/input.jsx
  - src/components/ui/select.jsx
---

# Phase 01: Code Review Report

**Depth:** standard
**Files Reviewed:** 15
**Status:** findings

---

## Critical

### CR-01: `locatario_id` ausente na query `getContratos()` — contagem de contratos por locatário sempre zero

**File:** `src/lib/queries-server.js:24` e `src/lib/queries-client.js:21`

**Issue:** Ambas as versões de `getContratos()` fazem `.select(...)` sem incluir `locatario_id` na lista de colunas. A query retorna apenas `unidade_id` como coluna escalar; `locatarios(nome_razao_social)` e `unidades(nome)` são joins embutidos, não a coluna FK.

Consequência direta em `LocatariosDesktop.js:93`:
```js
const cs = contratos.filter(c => c.locatario_id === l.id)
```
Como `contrato.locatario_id` é sempre `undefined`, `cs` é sempre `[]` para todos os locatários. A coluna "Contratos" na tabela de Locatários exibe "0/0" para todo mundo, independente da realidade.

Consequência secundária em `Contratos.js:281-283` e nas funções `askCancelar`/`askEncerrar`: o fallback `?? contrato.locatarios` resgata o nome do join embutido para a exibição, mas `locatarios.find(l => l.id === contrato.locatario_id)` nos diálogos de confirmação (linhas 83, 95) retorna `undefined`, então o nome do locatário aparece como "—" nesses diálogos.

**Fix:** Adicionar `locatario_id` ao select em ambos os arquivos:

```js
// queries-server.js:24 e queries-client.js:21
.select('id, data_inicio, data_fim, status, observacoes, unidade_id, locatario_id, locatarios(nome_razao_social), unidades(nome)')
```

---

### CR-02: Métrica "Receita Esperada" (`totalPendente`) inflada por múltiplas parcelas do mesmo contrato

**File:** `src/app/dashboard/page.js:56-60`

**Issue:** O cálculo soma `valor_mensal` da unidade para cada parcela em aberto (`pendente` ou `vencida`) de um mesmo contrato. Se um contrato tem 3 parcelas pendentes, `valor_mensal` é somado 3 vezes. O valor exibido no tile "Receita Esperada" (e no mobile) é uma múltipla do valor real e aumenta exponencialmente conforme acumulam parcelas em atraso.

```js
// Errado: conta valor por parcela, não por contrato
const totalPendente = parcelas.reduce((s, p) => {
  const contrato = contratos.find(c => c.id === p.contrato_id)
  const unidade  = unidades.find(u => u.id === contrato?.unidade_id)
  return s + (unidade?.valor_mensal ?? 0)
}, 0)
```

A "Receita Esperada" deveria ser: soma dos `valor_mensal` dos contratos ativos com parcelas em aberto — contando cada contrato uma vez — ou simplesmente a soma dos valores individuais de cada parcela pendente (o que exigiria armazenar `valor` na tabela `parcelas`, que o schema atual não tem).

**Fix:** Deduplica contratos antes de somar:

```js
const contratosComParcelas = [...new Set(parcelas.map(p => p.contrato_id))]
const totalPendente = contratosComParcelas.reduce((s, contratoId) => {
  const contrato = contratos.find(c => c.id === contratoId)
  const unidade  = unidades.find(u => u.id === contrato?.unidade_id)
  return s + (unidade?.valor_mensal ?? 0)
}, 0)
```

---

### CR-03: `key={item.id}` em `MobileBottomNav` — `item.id` é sempre `undefined`

**File:** `src/components/ui/MobileNav.js:51`

**Issue:** O componente itera `items` com `key={item.id}`, mas os objetos `navItems` em `page.js:70-75` não têm campo `id`:

```js
// page.js — nenhum campo "id"
const navItems = [
  { href: "/dashboard",            label: "Visão",      code: "DASH"   },
  { href: "/dashboard/unidades",   label: "Unidades",   code: "U.LIST" },
  ...
]
```

Resultado: todos os itens têm `key={undefined}`. React trata `undefined` como chave ausente e emite aviso de "Each child in a list should have a unique 'key' prop". Mais grave: itens com chaves idênticas fazem o React reutilizar o mesmo nó de DOM entre itens distintos durante reconciliação, causando potencial mistura de estado visual (classes ativas trocadas) quando o pathname muda.

**Fix:** Usar `item.href` como key, que é único e já existe nos dados:

```js
// MobileNav.js:51
<Link
  key={item.href}   // era: key={item.id}
  href={item.href}
  ...
```

---

## Warning

### WR-01: `Unidades.js` — `carregarDados()` swallows erros silenciosamente

**File:** `src/components/features/Unidades.js:38-41` e `src/components/features/Unidades.js:85-87`

**Issue:** A função `carregarDados()` chama `getEdificios()` e `getUnidades()` sem bloco try/catch nem verificação de erro. Se o Supabase retornar erro (RLS, timeout, rede), as funções retornam `null`/`undefined` e `setListaEdificios`/`setUnidades` recebem `null` diretamente — o estado fica `null`, não `[]`. Qualquer render que chame `.filter`, `.map` ou `.length` sobre `null` lançará `TypeError`. Não há estado `erro` exibido ao usuário.

Por contraste, `Contratos.js` usa `?? []` após cada set e `Parcelas.js` captura `erroMessage`.

**Fix:**

```js
async function carregarDados() {
  try {
    const [edificios, unidades] = await Promise.all([getEdificios(), getUnidades()])
    setListaEdificios(edificios ?? [])
    setUnidades(unidades ?? [])
  } catch (e) {
    setErro(e.message ?? "Erro ao carregar dados.")
  }
}
```

---

### WR-02: `Contratos.js` — botão "Ver Arquivo →" sem ação

**File:** `src/components/features/Contratos.js:372-378`

**Issue:** O botão "Ver Arquivo →" não tem `href`, não tem `onClick`, e não navega para nenhum destino. Um `<Button variant="ghost">` renderizado assim é um `<button>` sem handler — clicável, mas sem efeito. Em contexto de TCC com banca ao vivo, um botão inerte é um defeito visível.

```js
<Button
  variant="ghost"
  className="font-mono font-bold text-[10px] tracking-[1.4px] text-fg-2 uppercase p-0 h-auto"
>
  Ver Arquivo →
</Button>
```

**Fix:** Ou remover o botão até que a feature exista, ou adicionar um link para contratos filtrados por status encerrado:

```js
<Button
  variant="ghost"
  onClick={() => {/* filtrar por encerrado/cancelado */}}
  ...
>
  Ver Arquivo →
</Button>
```

---

### WR-03: `LocatariosDesktop.js` — `contratos` prop pode ser `undefined` sem default

**File:** `src/components/features/LocatariosDesktop.js:28` e `:93`

**Issue:** O parâmetro `contratos` não tem valor padrão na destructuring. Se o componente pai passar `contratos={undefined}` (por erro ou falha de fetch), a linha `contratos.filter(...)` lança `TypeError: Cannot read properties of undefined (reading 'filter')`. O prop `initialLocatarios` tem `?? []` no `useState`, mas `contratos` é usado diretamente sem guarda.

**Fix:**

```js
export default function LocatariosDesktop({ initialLocatarios, contratos = [] }) {
```

---

## Info

### IN-01: `RealtimeDot.js` não tem `"use client"` mas usa animação CSS dependente de browser

**File:** `src/components/ui/RealtimeDot.js:1`

**Issue:** O componente não declara `"use client"`. Em Next.js App Router, Server Components são renderizados no servidor. A animação `rommaPulse` é definida como CSS global e funciona sem JS — portanto não quebra. Porém `RealtimeDot` é importado tanto em `dashboard/page.js` (Server Component) quanto potencialmente em contextos client. Sem `"use client"`, qualquer adição futura de hooks ou event handlers quebrará sem explicação clara.

**Fix:** Declarar `"use client"` por precaução para explicitar a intenção, ou documentar que o componente é intencionalmente server-renderable.

---

### IN-02: `e2e/dashboard.spec.js` — seletor de tile por índice numérico visível é frágil

**File:** `e2e/dashboard.spec.js:37`

**Issue:** O seletor `desktopSection.locator('text=02').first().locator('..').locator('..')` localiza o tile pelo texto "02" e sobe dois níveis de DOM. Se o layout do tile mudar (adicionar um wrapper, mudar a hierarquia), ou se "02" aparecer em outro contexto textual, o seletor aponta para o elemento errado silenciosamente. Não é uma falha atual, mas é um teste frágil que pode dar falso positivo.

**Fix:** Adicionar `data-testid="tile-mrr"` ao tile MRR no JSX e usar `page.locator('[data-testid="tile-mrr"]')` no teste, conforme padrão já adotado para `data-testid="expiry-banner"` no DASH-03.

---

_Reviewed: 2026-05-22_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
