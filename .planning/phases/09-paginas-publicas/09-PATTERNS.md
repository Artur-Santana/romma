# Phase 9: Páginas Públicas — Pattern Map

**Mapeado:** 2026-06-06
**Arquivos analisados:** 4 arquivos a modificar + 1 arquivo de teste a criar
**Análogos encontrados:** 4 / 4 (os próprios arquivos-alvo são as fontes canônicas)

---

## File Classification

| Arquivo a modificar | Role | Data Flow | Análogo mais próximo | Match |
|---------------------|------|-----------|----------------------|-------|
| `src/app/page.js` | component (Server Component) | request-response (static SSR) | `src/app/page.js` (self) | exact |
| `src/components/features/UnidadePublicaCard.js` | component (Client Component) | request-response (render prop) | `src/components/features/UnidadePublicaCard.js` (self) | exact |
| `src/components/features/UnidadesPublicas.js` | component (Client Component) | event-driven (Realtime + useEffect) | `src/components/features/UnidadesPublicas.js` (self) | exact |
| `src/components/ui/Header.js` | component (Server Component) | request-response (static SSR) | `src/components/ui/Header.js` (self) | exact |
| `e2e/public-pages.spec.js` | test (E2E Playwright) | request-response (smoke tests) | `e2e/dashboard-smoke.spec.js` | role-match |

> **Nota:** Esta fase é de ajustes pontuais em arquivos existentes. Os próprios arquivos-alvo
> são a fonte canônica de padrões — os analógos abaixo documentam os padrões a preservar e
> o delta mínimo a aplicar em cada arquivo.

---

## Pattern Assignments

### `src/app/page.js` (Server Component, static SSR)

**Análogo:** `src/app/page.js` (self) + `src/components/ui/Header.js` (padrão `<Link>`)

**Padrão de imports** (linhas 1–4 atuais — preservar):
```jsx
import Link from "next/link";
import Image from "next/image";
import Header from "@/components/ui/Header";
import Footer from "@/components/ui/Footer";
```
`Link` já está importado — nenhuma adição de import necessária para D-01/D-02/D-04.

**Padrão de CTA primário — ANTES (linha 44–46):**
```jsx
<button type="button" className="py-4 px-10 bg-linear-45 from-primary to-primary-hover cursor-pointer">
  INICIE GRATUITAMENTE
</button>
```

**Padrão de CTA primário — DEPOIS (D-01):**
```jsx
<Link href="/login" className="py-4 px-10 bg-linear-45 from-primary to-primary-hover cursor-pointer text-center">
  ACESSAR DASHBOARD
</Link>
```
Regra: `<button>` de navegação → `<Link>`. Preservar todos os `className` existentes. Adicionar `text-center` (necessário para `<a>` que é inline por padrão, diferente de `<button>`).

**Padrão de CTA secundário — ANTES (linha 47–49):**
```jsx
<Link href="/unidades" className="py-4 px-10 bg-background cursor-pointer text-center">
  VER PROJETOS
</Link>
```

**Padrão de CTA secundário — DEPOIS (D-02):**
```jsx
<Link href="/unidades" className="py-4 px-10 bg-background cursor-pointer text-center">
  VER UNIDADES
</Link>
```
Regra: apenas troca de label. href e className intactos.

**Padrão de botão SISTEMA.04 — ANTES (linhas 146–148):**
```jsx
<button type="button" className="py-4 px-10 bg-linear-45 from-primary to-primary-hover font-headline-hanken font-semibold tracking-[0.2em] text-white text-sm cursor-pointer">
  ACESSE ANALITYCS
</button>
```

**Padrão de botão SISTEMA.04 — DEPOIS (D-04):**
```jsx
<Link href="/login" className="py-4 px-10 bg-linear-45 from-primary to-primary-hover font-headline-hanken font-semibold tracking-[0.2em] text-white text-sm cursor-pointer text-center">
  ACESSAR PAINEL
</Link>
```
Regra: mesma conversão `<button>` → `<Link>`. Adicionar `text-center`. Corrigir typo e label.

---

### `src/components/features/UnidadePublicaCard.js` (Client Component, render prop)

**Análogo:** `src/components/features/UnidadePublicaCard.js` (self)

**Diretiva de topo — preservar:**
```jsx
'use client'
```

