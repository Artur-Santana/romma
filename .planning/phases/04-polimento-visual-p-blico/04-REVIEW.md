---
phase: 04-polimento-visual-publico
reviewed: 2026-05-27T00:00:00Z
depth: standard
files_reviewed: 10
files_reviewed_list:
  - src/app/globals.css
  - src/app/layout.js
  - src/app/page.js
  - src/app/unidades/page.js
  - src/components/features/LocatariosDesktop.js
  - src/components/features/UnidadeDetailSheet.js
  - src/components/features/UnidadePublicaCard.js
  - src/components/features/Unidades.js
  - src/components/features/UnidadesPublicas.js
  - src/components/ui/UnidadeCard.js
findings:
  critical: 3
  warning: 6
  info: 4
  total: 13
status: issues_found
---

# Fase 4: Relatório de Code Review

**Revisado:** 2026-05-27
**Profundidade:** standard
**Arquivos revisados:** 10
**Status:** issues_found

---

## Resumo

Revisão da Fase 4 — polimento visual das páginas públicas. Os arquivos cobrem: nova página `/unidades` com `UnidadesPublicas` / `UnidadePublicaCard` / `UnidadeDetailSheet`, migração para `next/image` em `page.js`, redesign de `UnidadeCard` e nova feature de edição de locatário em `LocatariosDesktop`.

**Problemas críticos identificados:** vazamento de `valor_mensal` para visitantes não autenticados, um `setTimeout` sem cleanup que causa setState em componente desmontado, e uma auto-referência de variável CSS que pode quebrar a fonte em toda a aplicação. Há também um typo sistemático de Tailwind (`traking` em vez de `tracking`) que suprime letter-spacing em 10 elementos da landing page — direto no coração de uma fase de polimento visual.

---

## Critical Issues

### CR-01: `valor_mensal` exposto a visitantes não autenticados via `getUnidades()`

**Arquivo:** `src/components/features/UnidadesPublicas.js:27`

**Problema:** `UnidadesPublicas` chama `getUnidades()` que seleciona `valor_mensal` incondicionalmente para todas as unidades, independente do campo `valor_visivel`. A UI oculta o valor quando `valor_visivel = false`, mas o dado completo já foi enviado ao browser — qualquer visitante pode inspecionar a resposta de rede ou o estado React e ver os valores marcados como "Valor sob consulta". O codebase já possui `getUnidadesDisponiveis()` (em `src/lib/queries-client.js:77-83`) que resolve exatamente isso — ela nulifica `valor_mensal` no servidor antes de retornar quando `valor_visivel = false`.

**Correção:**
```js
// UnidadesPublicas.js — trocar a query
import { getUnidadesDisponiveis, getEdificios } from '@/lib/queries-client'

// dentro do useEffect:
const [u, e] = await Promise.all([getUnidadesDisponiveis(), getEdificios()])
```

A `getUnidadesDisponiveis` já filtra apenas `disponivel` e já retorna `edificios(nome)` via join — avaliar se `UnidadePublicaCard` precisa receber `edificio` separado ou pode usar o join embutido.

---

### CR-02: `setTimeout` sem cleanup — setState em componente desmontado

**Arquivo:** `src/components/features/UnidadesPublicas.js:56-61`

**Problema:** `simularAluguel` dispara um `setTimeout` de 700ms. Se o usuário navegar para fora da página durante esse intervalo, o componente é desmontado mas o callback ainda executa, chamando `setRemovingId(null)`, `setSelected(null)` e `setRemovedIds(...)`. No React 18+ isso gera um aviso em desenvolvimento e pode causar comportamento inesperado.

```js
function simularAluguel(uid) {
  setRemovingId(uid)
  setTimeout(() => {          // sem referência para cleanup
    setRemovingId(null)
    setSelected(null)
    setRemovedIds(prev => new Set([...prev, uid]))
  }, 700)
}
```

**Correção:** Converter para `useRef` armazenando o id do timer e limpar no cleanup do `useEffect`:

```js
const timerRef = useRef(null)

function simularAluguel(uid) {
  setRemovingId(uid)
  timerRef.current = setTimeout(() => {
    setRemovingId(null)
    setSelected(null)
    setRemovedIds(prev => new Set([...prev, uid]))
  }, 700)
}

// dentro do useEffect de subscription, adicionar ao return:
return () => {
  supabase.removeChannel(channel)
  clearTimeout(timerRef.current)
}
```

