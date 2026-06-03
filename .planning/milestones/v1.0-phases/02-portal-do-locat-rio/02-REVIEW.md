---
phase: 02-portal-do-locatario
reviewed: 2026-05-22T00:00:00Z
depth: standard
files_reviewed: 12
files_reviewed_list:
  - e2e/portal.spec.js
  - e2e/global-teardown.js
  - e2e/seed.mjs
  - e2e/auth-redirect.spec.js
  - src/app/portal/dashboard/page.js
  - src/components/features/portal/PortalDashboard.js
  - src/app/login/page.js
  - src/proxy.js
  - src/app/portal/layout.js
  - src/components/features/portal/ContratoCard.js
  - src/components/features/portal/ParcelsTable.js
  - src/lib/queries-client.js
findings:
  critical: 3
  warning: 6
  info: 3
  total: 12
status: issues_found
---

# Fase 02: Relatório de Code Review — Portal do Locatário

**Revisado:** 2026-05-22
**Profundidade:** standard
**Arquivos revisados:** 12
**Status:** issues_found

---

## Sumário

Revisão cobre toda a implementação do Portal do Locatário: proxy de autenticação (`src/proxy.js`), layout e página do portal, componentes `ContratoCard` e `ParcelsTable`, queries de dados, página de login, e a suíte de testes E2E (seed, teardown, specs). A implementação está funcionalmente coerente, mas apresenta três problemas críticos que afetam segurança ou corretude, além de seis avisos de robustez e três itens de qualidade.

---

## Critical Issues

### CR-01: `updateParcelaStatus` é uma mutação exposta em `queries-client.js` (cliente browser)

**Arquivo:** `src/lib/queries-client.js:120-128`

**Issue:** A função `updateParcelaStatus` executa um `UPDATE` na tabela `parcelas` diretamente do cliente browser usando a chave anon. Conforme a convenção do projeto (CLAUDE.md), mutações devem ir exclusivamente por Server Actions que usam `supabaseAdmin`. Qualquer usuário autenticado que descubra essa função pode chamar `.update()` contornando qualquer lógica de negócio — marcando parcelas como pagas sem data de pagamento, ou alterando o status de parcelas de contratos que não são seus, dependendo do que as políticas RLS permitem para UPDATE com a chave anon.

**Fix:** Mover a lógica de atualização de parcela para uma Server Action em `src/actions/parcelas.js`:

```js
// src/actions/parcelas.js
'use server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'

export async function atualizarParcelaStatus(parcelaId, status, dataPagamento) {
  // authGuard aqui
  const updates = { status }
  if (dataPagamento !== undefined) updates.data_pagamento = dataPagamento
  const { error } = await supabaseAdmin
    .from('parcelas')
    .update(updates)
    .eq('id', parcelaId)
  if (error) return { status: 500, erroMessage: error.message }
  return { status: 200 }
}
```

Remover `updateParcelaStatus` de `queries-client.js`.

---

### CR-02: `getLocatarioByUserId` retorna `null` silenciosamente quando `.maybeSingle()` encontra múltiplas linhas — mas o seed demonstra que duplicatas existem

**Arquivo:** `src/lib/queries-client.js:85-92`

**Issue:** `.maybeSingle()` lança exceção (retorna `error`, não `data`) quando a query retorna mais de uma linha. O seed (`e2e/seed.mjs:60-74`) inclui lógica explícita para remover locatários duplicados antes de inserir, o que confirma que a tabela `locatarios` não tem constraint `UNIQUE` em `usuario_id`. Se um locatário tiver mais de um registro (por bug no seed ou race condition), `getLocatarioByUserId` retornará `null` (pois o erro é ignorado — `data` será `null`) e o usuário verá a tela "Nenhum contrato ativo" em vez de um erro explicativo. O dado errado é apresentado como estado válido.

**Fix:** Checar o erro retornado e propagá-lo:

```js
export async function getLocatarioByUserId(userId) {
  const { data, error } = await supabase
    .from('locatarios')
    .select('id, usuario_id, nome_razao_social, tipo, documento, email, telefone')
    .eq('usuario_id', userId)
    .maybeSingle()
  if (error) throw new Error(error.message)
  return data
}
```

A mesma omissão existe em `getContratoAtivoByLocatario` (linha 130-138) e `getUnidade`/`getEdificio` com `.single()` (linhas 94-110) — nenhum deles checa `error`.

---

### CR-03: `proxy.js` faz duas chamadas RPC `is_proprietario` independentes por request — e a segunda pode retornar resultado diferente (TOCTOU)

**Arquivo:** `src/proxy.js:33-36` e `src/proxy.js:44-47`

