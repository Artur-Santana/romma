# Phase 8: Bug Fixes — Research

**Researched:** 2026-06-05
**Domain:** Next.js App Router / Supabase Auth — Correção cirúrgica de bugs em componentes pré-existentes
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**BUG-01 — Revogar Acesso**
- D-01: Investigar causa raiz antes de corrigir. Pode ser guard disparando incorretamente OU FK violation se locatário tiver contratos vinculados.
- D-02: Se locatário pendente tiver contrato vinculado (FK), retornar erro descritivo: "Locatário tem contratos vinculados — encerre-os antes de revogar."
- D-03: Substituir `alert(erroMessage)` na linha 96 de `LocatariosDesktop.js` por `setErro(erroMessage)` renderizado inline na tabela (`font-mono text-[11px] text-danger-fg` abaixo do header da tabela).

**BUG-02 — Estado de Erro Compartilhado**
- D-04: Criar dois estados separados: `erroDelete` (erros de `handleDeletarUnidade`) e `erroEdit` (erros de `handleSalvarUnidade`).
- D-05: `erroEdit` gerenciado em `Unidades.js` e passado via prop `erro` para `UnidadeCard`.
- D-06: `erroDelete` renderizado em `Unidades.js` no nível da lista (acima dos cards), nunca dentro de `UnidadeCard`.
- D-07: Limpar ambos os erros no início de cada nova ação.

**BUG-03 — Status de Convite**
- D-08: Causa raiz confirmada: `/auth/confirm/route.js` nunca atualiza `status_convite` de `'pendente'` → `'aceito'` após verificar o OTP de convite.
- D-09: Fix: após `supabase.auth.verifyOtp({ type: 'invite', token_hash })` bem-sucedido, usar `supabaseAdmin` para `UPDATE locatarios SET status_convite = 'aceito' WHERE usuario_id = <user.id>`.
- D-10: Com BUG-03 corrigido, locatários ativos mostrarão `status_convite = 'aceito'` e o botão REVOGAR não aparecerá para eles. Guard da action está correto.

**BUG-04 — Link de Volta em /unidades**
- D-11: Substituir o `<span>` "Unidades Disponíveis" no `flex justify-between` pelo link `← Voltar`.
- D-12: Implementar como `<Link href="/">← Voltar</Link>`, classes: `font-mono text-[11px] text-fg-4 tracking-[1px] uppercase hover:text-fg-2 transition-colors`.
- D-13: `RealtimeDot` permanece no lado direito do mesmo flex row.

### Claude's Discretion
- Ordem de fix no BUG-03: se `supabase.auth.getUser()` retornar o user após `verifyOtp`, usar diretamente; se não, fazer query em locatarios por email. **[RESOLVIDO em A2/Q2]** — o próprio `verifyOtp` retorna `data.user` no sucesso (não é preciso `getUser()`); o fallback por email é acionado quando o UPDATE por `usuario_id` afeta 0 linhas (linha do locatário existe mas ainda não está vinculada ao `usuario_id`).
- Estratégia de limpeza de estado em BUG-02: `setErroDelete(null)` pode ser chamado no início de `handleSalvarUnidade` também para evitar exibição de erro antigo.

### Deferred Ideas (OUT OF SCOPE)
Nenhum item deferido — discussion stayed within phase scope.

</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| BUG-01 | Proprietário consegue revogar acesso de Locatário sem erro (sem FK violation ou guard incorreto) | Action `revogarConvite` precisa verificar contratos ativos antes de deletar; UI precisa de erro inline |
| BUG-02 | Editar unidade não exibe erro de FK constraint (separar estado de erro entre edit e delete em Unidades.js) | Estado único `erro` em `Unidades.js` linha 35 causa o bug; split em `erroDelete`/`erroEdit` resolve |
| BUG-03 | Status de convite do Locatário (pendente/aceito) exibe corretamente no dashboard | `route.js` nunca executa UPDATE após verifyOtp — todos ficam `'pendente'` no DB; query já seleciona a coluna |
| BUG-04 | Página /unidades tem link funcional de volta para home (/) | JSX do header em `UnidadesPublicas.js` linhas 79–88; trocar `<span>` por `<Link href="/">` |

</phase_requirements>

---

## Summary