**Padrão de imports — preservar (linhas 1–4):**
```jsx
'use client'

import StatusBadge from '@/components/ui/StatusBadge'
import { fmtBRL, refOf } from '@/lib/utils'
```

**Padrão do card button — preservar (linhas 8–11):**
```jsx
<button
  style={{ all: 'unset', cursor: 'pointer', display: 'block', width: '100%', boxSizing: 'border-box' }}
  className={`px-5 py-5 border-t border-border-3 transition-opacity duration-700 ${isRemoving ? 'opacity-0' : 'opacity-100'}`}
  onClick={() => onSelect(unidade)}
>
```
`py-5` ≈ 68px — já atende ≥44px. Não modificar.

**Troca de texto — ANTES (linha 44–46):**
```jsx
<span className="font-mono text-[11px] text-fg-3 tracking-[1px] uppercase">
  Valor sob consulta
</span>
```

**Troca de texto — DEPOIS (D-05):**
```jsx
<span className="font-mono text-[11px] text-fg-3 tracking-[1px] uppercase">
  Consulte o Proprietário
</span>
```
Regra: troca de string literal apenas. `className` intacto. `UnidadeDetailSheet.js` já tem texto correto — não tocar.

---

### `src/components/features/UnidadesPublicas.js` (Client Component, event-driven)

**Análogo:** `src/components/features/UnidadesPublicas.js` (self)

**Diretiva de topo — preservar:**
```jsx
'use client'
```

**Padrão de imports — preservar (linhas 1–9):**
```jsx
'use client'

import { useState, useEffect, useRef, useMemo } from 'react'
import { getUnidadesDisponiveis, getEdificios } from '@/lib/queries-client'
import { createClient } from '@/lib/supabase-browser'
import RealtimeDot from '@/components/ui/RealtimeDot'
import UnidadePublicaCard from '@/components/features/UnidadePublicaCard'
import UnidadeDetailSheet from '@/components/features/UnidadeDetailSheet'
import Link from 'next/link'
```

**Padrão do link "← Voltar" — ANTES (linha 82):**
```jsx
<Link href="/" className="font-mono text-[11px] text-fg-4 tracking-[1px] uppercase hover:text-fg-2 transition-colors">← Voltar</Link>
```

**Padrão do link "← Voltar" — DEPOIS (D-06 adicional):**
```jsx
<Link href="/" className="font-mono text-[11px] text-fg-4 tracking-[1px] uppercase hover:text-fg-2 transition-colors py-3 inline-flex items-center min-h-[44px]">← Voltar</Link>
```
Regra: adicionar `py-3 inline-flex items-center min-h-[44px]` ao className existente.

**Padrão do tab button — ANTES (linhas 97–109):**
```jsx
<button
  key={tab.id}
  style={{ all: 'unset', cursor: 'pointer', flexShrink: 0, boxSizing: 'border-box' }}
  className={`px-3.5 py-2 inline-flex gap-2 font-body font-bold text-[10px] uppercase tracking-[0.5px] items-center border ${
    isActive
      ? 'border-indigo bg-[oklch(0.339_0.179_301.68/0.20)] text-fg-1'
      : 'border-border-3 bg-transparent text-fg-3'
  }`}
  onClick={() => setActiveTab(tab.id)}
>
```

**Padrão do tab button — DEPOIS (D-06):**
```jsx
<button
  key={tab.id}
  style={{ all: 'unset', cursor: 'pointer', flexShrink: 0, boxSizing: 'border-box' }}
  className={`px-3.5 py-3 min-h-[44px] inline-flex gap-2 font-body font-bold text-[10px] uppercase tracking-[0.5px] items-center border ${
    isActive
      ? 'border-indigo bg-[oklch(0.339_0.179_301.68/0.20)] text-fg-1'
      : 'border-border-3 bg-transparent text-fg-3'
  }`}
  onClick={() => setActiveTab(tab.id)}
>
```
Regra: `py-2` → `py-3 min-h-[44px]`. Ambas as classes são obrigatórias — `py-3` sozinho resulta em ~38-40px (abaixo de 44px). `style={{ all: 'unset' }}` e demais className intactos.

