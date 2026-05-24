# Phase 3: Refatoração e Qualidade - Research

**Pesquisado:** 2026-05-24
**Domínio:** Correções de lint/segurança em Next.js 16 App Router + Supabase Auth signOut
**Confiança:** HIGH (todos os achados verificados diretamente no código ou no registro npm)

---

## Sumário

Esta fase é predominantemente confirmação e cirurgia de precisão. A auditoria de D-07 a D-10 confirmou que REF-01/02/03/04 estão essencialmente cumpridos nas fases anteriores. Os trabalhos reais se concentram em: (1) dois erros de lint `react-hooks/set-state-in-effect`, (2) dois fixes de segurança HIGH — auth bypass em `cancelarContrato`/`encerrarContrato` e mass assignment em `editarLocatario`, (3) botão de logout no portal do Locatário, e (4) alinhamento do critério DEPL-03 com a realidade do `npm audit`.

**Recomendação principal:** Executar as 5 modificações de arquivo cirurgicamente, ajustar o critério de `npm audit` na documentação para refletir o que é factualmente atingível no Next.js 16.x estável.

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

- **D-01:** Os 2 erros `react-hooks/set-state-in-effect` em GestaoEdificios.js (linha 27-29) e Unidades.js (linha 85-87) DEVEM ser corrigidos — são `errors`, não warnings.
- **D-02:** Os 8 warnings `@next/next/no-img-element` em `src/app/page.js` são deferidos para Fase 4 (VIS-01). DEPL-03 considera "sem warnings críticos" — performance/img é não-crítico. Documentar como exceção conhecida no plano.
- **D-03:** `npm run build` já passa. Objetivo: lint sem errors antes de concluir a fase.
- **D-04:** `cancelarContrato` e `encerrarContrato` em `src/actions/contratos.js` — derivar `unidade_id` server-side via query ao contrato em vez de aceitar do cliente.
- **D-05:** `editarLocatario` em `src/actions/locatarios.js` — aplicar allowlist explícita nos campos do update: `{ nome_razao_social, tipo, documento, email, telefone }`.
- **D-06:** Adicionar botão/link de logout no portal do Locatário. Implementação: `signOut()` via `supabase-browser.js` + `router.push('/login')`. Usar Client Component separado ou wrapper em PortalDashboard.
- **D-07:** REF-01 (código morto em dashboard/page.js) — grep confirma já resolvido. Verificar antes de marcar done.
- **D-08:** REF-02 (supabase-browser em Client Components) — grep confirma já resolvido.
- **D-09:** REF-03 (erroMessage typo) — grep confirma consistente em todos os actions.
- **D-10:** REF-04 (consolidar useState em form objects) — estados `editandoId`, `erro`, `loading` NÃO devem ser consolidados; são estados UI/data, não form state. REF-04 está essencialmente cumprido.

### Claude's Discretion

- Localização exata do botão de logout no portal (TopStrip ou dentro do PortalDashboard).
- Fix exato do `set-state-in-effect` — opções: mover lógica para fora do useEffect, usar `useCallback`, ou `eslint-disable-next-line` com justificativa.

### Deferred Ideas (OUT OF SCOPE)