Esta fase corrige 4 bugs cirúrgicos sem criar nenhuma tela nova. Todo o código relevante foi lido e verificado diretamente no codebase.

**BUG-01** tem duas partes: (1) a action `revogarConvite` em `src/actions/locatarios.js` não verifica se o locatário tem contratos vinculados antes de tentar deletar — uma FK constraint bloqueia o DELETE silenciosamente ou retorna erro genérico; (2) o componente `LocatariosDesktop.js` usa `alert()` na linha 96 para exibir o erro, que deve ser substituído por erro inline via `setErro`. O guard `status_convite !== 'pendente'` na linha 100 da action está correto conceitualmente, mas com BUG-03 não corrigido, todos os locatários ficam com `'pendente'` — então o guard não estava disparando incorretamente como teorizado. A verdadeira causa de falha do BUG-01 é a FK violation ao tentar deletar locatário com contratos.

**BUG-02** é o mais simples: `Unidades.js` usa um único estado `erro` (linha 35) para tanto `handleDeletarUnidade` quanto `handleSalvarUnidade`. Quando o delete falha, o `erro` é setado; quando o usuário abre o form de edição de outra unidade, o mesmo `erro` aparece dentro de `UnidadeCard` via prop. O fix é separar em `erroDelete` e `erroEdit`.

**BUG-03** é a causa raiz mais crítica: `src/app/auth/confirm/route.js` chama `supabase.auth.verifyOtp` (linha 15) e redireciona para o portal, mas nunca executa o UPDATE em `locatarios.status_convite`. A coluna existe no schema (migration `20260520100000`) com DEFAULT `'pendente'`. A query `getLocatarios()` já seleciona `status_convite` (linha 16 de `queries-client.js`). O fix é adicionar o UPDATE usando `supabaseAdmin` após o `verifyOtp` bem-sucedido — usando `data.user.id` retornado diretamente pelo `verifyOtp` (ver Q2/A2 RESOLVIDO).

**BUG-04** é puramente visual: o header de `UnidadesPublicas.js` (linhas 79–88) tem um `<span>` com texto "Unidades Disponíveis" no lado esquerdo do flex row. Esse span deve ser substituído por `<Link href="/">← Voltar</Link>` com as classes CSS especificadas na UI-SPEC.

**Primary recommendation:** Executar os 4 fixes na ordem BUG-03 → BUG-01 → BUG-02 → BUG-04, pois BUG-03 afeta o comportamento observado de BUG-01.

---

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| BUG-01: Verificação FK antes de revogar | API / Backend (Server Action) | — | Validação de integridade referencial pertence à camada server |
| BUG-01: Exibição de erro inline | Frontend Client Component | — | Estado de UI (`setErro`) pertence ao componente `LocatariosDesktop.js` |
| BUG-02: Split de estado de erro | Frontend Client Component | — | `Unidades.js` é o dono do estado; UnidadeCard recebe via prop |
| BUG-03: Update de status_convite | API / Backend (Route Handler) | Database | Route handler inicia; supabaseAdmin executa UPDATE |
| BUG-04: Link de navegação | Frontend Client Component | — | JSX puro em `UnidadesPublicas.js` |

---

## Standard Stack

### Core — Já instalado, sem novos pacotes

| Library | Version | Purpose | Relevância para fase |
|---------|---------|---------|----------------------|
| Next.js App Router | ^16.2.4 | Framework | Route handler + Server Actions + Link |
| @supabase/supabase-js | ^2.99.2 | Cliente DB/Auth | verifyOtp, supabaseAdmin UPDATE |
| React | 19.2.4 | UI | useState, componentes existentes |

**Esta fase não instala nenhum pacote novo.**

### Alternativas Consideradas

Nenhuma — fase de correção cirúrgica. Todos os padrões já estão estabelecidos no codebase.

---

## Package Legitimacy Audit

**Nenhum pacote novo é instalado nesta fase.**

| Package | Registry | Age | Downloads | Source Repo | slopcheck | Disposition |
|---------|----------|-----|-----------|-------------|-----------|-------------|
| — | — | — | — | — | N/A | N/A |

**Packages removed due to slopcheck [SLOP] verdict:** nenhum
**Packages flagged as suspicious [SUS]:** nenhum

---

