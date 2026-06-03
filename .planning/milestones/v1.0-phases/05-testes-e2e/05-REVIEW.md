---
phase: 05-testes-e2e
reviewed: 2026-05-29T00:00:00Z
depth: standard
files_reviewed: 6
files_reviewed_list:
  - src/app/dashboard/edificios/page.js
  - e2e/seed.mjs
  - e2e/global-teardown.js
  - e2e/crud.spec.js
  - e2e/parcelas.spec.js
  - e2e/realtime.spec.js
findings:
  critical: 2
  warning: 7
  info: 2
  total: 11
status: issues_found
---

# Phase 05: Code Review Report

**Revisado:** 2026-05-29
**Profundidade:** standard
**Arquivos revisados:** 6
**Status:** issues_found

---

## Summary

Revisão da implementação de testes E2E (Playwright) para o sistema Romma. Os arquivos cobrem seed de dados, teardown global, e três suítes de testes (CRUD, parcelas, realtime).

A implementação está estruturalmente correta — isolamento por prefixo `E2E-`, uso de `supabaseAdmin` apenas no lado servidor, cascata FK na ordem correta. Contudo, dois problemas críticos de segurança de dados foram identificados: o guard de URL de produção está ausente no caminho real de execução (Playwright chama `seed()` diretamente, não via CLI), e o `global-teardown.js` não possui nenhum guard. Ambos os casos permitem que, em um acidente de configuração, operações destrutivas com a service role key sejam executadas contra um banco de dados de produção.

Além dos dois BLOCKERs, há sete WARNINGs relevantes relacionados a acoplamento entre testes (sem `serial()`), falta de idempotência no `beforeAll` de `parcelas.spec.js`, seletores frágeis, datas hardcoded no passado e uma assertion que falhará com múltiplos resultados na página.

`src/app/dashboard/edificios/page.js` é um wrapper trivial (5 linhas) sem defeitos.

---

## Critical Issues

### CR-01: Guard de URL ausente no caminho de execução do Playwright (`seed.mjs`)

**File:** `e2e/seed.mjs:156-161`

**Issue:** O único guard que impede execução contra produção está dentro do bloco `if (import.meta.url === ...)` — que só roda quando o arquivo é chamado diretamente via `node e2e/seed.mjs`. Quando o Playwright executa, o `global-setup.js` importa e chama `seed()` diretamente. Nesse caminho, **não há nenhuma verificação** antes de operações destrutivas com a service role key (DELETE em cascata em parcelas/contratos/locatarios nas linhas 84-88). Se `.env.test` apontar por acidente para o projeto de produção (`vfymttcajeyhrmsyhrtj.supabase.co`), dados reais serão apagados.

**Fix:** Extrair o guard para dentro da função `seed()`, executando antes de qualquer operação:

```js
export async function seed() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
  if (!url.includes('test') && !url.includes('local') && !url.includes('127.0.0.1')) {
    throw new Error(`ABORT: seed() recusou URL de produção: ${url}`)
  }

  const proprietario = await upsertUser('proprietario@test.romma.local', 'Test1234!')
  // ... resto da função
}
```

O bloco CLI (linhas 155-161) pode ser simplificado para só chamar `seed()` sem duplicar o check.

---

### CR-02: Nenhum guard de URL em `global-teardown.js`

**File:** `e2e/global-teardown.js:16-117`

**Issue:** `globalTeardown()` executa operações destrutivas de alto impacto com credencial de service role — incluindo `DELETE FROM edificios WHERE nome LIKE 'E2E-%'`, `DELETE FROM locatarios WHERE nome_razao_social LIKE 'E2E-%'`, e `auth.admin.deleteUser` para qualquer usuário com email prefixado `e2e-*`. Não há nenhuma verificação de URL. Se `NEXT_PUBLIC_SUPABASE_URL` apontar para produção (por acidente de `.env` ou variável de ambiente sobrescrita), o teardown apagará dados reais de qualquer usuário que coincidentemente tenha email começando com `e2e-`.