---

### CR-03: Auto-referência em `@theme inline` pode quebrar fonte do corpo em toda a aplicação

**Arquivo:** `src/app/globals.css:143-144`

**Problema:** O bloco `@theme inline` contém:
```css
--font-sans: var(--font-sans);
--font-heading: var(--font-heading);
```
Ambas as variáveis referenciam a si mesmas. Tailwind v4 usa `--font-sans` como família de fonte padrão para `@apply font-sans` (linha 207) e `font-sans` (linha 207 em `html`). Se nenhuma definição externa sobrescrever essa var antes da resolução, o browser trata como ciclo e a propriedade fica sem valor — a fonte recai para o fallback do UA.

Em `layout.js` os tokens `--font-space-grotesk` e `--font-Hanken_Grotesk` são injetados, mas nenhum atribui `--font-sans` explicitamente. O design system usa `--font-body` e `--font-headline-hanken` diretamente, contornando `font-sans` em muitos componentes — mas o fallback em `html` pode estar quebrado silenciosamente.

**Correção:** Remover as linhas auto-referenciais ou mapeá-las para os tokens reais:
```css
@theme inline {
  --font-sans: var(--font-body);      /* Space Grotesk */
  --font-heading: var(--font-headline-hanken);
  /* ... restante inalterado */
}
```

---

## Warnings

### WR-01: Typo sistemático `traking` (10 ocorrências) suprime letter-spacing na landing page

**Arquivo:** `src/app/page.js:210,214,219,222,227,230,235,238,243,249,252`

**Problema:** `traking-[1.5px]` é um nome de utilitário inválido no Tailwind. O correto é `tracking-[1.5px]`. Tailwind silenciosamente ignora utilitários desconhecidos — `letter-spacing` não é aplicado em nenhum dos 10 elementos afetados, incluindo todos os labels da seção "PREVISÃO_FLUXO_2026" e o callout de testemunho. Numa fase de polimento visual, esse é um defeito funcional, não cosmético.

**Correção:** Substituição global no arquivo:
```
traking-[1.5px]  →  tracking-[1.5px]
```

---

### WR-02: `unidade.area_m2` exibido sem guard em `UnidadeDetailSheet`

**Arquivo:** `src/components/features/UnidadeDetailSheet.js:55`

**Problema:** O grid de detalhes renderiza:
```js
<span ...>{unidade.area_m2}m²</span>
```
Se `area_m2` for `null` (campo não-obrigatório no cadastro), exibe "nullm²" na UI. O `UnidadePublicaCard` guarda a mesma exibição com `{unidade.area_m2 && (...)}` (linha 28) — inconsistência entre os dois componentes.

**Correção:**
```js
<span ...>{unidade.area_m2 != null ? `${unidade.area_m2}m²` : '—'}</span>
```

---

### WR-03: `shortenName` em `UnidadesPublicas` lança exceção se `edificio.nome` for `null`

**Arquivo:** `src/components/features/UnidadesPublicas.js:10-15`

**Problema:**
```js
function shortenName(nome) {
  return nome
    .replace('Edifício ', '')
    // ...
}
```
Se `nome` for `null` ou `undefined` (campo `nome` é obrigatório no schema, mas erros de fetch podem retornar objetos incompletos), `.replace()` lança `TypeError`. A função é chamada para cada edifício na linha 47 sem verificação.

**Correção:**
```js
function shortenName(nome) {
  if (!nome) return ''
  return nome
    .replace('Edifício ', '')
    .replace('Centro Empresarial ', 'CE ')
    .replace('Torre ', '')
}
```

---

### WR-04: Edição de locatário não limpa `formEdit` nem `erro` ao cancelar

**Arquivo:** `src/components/features/LocatariosDesktop.js:208`

**Problema:** O modal de edição fecha via `setEditandoId(null)` mas `formEdit` fica populado com os dados do último locatário editado. Se o usuário abrir edição de um locatário, cancelar, e abrir outro, o formulário piscará com os dados antigos por um tick antes de `handleEditarLocatario` re-popular o state. Além disso, o `erro` não é limpo ao cancelar (linha 283 limpa ao cancelar, mas `handleEditarLocatario` não reseta `erro`).

**Correção:**
```js
function handleEditarLocatario(locatario) {
  setErro("")   // adicionar
  setFormEdit({
    nome_razao_social: locatario.nome_razao_social,
    tipo: locatario.tipo,
    documento: locatario.documento ?? "",
    email: locatario.email ?? "",
    telefone: locatario.telefone ?? "",
  })
  setEditandoId(locatario.id)
}
```