## Architecture Patterns

### System Architecture Diagram

```
BUG-01:
  [LocatariosDesktop.js] --handleRevogar()--> [revogarConvite (Server Action)]
       ↓ setErro() inline                          ↓ query contratos FK check
  [Tabela UI — erro inline]               [supabaseAdmin.delete locatarios]
                                          [supabaseAdmin.deleteUser]

BUG-02:
  [Unidades.js] --handleDeletarUnidade()--> [deletarUnidade action] --> erroDelete state
  [Unidades.js] --handleSalvarUnidade()--> [editarUnidade action] --> erroEdit state
       ↓ erroDelete renderiza acima da lista          ↓ erroEdit passa via prop erro para UnidadeCard

BUG-03:
  [/auth/confirm/route.js]
       ↓ supabase.auth.verifyOtp({ type: 'invite', token_hash }) → { data: { user }, error }
       ↓ supabaseAdmin UPDATE locatarios SET status_convite='aceito' WHERE usuario_id = data.user.id
       ↓ se 0 linhas afetadas → fallback UPDATE por email (data.user.email)
       ↓ redirect → /portal/dashboard

BUG-04:
  [UnidadesPublicas.js header]
  <div flex justify-between>
    [ANTES: <span>Unidades Disponíveis</span>]
    [DEPOIS: <Link href="/">← Voltar</Link>]
    <RealtimeDot />
  </div>
```

### Estrutura de Arquivos Afetados

```
src/
├── app/
│   └── auth/
│       └── confirm/
│           └── route.js          # BUG-03: adicionar UPDATE status_convite
├── actions/
│   └── locatarios.js             # BUG-01: verificar FK contratos antes de deletar
└── components/
    ├── features/
    │   ├── LocatariosDesktop.js  # BUG-01: substituir alert() por setErro() inline
    │   ├── Unidades.js           # BUG-02: split erroDelete / erroEdit
    │   └── UnidadesPublicas.js   # BUG-04: substituir <span> por <Link>
    └── ui/
        └── UnidadeCard.js        # BUG-02: sem alteração (recebe prop erro já correto)
```

### Padrões do Projeto Relevantes para Esta Fase

**Pattern 1: Server Action com verificação FK**

```javascript
// Padrão atual — revogarConvite src/actions/locatarios.js linha 91+
// A action já busca o locatário antes de deletar. O fix é adicionar
// verificação de contratos vinculados:
const { count } = await supabaseAdmin
  .from('contratos')
  .select('*', { count: 'exact', head: true })
  .eq('locatario_id', id)
    // Sem filtro de status: FK bloqueia qualquer contrato, independente de status

if (count > 0) return {
  status: 400,
  erroMessage: 'Locatário tem contratos vinculados — encerre-os antes de revogar.'
}
```

**Pattern 2: Erro inline em tabela (substituindo alert)**

```javascript
// LocatariosDesktop.js — handleRevogar() deve usar setErro ao invés de alert
// Antes (linha 95-96):
//   } else { alert(erroMessage ?? "Erro ao revogar convite.") }
// Depois:
  } else { setErro(erroMessage ?? "Erro ao revogar convite.") }

// E no JSX, após o header da tabela (após linha 118):
{erro && (
  <div className="px-5 py-2 font-mono text-[11px] text-danger-fg border-t border-border-3">
    {erro}
  </div>
)}
```

**Pattern 3: Split de estado de erro em Unidades.js**

```javascript
// Antes (linha 35): const [erro, setErro] = useState(null)
// Depois:
const [erroDelete, setErroDelete] = useState(null)
const [erroEdit, setErroEdit] = useState(null)

// handleDeletarUnidade → setErroDelete(result.erroMessage)
// handleSalvarUnidade → setErroEdit(result.erroMessage)
// Prop para UnidadeCard: erro={erroEdit} (não erroDelete)
// erroDelete renderiza acima do div.flex.flex-col.gap-0.border
```

**Pattern 4: UPDATE status_convite no route handler (com fallback por email)**