- `@next/next/no-img-element` warnings (8x em `src/app/page.js`) — deferidos para Fase 4 VIS-01.
- `criarContrato + gerarParcelas` não-atômicos — requer Postgres function/RPC, fora da Fase 3.
- Issues MEDIUM do CONCERNS.md (#6, #7, etc.) — fora do escopo.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Descrição | Suporte da Pesquisa |
|----|-----------|---------------------|
| REF-01 | Limpeza de código morto: remover `useEffect` guard duplicado e `useState(null)` de `usuario` não consumido | Auditoria direta confirmou: nenhuma das ocorrências existe em dashboard/page.js — cumprido nas fases anteriores |
| REF-02 | Migrar `supabase.js` para `supabase-browser.js` em Client Components que restam | grep confirma: nenhum Client Component importa `supabase.js` diretamente — cumprido |
| REF-03 | Padronizar `erroMessage` em todos os Server Actions | lint output + grep confirmam: todos os actions usam `erroMessage` corretamente — cumprido |
| REF-04 | Consolidar `useState` individuais em objetos `form`/`editForm` nos 3 arquivos | `form` e `formEdit` já são objetos nos 3 arquivos; estados `editandoId`, `erro`, `loading` são UI state legítimos — cumprido |
| DEPL-03 | Build limpo — `npm run lint`, `npm run build`, `npm audit --omit=dev` sem erros | `npm run build` passa; lint tem 2 errors (D-01); `npm audit` tem issue crítico documentado abaixo |
</phase_requirements>

---

## Mapa de Responsabilidade Arquitetural

| Capacidade | Camada Primária | Camada Secundária | Racional |
|------------|----------------|-------------------|----------|
| Fix lint (set-state-in-effect) | Frontend / Client Component | — | Regra ESLint no componente React client-side |
| Fix segurança D-04 (auth bypass) | Server Action | Database (Supabase Admin) | Derivar unidade_id server-side via query protegida |
| Fix segurança D-05 (mass assignment) | Server Action | — | Allowlist no payload antes do update |
| Logout portal | Frontend / Client Component | Supabase Auth (browser) | signOut() é operação client-side; cookie cleared pelo @supabase/ssr |
| Auditoria REF-01..04 | Codebase inteiro | — | Verificação de leitura; sem modificações esperadas |

---

## Stack Standard (sem novos pacotes nesta fase)

Nenhum pacote novo é instalado nesta fase. Todos os problemas são resolvidos com o stack existente.

**Verificação de versão atual relevante:**
- `eslint-plugin-react-hooks` — versão a verificar: regra `set-state-in-effect` existe desde v5+ [ASSUMED]
- `@supabase/ssr` `^0.9.0` — `createBrowserClient` + `signOut()` [VERIFIED: leitura direta de supabase-browser.js]
- `next` `16.2.4` → `16.2.6` após `npm audit fix` [VERIFIED: npm view next versions]

---

## Package Legitimacy Audit

> Nenhum pacote novo instalado nesta fase. Seção N/A.

**Pacotes removidos por slopcheck [SLOP]:** nenhum
**Pacotes suspeitos [SUS]:** nenhum

---

## Padrões de Arquitetura

### Diagrama de Fluxo (mudanças desta fase)

```
[Client: GestaoEdificios / Unidades]
  └── useEffect ──> (fix D-01) fetch inline no body do effect
        └── setState dentro do effect (eliminado da chamada externa)

[Client: Contratos.js call site]
  └── cancelarContrato(id)          ← assinatura muda: remove unidade_id
  └── encerrarContrato(id)          ← assinatura muda: remove unidade_id

[Server Action: contratos.js]
  └── cancelarContrato(id)
        └── SELECT unidade_id FROM contratos WHERE id = $id (supabaseAdmin)
        └── UPDATE contratos SET status='cancelado'
        └── UPDATE unidades SET status='disponivel'

[Server Action: locatarios.js]
  └── editarLocatario(id, form)
        └── const { nome_razao_social, tipo, documento, email, telefone } = form
        └── UPDATE locatarios SET (allowlist fields only)

[Client: LogoutButton.js (novo)]
  └── supabase.auth.signOut()
  └── router.push('/login')

[portal/layout.js (Server Component)]
  └── <TopStrip />
  └── <LogoutButton /> ← novo Client Component injetado
```

### Estrutura de Projeto (arquivos afetados)

```
src/
├── actions/
│   ├── contratos.js        # D-04: cancelarContrato, encerrarContrato — remover param unidade_id, derivar server-side
│   └── locatarios.js       # D-05: editarLocatario — allowlist explícita
├── components/
│   ├── features/
│   │   ├── GestaoEdificios.js   # D-01: fix set-state-in-effect
│   │   ├── Unidades.js          # D-01: fix set-state-in-effect
│   │   └── Contratos.js         # D-04: atualizar call sites (unidade_id removido do argumento)
│   └── ui/
│       └── LogoutButton.js      # D-06: novo Client Component (ou inline em PortalDashboard)
└── app/
    └── portal/
        └── layout.js            # D-06: injetar LogoutButton (se colocado no TopStrip) OU
src/components/features/portal/
    └── PortalDashboard.js       # D-06: injetar LogoutButton (se colocado na página)
```

---

## Análise Técnica por Decisão

### D-01: Fix `react-hooks/set-state-in-effect`

**Baseline verificado:** `npm run lint` confirma 2 errors — GestaoEdificios.js:28 e Unidades.js:86. [VERIFIED: leitura direta do output do lint]

**O que a regra diz:** A mensagem do ESLint é explícita: "Calling setState synchronously within an effect can trigger cascading renders". A regra dispara quando `setState` é chamado **indiretamente** via função definida fora do `useEffect`. O problema não é o padrão async/await, mas sim a indireção: `carregarEdificios()` chama `setEdificios` fora do corpo literal do effect. [VERIFIED: leitura da mensagem de erro do lint]

**Padrão que está falhando:**
```javascript
async function carregarEdificios() {
  setEdificios(await getEdificios()); // setState aqui
}
useEffect(() => {
  carregarEdificios(); // indireta — regra dispara aqui
}, []);
```

**Fix recomendado — inline IIFE no body do effect:**
```javascript
useEffect(() => {
  (async () => {
    setEdificios(await getEdificios());
  })();
}, []);
```

**Atenção:** O CONTEXT.md levantou dúvida se o IIFE silencia a regra. A resposta é: **sim, silencia**, porque o `setState` agora ocorre dentro do body literal do effect (dentro da IIFE, que está dentro do useEffect callback). A regra `set-state-in-effect` detecta chamadas de funções externas que fazem setState — quando a lógica fica inline no body do effect, a regra não dispara. [ASSUMED — baseado na leitura da mensagem de erro e comportamento esperado da regra; confidência MEDIUM]

**Alternativa segura se IIFE não silenciar:** `// eslint-disable-next-line react-hooks/set-state-in-effect` com comentário `// fetch-on-mount: padrão estabelecido no projeto`. Esta abordagem é aceitável para padrão fetch-on-mount documentado. O disabling seria na linha que chama a função, não no `setState`.

**Impacto em `carregarEdificios()` como função reutilizada:** GestaoEdificios usa `carregarEdificios()` em 3 outros lugares (após insert, delete, salvar). Esses usos são em handlers de evento, não em effects — a regra NÃO dispara neles. A função deve ser mantida; apenas o `useEffect` precisa ser alterado.

### D-04: Fix auth bypass em `cancelarContrato` / `encerrarContrato`

**Baseline verificado:** `src/actions/contratos.js` linhas 58-85 e 87-113 confirmam que ambas as funções aceitam `unidade_id` como parâmetro e o usam diretamente sem verificar se pertence ao contrato. [VERIFIED: leitura direta do arquivo]

**Impacto de assinatura:** A assinatura pública muda de `cancelarContrato(id, unidade_id)` para `cancelarContrato(id)`. O único call site verificado é `src/components/features/Contratos.js` linhas 108 e 118. [VERIFIED: grep no codebase]

```
src/components/features/Contratos.js:108:
  const result = await cancelarContrato(contrato.id, contrato.unidade_id)
src/components/features/Contratos.js:118:
  const res = await encerrarContrato(contrato.id, contrato.unidade_id)
```

Ambos os call sites devem ser atualizados para remover o segundo argumento.

**Pattern do fix (server-side):**
```javascript
export async function cancelarContrato(id) {
  const { err } = await authGuard()
  if (err) return err
  if (!UUID_RE.test(id)) return { status: 400, erroMessage: 'ID inválido.' }

  // Derivar unidade_id server-side
  const { data: contrato, error: fetchErr } = await supabaseAdmin
    .from('contratos')
    .select('unidade_id')
    .eq('id', id)
    .single()
  if (fetchErr || !contrato) return { status: 404, erroMessage: 'Contrato não encontrado.' }

  const { error } = await supabaseAdmin
    .from('contratos')
    .update({ status: 'cancelado' })
    .eq('id', id)
  if (error) return { status: 500, erroMessage: error.message }

  const { error: errUnidade } = await supabaseAdmin
    .from('unidades')
    .update({ status: 'disponivel' })
    .eq('id', contrato.unidade_id)
  if (errUnidade) return { status: 500, erroMessage: errUnidade.message }

  await supabaseAdmin
    .from('parcelas')
    .delete()
    .eq('contrato_id', id)
    .eq('status', 'futura')

  return { status: 200 }
}
```

O padrão é idêntico para `encerrarContrato` (apenas `status: 'encerrado'`, sem deletar parcelas futuras).

**Nota sobre estilo:** `editarLocatario` em locatarios.js não usa o helper `authGuard()` — inline o check. O plano deve preservar o estilo inline existente nesse arquivo; não expandir escopo para refatorar o padrão.

### D-05: Fix mass assignment em `editarLocatario`

**Baseline verificado:** `src/actions/locatarios.js` linha 56: `.update(form)` sem allowlist. [VERIFIED: leitura direta do arquivo]

**Fix:**
```javascript
export async function editarLocatario(id, form) {
  // ... authGuard inline existente ...
  if (!UUID_RE.test(id)) return { status: 400, erroMessage: 'ID inválido.' }
  const { nome_razao_social, tipo, documento, email, telefone } = form
  const { error } = await supabaseAdmin
    .from('locatarios')
    .update({ nome_razao_social, tipo, documento, email, telefone })
    .eq('id', id)
  if (error) return { status: 500, erroMessage: error.message }
  return { status: 200 }
}
```

### D-06: Logout no portal do Locatário

**Baseline verificado:**
- `portal/layout.js` é Server Component — não pode chamar `signOut()` diretamente. [VERIFIED: leitura direta]
- `TopStrip.js` é Client Component (`'use client'`) — poderia receber lógica de logout, mas atualmente não tem props e é um componente de display puro (timestamp + status). Adicionar logout ao TopStrip mudaria seu propósito semântico.
- `PortalDashboard.js` já é Client Component com `createClient()` instanciado no topo do arquivo — é o lugar mais natural para adicionar logout sem criar nova dependência.

**Recomendação (Claude's Discretion):** Adicionar `LogoutButton` inline no `PortalDashboard.js` como componente local ou separado. O `PortalDashboard` já tem `supabase = createClient()` disponível — reutilizar a mesma instância.

**Pattern canônico com @supabase/ssr no App Router:** [ASSUMED — baseado na leitura do código existente e padrão Supabase]
```javascript
// Dentro de PortalDashboard.js (já é 'use client' com supabase instanciado)
import { useRouter } from 'next/navigation'
const router = useRouter()

async function handleLogout() {
  await supabase.auth.signOut()
  router.push('/login')
}
```

**Nota sobre `router.refresh()` vs `router.push()`:** O `portal/layout.js` verifica `getUser()` a cada render server-side. Após `signOut()`, `router.push('/login')` redireciona para uma nova rota onde o layout não será re-renderizado com sessão antiga. `router.refresh()` re-executa o layout server-side e causaria redirect automático via `redirect('/login')`. Ambas as abordagens funcionam; `router.push('/login')` é mais explícito e consistente com o padrão de `src/app/login/page.js`.

---

## DEPL-03: Situação do `npm audit --omit=dev`

**ACHADO CRÍTICO — requer decisão do plano:** [VERIFIED: execução direta de `npm audit --omit=dev` e `npm audit fix --dry-run`]

### Estado atual (antes desta fase):
- **3 vulnerabilidades:** 1 HIGH (next + múltiplos CVEs de middleware/proxy/cache poisoning), 2 MODERATE (postcss, ws)
- Comando: `npm audit --omit=dev` sai com código de erro 1

### Estado após `npm audit fix` (16.2.4 → 16.2.6):
- `npm audit fix` upgrada Next.js para 16.2.6 (latest stable 16.x)
- **16.2.6 ainda está no range vulnerável:** `next 9.3.4-canary.0 - 16.3.0-canary.5`
- Resultado: **3 HIGH + 7 MODERATE** persistem (principalmente em next, fast-uri, picomatch)
- `npm audit --omit=dev` continua a falhar

### Implicação para DEPL-03:
O critério `npm audit --omit=dev` passa sem vulnerabilidades de alta/crítica severidade **não é atingível** com Next.js 16.x estável, pois todos os patches de segurança estão na linha 17.x (canary range exclui apenas versões pós-16.3.0-canary.5, que não existem como estável).

### Opções para o plano:
1. **Executar `npm audit fix`** (upgrade 16.2.4 → 16.2.6) + **documentar exceção explícita** para as vulnerabilidades residuais de Next.js que não têm fix disponível no 16.x. Critério DEPL-03 ajustado para: "sem vulnerabilidades HIGH/CRITICAL *exceto as de next.js sem fix disponível no 16.x*".
2. **Ignorar vulnerabilidades sem fix** via `npm audit --omit=dev --audit-level=none` — não recomendado para documentação de TCC.
3. **Não rodar `npm audit fix`** e documentar o estado atual como exceção conhecida.

**Recomendação:** Opção 1 — executar `npm audit fix` para upgrade minor do Next.js (16.2.4 → 16.2.6, apenas patch releases, sem breaking changes esperados) e documentar as CVEs de Next.js como exceção conhecida no plano, apontando que a versão estável 16.x não possui fix disponível. O critério de sucesso DEPL-03 deve ser reformulado como "sem vulnerabilidades de alta/crítica *com fix disponível*".

---

## Auditoria REF-01..04

**Comandos de verificação** que o plano deve executar antes de marcar cada item como done:

```bash
# REF-01: código morto em dashboard/page.js
grep -n "useEffect\|useState.*usuario" src/app/dashboard/page.js

# REF-02: supabase.js em Client Components
grep -rn "from.*supabase\.js\|from.*@/lib/supabase'" src/components/ src/app/dashboard/

# REF-03: erroMessage consistente
grep -rn "errorMessage" src/actions/

# REF-04: form objects nos 3 arquivos
grep -n "const \[form" src/components/features/GestaoEdificios.js src/components/features/Unidades.js src/components/features/Locatarios.js
```

Todos indicam cumprimento — mas devem ser executados como gate de verificação no plano.

---

## Armadilhas Comuns

### Pitfall 1: Mudar assinatura sem atualizar todos os call sites
**O que dá errado:** `cancelarContrato(id, unidade_id)` → `cancelarContrato(id)` quebra silenciosamente em TypeScript mas em JS passa o argumento extra sem erro; a action ignora. O call site em Contratos.js ainda envia `contrato.unidade_id` como segundo argumento, mas a action não o usa mais — sem runtime error, mas código inconsistente.
**Por que acontece:** JS não valida arity em chamadas de função.
**Como evitar:** Atualizar Contratos.js:108 e Contratos.js:118 na mesma task que modifica contratos.js.

### Pitfall 2: Fix do lint quebra o reload-after-mutation
**O que dá errado:** Ao inlinear o fetch no useEffect, a função `carregarEdificios()` usada nos handlers (após insert/delete/save) pode ser afetada se a refatoração mover lógica incorretamente.
**Por que acontece:** O fix muda apenas o `useEffect` — a função async externa deve ser **mantida** para os handlers.
**Como evitar:** Apenas o body do useEffect muda; `carregarEdificios()` permanece como está.

### Pitfall 3: LogoutButton em Server Component
**O que dá errado:** `portal/layout.js` é Server Component. Adicionar `onClick` diretamente nele causa erro de compilação.
**Por que acontece:** Server Components não podem ter handlers de evento.
**Como evitar:** Criar `LogoutButton.js` com `'use client'` ou adicionar inline em `PortalDashboard.js` que já é client.

### Pitfall 4: signOut sem invalidar a sessão server-side
**O que dá errado:** `supabase.auth.signOut()` no cliente limpa o cookie de sessão. Se `router.refresh()` não for chamado, o layout renderizado em cache ainda pode mostrar estado autenticado brevemente.
**Por que acontece:** O layout usa `getUser()` mas React cache pode servir a versão anterior.
**Como evitar:** Usar `router.push('/login')` que navega para nova rota sem reuso de cache do layout anterior. O `portal/layout.js` fará `redirect('/login')` automaticamente quando detectar `!user`.

---

## Não Construir do Zero

| Problema | Não Construir | Usar Já Existente | Por quê |
|----------|---------------|-------------------|---------|
| Fetch-on-mount com setState | Nova abstração de data fetching | Pattern inline no useEffect (já usado em PortalDashboard.js) | Consistência; PortalDashboard já usa IIFE async no useEffect |
| Auth guard em Server Actions | Nova função helper compartilhada | `authGuard()` local em cada action file (padrão estabelecido) | Convenção do projeto; não criar dependência entre actions |
| signOut client | Server Action de logout | `supabase.auth.signOut()` via supabase-browser.js | signOut é operação client-side; Server Action seria over-engineering |

---

## Runtime State Inventory

N/A — esta fase é refatoração de código fonte e não envolve rename, migração de dados, ou rebrand. Nenhum estado em runtime é afetado.

---

## Environment Availability

| Dependência | Necessária para | Disponível | Versão | Fallback |
|------------|----------------|-----------|--------|----------|
| Node.js | npm run lint, npm run build | ✓ | >=20 (via projeto) | — |
| npm | npm audit, npm audit fix | ✓ | bundled | — |
| ESLint | npm run lint | ✓ | ^9 (eslint-config-next) | — |

Nenhuma dependência externa nova requerida.

---

## Arquitetura de Validação

### Framework de Testes

| Propriedade | Valor |
|-------------|-------|
| Framework | Playwright ^1.60.0 (E2E only) |
| Arquivo de config | `playwright.config.js` |
| Comando rápido | `npm run lint` (validação do fix D-01) |
| Suite completa | `npm run lint && npm run build` |

### Mapa de Requirements → Testes

| Req ID | Comportamento | Tipo de Teste | Comando | Arquivo existe? |
|--------|--------------|---------------|---------|----------------|
| REF-01 | Sem código morto em dashboard/page.js | Verificação manual (grep) | `grep -n "useEffect\|useState.*usuario" src/app/dashboard/page.js` | N/A — grep, não arquivo de teste |
| REF-02 | supabase-browser em Client Components | Verificação manual (grep) | `grep -rn "from.*@/lib/supabase'" src/components/` | N/A |
| REF-03 | erroMessage sem typo | Verificação manual (grep) | `grep -rn "errorMessage" src/actions/` | N/A |
| REF-04 | useState consolidados em form objects | Verificação manual (grep) | `grep -n "const \[form" src/components/features/GestaoEdificios.js src/components/features/Unidades.js src/components/features/Locatarios.js` | N/A |
| DEPL-03 | Lint + Build passam | Automático | `npm run lint && npm run build` | N/A — comandos |

### Taxa de Amostragem

- **Por commit:** `npm run lint` — confirma que os 2 errors foram resolvidos
- **Merge final:** `npm run lint && npm run build && npm audit --omit=dev` — conforme critério DEPL-03 ajustado

### Wave 0 Gaps

Nenhum — testes existentes (Playwright E2E) não cobrem os fixes desta fase, mas os fixes são validáveis via lint + grep. Não são necessários novos arquivos de teste para esta fase.

---

## Domínio de Segurança

### Categorias ASVS Aplicáveis

| Categoria ASVS | Aplica | Controle |
|----------------|--------|---------|
| V4 Access Control | sim | D-04: derivar unidade_id server-side elimina IDOR |
| V5 Input Validation | sim | D-05: allowlist em editarLocatario previne mass assignment |
| V2 Authentication | sim (D-06) | signOut via @supabase/ssr — não hand-roll |
| V3 Session Management | sim (D-06) | Cookie cleared pelo @supabase/ssr |
| V6 Cryptography | não | — |

### Padrões de Ameaça Conhecidos

| Padrão | STRIDE | Mitigação |
|--------|--------|-----------|
| IDOR em cancelarContrato/encerrarContrato | Spoofing/Tampering | Derivar unidade_id server-side via query autenticada (D-04) |
| Mass assignment em editarLocatario | Tampering | Allowlist explícita de campos permitidos (D-05) |
| Sessão não invalidada após logout | Spoofing | signOut() + router.push — cookie cleared pelo SSR client (D-06) |

---

## Fontes

### Primárias (confiança HIGH)
- Leitura direta de `src/actions/contratos.js` — baseline de auth bypass confirmado
- Leitura direta de `src/actions/locatarios.js` — baseline de mass assignment confirmado
- Leitura direta de `src/components/features/GestaoEdificios.js` e `Unidades.js` — padrão useEffect confirmado
- `npm run lint` output — 2 errors confirmados em GestaoEdificios.js:28 e Unidades.js:86
- `npm audit --omit=dev` — 1 HIGH + 2 MODERATE confirmados
- `npm audit fix --dry-run` — upgrade 16.2.4→16.2.6, vulnerabilidades de next persistem
- `npm view next versions` — 16.2.6 é latest stable 16.x
- grep em todo o codebase — único call site de cancelarContrato/encerrarContrato é Contratos.js:108,118

### Secundárias (confiança MEDIUM)
- Leitura da mensagem de erro do ESLint para `react-hooks/set-state-in-effect` — comportamento da regra inferido da mensagem

### Terciárias (confiança LOW — marcadas [ASSUMED])
- Fix via IIFE no useEffect silencia a regra — provável mas não verificado em execução

---

## Log de Pressupostos

| # | Afirmação | Seção | Risco se Errado |
|---|-----------|-------|-----------------|
| A1 | IIFE inline no useEffect silencia `react-hooks/set-state-in-effect` | D-01 | Precisar usar `eslint-disable-next-line` como fallback — impacto baixo |
| A2 | signOut() via supabase-browser.js + router.push('/login') invalida sessão corretamente no App Router com @supabase/ssr | D-06 | Sessão persistente no server shell — fallback: adicionar router.refresh() antes do push |
| A3 | `next 16.2.6` não tem fix para as CVEs de HIGH severity listadas | DEPL-03 | Se 16.2.7+ resolver as CVEs, npm audit fix resolveria completamente — verificar no momento da execução |

---

## Questões Abertas

1. **A1: IIFE silencia o lint error?**
   - O que sabemos: a regra dispara em chamadas indiretas de função que fazem setState
   - O que é incerto: se IIFE dentro do useEffect é tratada como "body literal" pela regra
   - Recomendação: tentar o IIFE primeiro; se falhar, usar `eslint-disable-next-line` com comentário justificando fetch-on-mount

2. **DEPL-03 e vulnerabilidades residuais de next.js**
   - O que sabemos: `npm audit fix` não resolve as HIGH do next.js 16.x; a versão estável máxima é 16.2.6
   - O que é incerto: se o critério de DEPL-03 do TCC exige auditoria limpa ou "sem vulnerabilidades com fix disponível"
   - Recomendação: o plano deve ajustar o critério de sucesso de DEPL-03 para refletir a realidade — "sem vulnerabilidades com fix disponível" — e documentar as CVEs de next.js como exceção conhecida

---

## Metadados

**Breakdown de confiança:**
- Arquivos a modificar (5): HIGH — leitura direta do código
- Fix de segurança D-04/D-05: HIGH — pattern direto, sem ambiguidade
- Fix de lint D-01: MEDIUM — fix provável via IIFE, fallback eslint-disable disponível
- Logout D-06: HIGH para "o que fazer", MEDIUM para "router.push vs refresh"
- DEPL-03 audit: HIGH — baseline verificado; vulnerabilidades residuais confirmadas

**Data da pesquisa:** 2026-05-24
**Válido até:** 2026-06-18 (data da banca — stack não muda)
