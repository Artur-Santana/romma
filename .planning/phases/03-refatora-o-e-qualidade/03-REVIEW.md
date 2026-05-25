---
phase: 03-refatora-o-e-qualidade
reviewed: 2026-05-25T22:30:00Z
depth: standard
files_reviewed: 7
files_reviewed_list:
  - src/actions/contratos.js
  - src/actions/locatarios.js
  - src/components/features/Contratos.js
  - src/components/features/GestaoEdificios.js
  - src/components/features/Unidades.js
  - src/components/features/portal/PortalDashboard.js
  - src/components/ui/LogoutButton.js
findings:
  critical: 1
  warning: 6
  info: 5
  total: 12
status: issues_found
---

# Phase 03: Code Review Report

**Reviewed:** 2026-05-25T22:30:00Z
**Depth:** standard
**Files Reviewed:** 7
**Status:** issues_found

## Summary

Revisão dos 7 arquivos modificados na fase 03 (security fixes D-04/D-05, lint fixes 03-02, LogoutButton 03-03). As correções principais — SELECT-first em cancelar/encerrarContrato e allowlist em editarLocatario — estão corretas e fecham as vulnerabilidades alvo. O padrão `useEffect` com função nomeada interna foi aplicado corretamente em ambos os componentes.

Foram encontrados 1 CRÍTICO, 6 WARNINGS e 5 INFOs. O achado crítico é um TypeError latente em `gerarParcelas` (pré-existente, não introduzido na fase 03, mas em arquivo modificado). Os warnings cobrem gaps de validação, inconsistência de null-safety e comportamento de UX no fluxo de criação de contrato.

---

## Critical Issues

### CR-01: TypeError em gerarParcelas — session pode ser null após getUser() passar

**File:** `src/actions/contratos.js:133-136`
**Issue:** `supabase.auth.getSession()` pode retornar `{ data: { session: null } }` em alguns cenários de cookie expirado ou race condition mesmo quando `getUser()` retorna usuário válido (getUser valida via request, getSession lê do cookie local). A linha 136 desestrutura `session.access_token` sem nenhuma guarda, causando `TypeError: Cannot read properties of null (reading 'access_token')` que burbulha para fora da Server Action sem retornar a estrutura `{ status, erroMessage }` esperada.

**Fix:**
```js
const { data: { session } } = await supabase.auth.getSession()
if (!session) return { status: 401, erroMessage: 'Sessão expirada. Faça login novamente.' }
const { error } = await supabaseJWT.functions.invoke('gerar-parcelas', {
  body: { contrato_id: contratoId },
  headers: { Authorization: 'Bearer ' + session.access_token }
})
```

---

## Warnings

### WR-01: PortalDashboard — setParcelas sem fallback ?? []

**File:** `src/components/features/portal/PortalDashboard.js:31`
**Issue:** `setParcelas(parc)` não tem `?? []`. Se `getParcelasPortal` retornar `null` (sem contrato ou query vazia), `ParcelsTable` receberá `null` como `parcelas` e quebrará no map. CLAUDE.md é explícito: "sempre `?? []` em retornos de array". Todos os outros arrays no projeto usam `?? []` (ver Contratos.js:48-51).

**Fix:**
```js
const parc = await getParcelasPortal(ct.id)
setParcelas(parc ?? [])
```

### WR-02: GestaoEdificios e Unidades — setEdificios/setUnidades sem ?? [] em carregarEdificios e fetchDados

**File:** `src/components/features/GestaoEdificios.js:24,29` | `src/components/features/Unidades.js:39-40,87-88`
**Issue:** As chamadas adicionadas/preservadas na fase 03-02 não aplicam `?? []`. Em `carregarEdificios()` (linha 24): `setEdificios(await getEdificios())` — sem fallback. No `fetchDados` interno do useEffect (linha 29): idem. Em `Unidades.js`, `carregarDados()` (linhas 39-40) e `fetchDados` interno (linhas 87-88): mesma omissão. Se a query falhar e retornar null, o estado ficará null e todos os `.map()` subsequentes quebrarão.

**Fix (padrão uniforme para todos os casos):**
```js
setEdificios(await getEdificios() ?? [])
setUnidades(await getUnidades() ?? [])
setListaEdificios(await getEdificios() ?? [])
```

### WR-03: editarLocatario — allowlist sem validação de conteúdo

**File:** `src/actions/locatarios.js:56-57`
**Issue:** O fix D-05 correto previne mass assignment, mas nenhum campo da allowlist é validado antes do UPDATE. `nome_razao_social` pode ser string vazia, `tipo` pode ser valor fora do enum `{pf,pj}`, `documento` pode ser string com letras. Contraste com `criarContrato` que valida enum `status` e formato UUID. Garbage-in chega direto ao banco e pode quebrar constraints downstream.

**Fix:**
```js
const { nome_razao_social, tipo, documento, email, telefone } = form
if (!nome_razao_social?.trim()) return { status: 400, erroMessage: 'Nome é obrigatório.' }
if (!['pf', 'pj'].includes(tipo)) return { status: 400, erroMessage: 'Tipo inválido.' }
// (email, documento, telefone: validação opcional mas recomendada)
```

### WR-04: handleCriarContrato — erro de gerarParcelas escondido pelo resetForm/setShowForm