```javascript
// src/app/auth/confirm/route.js — após verifyOtp bem-sucedido com type === 'invite'
import supabaseAdmin from "@/lib/supabaseAdmin"

// verifyOtp retorna data.user no sucesso (Q2/A2 RESOLVIDO via auth-js line 1125).
const { data, error } = await supabase.auth.verifyOtp({ type, token_hash })
// ... guard de erro redireciona ...
if (type === 'invite' && data?.user) {
  // Caminho primário: vincular por usuario_id
  const { data: rows } = await supabaseAdmin
    .from('locatarios')
    .update({ status_convite: 'aceito' })
    .eq('usuario_id', data.user.id)
    .select('id')
  // Fallback: se 0 linhas afetadas, a linha do locatário existe mas usuario_id
  // ainda não foi vinculado — atualizar por email E gravar usuario_id.
  if (!rows || rows.length === 0) {
    await supabaseAdmin
      .from('locatarios')
      .update({ status_convite: 'aceito', usuario_id: data.user.id })
      .eq('email', data.user.email)
  }
}
```

**Pattern 5: Link de volta em UnidadesPublicas.js**

```javascript
// Import já disponível? Verificar se Link está importado — se não, adicionar:
import Link from 'next/link'

// Substituir no JSX (linha 81-83):
// ANTES:
//   <span className="font-mono text-[11px] text-fg-5 tracking-[1px] uppercase">
//     Unidades Disponíveis
//   </span>
// DEPOIS:
<Link
  href="/"
  className="font-mono text-[11px] text-fg-4 tracking-[1px] uppercase hover:text-fg-2 transition-colors"
>
  ← Voltar
</Link>
```

### Anti-Patterns a Evitar

- **Não modificar `StatusBadge.js`:** O componente está correto. O bug é nos dados (BUG-03), não na apresentação.
- **Não criar novo estado `erroRevogar` separado:** Usar o estado `erro` existente em `LocatariosDesktop.js` — já é usado para outros erros do componente (convite, edição). O erro de revogar entra no mesmo state.
- **Não importar `supabaseAdmin` no route.js via path alternativo:** Usar `@/lib/supabaseAdmin` que já tem `'server-only'` e funciona em route handlers.
- **Não usar `middleware.js`:** O projeto usa `proxy.js` conforme CLAUDE.md.
- **Não acionar o fallback por "user null":** quando `data.user` é null, `data.session` também é null e a URL de invite não carrega email — não há email para consultar. O fallback correto é acionado por **0 linhas afetadas no UPDATE por usuario_id** (linha existe mas não vinculada), usando `data.user.email` que SÓ existe quando `data.user` é não-nulo.

---

## Don't Hand-Roll

| Problema | Não construir | Usar em vez | Por quê |
|----------|--------------|-------------|---------|
| Verificação de FK antes de delete | Query customizada sem padrão | `supabase.from('contratos').select('*', { count: 'exact', head: true }).eq('locatario_id', id)` | Padrão já usado em `queries-client.js` (`countRegistros`) |
| Update de registro após auth event | Custom webhook / trigger | `supabaseAdmin.from('locatarios').update()` diretamente no route handler | Mais simples, sem infra adicional; RLS bypass via admin |
| Erro inline em tabela | Toast externo | Estado React + renderização condicional JSX | Padrão já estabelecido no componente |

---

## Common Pitfalls

### Pitfall 1: Estado `erro` compartilhado em `LocatariosDesktop.js`

**O que dá errado:** `LocatariosDesktop.js` tem um único estado `erro` usado para erros de convite, edição E revogar. Ao adicionar `setErro` para o revogar (BUG-01), o erro pode aparecer no form de convite ou edição se não for limpo corretamente.

**Por que acontece:** O componente mistura fluxos (convidar, editar, revogar) com estado único de erro.

**Como evitar:** Limpar `setErro("")` no início de `handleRevogar` e garantir que o erro inline da tabela seja separado visualmente do erro dos modals. O erro de revogar deve aparecer na tabela, não no modal de edição (que já tem `{erro && ...}` nas linhas 281-283).

**Sinais de alerta:** Erro de revogar aparecendo dentro do modal de edição.

### Pitfall 2: `supabase.auth.getUser()` retorna null após `verifyOtp` em alguns fluxos

**O que dá errado:** Após `verifyOtp`, o cliente `supabase` criado com `createServer()` pode não ter a sessão estabelecida no mesmo request — depende de como o cookie é gerenciado.

