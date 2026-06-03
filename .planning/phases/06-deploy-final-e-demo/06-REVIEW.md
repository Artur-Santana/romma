---
phase: 06-deploy-final-e-demo
reviewed: 2026-06-01T00:00:00Z
depth: standard
files_reviewed: 3
files_reviewed_list:
  - scripts/seed-prod-demo.mjs
  - demo-cheat-sheet.html
  - .gitignore
findings:
  critical: 2
  warning: 3
  info: 2
  total: 7
status: issues_found
---

# Phase 06: Code Review Report

**Reviewed:** 2026-06-01
**Depth:** standard
**Files Reviewed:** 3
**Status:** issues_found

## Summary

Revisão dos três artefatos entregues na fase 06: script de seed de produção (`seed-prod-demo.mjs`), cheat sheet HTML para a banca (`demo-cheat-sheet.html`) e atualização do `.gitignore`.

O script de seed tem dois problemas críticos que podem causar falha silenciosa ou comportamento incorreto durante a demo: (1) `admin.auth.admin.listUsers()` é paginado — sem tratar a paginação, usuários além dos primeiros 1000 não são encontrados, levando a uma tentativa de `createUser` duplicado com erro; (2) a senha do locatário de demonstração está hardcoded em texto claro no script de produção. Os três warnings indicam falha no tratamento de erros de queries que precedem etapas críticas e um race condition potencial se o seed for interrompido a meio.

O cheat sheet HTML e o `.gitignore` não apresentam defeitos de correctness — as observações são de qualidade menor.

---

## Critical Issues

### CR-01: `listUsers()` não trata paginação — cria usuário duplicado silenciosamente em bases com >1000 usuários

**File:** `scripts/seed-prod-demo.mjs:63` e `:215`

**Issue:** `admin.auth.admin.listUsers()` retorna por padrão apenas a primeira página (1000 usuários). Se a base de auth já tiver mais de 1000 registros, `list.users.find(u => u.email === email)` retorna `undefined` mesmo que o usuário exista — `upsertUser` então tenta `createUser` e recebe erro `User already registered` (ou cria duplicata dependendo da versão do cliente). O mesmo padrão é repetido na linha 215 para buscar o `locatarioAuthUser` após o upsert.

Hoje a base provavelmente tem menos de 1000 usuários, mas o padrão é estruturalmente incorreto: o script vai quebrar silenciosamente se o `.find()` na linha 215 retornar `undefined` — a linha 217 lança `throw new Error(...)` e o seed inteiro falha, sem aviso sobre o motivo real (paginação).

**Fix:**
```js
// Substituir listUsers() simples por paginação completa
async function listAllUsers() {
  let users = []
  let page = 1
  const perPage = 1000
  while (true) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage })
    if (error) throw error
    users = users.concat(data.users)
    if (data.users.length < perPage) break
    page++
  }
  return users
}

// Em upsertUser — linha 63:
async function upsertUser(email, password) {
  const allUsers = await listAllUsers()
  const existing = allUsers.find(u => u.email === email)
  if (existing) return existing
  // ...
}

// Na linha 215:
const allUsers = await listAllUsers()
const locatarioAuthUser = allUsers.find(u => u.email === DEMO_EMAIL)
```

---

### CR-02: Senha de demonstração hardcoded em texto claro em script de produção

**File:** `scripts/seed-prod-demo.mjs:207`

**Issue:** `const DEMO_PASSWORD = 'Demo1234!'` está hardcoded no script que aponta para a base de produção. O script lê `SUPABASE_ROLE_KEY` do `.env.local` (correto), mas a senha da conta demo está no código-fonte. Qualquer pessoa com acesso ao repositório — incluindo qualquer colaborador futuro ou leak de histórico git — obtém a senha real do Locatário de demonstração que pode logar em `romma-alpha.vercel.app/locatario`.

Embora o `.gitignore` exclua `DEMO.md`, o script `seed-prod-demo.mjs` está rastreado pelo git (`git log` não mostra exclusão). Se a senha for commitada, ela fica no histórico permanentemente.

**Fix:**
```js
// Mover para variável de ambiente — adicionar a .env.local:
// DEMO_LOCATARIO_PASSWORD=Demo1234!

const DEMO_PASSWORD = process.env.DEMO_LOCATARIO_PASSWORD
if (!DEMO_PASSWORD) {
  console.error('DEMO_LOCATARIO_PASSWORD ausente em .env.local')
  process.exit(1)
}

// Adicionar ao .env.example (sem valor):
// DEMO_LOCATARIO_PASSWORD=
```

---

## Warnings

### WR-01: Erros de queries de verificação de existência não são tratados — falha silenciosa mascarada como "já existe"

**File:** `scripts/seed-prod-demo.mjs:85-90`, `:107-112`, `:144-149`, `:179-183`, `:259-264`

**Issue:** Em todos os blocos de verificação de existência o padrão é:

```js
const { data: exEdificio1 } = await admin
  .from('edificios')
  .select('id')
  .eq('nome', 'Edifício Comercial Aurora')
  .maybeSingle()
```