**Issue:** Quando o path começa com `/dashboard`, o proxy faz `supabase.rpc('is_proprietario')` (linha 33). Quando começa com `/portal`, faz outra chamada independente (linha 44). Apesar de improvável em produção, em ambiente de testes ou com propagação eventual de permissões, o resultado entre as duas chamadas pode divergir. Mais importante: a estrutura duplicada é uma fonte de bug de manutenção — qualquer mudança futura em regras de acesso precisa ser aplicada em ambos os blocos. Além disso, o `config.matcher` cobre apenas `/dashboard/:path*` e `/portal/:path*`, o que significa que a raiz `/dashboard` e `/portal` não são protegidas pelo matcher (Next.js trata `:path*` como um ou mais segmentos).

**Fix:** Consolidar a lógica de permissão e corrigir o matcher:

```js
// proxy.js — versão consolidada
const { data: { user } } = await supabase.auth.getUser()

const onDashboard = request.nextUrl.pathname.startsWith('/dashboard')
const onPortal = request.nextUrl.pathname.startsWith('/portal')

if ((onDashboard || onPortal) && !user) {
  return NextResponse.redirect(new URL('/login', request.url))
}

if (onDashboard || onPortal) {
  const { data: isProprietario } = await supabase.rpc('is_proprietario')
  if (onDashboard && !isProprietario) return NextResponse.redirect(new URL('/', request.url))
  if (onPortal && isProprietario) return NextResponse.redirect(new URL('/dashboard', request.url))
}

// matcher
export const config = {
  matcher: ['/dashboard', '/dashboard/:path*', '/portal', '/portal/:path*'],
}
```

---

## Warnings

### WR-01: `PortalDashboard` não trata o caso em que `user` é `null` após `supabase.auth.getUser()` — `setLoading(false)` nunca é chamado

**Arquivo:** `src/components/features/portal/PortalDashboard.js:22-25`

**Issue:** Se `getUser()` retornar `user = null` (sessão expirada, por exemplo), o código executa `return` sem chamar `setLoading(false)`. O estado `loading` permanece `true` para sempre e o usuário vê um spinner infinito. O layout (`portal/layout.js`) também faz `redirect('/login')` no servidor, mas essa proteção client-side fica quebrada.

**Fix:**

```js
const { data: { user } } = await supabase.auth.getUser()
if (!user) { setLoading(false); return }
```

---

### WR-02: `getParcelasByContrato` retorna `null` quando nenhuma parcela existe (sem `?? []`)

**Arquivo:** `src/lib/queries-client.js:68-75`

**Issue:** Diferente de `getParcelasPortal` (linha 147 — usa `?? []`) e `getParcelasByContratos` (linha 65 — usa `?? []`), a função `getParcelasByContrato` retorna `data` diretamente sem fallback. Se a query retornar um array vazio ou erro, `data` será `null`, e qualquer chamador que faça `.map()` ou `.length` nesse retorno vai lançar exceção.

**Fix:**

```js
export async function getParcelasByContrato(contratoId) {
  const { data } = await supabase
    .from('parcelas')
    .select('id, numero, data_fechamento, data_vencimento, data_pagamento, status')
    .eq('contrato_id', contratoId)
    .order('numero', { ascending: true })
  return data ?? []
}
```

---

### WR-03: `seed.mjs` é executável diretamente (`node e2e/seed.mjs`) sem guard de ambiente — pode rodar contra o banco de produção

**Arquivo:** `e2e/seed.mjs:137-138`

**Issue:** O arquivo executa `seed()` incondicionalmente quando chamado diretamente. Se `NEXT_PUBLIC_SUPABASE_URL` e `SUPABASE_ROLE_KEY` forem as credenciais de produção (`.env.local` em vez de `.env.test`), o seed insere dados de teste no banco de produção e o teardown os deleta. Não há nenhuma validação do URL ou do ambiente antes de executar.

**Fix:** Adicionar guard de ambiente mínimo:

