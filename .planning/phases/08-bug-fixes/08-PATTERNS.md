# Phase 8: Bug Fixes — Pattern Map

**Mapeado:** 2026-06-05
**Arquivos analisados:** 5 modificações (sem arquivos novos)
**Análogos encontrados:** 5 / 5

> Nota: Esta fase modifica apenas arquivos existentes. Todos os "análogos" são padrões
> já presentes no mesmo arquivo ou em um sibling imediato — não há novo arquivo sem precedente.

---

## File Classification

| Arquivo Modificado | Papel | Data Flow | Análogo Principal | Qualidade |
|-------------------|-------|-----------|-------------------|-----------|
| `src/actions/locatarios.js` | server action | request-response | in-file: `revogarConvite` linhas 97-100 + `queries-client.js` linhas 31-39 (`countRegistros`) | in-file |
| `src/components/features/LocatariosDesktop.js` | client component | request-response | in-file: `setErro` linha 57, `{erro && ...}` linhas 281-283 e 379-381 | in-file |
| `src/components/features/Unidades.js` | client component | request-response | in-file: bloco danger-box linhas 251-255, padrão set/clear erro | in-file |
| `src/app/auth/confirm/route.js` | route handler | request-response | sibling: `supabaseAdmin.from(...).update(...).eq(...)` em `locatarios.js` linha 65 | sibling |
| `src/components/features/UnidadesPublicas.js` | client component | event-driven | sibling: `src/components/ui/Header.js` linhas 1 e 26-27 | sibling |

---

## Pattern Assignments

### `src/actions/locatarios.js` — BUG-01: verificação FK antes de deletar

**Análogo in-file:** `revogarConvite` linhas 97-100 (padrão select-single → guard → return 400)
**Análogo sibling:** `src/lib/queries-client.js` linhas 31-39 (`countRegistros` — `.select('*', { count: 'exact', head: true }).eq()`)

**Padrão de guard existente** (linhas 97-100):
```javascript
const { data: loc, error: fetchErr } = await supabaseAdmin
    .from('locatarios').select('usuario_id, status_convite').eq('id', id).single()
if (fetchErr || !loc) return { status: 404, erroMessage: 'Locatário não encontrado.' }
if (loc.status_convite !== 'pendente') return { status: 400, erroMessage: 'Convite não está pendente.' }
```

**Padrão countRegistros** (`queries-client.js` linhas 35-39):
```javascript
const { count } = await supabase
    .from(tabela)
    .select('*', { count: 'exact', head: true})
    .eq(coluna, valor)
return count
```

**Fix a inserir** — logo após a linha 100 (guard `status_convite`), antes do delete:
```javascript
const { count, error: countErr } = await supabaseAdmin
    .from('contratos')
    .select('*', { count: 'exact', head: true })
    .eq('locatario_id', id)
if (countErr) return { status: 500, erroMessage: countErr.message }
if (count > 0) return {
    status: 400,
    erroMessage: 'Locatário tem contratos vinculados — encerre-os antes de revogar.'
}
```

**Padrão de retorno da action** (linha 45-48 e 50-55 como referência):
```javascript
return { status: 200 }
// ou
return { status: 500, erroMessage: error.message }
```

---

### `src/components/features/LocatariosDesktop.js` — BUG-01 UI: substituir alert() por setErro inline

**Análogo in-file:** `handleConvidar` linha 57 (setErro com erroMessage) + renderização `{erro && ...}` linha 281-283 / 379-381

**Padrão setErro existente** (linha 57):
```javascript
setErro(erroMessage ?? "Erro ao enviar convite.")
```

**Padrão de renderização de erro inline existente** (linhas 281-283):
```javascript
{erro && (
  <span className="font-mono text-[11px] text-danger-fg">{erro}</span>
)}
```

**Fix na função handleRevogar** — linha 96, substituir `alert(...)` por:
```javascript
} else {
  setErro(erroMessage ?? "Erro ao revogar convite.")
}
```

**Novo bloco JSX de erro** — inserir após o header da tabela (após linha 118), conforme UI-SPEC:
```javascript
{erro && (
  <div className="px-5 py-2 font-mono text-[11px] text-danger-fg border-t border-border-3">
    {erro}
  </div>
)}
```

**Limpar erro no início de handleRevogar** — inserir `setErro("")` antes da chamada à action (linha 92).

---

### `src/components/features/Unidades.js` — BUG-02: split de estado de erro

**Análogo in-file:** bloco danger-box existente (linhas 251-255) + padrão `setErro(null)` / `setErro(result.erroMessage)`

**Bloco danger-box existente** (linhas 251-255) — usar como modelo visual para `erroDelete`:
```javascript
{erro && (
  <div className="bg-[var(--danger-bg2)] border-l-2 border-l-danger-fg px-4 py-3 font-mono text-[12px] text-danger-fg mb-4">
    {erro}
  </div>
)}
```

**Padrão atual de estado único** (linha 35) — a ser substituído:
```javascript
const [erro, setErro] = useState(null)  // ANTES — remover
```

**Substituição** (dois estados separados):
```javascript
const [erroDelete, setErroDelete] = useState(null)
const [erroEdit, setErroEdit] = useState(null)
```

**Padrão de limpeza no início de cada handler** — modelar a partir das linhas 84/94 (onde `setErro(null)` já aparece):
- `handleDeletarUnidade`: `setErroDelete(null); setErroEdit(null)` no início
- `handleSalvarUnidade`: `setErroDelete(null); setErroEdit(null)` no início
- `handleEditarUnidade`: `setErroDelete(null)` no início (prevenir exibição de erro stale)

