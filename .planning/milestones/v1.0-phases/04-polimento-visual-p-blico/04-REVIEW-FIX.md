---
phase: 04-polimento-visual-publico
fixed_at: 2026-05-27T00:00:00Z
review_path: .planning/phases/04-polimento-visual-p-blico/04-REVIEW.md
iteration: 1
findings_in_scope: 8
fixed: 8
skipped: 0
status: all_fixed
---

# Fase 4: Relatório de Correções do Code Review

**Corrigido em:** 2026-05-27
**Review de origem:** `.planning/phases/04-polimento-visual-p-blico/04-REVIEW.md`
**Iteração:** 1

**Resumo:**
- Findings no escopo (CR + WR): 8
- Corrigidos: 8
- Ignorados: 0

---

## Issues Corrigidas

### CR-01: `valor_mensal` exposto a visitantes não autenticados via `getUnidades()`

**Arquivos modificados:** `src/components/features/UnidadesPublicas.js`, `src/lib/queries-client.js`
**Commit:** `cfd4b60`
**Correção aplicada:** Import trocado de `getUnidades` para `getUnidadesDisponiveis`. Adicionado `edificio_id` ao SELECT de `getUnidadesDisponiveis` (campo omitido anteriormente) para manter funcionamento do filtro de tab e lookup de edifício. Removido filtro redundante `u.status === 'disponivel'` no client (a query já filtra no servidor). O `valor_mensal` agora é nulificado no servidor antes de chegar ao browser quando `valor_visivel=false`. **Nota:** este fix também resolve WR-06 (unidades com status `alugada` sendo enviadas para visitantes) simultaneamente.

---

### CR-02: `setTimeout` sem cleanup — setState em componente desmontado

**Arquivos modificados:** `src/components/features/UnidadesPublicas.js`
**Commit:** `87fe9d0`
**Correção aplicada:** Adicionado `useRef` ao import. Declarado `timerRef = useRef(null)`. A função `simularAluguel` agora armazena o id do timer em `timerRef.current`. O cleanup do `useEffect` limpa o timer com `clearTimeout(timerRef.current)` ao lado do `supabase.removeChannel`.

---

### CR-03: Auto-referência em `@theme inline` quebra fonte do corpo em toda a aplicação

**Arquivos modificados:** `src/app/globals.css`
**Commit:** `aea30a3`
**Correção aplicada:** Linhas `--font-sans: var(--font-sans)` e `--font-heading: var(--font-heading)` substituídas por `--font-sans: var(--font-body)` e `--font-heading: var(--font-headline-hanken)`, respectivamente. Os tokens de destino já estão definidos no `@theme` e em `:root`, alinhando com os tokens injetados pelo `layout.js` (`--font-space-grotesk` via `--font-body`, `--font-Hanken_Grotesk` via `--font-headline-hanken`).

---

### WR-01: Typo sistemático `traking` (10 ocorrências) suprime letter-spacing na landing page

**Arquivos modificados:** `src/app/page.js`
**Commit:** `351e7c9`
**Correção aplicada:** Substituição global de todas as 10 ocorrências de `traking-[1.5px]` por `tracking-[1.5px]`. Confirmado zero ocorrências restantes de `traking` no arquivo.

---

### WR-02: `unidade.area_m2` exibido sem guard em `UnidadeDetailSheet`

**Arquivos modificados:** `src/components/features/UnidadeDetailSheet.js`
**Commit:** `415cd21`
**Correção aplicada:** Expressão `{unidade.area_m2}m²` substituída por `{unidade.area_m2 != null ? \`${unidade.area_m2}m²\` : '—'}`. Quando `area_m2` é null, exibe `—` em vez de `nullm²`, alinhando com o tratamento já feito em `UnidadePublicaCard`.

---

### WR-03: `shortenName` em `UnidadesPublicas` lança exceção se `edificio.nome` for `null`

**Arquivos modificados:** `src/components/features/UnidadesPublicas.js`
**Commit:** `b237acf`
**Correção aplicada:** Adicionado `if (!nome) return ''` como primeira linha da função `shortenName`, antes de qualquer chamada a `.replace()`. Previne TypeError quando `edificio.nome` é null ou undefined.

---

### WR-04 + WR-05: Campos `null` do banco causam aviso `uncontrolled→controlled` e `erro` não é limpo ao abrir edição

**Arquivos modificados:** `src/components/features/LocatariosDesktop.js`, `src/components/features/Unidades.js`
**Commit:** `7467977`
**Correção aplicada:**
- `LocatariosDesktop.js` — `handleEditarLocatario`: adicionado `setErro("")` antes de popular o form; todos os campos do banco com `?? ""` (ou `?? "pf"` para `tipo`).
- `Unidades.js` — `handleEditarUnidade`: todos os campos com `?? ""` (e `?? false` para `valor_visivel`).

---

## Issues Ignoradas (fora do escopo)

WR-06 e os findings IN-01 a IN-04 estão fora do escopo fixado (CR-01 a WR-05). WR-06 foi resolvido como efeito colateral do fix CR-01.

---

_Corrigido: 2026-05-27_
_Corretor: Claude (gsd-code-fixer)_
_Iteração: 1_