**Por que acontece:** O `createServer()` usa `@supabase/ssr` que lê cookies do request. O `verifyOtp` pode não escrever o cookie antes de `getUser()` ser chamado.

**Como evitar:** **[RESOLVIDO — Q2/A2]** Não depender de `getUser()`. O próprio `verifyOtp` retorna `{ data: { user, session }, error }` e `exchangeCodeForSession` retorna `{ data: { user, session }, error }` — usar `data.user.id` diretamente, eliminando o problema de timing de cookie. [VERIFIED: auth-js GoTrueClient.js linha 1125 e GoTrueClient.d.ts linha 324]

**Sinais de alerta:** `user` é null após verifyOtp bem-sucedido — usar `const { data, error } = await supabase.auth.verifyOtp(...)` e ler `data.user` (não chamar `getUser()`).

### Pitfall 3: FK em `contratos` — qual status verificar

**O que dá errado:** Verificar apenas contratos com `status = 'ativo'` pode deixar passar locatários com contratos `encerrados` ou `cancelados` que ainda têm FK. A FK é na tabela `contratos.locatario_id`, não filtrada por status.

**Por que acontece:** O DELETE em `locatarios` é bloqueado por qualquer contrato vinculado (FK sem ON DELETE CASCADE), independente do status.

**Como evitar:** Verificar se existe qualquer contrato vinculado — `count > 0` **sem filtro de status**. [VERIFIED: migration 20250101000000] A FK `contratos.locatario_id` é `REFERENCES public.locatarios(id)` sem `ON DELETE CASCADE` — qualquer contrato vinculado (independente de status) bloqueia o DELETE.

**Sinais de alerta:** Delete falha mesmo após encerrar contrato.

### Pitfall 4: `erroDelete` persistindo ao abrir form de edição

**O que dá errado:** Após um erro de delete, o usuário clica em "Editar" outra unidade. O `erroDelete` ainda visível acima da lista confunde — parece que a edição falhou.

**Por que acontece:** Os dois fluxos (delete e edit) são independentes mas o erro delete persiste na tela.

**Como evitar:** Limpar `setErroDelete(null)` no início de `handleSalvarUnidade` e `handleEditarUnidade` (conforme Discretion D-39).

### Pitfall 5: Fallback de UPDATE acionado pelo gatilho errado

**O que dá errado:** Acionar o fallback por email em `if (!data.user)` torna o fallback inalcançável e incoerente: quando `data.user` é null, `data.session` também é null e a URL de invite (token_hash + type) não carrega email — `data.user.email` seria `undefined` e `.eq('email', undefined)` não casa nenhuma linha.

**Por que acontece:** O cenário "user null" só ocorre em erro (que já redireciona para /login), então não há email para consultar nesse caminho.

**Como evitar:** O fallback por email deve ser acionado quando o **UPDATE por `usuario_id` afeta 0 linhas** (linha do locatário existe mas `usuario_id` ainda não está vinculado). Nesse momento `data.user` é não-nulo, então `data.user.email` está disponível. O fallback grava `usuario_id` junto com `status_convite`, completando o vínculo. Assim o UPDATE de BUG-03 SEMPRE completa no fluxo real — nunca "fica manual".

**Sinais de alerta:** Código com `if (!data.user) { ...query por email... }` — gatilho incoerente; `.eq('email', undefined)`.

---

## Code Examples

Verificados por leitura direta do codebase — sem inferência de training data:

### BUG-01: Verificação FK (src/actions/locatarios.js)

```javascript
// [VERIFIED: codebase read — locatarios.js linha 91+]
// Inserir ANTES do delete, após a verificação de status_convite (linha 100):
const { count, error: countErr } = await supabaseAdmin
  .from('contratos')
  .select('*', { count: 'exact', head: true })
  .eq('locatario_id', id)

if (countErr) return { status: 500, erroMessage: countErr.message }
if (count > 0) return {
  status: 400,
  erroMessage: 'Locatário tem contratos vinculados — encerre-os antes de revogar.'
}
// ... continua com delete
```

### BUG-03: verifyOtp com captura de user + fallback por email (src/app/auth/confirm/route.js)