**Atribuição do erro por handler:**
- `handleDeletarUnidade` linha 87: `setErroDelete(result.erroMessage)`
- `handleSalvarUnidade` linha 99: `setErroEdit(result.erroMessage)`

**Prop para UnidadeCard** (linha 286) — manter `erro={erroEdit}` (não `erroDelete`):
```javascript
erro={erroEdit}
```

**Renderização de erroDelete** — inserir acima do `<div className="flex flex-col gap-0 border...">` (linha 271):
```javascript
{erroDelete && (
  <div className="bg-[var(--danger-bg2)] border-l-2 border-l-danger-fg px-4 py-3 font-mono text-[13px] text-danger-fg mb-4">
    {erroDelete}
  </div>
)}
```

---

### `src/app/auth/confirm/route.js` — BUG-03: update status_convite após verifyOtp

**Análogo sibling:** `src/actions/locatarios.js` linha 65 — `supabaseAdmin.from(...).update(...).eq(...)`

**Padrão update via supabaseAdmin** (`locatarios.js` linha 65):
```javascript
const { error } = await supabaseAdmin.from('locatarios').update({ ... }).eq('id', id)
```

**Import a adicionar** no topo de `route.js` (após a importação existente de `createServer`):
```javascript
import supabaseAdmin from "@/lib/supabaseAdmin"
```

**Bloco token_hash existente** (linhas 12-23) — estrutura de referência para saber onde inserir:
```javascript
if (token_hash && type) {
  const { error } = await supabase.auth.verifyOtp({ type, token_hash })
  if (error) {
    return NextResponse.redirect(new URL("/login?error=invite_invalid", request.url))
  }
  // >>> INSERIR AQUI o update de status_convite <<<
  if (type === "recovery") { ... }
  return NextResponse.redirect(...)
}
```

**Fix — mudar desestruturação de `verifyOtp` e adicionar update:**
```javascript
const { data, error } = await supabase.auth.verifyOtp({ type, token_hash })
if (error) {
  return NextResponse.redirect(new URL("/login?error=invite_invalid", request.url))
}
if (type === 'invite' && data?.user) {
  await supabaseAdmin
    .from('locatarios')
    .update({ status_convite: 'aceito' })
    .eq('usuario_id', data.user.id)
}
```

---

### `src/components/features/UnidadesPublicas.js` — BUG-04: link de volta para /

**Análogo sibling:** `src/components/ui/Header.js` linhas 1 e 26-27

**Padrão de import** (`Header.js` linha 1):
```javascript
import Link from "next/link";
```

**Padrão de uso** (`Header.js` linhas 26-27):
```javascript
<Link href="/unidades" className="animacao-underscore content-center">
  PROPRIEDADES
</Link>
```

**Import a adicionar** no topo de `UnidadesPublicas.js` (após os imports existentes, linhas 1-8):
```javascript
import Link from 'next/link'
```

**Elemento a substituir** (linhas 81-83):
```javascript
// ANTES — remover:
<span className="font-mono text-[11px] text-fg-5 tracking-[1px] uppercase">
  Unidades Disponíveis
</span>

// DEPOIS — conforme UI-SPEC:
<Link
  href="/"
  className="font-mono text-[11px] text-fg-4 tracking-[1px] uppercase hover:text-fg-2 transition-colors"
>
  ← Voltar
</Link>
```

`<RealtimeDot />` na linha 84 permanece sem alteração.

---

## Shared Patterns

### Contrato de retorno de Server Actions
**Fonte:** `src/actions/locatarios.js` (padrão em todos os exports)
**Aplicar em:** qualquer ajuste no arquivo `locatarios.js`
```javascript
return { status: 200 }
// ou
return { status: 400 | 401 | 403 | 404 | 500, erroMessage: '...' }
// ATENÇÃO: erroMessage (não errorMessage) — convenção do projeto
```

### supabaseAdmin — import e uso server-side
**Fonte:** `src/lib/supabaseAdmin.js` + `src/actions/locatarios.js` linha 3
**Aplicar em:** `src/app/auth/confirm/route.js` (BUG-03)
```javascript
import supabaseAdmin from "@/lib/supabaseAdmin"
// supabaseAdmin tem 'server-only' — seguro em route handlers e Server Actions
// Nunca importar em Client Components
```

### Erro inline em Client Component
**Fonte:** `src/components/features/LocatariosDesktop.js` linhas 34, 57, 281-283
**Aplicar em:** BUG-01 UI fix em `LocatariosDesktop.js`
```javascript
const [erro, setErro] = useState("")
// Setar:
setErro(erroMessage ?? "Mensagem padrão.")
// Limpar no início do próximo handler:
setErro("")
// Renderizar:
{erro && (
  <span className="font-mono text-[11px] text-danger-fg">{erro}</span>
)}
```

### Padrão UUID guard em Server Actions
**Fonte:** `src/actions/locatarios.js` linha 7 e 96
**Aplicar em:** qualquer novo guard adicionado em `locatarios.js`
```javascript
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
if (!UUID_RE.test(id)) return { status: 400, erroMessage: 'ID inválido.' }
```

---

## No Analog Found

Nenhum arquivo desta fase ficou sem análogo. Todos os 5 arquivos têm padrões extraídos
diretamente do codebase (in-file ou sibling imediato).

---

## Metadata

**Escopo de busca:** `src/actions/`, `src/components/features/`, `src/app/auth/`, `src/lib/`, `src/components/ui/`
**Arquivos lidos:** 8 (5 alvos + `supabaseAdmin.js`, `queries-client.js`, `Header.js`)
**Data de mapeamento:** 2026-06-05