**Fix:** Adicionar guard na primeira linha de `globalTeardown()`:

```js
export default async function globalTeardown() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
  if (!url.includes('test') && !url.includes('local') && !url.includes('127.0.0.1')) {
    throw new Error(`ABORT: globalTeardown() recusou URL de produção: ${url}`)
  }

  // ... resto da função
}
```

---

## Warnings

### WR-01: Testes com dependência sequencial não declarados como `serial()` — `crud.spec.js`

**File:** `e2e/crud.spec.js:36-133`

**Issue:** Os três `test.describe` de Edifícios, Unidades e Locatários têm testes encadeados: "criar" → "editar" → "deletar" onde cada teste depende do resultado do anterior (o nome criado no teste 1 é buscado no teste 2, etc.). Sem `test.describe.configure({ mode: 'serial' })`, o Playwright pode reordenar ou paralelizar dentro do describe em configurações futuras. Se "criar" falhar, "editar" e "deletar" falharão com erros confusos em vez de serem pulados.

**Fix:** Adicionar no início de cada `test.describe` dependente:

```js
test.describe('Edifícios', () => {
  test.describe.configure({ mode: 'serial' })
  // ...
})
```

---

### WR-02: `contratoId` acoplado entre testes sem `serial()` — `parcelas.spec.js`

**File:** `e2e/parcelas.spec.js:33-37, 154, 177`

**Issue:** `contratoId` é uma variável de módulo atribuída no teste "gera parcelas..." (linha 154) e consumida no teste "marca parcela como paga" (linha 177). Se o primeiro teste falhar, `contratoId` permanece `undefined`. A query admin na linha 177 executará `.eq('contrato_id', undefined)` e silenciosamente não atualizará nada — o teste seguirá, mas o botão "Marcar Paga" não estará disponível, gerando uma falha confusa sem mensagem clara de causa raiz.

**Fix:** Adicionar `test.describe.configure({ mode: 'serial' })` no `test.describe('TEST-02 — Parcelas', ...)` e adicionar asserção explícita no início do segundo teste:

```js
test('marca parcela como paga', async ({ page }) => {
  expect(contratoId, 'contratoId deve ter sido definido pelo teste anterior').toBeTruthy()
  // ...
})
```

---

### WR-03: `beforeAll` em `parcelas.spec.js` não é idempotente — falha em rerun

**File:** `e2e/parcelas.spec.js:66-72`

**Issue:** O `beforeAll` chama `admin.auth.admin.createUser({ email: 'e2e-parcelas@test.romma.local', ... })` sem verificar se o usuário já existe. Se um run anterior crashar antes do `afterAll` (ex: `Ctrl+C`, falha de rede), o próximo run falhará no `beforeAll` com erro "User already registered". O `crud.spec.js` (linha 141-153) trata isso corretamente com listUsers + find. A inconsistência é um bug latente.

**Fix:** Aplicar o mesmo padrão upsert já usado em `crud.spec.js`:

```js
const { data: list } = await admin.auth.admin.listUsers()
const existing = list.users.find(u => u.email === 'e2e-parcelas@test.romma.local')
if (existing) {
  authUserId = existing.id
} else {
  const { data: authData, error: errAuth } = await admin.auth.admin.createUser({ ... })
  if (errAuth) throw errAuth
  authUserId = authData.user.id
}
```

---

### WR-04: Seletor com espaço no placeholder acopla o teste a um typo de UI

**File:** `e2e/crud.spec.js:121`

**Issue:** `page.fill('input[placeholder="Telefone "]', '11999999999')` — o placeholder tem um espaço trailing. Se o componente de UI corrigir o typo (`"Telefone"` sem espaço), este seletor deixará de encontrar o elemento e o teste falhará. O teste está acoplado a um defeito de UI.

**Fix:** Corrigir o placeholder na UI para `"Telefone"` (sem espaço) e atualizar o seletor para `'input[placeholder="Telefone"]'`.

---

### WR-05: `getByText('cancelado')` sem `.first()` pode falhar em modo estrito

**File:** `e2e/crud.spec.js:269`