```javascript
// [VERIFIED: codebase read — route.js linha 12-22]
// [VERIFIED: auth-js GoTrueClient.js linha 1125 — verifyOtp retorna { data: { user, session }, error }]
// Modificação do bloco token_hash:
if (token_hash && type) {
  const { data, error } = await supabase.auth.verifyOtp({ type, token_hash })
  if (error) {
    return NextResponse.redirect(new URL("/login?error=invite_invalid", request.url))
  }
  if (type === 'invite' && data?.user) {
    const { data: rows } = await supabaseAdmin
      .from('locatarios')
      .update({ status_convite: 'aceito' })
      .eq('usuario_id', data.user.id)
      .select('id')
    if (!rows || rows.length === 0) {
      // linha existe mas usuario_id não vinculado — vincular por email
      await supabaseAdmin
        .from('locatarios')
        .update({ status_convite: 'aceito', usuario_id: data.user.id })
        .eq('email', data.user.email)
    }
  }
  if (type === "recovery") {
    return NextResponse.redirect(new URL("/auth/reset-password", request.url))
  }
  return NextResponse.redirect(new URL("/portal/dashboard", request.url))
}
```

### BUG-02: Split de estado (Unidades.js)

```javascript
// [VERIFIED: codebase read — Unidades.js linha 35]
// ANTES: const [erro, setErro] = useState(null)
// DEPOIS:
const [erroDelete, setErroDelete] = useState(null)
const [erroEdit, setErroEdit] = useState(null)

// handleDeletarUnidade (linha 81):
async function handleDeletarUnidade(id) {
  setErroDelete(null)
  setErroEdit(null)
  const result = await deletarUnidade(id)
  if (result.status === 200) {
    setUnidades(await getUnidades() ?? [])
  } else {
    setErroDelete(result.erroMessage)
  }
}

// handleSalvarUnidade (linha 91):
async function handleSalvarUnidade(id) {
  setErroDelete(null)
  setErroEdit(null)
  const result = await editarUnidade(id, formEdit)
  if (result.status === 200) {
    setEditandoId(null)
    resetFormEdit()
    setUnidades(await getUnidades() ?? [])
  } else {
    setErroEdit(result.erroMessage)
  }
}

// No JSX — ANTES do div da lista (linha 271):
{erroDelete && (
  <div className="bg-[var(--danger-bg2)] border-l-2 border-l-danger-fg px-4 py-3 font-mono text-[13px] text-danger-fg mb-4">
    {erroDelete}
  </div>
)}

// Prop para UnidadeCard (linha 287): erro={erroEdit}
```

---

## State of the Art

| Abordagem antiga | Abordagem atual | Impacto |
|-----------------|-----------------|---------|
| `alert()` para erros de UI | `setErro()` + renderização inline | alert é API do browser bloqueante — inline é mais UX-friendly |
| Estado único de erro para múltiplas operações | Estado separado por operação | Evita vazamento de contexto entre operações distintas |

---

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| ~~A1~~ | ~~A FK constraint em `contratos.locatario_id` não tem ON DELETE CASCADE~~  **VERIFICADO** — `REFERENCES public.locatarios(id)` sem CASCADE confirmado em `20250101000000_initial_schema.sql` | Common Pitfalls 3 | N/A — fato confirmado |
| ~~A2~~ | ~~`supabase.auth.verifyOtp()` retorna `{ data: { user }, error }` com o user populado no sucesso~~ **VERIFICADO** — [auth-js GoTrueClient.js linha 1125] `verifyOtp` retorna `this._returnResult({ data: { user, session }, error: null })` no sucesso; tipo `AuthResponse` (types.d.ts linha 171) confirma `data: { user: User \| null; session }`. `exchangeCodeForSession` (GoTrueClient.d.ts linha 324) retorna `AuthTokenResponse` com `data.user: User` (não-nulo no sucesso). | Code Examples BUG-03 | N/A — fato confirmado. Usar `data.user.id` direto; fallback por email só quando UPDATE por usuario_id afeta 0 linhas |

**A1 e A2 verificados.** Nenhuma assumption pendente requer atenção em execução.

---

## Open Questions (RESOLVED)

