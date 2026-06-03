# Phase 6: Deploy Final e Demo - Pattern Map

**Mapeado:** 2026-06-01
**Arquivos analisados:** 4 (1 código, 1 config, 2 docs/assets)
**Analogias encontradas:** 1 / 4

---

## Classificação de Arquivos

| Arquivo Novo/Modificado | Papel | Fluxo de Dados | Analógo Mais Próximo | Qualidade |
|-------------------------|-------|----------------|----------------------|-----------|
| `scripts/seed-prod-demo.mjs` | utility | batch / CRUD | `scripts/seed-dev-data.mjs` + `e2e/seed.mjs` | role-match (dois analógos complementares) |
| `.gitignore` | config | — | `.gitignore` existente | exato (adição trivial) |
| `DEMO.md` | doc | — | nenhum | sem analógo |
| `DEMO.pdf` / cheat sheet | asset | — | nenhum | sem analógo |

> **Nota de escopo:** As demais ações da fase 6 são operacionais (configurar env vars na Vercel, adicionar Redirect URL no Supabase Dashboard, definir `APP_URL` na Edge Function via dashboard). Essas ações não produzem arquivos de código novos — o código já existe e já lê as variáveis. Não há padrão de código a extrair para elas.

---

## Padrões por Arquivo

### `scripts/seed-prod-demo.mjs` (utility, batch/CRUD)

Este é o único arquivo de código novo a ser criado nesta fase. Dois analógos fornecem partes distintas do padrão — nenhum deles sozinho é suficiente.

---

#### Analógo A: `scripts/seed-dev-data.mjs`

Fornece: **conexão com Supabase de produção, helper `step()`, verificação de existência (idempotência), resumo final**.

**Padrão de conexão prod** (`scripts/seed-dev-data.mjs` linhas 10-26):
```javascript
import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'
import { resolve } from 'path'

config({ path: resolve(process.cwd(), '.env.local') })

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const ROLE_KEY    = process.env.SUPABASE_ROLE_KEY

if (!SUPABASE_URL || !ROLE_KEY) {
  console.error('NEXT_PUBLIC_SUPABASE_URL ou SUPABASE_ROLE_KEY ausentes em .env.local')
  process.exit(1)
}

const admin = createClient(SUPABASE_URL, ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
})
```

**Helper `step()` para logging estruturado** (`scripts/seed-dev-data.mjs` linhas 34-44):
```javascript
async function step(label, fn) {
  process.stdout.write(`  ${label}... `)
  try {
    const result = await fn()
    console.log('ok', result !== undefined ? `(${JSON.stringify(result)})` : '')
    return result
  } catch (e) {
    console.log('ERRO:', e.message)
    throw e
  }
}
```

**Verificação de existência antes de inserir (idempotência)** (`scripts/seed-dev-data.mjs` linhas 95-103):
```javascript
const { data: existente } = await admin
  .from('contratos')
  .select('id')
  .eq('unidade_id', UNIDADE_ID)
  .eq('status', 'ativo')
  .maybeSingle()

if (existente) {
  console.log(`3. Contrato de teste já existe para Sala 101 (id=${existente.id}) — skip`)
} else {
  // ... criar
}
```

**Resumo final** (`scripts/seed-dev-data.mjs` linhas 184-199):
```javascript
console.log('\n=== estado final ===\n')
const [{ count: pendentesCount }, { count: vencidasCount }, contratos] = await Promise.all([
  admin.from('parcelas').select('*', { count: 'exact', head: true }).eq('status', 'pendente'),
  admin.from('parcelas').select('*', { count: 'exact', head: true }).eq('status', 'vencida'),
  admin.from('contratos').select('id, status, data_fim').eq('status', 'ativo'),
])
console.log(`parcelas pendentes : ${pendentesCount}`)
console.log(`parcelas vencidas  : ${vencidasCount}`)
console.log(`contratos ativos   : ${contratos.data?.length}`)
```

---

#### Analógo B: `e2e/seed.mjs`

Fornece: **estrutura completa de criação da cadeia FK** (edifício → unidade → locatário → contrato → parcelas) e o helper `upsertUser` para criar usuário auth com email confirmado.

**`upsertUser` — criar auth.user com email confirmado** (`e2e/seed.mjs` linhas 10-21):
```javascript
async function upsertUser(email, password) {
  const { data: list } = await admin.auth.admin.listUsers()
  const existing = list.users.find(u => u.email === email)
  if (existing) return existing
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true, // obrigatório — sem isso login retorna "Email not confirmed"
  })
  if (error) throw error
  return data.user
}
```