**Issue:** `await expect(page.getByText('cancelado')).toBeVisible({ timeout: 10_000 })` — a suite de contratos cria e cancela contratos em sequência. Após o segundo contrato, a página pode exibir "cancelado" em múltiplos elementos. O Playwright em modo estrito lança erro se um locator retorna múltiplos elementos. O mesmo risco existe em `getByText('encerrado')` na linha 318.

**Fix:**

```js
await expect(page.getByText('cancelado').first()).toBeVisible({ timeout: 10_000 })
// ...
await expect(page.getByText('encerrado').first()).toBeVisible({ timeout: 10_000 })
```

---

### WR-06: Datas de contrato hardcoded (`2026-06-01`) já estão no passado para a banca

**File:** `e2e/crud.spec.js:249, 286`, `e2e/parcelas.spec.js:134`

**Issue:** Contratos criados com `data_inicio: '2026-06-01'` e `data_fim: '2027-06-01'`. A banca é em 18/06/2026. Após essa data, `data_inicio` passará a ser uma data no passado — o que pode violar validações de negócio no frontend (campo de data mínima) ou alterar o comportamento de status das parcelas geradas pela Edge Function. Para `crud.spec.js` isso é secundário (testa CRUD, não lógica de parcelas), mas para `parcelas.spec.js` (que verifica `futura` ou `pendente`) a data no passado pode gerar todas as parcelas como `pendente` imediatamente, quebrando a assertion da linha 159.

**Fix:** Usar datas dinâmicas calculadas a partir de `new Date()` para garantir que `data_inicio` seja sempre >= hoje:

```js
const dataInicio = new Date().toISOString().slice(0, 10)
const dataFim = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
await page.locator('input[type="date"]').nth(0).fill(dataInicio)
await page.locator('input[type="date"]').nth(1).fill(dataFim)
```

`realtime.spec.js` já faz isso corretamente (linhas 80-83) — padronizar os demais.

---

### WR-07: Navegação DOM com `.locator('..')` duplo é frágil

**File:** `e2e/crud.spec.js:53, 61, 93, 101, 128, 263, 312`

**Issue:** O padrão `page.getByText('...').locator('..').getByRole('button', ...)` (e `locator('..').locator('..')` nos contratos) navega pela estrutura DOM para encontrar botões co-localizados. Qualquer mudança de markup (adicionar um wrapper div, mudar heading para span) quebra o seletor silenciosamente — o Playwright pode não lançar erro imediatamente, mas seleciona o elemento errado. Padrão particularmente frágil com `locator('..').locator('..')` que faz dois saltos para cima na árvore.

**Fix:** Preferir `data-testid` em componentes de card para botões de ação, ou usar `within()` / `filter()`:

```js
const linhaContrato = page.locator('[data-testid="contrato-row"]').filter({ hasText: 'E2E-Locatário Contratos' })
await linhaContrato.getByRole('button', { name: 'CANC' }).click()
```

---

## Info

### IN-01: `src/app/dashboard/edificios/page.js` — arquivo trivialmente correto

**File:** `src/app/dashboard/edificios/page.js:1-5`

**Issue:** Wrapper de rota com 5 linhas, sem lógica. Correto. Nenhum problema.

**Fix:** N/A.

---

### IN-02: Comentário do `afterAll` em `parcelas.spec.js` descreve ordem FK incorreta

**File:** `e2e/parcelas.spec.js:93`

**Issue:** O comentário na linha 93 descreve a cascata como "parcelas → contratos → unidades → edificios → locatarios → auth user", mas locatários não têm FK para unidades — a ordem correta seria "parcelas → contratos → locatarios → unidades → edificios". O código de cleanup está correto; apenas o comentário está errado. Pode causar confusão ao manter a ordem de teardown.

**Fix:** Corrigir o comentário:

```js
// Cascata FK obrigatória: parcelas → contratos → locatarios → unidades → edificios → auth user
```

---

_Revisado: 2026-05-29_
_Revisor: Claude (gsd-code-reviewer)_
_Profundidade: standard_