1. **FK constraint em contratos.locatario_id tem CASCADE? — RESOLVIDO**
   - [VERIFIED: migration 20250101000000_initial_schema.sql linha 51] `locatario_id uuid NOT NULL REFERENCES public.locatarios(id)` — sem `ON DELETE` clause = PostgreSQL padrão `NO ACTION` (equivalente a `RESTRICT`)
   - Conclusão: qualquer DELETE em `locatarios` com contratos vinculados **falha com FK violation**, independente do status do contrato
   - O count-check antes do delete é necessário e correto conforme D-02

2. **`supabase.auth.verifyOtp` retorna user no mesmo objeto? — RESOLVIDO**
   - [VERIFIED: auth-js GoTrueClient.js linha 1125] No sucesso, `verifyOtp` retorna `this._returnResult({ data: { user, session }, error: null })`, onde `user`/`session` vêm da resposta do endpoint `/verify` via xform `_sessionResponse`. Para `type=invite` bem-sucedido, o endpoint retorna sessão + user, então **`data.user` é populado**.
   - [VERIFIED: auth-js types.d.ts linha 171] `AuthResponse = { data: { user: User | null; session: Session | null }, error: null } | { data: {...null}, error: AuthError }` — no sucesso `data.user` está disponível; quando há erro, `data.user` e `data.session` são ambos null juntos.
   - [VERIFIED: auth-js GoTrueClient.d.ts linha 324] `exchangeCodeForSession(authCode): Promise<AuthTokenResponse>` e `AuthTokenResponse` tem `data.user: User` (não-nulo no sucesso) — então o caminho `code` também usa `data.user.id` direto, sem `getUser()` (dispensando o problema de timing de cookie do Pitfall 2).
   - **Conclusão:** Usar `const { data, error } = await supabase.auth.verifyOtp(...)` e ler `data.user.id` diretamente. Não chamar `getUser()`. O fallback por email NÃO é acionado por "user null" (cenário inalcançável fora de erro, e sem email disponível nesse caso) — é acionado quando o **UPDATE por `usuario_id` afeta 0 linhas** (linha do locatário existe mas não vinculada), usando `data.user.email` (disponível pois `data.user` é não-nulo) para completar o vínculo. Ver Pitfall 5.

---

## Environment Availability

Esta fase é puramente de correção de código e configuração — sem dependências externas novas.

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| @supabase/supabase-js | BUG-03 (supabaseAdmin) | ✓ | ^2.99.2 | — |
| next/link | BUG-04 | ✓ — [VERIFIED: UnidadesPublicas.js linhas 1-8] import ausente no arquivo, deve ser adicionado | ^16.2.4 | — |

**Missing dependencies with no fallback:** nenhuma

---

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Playwright ^1.60.0 |
| Config file | `playwright.config.js` (raiz do projeto) |
| Quick run command | `npx playwright test e2e/dashboard.spec.js --project=chromium` |
| Full suite command | `npx playwright test` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| BUG-01 | Revogar convite completa sem erro, locatário some da lista | E2E | `npx playwright test e2e/crud.spec.js --project=chromium` | ✅ exists |
| BUG-02 | Erro de delete não aparece no form de edição | E2E (manual observação) | `npx playwright test e2e/crud.spec.js --project=chromium` | ✅ exists |
| BUG-03 | Status badge mostra "Convite aceito" após login do locatário | E2E | `npx playwright test e2e/auth-confirm.spec.js --project=chromium` | ✅ exists |
| BUG-04 | Link ← Voltar navega para / | E2E smoke | `npx playwright test e2e/dashboard-smoke.spec.js --project=chromium` | ✅ exists |

### Sampling Rate

- **Por task commit:** `npx playwright test e2e/dashboard-smoke.spec.js --project=chromium`
- **Por wave merge:** `npx playwright test e2e/ --project=chromium`
- **Phase gate:** Suite completa verde antes de `/gsd-verify-work`

### Wave 0 Gaps

[VERIFIED: spec files lidos] Status real dos gaps:
- [ ] `e2e/crud.spec.js` — cobre CRUD de locatários (convidar/editar) mas **não cobre revogar convite (BUG-01)** nem erro de delete/edit separados (BUG-02). Wave 0 deve adicionar esses cenários.
- [ ] `e2e/auth-confirm.spec.js` — cobre apenas redirecionamentos de erro (token inválido / sem params). **Não cobre atualização de status_convite (BUG-03).** Wave 0 deve adicionar cenário de aceite de convite.
- [ ] `e2e/dashboard-smoke.spec.js` — adicionar verificação do link ← Voltar em /unidades (BUG-04)