O `error` é descartado (desestruturado e ignorado). Se a query falhar (rede, permissão RLS, timeout), `data` será `null` e o código cai no branch `else` tentando inserir um registro que pode já existir, resultando em constraint error — ou pior, criando duplicata se não houver unique constraint. Durante a banca, onde o tempo é curto e a rede pode ser instável, um erro silencioso aqui pode corromper o estado da demo.

**Fix:**
```js
const { data: exEdificio1, error: errEx1 } = await admin
  .from('edificios')
  .select('id')
  .eq('nome', 'Edifício Comercial Aurora')
  .maybeSingle()
if (errEx1) throw new Error(`Falha ao verificar Edifício Aurora: ${errEx1.message}`)
```

---

### WR-02: Race condition estrutural — unidade marcada `disponivel` antes do contrato ser criado

**File:** `scripts/seed-prod-demo.mjs:270-305`

**Issue:** O fluxo é: (1) marcar unidade como `disponivel`, (2) criar contrato, (3) marcar como `alugada`. Se o step 2 falhar (erro de DB, timeout), a unidade fica com `status='disponivel'` mesmo que já existisse um contrato encerrado ou em estado inconsistente. Na próxima execução do seed, o gate de verificação (linha 259) verifica apenas se existe `contrato ativo` — se o contrato foi criado mas o insert de parcelas falhou, o gate detecta o contrato e pula tudo, deixando a unidade com status incorreto (`disponivel` ou `alugada` dependendo de onde falhou).

O script é declarado idempotente, mas não é completamente seguro a falhas parciais.

**Fix:** Adicionar verificação explícita do status da unidade no resumo final, e/ou documentar no cabeçalho do script que falhas parciais requerem inspeção manual do estado da `Sala 101` antes de re-executar:

```js
// No resumo final (linha 355+), adicionar:
const { data: statusUni } = await admin
  .from('unidades')
  .select('status')
  .eq('id', unidade101Id)
  .single()
console.log(`Sala 101 status    : ${statusUni?.status}`)
// Aviso se contrato ativo mas unidade não alugada
if (contratos.data?.length && statusUni?.status !== 'alugada') {
  console.warn('AVISO: contrato ativo mas unidade não está alugada — verificar manualmente.')
}
```

---

### WR-03: Resumo final usa contagem global de parcelas, não filtrada por contrato da demo

**File:** `scripts/seed-prod-demo.mjs:357-379`

**Issue:** As queries de contagem no resumo final (linhas 364-368) contam **todas** as parcelas da base, não apenas as do contrato de demonstração recém-criado. Se a base já tiver outros contratos com parcelas (de testes anteriores ou dados reais), o output do resumo vai mostrar números inflados que não refletem o estado do seed. Isso pode confundir durante a verificação pré-banca.

**Fix:**
```js
// Filtrar pelo contrato_id quando disponível — requer salvar o id do contrato
// Se o contrato já existia (branch skip), buscar o id antes do Promise.all:
const { data: contratoAtivo } = await admin
  .from('contratos')
  .select('id')
  .eq('unidade_id', unidade101Id)
  .eq('status', 'ativo')
  .single()

const [{ count: pagasCount }, ...] = await Promise.all([
  admin.from('parcelas').select('*', { count: 'exact', head: true })
    .eq('status', 'paga').eq('contrato_id', contratoAtivo.id),
  // ...
])
```

---

## Info

### IN-01: `demo-cheat-sheet.html` referencia URL sem protocolo seguro explicitado na subtítulo

**File:** `demo-cheat-sheet.html:204`

**Issue:** A linha `romma-alpha.vercel.app` no subtítulo não tem `https://` prefixado, enquanto o rodapé na linha 308 também omite o protocolo. O arquivo HTML impresso é usado como referência durante a banca — um membro da banca tentando digitar a URL pode hesitar sem o protocolo explícito.

**Fix:** Alterar para `https://romma-alpha.vercel.app` nas duas ocorrências (linhas 204 e 308). Não afeta funcionalidade — classificado como info.

---

### IN-02: `.gitignore` exclui `DEMO.md` mas o arquivo já existe no working tree e nunca foi rastreado

**File:** `.gitignore:59`

**Issue:** `DEMO.md` está no `.gitignore` e a verificação confirma que o arquivo nunca foi commitado (`git log -- DEMO.md` retorna vazio). A proteção funciona corretamente. Porém, o arquivo `DEMO.md` existe localmente com o email real do proprietário (`artur.santana@contasimples.com`) e instrui a "definir senha antes da banca via Supabase" — o que é coerente com CR-02 (senha não hardcoded no DEMO.md, mas hardcoded no seed). Isso confirma que a intenção de design era nunca comprometer a senha no código, mas a implementação do seed contradiz essa intenção.

**Fix:** Nenhuma ação necessária no `.gitignore` — a exclusão está correta. A ação necessária é CR-02 (mover senha para env var).

---

_Reviewed: 2026-06-01_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