**Cadeia FK: edifício → unidade** (`e2e/seed.mjs` linhas 34-69):
```javascript
const { data: edificio, error: errEdificio } = await admin
  .from('edificios')
  .insert({ nome: 'Edifício Demo', endereco: 'Av. Demo, 100' })
  .select()
  .single()
if (errEdificio) throw errEdificio

const { data: unidade, error: errUnidade } = await admin
  .from('unidades')
  .insert({
    edificio_id: edificio.id,
    nome: 'Sala 101',
    area_m2: 40,
    valor_mensal: 2500,
    valor_visivel: true,
    status: 'alugada',
  })
  .select()
  .single()
if (errUnidade) throw errUnidade
```

**Mix de status de parcelas para demonstração** (`e2e/seed.mjs` linhas 119-147):
```javascript
await admin.from('parcelas').insert([
  {
    contrato_id: contrato.id, numero: 1,
    data_fechamento: ontem, data_vencimento: ontem, data_pagamento: ontem,
    status: 'paga',
  },
  {
    contrato_id: contrato.id, numero: 2,
    data_fechamento: ontem, data_vencimento: ontem, data_pagamento: null,
    status: 'vencida',
  },
  {
    contrato_id: contrato.id, numero: 3,
    data_fechamento: dataInicio, data_vencimento: emSeteDias, data_pagamento: null,
    status: 'pendente',
  },
])
```

---

#### AVISO CRITICO — guard de segurança NÃO deve ser copiado

`e2e/seed.mjs` linhas 156-160 abortam se a URL não contiver `test`, `local` ou `127.0.0.1`:
```javascript
if (!url.includes('test') && !url.includes('local') && !url.includes('127.0.0.1')) {
  console.error('ABORT: URL de Supabase não parece ser de teste:', url)
  process.exit(1)
}
```
**Este guard NÃO deve aparecer em `seed-prod-demo.mjs`** — o script aponta intencionalmente para a URL de produção. O analógo correto para comportamento prod é `seed-dev-data.mjs`, que lê `.env.local` sem esse bloqueio.

---

### `.gitignore` (config)

**Analógo:** `.gitignore` existente no projeto.

Adição trivial — acrescentar `DEMO.md` na seção `#docs`:

```
#docs
/docs/code-reviews
code-review.md
code-review-plan.md
/docs/plans
DEMO.md
```

Nenhum padrão de código a extrair além da convenção de agrupamento por seção existente.

---

## Sem Analógo

| Arquivo | Papel | Fluxo | Motivo |
|---------|-------|-------|--------|
| `DEMO.md` | doc | — | Nenhum roteiro de apresentação existe no repo. Conteúdo definido em D-05/D-06 do CONTEXT.md |
| Cheat sheet imprimível (HTML/PDF) | asset | — | Nenhum asset de apresentação existe. Formato livre — 1 página A4, passos numerados, tempo por seção, fallbacks |

---

## Ações Operacionais (sem arquivo de código)

As ações abaixo são configurações externas — o código já as suporta, bastam os valores corretos nos dashboards:

| Ação | Onde | Variável / Campo |
|------|------|-----------------|
| Confirmar ou definir env vars de produção | Vercel Dashboard → Environment Variables | `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_JWT`, `SUPABASE_ROLE_KEY`, `SITE_URL=https://romma-alpha.vercel.app` |
| Adicionar Redirect URL permitida | Supabase Dashboard → Authentication → URL Configuration | `https://romma-alpha.vercel.app/**` |
| Definir `APP_URL` para CORS da Edge Function | Supabase Dashboard → Edge Functions → `gerar-parcelas` → Environment | `APP_URL=https://romma-alpha.vercel.app` |

Referência de código existente para context: `src/actions/locatarios.js` linha 13 (`process.env.SITE_URL`) e `supabase/functions/gerar-parcelas/index.ts` linha 6 (`Deno.env.get('APP_URL')`).

---

## Metadados

**Escopo de busca:** `scripts/`, `e2e/`, `src/actions/`, `supabase/functions/`
**Arquivos varridos:** 4 (seed-dev-data.mjs, seed.mjs, locatarios.js, gerar-parcelas/index.ts)
**Data do mapeamento:** 2026-06-01