```js
// Ao final de seed.mjs
if (import.meta.url === `file://${process.argv[1]}`) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
  if (!url.includes('test') && !url.includes('local') && !url.includes('127.0.0.1')) {
    console.error('ABORT: URL de Supabase não parece ser de teste:', url)
    process.exit(1)
  }
  seed().then(() => console.log('seed ok')).catch(e => { console.error(e); process.exit(1) })
}
```

---

### WR-04: `handleForgotPassword` não verifica nem trata o erro retornado por `resetPasswordForEmail`

**Arquivo:** `src/app/login/page.js:186-189`

**Issue:** `supabase.auth.resetPasswordForEmail(email)` pode falhar (rate limit, e-mail inválido, erro de rede). O retorno `{ error }` é ignorado completamente — o status sempre vai para `reset_sent` mesmo quando o envio falha, exibindo ao usuário a mensagem "Verifique sua caixa de entrada" quando na verdade nada foi enviado.

**Fix:**

```js
async function handleForgotPassword(e) {
  e.preventDefault()
  if (!email) { emailRef.current?.focus(); return }
  setStatus("reset_loading")
  const { error } = await supabase.auth.resetPasswordForEmail(email)
  if (error) { setStatus("error"); return }
  setStatus("reset_sent")
}
```

---

### WR-05: `getLocatarios` retorna `status_convite` — coluna que não consta no schema documentado no CLAUDE.md

**Arquivo:** `src/lib/queries-client.js:16-18`

**Issue:** A query `getLocatarios` seleciona `status_convite`, mas o schema em CLAUDE.md não documenta essa coluna na tabela `locatarios`. Se a coluna não existir no banco, a query falha silenciosamente (Supabase retorna erro, `data` fica `null`). Se a coluna existe mas foi adicionada sem atualizar o CLAUDE.md, o contrato de schema está desatualizado.

**Fix:** Verificar se a coluna existe no banco e, se sim, atualizar o schema no CLAUDE.md. Se não existir, remover da query.

---

### WR-06: `global-teardown.js` não remove a `unidade` de teste antes de tentar remover o `edificio`, violando constraints FK

**Arquivo:** `e2e/global-teardown.js:43-49`

**Issue:** O teardown deleta unidades (linha 47) e depois edificios (linha 48) — essa ordem está correta. Porém, o código assume que `unidades.nome === 'Sala 101'` é identificador suficientemente único. Se outro teste ou seed paralelo criar uma unidade com o mesmo nome em um edificio diferente, o teardown pode deletar dados não relacionados ao teste. Além disso, não há verificação se a deleção de edificios falhou por FK com outras tabelas não cobertas pelo teardown.

**Fix:** Usar o `edificio_id` do edificio criado pelo seed como identificador primário, não o nome da unidade. O seed deve retornar/salvar o ID do edificio em um artefato compartilhado (ex: arquivo temporário ou variável global via `globalSetup`).

---

## Info

### IN-01: `"remember"` state em `SignInForm` não tem efeito funcional

**Arquivo:** `src/app/login/page.js:159`

**Issue:** O estado `remember` é renderizado visualmente como um checkbox, mas nunca é passado para `supabase.auth.signInWithPassword()`. O Supabase aceita opções como `{ data: { ...options } }` mas não controla persistência de sessão diretamente dessa forma. A UI promete funcionalidade que não existe.

**Fix:** Remover o checkbox "MANTER SESSÃO ATIVA" da UI, ou implementar a persistência de fato configurando `persistSession` dinamicamente.

---

### IN-02: `PortalDashboard` instancia `supabase` no escopo do módulo (linha 9) fora de qualquer hook

**Arquivo:** `src/components/features/portal/PortalDashboard.js:9`

**Issue:** `const supabase = createClient()` é chamado no escopo do módulo, fora de qualquer hook ou função. Em Next.js App Router com SSR, isso pode causar instâncias compartilhadas entre requests no servidor (embora o componente tenha `'use client'`). O padrão consistente no projeto é instanciar dentro de `useEffect` ou em um módulo singleton. O mesmo padrão existe em `login/page.js:9` — é uma inconsistência de estilo que pode escalar para bugs em contextos SSR mais complexos.

**Fix:** Mover a instanciação para dentro do `useEffect`, ou garantir que `supabase-browser.js` retorne sempre um singleton (verificar implementação do módulo).

---

### IN-03: Teste PORT-03 valida `futura` com `.toHaveCount(0)` mas sem `await`

**Arquivo:** `e2e/portal.spec.js:29`

**Issue:** `await expect(parcelasRegion.getByText(/futura/i)).toHaveCount(0)` — esta linha **tem** `await` (correto). Porém o padrão geral do teste não utiliza `aria-label` para identificar a região de parcelas de forma mais resiliente. `getByRole('region', { name: /HISTÓRICO DE PARCELAS/i })` depende do atributo `aria-label="HISTÓRICO DE PARCELAS"` estar presente em `ParcelsTable.js` (linha 8) — o que está correto. Não é um bug, mas a string de label está hardcoded em dois lugares e qualquer refatoração quebra o teste silenciosamente.

**Fix:** Usar `data-testid="parcelas-table"` (já presente na linha 8 do `ParcelsTable.js`) no teste, eliminando a dependência na string de aria-label:

```js
const parcelasRegion = page.getByTestId('parcelas-table')
```

---

_Revisado: 2026-05-22_
_Revisor: Claude (gsd-code-reviewer)_
_Profundidade: standard_