---

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | sim (BUG-03) | supabase.auth.verifyOtp — biblioteca oficial |
| V3 Session Management | sim (BUG-03) | Supabase SSR cookie management |
| V4 Access Control | sim (BUG-01) | Guard `isProprietario()` em server action |
| V5 Input Validation | sim (BUG-01) | UUID_RE regex já presente na action |
| V6 Cryptography | não | Sem mudanças criptográficas |

### Known Threat Patterns

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Revogar locatário sem autorização | Elevation of Privilege | Guard `isProprietario()` já presente — não remover |
| UPDATE status_convite sem RLS | Tampering | Usar supabaseAdmin (service role) — RLS bypass intencional para route handler server-side |
| FK violation expondo info interna | Information Disclosure | Retornar mensagem genérica amigável, não erro raw do Postgres |
| Fallback por email vinculando usuario_id de terceiro | Spoofing | `data.user.email` vem da sessão verificada por verifyOtp, não de parâmetro de query — o email é do convite que o próprio user aceitou |

---

## Project Constraints (from CLAUDE.md)

- **JavaScript puro** — sem TypeScript em nenhum arquivo novo
- **`'use client'`** em feature components com hooks/eventos — já presente em todos os arquivos afetados
- **`'use server'`** em actions — já presente em `locatarios.js`
- **`proxy.js`** ao invés de `middleware.js` — não afeta esta fase
- **Erros:** variável `erro` (português), não `error`
- **Server Actions retornam** `{ status: 200 }` ou `{ status: 500, erroMessage: '...' }` — manter
- **Supabase Admin** (`supabaseAdmin`) importado via `@/lib/supabaseAdmin` — `'server-only'` já garantido
- **Commits via conventional commits** com scope e gitmoji
- **Branch antes do primeiro commit** — obrigatório

---

## Sources

### Primary (HIGH confidence)

- Leitura direta de `src/actions/locatarios.js` — lógica completa de `revogarConvite` verificada
- Leitura direta de `src/components/features/LocatariosDesktop.js` — `alert()` confirmado na linha 96, estado `erro` confirmado
- Leitura direta de `src/components/features/Unidades.js` — estado único `erro` confirmado na linha 35
- Leitura direta de `src/app/auth/confirm/route.js` — ausência do UPDATE confirmada
- Leitura direta de `src/lib/queries-client.js` — `getLocatarios()` seleciona `status_convite` confirmado (linha 16)
- Leitura direta de `src/components/ui/StatusBadge.js` — mapa de status com `aceito` e `pendente_convite` confirmado
- Leitura direta de `src/components/features/UnidadesPublicas.js` — `<span>` "Unidades Disponíveis" confirmado (linha 81-83)
- Leitura direta de `supabase/migrations/20260520100000_locatarios_status_convite.sql` — coluna `status_convite` com DEFAULT 'pendente' confirmada
- Leitura direta de `node_modules/@supabase/auth-js/dist/module/GoTrueClient.js` (linha 1097-1133) e `GoTrueClient.d.ts` (linha 324, 374) e `lib/types.d.ts` (linha 171-193) — return shape de `verifyOtp` e `exchangeCodeForSession` confirmado (Q2/A2)

### Secondary (MEDIUM confidence)

- `08-CONTEXT.md` — decisões locked do /gsd-discuss-phase
- `08-UI-SPEC.md` — contrato visual aprovado

### Tertiary (LOW confidence)

Nenhum item de baixa confiança — todos os claims foram verificados diretamente no codebase.

---

## Metadata

**Confidence breakdown:**
- Standard Stack: HIGH — sem novos pacotes; stack verificada via leitura de arquivos
- Architecture: HIGH — todos os arquivos relevantes lidos, causa raiz confirmada em cada bug
- Pitfalls: HIGH — pitfalls derivados da leitura real do código, não de training data
- Assumptions: A1 e A2 VERIFICADOS via leitura direta (migration + auth-js SDK) — nenhum item pendente

**Research date:** 2026-06-05
**Valid until:** 2026-06-18 (banca) — código estável, sem risco de drift