**Padrão do empty state — verificar (linhas 124–135, NÃO modificar):**
```jsx
{filtered.length === 0 ? (
  <div className="py-20 px-8 text-center flex flex-col gap-3 items-center">
    <div className="w-12 h-12 border border-border-3 flex items-center justify-center text-[18px] text-fg-4">
      —
    </div>
    <span className="font-body font-bold text-[22px] tracking-[-0.8px] text-fg-2 block">
      Nenhuma unidade disponível
    </span>
    <p className="text-[12px] text-fg-4 leading-[1.5] max-w-[240px] m-0">
      Todas as unidades estão ocupadas no momento. Volte em breve.
    </p>
  </div>
) : (
```
PUB-02 já está implementado. Tarefa: apenas verificar que renderiza.

---

### `src/components/ui/Header.js` (Server Component, static SSR)

**Análogo:** `src/components/ui/Header.js` (self)

**Padrão de imports — preservar (linha 1):**
```jsx
import Link from "next/link";
```
`Link` já está importado — nenhuma adição necessária para D-07.

**Padrão desktop CTA — ANTES (linhas 47–52):**
```jsx
<button
  type="button"
  className="content-center text-white font-semibold tracking-4 bg-linear-45 from-primary to-primary-hover py-4 px-10 cursor-pointer"
>
  COMEÇAR AGORA
</button>
```

**Padrão desktop CTA — DEPOIS (D-07):**
```jsx
<Link
  href="/login"
  className="content-center text-white font-semibold tracking-4 bg-linear-45 from-primary to-primary-hover py-4 px-10 cursor-pointer"
>
  COMEÇAR AGORA
</Link>
```

**Padrão mobile CTA — ANTES (linhas 95–100):**
```jsx
<button
  type="button"
  className="w-full text-white font-semibold tracking-4 bg-linear-45 from-primary to-primary-hover py-4 px-10 cursor-pointer"
>
  COMEÇAR AGORA
</button>
```

**Padrão mobile CTA — DEPOIS (D-07):**
```jsx
<Link
  href="/login"
  className="w-full text-white font-semibold tracking-4 bg-linear-45 from-primary to-primary-hover py-4 px-10 cursor-pointer text-center"
>
  COMEÇAR AGORA
</Link>
```
Regra: dois `<button>` para converter — um no bloco desktop (hidden md:flex) e um no bloco mobile (`<details>`). Preservar todos os `className`. Adicionar `text-center` onde necessário para `<a>`.

---

### `e2e/public-pages.spec.js` (Playwright E2E, smoke tests) — arquivo novo

**Análogo:** `e2e/dashboard-smoke.spec.js` (role-match)

**Padrão de estrutura de teste — copiar de `e2e/dashboard-smoke.spec.js`:**

```javascript
import { test, expect } from '@playwright/test'

// Padrão: describe por grupo de req-id, test por comportamento específico
test.describe('LP-01 — Hero CTA "VER UNIDADES"', () => {
  test('LP-01 — clicar "VER UNIDADES" navega para /unidades', async ({ page }) => {
    await page.goto('/')
    // Encontrar por role + name (padrão do projeto)
    const cta = page.getByRole('link', { name: /VER UNIDADES/i })
    await expect(cta).toBeVisible()
    await cta.click()
    await page.waitForURL('**/unidades', { timeout: 10_000 })
    expect(page.url()).toContain('/unidades')
  })
})
```

**Padrão de viewport para testes mobile (PUB-03):**
```javascript
// Usar configuração de viewport diretamente no test
test('PUB-03 — sem overflow horizontal em 375px', async ({ browser }) => {
  const context = await browser.newContext({ viewport: { width: 375, height: 812 } })
  const page = await context.newPage()
  await page.goto('/unidades')

  // Verificar ausência de overflow-x via evaluate
  const hasOverflow = await page.evaluate(() =>
    document.documentElement.scrollWidth > document.documentElement.clientWidth
  )
  expect(hasOverflow).toBe(false)
  await context.close()
})
```

**Padrão de mock para empty state (PUB-02):**
```javascript
// page.route() intercepta chamada Supabase e retorna lista vazia
test('PUB-02 — empty state quando zero unidades disponíveis', async ({ page }) => {
  await page.route('**/rest/v1/unidades**', route =>
    route.fulfill({ status: 200, body: JSON.stringify([]) })
  )
  await page.goto('/unidades')
  await expect(page.getByText('Nenhuma unidade disponível')).toBeVisible({ timeout: 10_000 })
})
```