---

### WR-05: Campos `null` do banco causam aviso de `uncontrolled → controlled` em inputs

**Arquivo:** `src/components/features/Unidades.js:52-58` e `src/components/features/LocatariosDesktop.js:62-69`

**Problema:** `handleEditarUnidade` e `handleEditarLocatario` copiam campos do banco diretamente para `formEdit`. Campos como `descricao`, `documento`, `telefone` são anuláveis — se forem `null`, o input recebe `value={null}`, que o React trata como `uncontrolled`. Na próxima digitação o input transita para `controlled`, disparando aviso e potencialmente perdendo o primeiro caractere digitado.

**Correção:** Usar `?? ""` ao popular o estado de edição:
```js
// Unidades.js:52-58
setFormEdit({
  nome: unidade.nome ?? "",
  descricao: unidade.descricao ?? "",
  area_m2: unidade.area_m2 ?? "",
  valor_mensal: unidade.valor_mensal ?? "",
  valor_visivel: unidade.valor_visivel ?? false,
  status: unidade.status ?? "",
})
```

---

### WR-06: `UnidadesPublicas` busca todas as unidades (incluindo `alugada`) em rota pública

**Arquivo:** `src/components/features/UnidadesPublicas.js:27`

**Problema:** `getUnidades()` retorna todas as unidades, independente do status. O filtro `disponivel` acontece no cliente (linha 43). Uma rota pública enviando dados de unidades alugadas para visitantes anônimos é redundante e exposição desnecessária de informações. Isso é independente do CR-01 — mesmo substituindo por `getUnidadesDisponiveis()` o problema do dado `alugada` some, mas vale registrar a causa raiz.

**Correção:** Usar `getUnidadesDisponiveis()` (já resolve CR-01 e este warning simultaneamente).

---

## Info

### IN-01: Função morta `carregarDados` em `Unidades.js`

**Arquivo:** `src/components/features/Unidades.js:38-41`

**Problema:** A função `carregarDados` é declarada mas nunca chamada. O `useEffect` (linha 86-91) tem uma cópia inline idêntica.

**Correção:** Remover a função `carregarDados` ou substituir o `useEffect` por uma chamada a ela.

---

### IN-02: Typo de interface: "ACESSE ANALITYCS"

**Arquivo:** `src/app/page.js:147`

**Problema:** O label do botão contém `ANALITYCS` — deveria ser `ANALYTICS` (ou em português, `ANÁLISES`).

**Correção:**
```jsx
ACESSE ANALYTICS
```

---

### IN-03: `UnidadeDetailSheet` sem acessibilidade de diálogo modal

**Arquivo:** `src/components/features/UnidadeDetailSheet.js:11-104`

**Problema:** O sheet se comporta como um modal (overlay, foca conteúdo, fecha ao clicar fora) mas não implementa: `role="dialog"`, `aria-modal="true"`, `aria-labelledby` apontando para o `h2`, trap de foco, fechamento via `Esc`, ou trava de scroll no `body`. Para uma página pública demonstrável em banca, a acessibilidade básica de modal é esperada.

**Correção mínima:**
```jsx
<div
  role="dialog"
  aria-modal="true"
  aria-labelledby="sheet-title"
  // ...
>
  <h2 id="sheet-title" ...>{unidade.nome}</h2>
```
Para Esc: `useEffect(() => { const h = e => e.key === 'Escape' && onClose(); window.addEventListener('keydown', h); return () => window.removeEventListener('keydown', h) }, [onClose])`.

---

### IN-04: `SpeedInsights` importado em `layout.js` mas nunca renderizado no JSX

**Arquivo:** `src/app/layout.js:2`

**Problema:** `import { SpeedInsights } from "@vercel/speed-insights/next"` aparece na linha 2, mas o componente `<SpeedInsights />` não está no JSX do `RootLayout`. O import é dead code — o Speed Insights não está ativo.

**Correção:** Adicionar `<SpeedInsights />` dentro do `<body>`, ou remover o import se não for usado:
```jsx
<body className="min-h-full flex flex-col">
  {children}
  <SpeedInsights />
</body>
```

---

_Revisado: 2026-05-27_
_Revisor: Claude (gsd-code-reviewer)_
_Profundidade: standard_
