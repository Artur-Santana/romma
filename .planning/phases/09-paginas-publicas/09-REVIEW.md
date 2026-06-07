---
phase: 09-paginas-publicas
reviewed: 2026-06-06T00:00:00Z
depth: standard
files_reviewed: 6
files_reviewed_list:
  - e2e/public-pages.spec.js
  - src/app/page.js
  - src/components/features/UnidadeDetailSheet.js
  - src/components/features/UnidadePublicaCard.js
  - src/components/features/UnidadesPublicas.js
  - src/components/ui/Header.js
findings:
  critical: 2
  warning: 2
  info: 3
  total: 7
status: issues_found
---

# Fase 09: Relatório de Code Review

**Revisado:** 2026-06-06
**Profundidade:** standard
**Arquivos revisados:** 6
**Status:** issues_found

## Resumo

Revisão das páginas públicas (landing page `/` e listagem `/unidades`). A implementação cobre corretamente os CTAs da landing page, tap targets ≥44px e empty state. Dois defeitos estruturais foram encontrados: a query `getUnidadesDisponiveis` não seleciona campos que os componentes dependem, resultando em funcionalidade silenciosamente quebrada. Dois warnings de qualidade também foram identificados.

---

## Critical Issues

### CR-01: `status` não é selecionado pela query — StatusBadge exibe badge quebrado em todos os cards

**Arquivo:** `src/lib/queries-client.js:80`  
**Consumidor:** `src/components/features/UnidadePublicaCard.js:31`

**Issue:** `getUnidadesDisponiveis` seleciona `'id, edificio_id, nome, area_m2, valor_mensal, valor_visivel, edificios(nome)'` — o campo `status` não consta na lista. `UnidadePublicaCard` passa `unidade.status` para `<StatusBadge>`, que recebe `undefined`. O `StatusBadge` usa o fallback `{ label: status }` onde `status` é `undefined` — renderiza o ponto colorido sem nenhum label de texto. O badge "Disponível" que o teste PUB-01 (linha 88) verifica via `/Disponível/i` depende exatamente desse label: o teste E2E usa dados do seed real e vai falhar em CI porque o texto "Disponível" nunca é renderizado.

**Fix:**
```js
// src/lib/queries-client.js — linha 78-83
export async function getUnidadesDisponiveis() {
    const { data } = await supabase
        .from('unidades')
        .select('id, edificio_id, nome, descricao, area_m2, valor_mensal, valor_visivel, status, edificios(nome)')
        .eq('status', 'disponivel')
    return data?.map(u => u.valor_visivel ? u : { ...u, valor_mensal: null }) ?? []
}
```

---

### CR-02: `descricao` não é selecionado pela query — bloco de descrição nunca é renderizado no sheet

**Arquivo:** `src/lib/queries-client.js:80`  
**Consumidor:** `src/components/features/UnidadeDetailSheet.js:64`

**Issue:** `getUnidadesDisponiveis` não seleciona `descricao`. `UnidadeDetailSheet` condiciona o bloco de descrição em `{unidade.descricao && ...}` — com `descricao` sempre `undefined`, o bloco nunca renderiza independente dos dados reais do banco. Feature silenciosamente morta.

**Fix:** Mesmo que CR-01 — adicionar `descricao` ao select de `getUnidadesDisponiveis` (veja fix acima).

---

## Warnings

### WR-01: `new Date().toISOString()` em render causa potencial hydration mismatch

**Arquivo:** `src/components/features/UnidadesPublicas.js:119`

**Issue:** A data `SYNC · {new Date().toISOString().slice(0, 10)}` é avaliada em tempo de render dentro de um `'use client'` component. Next.js 16 com App Router faz SSR do componente no servidor e depois hidrata no browser. Se o servidor renderiza em um fuso horário UTC e o browser está em UTC-3, perto da meia-noite a data pode diferir entre server e client, gerando hydration mismatch e warning no console (ou erro em modo strict).

**Fix:**
```js
// Usar useMemo ou useEffect para capturar a data apenas no client:
const [syncDate, setSyncDate] = useState('')
useEffect(() => {
  setSyncDate(new Date().toISOString().slice(0, 10))
}, [])

// No JSX:
<span ...>SYNC · {syncDate}</span>
```

---

### WR-02: `refOf` acessa `u.id.slice()` sem guard — crash se id for null/undefined

**Arquivo:** `src/lib/utils.js:17-19`  
**Consumidores:** `src/components/features/UnidadePublicaCard.js:15`, `src/components/features/UnidadeDetailSheet.js:21`

**Issue:** `refOf(u)` executa `u.id.slice(0, 6)` sem verificar se `u.id` existe. O dado vem de Supabase e em condições normais `id` é sempre preenchido, mas qualquer unidade mal-formada (bug de seed, mock incompleto no E2E, etc.) lança `TypeError: Cannot read properties of undefined (reading 'slice')`, crashando o card ou o sheet sem mensagem de erro útil.

**Fix:**
```js
export function refOf(u) {
  if (!u?.id) return 'UN-??????'
  return "UN-" + u.id.slice(0, 6).toUpperCase()
}
```

---

## Info

### IN-01: Nested join `edificios(nome)` selecionado na query mas não utilizado pelos componentes

**Arquivo:** `src/lib/queries-client.js:80`

**Issue:** A query seleciona `edificios(nome)` via join, mas `UnidadesPublicas` passa `edificio` como prop separada (buscada por `getEdificios()` e resolvida via `edificioById`). O campo `u.edificios` jamais é lido — query dupla/dado morto que aumenta o payload sem uso.

**Fix:** Remover `edificios(nome)` do select, ou substituir o segundo `getEdificios()` pelo join — mas não manter os dois.

---

### IN-02: Links "CONTRATOS", "PORTAIS", "DASHBOARD" no Header apontam para `href="#"`

**Arquivo:** `src/components/ui/Header.js:30-36` (desktop) e `72-86` (mobile)

**Issue:** Os quatro links de navegação do header (`PROPRIEDADES` exceto, os demais três) usam `href="#"` — âncora vazia que faz scroll para o topo da página ao invés de navegar, podendo confundir visitantes e prejudicar acessibilidade. Em contexto de banca de TCC, cliques nesses links em demo ao vivo podem parecer bugs.

**Fix:** Substituir por `href="/login"` (redireciona para autenticação antes de acesso) ou remover os links não implementados do menu público.

---

### IN-03: Data hardcoded no Header — "DATA: 09.06.2026 // STATUS: OTIMIZADO"

**Arquivo:** `src/components/ui/Header.js:14`

**Issue:** A data no banner superior do Header está hardcoded como string estática `"DATA: 09.06.2026 // STATUS: OTIMIZADO"`. Para uma apresentação de banca após essa data, o Header exibirá uma data desatualizada.

**Fix:**
```js
// Calcular dinamicamente (client-side somente para evitar hydration mismatch):
const hoje = new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })
// Render: `DATA: ${hoje} // STATUS: OTIMIZADO`
```
Ou, se for puramente decorativo, documentar como intencional.

---

_Revisado: 2026-06-06_  
_Reviewer: Claude (gsd-code-reviewer)_  
_Depth: standard_