**Padrão de verificação de tap target (PUB-03):**
```javascript
// getBoundingClientRect via page.evaluate para checar dimensões mínimas
test('PUB-03 — tab buttons têm tap target ≥44px', async ({ browser }) => {
  const context = await browser.newContext({ viewport: { width: 375, height: 812 } })
  const page = await context.newPage()
  await page.goto('/unidades')

  // Aguardar tabs aparecerem (dados carregados)
  const tabBtn = page.locator('button').filter({ hasText: 'Todos' })
  await expect(tabBtn).toBeVisible({ timeout: 10_000 })

  const height = await tabBtn.evaluate(el => el.getBoundingClientRect().height)
  expect(height).toBeGreaterThanOrEqual(44)
  await context.close()
})
```

---

## Shared Patterns

### Padrão: `<button>` → `<Link>` (Next.js App Router)

**Fonte:** `src/components/ui/Header.js` linha 41–45 (exemplo de `<Link>` correto existente)
**Aplicar a:** `src/app/page.js` (D-01, D-04) e `src/components/ui/Header.js` (D-07)

```jsx
// Link de navegação correto — padrão estabelecido no Header
<Link
  href="/login"
  className="content-center font-normal tracking-widest text-sm p-3 animacao-underscore"
>
  ENTRAR
</Link>
```

**Regras ao converter `<button>` → `<Link>`:**
1. Remover `type="button"`
2. Adicionar `href="..."` como prop
3. Preservar todos os `className` existentes sem alteração
4. Adicionar `text-center` quando necessário (elementos `<a>` são inline, diferente de `<button>`)
5. Nenhuma adição de import — `Link` já está importado em todos os arquivos-alvo

### Padrão: tap targets ≥44px via Tailwind

**Fonte:** `src/components/features/UnidadePublicaCard.js` linha 10 (`py-5` existente)
**Aplicar a:** tab buttons e link Voltar em `UnidadesPublicas.js`

```jsx
// Padrão existente que JÁ atende (py-5 ≈ 68px) — referência
className={`px-5 py-5 border-t border-border-3 ...`}

// Padrão a APLICAR em tab buttons (D-06) — ambas as classes obrigatórias
className={`px-3.5 py-3 min-h-[44px] inline-flex ...`}

// Padrão a APLICAR no link Voltar — adicionar ao className existente
className="... py-3 inline-flex items-center min-h-[44px]"
```

**Matemática:**
- `py-2` = ~30px total — FALHA ≥44px
- `py-3` = ~38-40px total — FALHA ≥44px sem `min-h-[44px]`
- `py-3 min-h-[44px]` = garante 44px mínimo — PASSA

### Padrão: `style={{ all: 'unset' }}` em buttons de navegação/lista

**Fonte:** `src/components/features/UnidadePublicaCard.js` linha 9 e `UnidadesPublicas.js` linha 99
**Aplicar a:** Não modificar — padrão existente a preservar

```jsx
// Card button — preservar exatamente
style={{ all: 'unset', cursor: 'pointer', display: 'block', width: '100%', boxSizing: 'border-box' }}

// Tab button — preservar exatamente
style={{ all: 'unset', cursor: 'pointer', flexShrink: 0, boxSizing: 'border-box' }}
```

---

## No Analog Found

Nenhum arquivo desta fase está sem análogo. O arquivo novo (`e2e/public-pages.spec.js`) tem
análogo próximo em `e2e/dashboard-smoke.spec.js`.

---

## Pitfalls Capturados (do RESEARCH.md)

| Pitfall | Regra para o executor |
|---------|----------------------|
| D-06 incompleto | SEMPRE aplicar `py-3 min-h-[44px]` juntos — `py-3` sozinho falha ≥44px |
| Header.js esquecido | Escopo inclui `Header.js` (D-07) mesmo não listado em CONTEXT.md — UI-SPEC prevalece |
| UnidadeDetailSheet | Fora do escopo desta fase — botão ✕ (32px) é risco documentado mas não corrigido aqui |
| D-05 scope | Trocar texto APENAS em `UnidadePublicaCard.js` linha 44 — `UnidadeDetailSheet.js` já está correto |
| Import desnecessário | `Link` já está importado em todos os 4 arquivos-alvo — não adicionar import duplicado |

---

## Metadata

**Escopo de busca de análogos:** `src/app/`, `src/components/`, `e2e/`
**Arquivos lidos:** 6 (page.js, UnidadePublicaCard.js, UnidadesPublicas.js, Header.js, dashboard-smoke.spec.js + planejamento)
**Data de extração:** 2026-06-06