**File:** `src/components/features/Contratos.js:69-78`
**Issue:** Quando `gerarParcelas` retorna erro (linha 70), `setErro(...)` é chamado, mas nas linhas 71-75 o código continua: chama `resetForm()` e `setShowForm(false)`. O formulário fecha e o estado de erro desaparece da tela antes que o usuário possa lê-lo. O contrato foi criado, mas sem parcelas — o usuário perde o feedback de erro e não sabe que precisa acionar gerar parcelas manualmente.

**Fix:**
```js
const parcResult = await gerarParcelas(result.data.id)
if (parcResult.status !== 200) {
  setErro(parcResult.erroMessage ?? "Erro ao gerar parcelas.")
  setLoading(false)
  return  // mantém formulário aberto com o erro visível
}
// só reseta/fecha em sucesso total
```

### WR-05: LogoutButton — ausência de router.refresh() após signOut

**File:** `src/components/ui/LogoutButton.js:22`
**Issue:** `router.push('/login')` após signOut não invalida o cache de Server Components do Next.js App Router. Conteúdo autenticado pode continuar visível em cache até um hard refresh. O padrão correto no Next.js + Supabase App Router é `signOut → router.refresh() → router.push()`. Isso garante que os Server Components sejam re-renderizados sem dados de sessão antes do redirect.

**Fix:**
```js
router.refresh()
router.push("/login")
```

### WR-06: criarContrato — operações não atômicas (órfão possível)

**File:** `src/actions/contratos.js:30-43`
**Issue:** O INSERT em `contratos` (linha 30) e o UPDATE em `unidades` (linha 37) são duas operações separadas sem transação. Se o UPDATE de unidade falhar, o contrato existe no banco com `unidade_id` correto mas a unidade permanece `disponivel`, permitindo criação de segundo contrato na mesma unidade. O mesmo padrão existe em `convidarLocatario` (rollback de deleteUser na linha 32 não verifica seu próprio erro). Supabase/Postgres suporta RPC transacional; para Fase 4, considerar extrair para Edge Function atômica.

**Fix (mitigação imediata — rollback manual):**
```js
const { error: errUnidade } = await supabaseAdmin
  .from('unidades').update({ status: 'alugada' }).eq('id', unidade_id)
if (errUnidade) {
  // reverter contrato criado
  await supabaseAdmin.from('contratos').delete().eq('id', data.id)
  return { status: 500, erroMessage: errUnidade.message }
}
```

---

## Info

### IN-01: GestaoEdificios — heading de debug hardcoded

**File:** `src/components/features/GestaoEdificios.js:92`
**Issue:** `<h1>Pagina de dashboard!</h1>` é um placeholder de desenvolvimento nunca removido. Aparece na UI em produção como texto incoerente. Também possui erro de ortografia ("Pagina" sem acento).

**Fix:** Remover a linha 92 ou substituir por conteúdo adequado ao componente.

### IN-02: LogoutButton — mismatch entre nome do arquivo e export

**File:** `src/components/ui/LogoutButton.js:9`
**Issue:** O arquivo se chama `LogoutButton.js` mas o componente exportado é `SairButton`. Funciona via default export, mas o mismatch torna debugging e buscas por componente mais difíceis. React DevTools exibirá "SairButton", não "LogoutButton".

**Fix:** Renomear a função para `LogoutButton` ou o arquivo para `SairButton.js`. Preferir consistência com o nome do arquivo (convenção do projeto).

### IN-03: carregarDados em Unidades.js é dead code

**File:** `src/components/features/Unidades.js:38-41`
**Issue:** A função `carregarDados()` (declarada na linha 38) não é chamada por nenhum handler — `handleDeletarUnidade` e `handleSalvarUnidade` chamam `getUnidades()` diretamente. Confirmado no summary 03-02. A função está preservada intencionalmente, mas é dead code. Pode causar confusão sobre qual função de recarga usar.

**Fix:** Remover `carregarDados` e padronizar todos os handlers para `getUnidades()` diretamente, ou ao contrário — fazer handlers chamarem `carregarDados()` e remover chamadas diretas.

### IN-04: Funções async sem await — handleEditar e handleEditarUnidade

**File:** `src/components/features/GestaoEdificios.js:56` | `src/components/features/Unidades.js:51`
**Issue:** `handleEditar(edificio)` e `handleEditarUnidade(unidade)` são declaradas como `async function` mas não contêm nenhum `await`. A keyword `async` é desnecessária — pode confundir sobre a natureza assíncrona da função.

**Fix:** Remover `async` das declarações: `function handleEditar(edificio)` e `function handleEditarUnidade(unidade)`.

### IN-05: Inconsistência de padrão authGuard entre contratos.js e locatarios.js

**File:** `src/actions/locatarios.js:51-54,63-66,74-76`
**Issue:** `contratos.js` centraliza a verificação de autenticação/autorização em `authGuard()` (linhas 11-17). `locatarios.js` replica as mesmas 3 linhas manualmente em cada função (`editarLocatario`, `deletarLocatario`, `revogarConvite`). Não é uma regressão desta fase, mas vai contra o padrão estabelecido no mesmo arquivo de actions irmão.

**Fix:** Extrair `authGuard()` para `@/lib/auth` (junto com `isProprietario`) ou replicar o helper local em `locatarios.js` como feito em `contratos.js`.

---

_Reviewed: 2026-05-25T22:30:00Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
