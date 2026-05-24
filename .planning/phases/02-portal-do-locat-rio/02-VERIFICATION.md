---
phase: 02-portal-do-locat-rio
verified: 2026-05-22T03:00:00Z
status: gaps_found
score: 3/5 must-haves verified
overrides_applied: 0
gaps:
  - truth: "Testes Playwright cobrem login via convite, visualização do contrato ativo e visualização do histórico de parcelas (TEST-03 / SC-5)"
    status: failed
    reason: "PORT-02 e PORT-03 permanecem falhando após 3 tentativas de fix. SUMMARY 02-03 admite explicitamente: 'Tests remain failing after 3 fix attempts.' Causa raiz: Next.js 16 compila NEXT_PUBLIC_* a partir de .env.local durante next build, sobrescrevendo as vars do webServer.command. O browser bundle aponta para Supabase produção; os dados de seed estão no Supabase local — 'Nenhum contrato ativo' é exibido em vez de 'Sala 101'."
    artifacts:
      - path: "e2e/portal.spec.js"
        issue: "Spec existe e está correto, mas PORT-02 e PORT-03 falham em runtime"
      - path: "playwright.config.js"
        issue: "webServer.command injeta NEXT_PUBLIC_* mas Next.js .env.local override vence durante build"
    missing:
      - "Resolver conflito entre .env.local e .env.test durante next build — opções: (1) renomear .env.local antes do build e restaurar após; (2) criar .env.test.local com NEXT_PUBLIC_* apontando para instância local; (3) usar webServer.env em playwright.config.js (não apenas command); (4) fazer supabase-browser.js ler URL de runtime config em vez de env compilada"
  - truth: "Locatário logado visualiza os dados do seu contrato ativo (PORT-02 / SC-2)"
    status: failed
    reason: "A implementação (PortalDashboard + ContratoCard + queries) está corretamente wired no código. Mas o contrato de TDD outside-in adotado pela fase exige E2E GREEN como sinal de conclusão. PORT-02 falha — screenshot mostra 'Nenhum contrato ativo' por causa do env override de build-time."
    artifacts:
      - path: "src/components/features/portal/PortalDashboard.js"
        issue: "Implementação correta; falha é de infra de teste, não de código de produção"
    missing:
      - "E2E PORT-02 precisa passar — bloqueado pelo mesmo root cause do TEST-03 acima"
  - truth: "Locatário vê histórico de parcelas com status paga/pendente/vencida; parcelas futuras não aparecem (PORT-03 / SC-3)"
    status: failed
    reason: "ParcelsTable e getParcelasPortal com .neq('status', 'futura') estão implementados. PORT-03 falha pelo mesmo root cause de env — o componente nunca recebe dados reais nos testes."
    artifacts:
      - path: "src/components/features/portal/ParcelsTable.js"
        issue: "Implementação correta; falha é de infra de teste"
    missing:
      - "E2E PORT-03 precisa passar — bloqueado pelo mesmo root cause do TEST-03 acima"
human_verification:
  - test: "Logar como locatario@test.romma.local em ambiente local com Supabase local"
    expected: "Redirect para /portal/dashboard; página exibe 'Sala 101', 'R$ 2.500', status 'ativo', tabela com 3 parcelas (paga/vencida/pendente) sem futura"
    why_human: "E2E automatizado falha por env override de build. Verificação manual pode confirmar se implementação funciona em isolamento."
  - test: "Acessar /portal/dashboard sem sessão"
    expected: "Redirect para /login"
    why_human: "Verificação de guard duplo (proxy.js + layout.js) requer browser real"
  - test: "Logar como Proprietário e tentar acessar /portal/dashboard"
    expected: "Redirect para /dashboard"
    why_human: "Role gate do proxy.js requer browser com cookies reais"
---

# Phase 02: Portal do Locatário — Relatório de Verificação

**Objetivo da Fase:** Locatário autenticado via convite acessa seu contrato ativo e histórico de parcelas no portal próprio
**Verificado em:** 2026-05-22
**Status:** GAPS FOUND
**Re-verificação:** Não — verificação inicial

---

## Resumo do Resultado

A implementação de produção está completa e corretamente wired: login routing por role, proxy guard, PortalDashboard com fetch chain, ContratoCard, ParcelsTable, queries sem `status='futura'`. O código de produção está correto.

O bloqueio é a infraestrutura de testes E2E: PORT-02 e PORT-03 permanecem falhando por um conflito entre `.env.local` e `.env.test` durante `next build`. O SUMMARY 02-03 documenta isso explicitamente como "Tests remain failing after 3 fix attempts". A fase adotou TDD outside-in — E2E GREEN é o contrato de conclusão, não a implementação isolada.

**Placar:** 3/5 critérios verificados

---

## 1. Verdades Observáveis

| # | Verdade | Status | Evidência |
|---|---------|--------|-----------|
| 1 | SC-1: Locatário faz login com email/senha e é redirecionado para /portal/dashboard | VERIFIED | `login/page.js` linha 174–177: `rpc('is_proprietario')` → ternário `/dashboard` ou `/portal/dashboard`. Commits f2fd4e5. |
| 2 | SC-2: Locatário logado visualiza dados do contrato ativo (PORT-02) | FAILED | Implementação correta (`PortalDashboard.js`, `ContratoCard.js`, `getContratoAtivoByLocatario`). E2E PORT-02 falha — "Sala 101" não visível por env override de build-time. |
| 3 | SC-3: Locatário vê histórico de parcelas paga/pendente/vencida sem futuras (PORT-03) | FAILED | `ParcelsTable.js` + `getParcelasPortal` com `.neq('status', 'futura')` implementado. E2E PORT-03 falha pelo mesmo root cause. |
| 4 | SC-4: Portal com design Obsidian Blueprint consistente (VIS-03) | VERIFIED | Zero `style={` nos 5 arquivos do portal. Tailwind v4 com tokens `eyebrow--indigo`, `romma-page`, `font-display`, `text-fg-*`. Confirmado via grep. |
| 5 | SC-5: Testes Playwright cobrem os fluxos do portal (TEST-03) | FAILED | `e2e/portal.spec.js` existe com PORT-01/02/03. PORT-02 e PORT-03 falham — SUMMARY 02-03 admite explicitamente após 3 tentativas. Root cause: `.env.local` sobrescreve `NEXT_PUBLIC_*` no build. |

**Placar:** 3/5 verdades verificadas

---

## 2. Artefatos Obrigatórios

| Artefato | Esperado | Status | Detalhes |
|----------|---------|--------|----------|
| `e2e/portal.spec.js` | Specs PORT-01/02/03 | VERIFIED | 3 testes com nomes exatos, import de `./helpers.js` e `./fixtures.js`, sem credenciais inline |
| `e2e/global-teardown.js` | Teardown FK-aware, default export | VERIFIED | Exporta `default async function globalTeardown()`, ordem: parcelas → contratos → locatarios → unidades → edificios. Sem `auth.admin.deleteUser`. |
| `playwright.config.js` | `globalTeardown` wiring | VERIFIED | Linha 24: `globalTeardown: './e2e/global-teardown.js'` |
| `e2e/seed.mjs` | Cadeia FK do locatário | VERIFIED (parcial) | Cria edificio → unidade → locatario → contrato ativo → 3 parcelas (paga/vencida/pendente). Sem `status: 'futura'`. NOTA: `status_convite` omitido — coluna não existe no schema. |
| `src/proxy.js` | Guard /portal, matcher expandido | VERIFIED | `startsWith('/portal')` exatamente 2x. Matcher: `['/dashboard/:path*', '/portal/:path*']`. Sem `src/middleware.js`. |
| `src/app/login/page.js` | RPC + routing por role | VERIFIED | `rpc('is_proprietario')` 1x, linha 174. Ternário: `isProprietario ? '/dashboard' : '/portal/dashboard'`, linha 177. |
| `src/app/portal/layout.js` | Tailwind, sem inline styles | VERIFIED | `className="flex flex-col h-screen bg-background"`. Zero `style={`. Auth guard preservado. |
| `src/app/portal/dashboard/page.js` | Thin Server Component shell | VERIFIED | 5 linhas. Import de `PortalDashboard`. Sem `'use client'`. Sem props de dados. |
| `src/components/features/portal/PortalDashboard.js` | Client Component wired | VERIFIED | `'use client'`, fetch chain via useEffect, todos os 4 estados (loading/error/empty/data), zero `style={`, zero `supabaseAdmin`. |
| `src/lib/queries-client.js` | `getContratoAtivoByLocatario` + `getParcelasPortal` | VERIFIED | Ambas exportadas, `.maybeSingle()`, `.neq('status', 'futura')`, `.order('data_vencimento', { ascending: false })`, `data ?? []`. |
| `src/components/features/portal/ContratoCard.js` | Cartão do contrato ativo | VERIFIED | `'use client'`, `fmtBRL`, `fmtData`, `StatusBadge`, "CONTRATO ATIVO", zero `style={` |
| `src/components/features/portal/ParcelsTable.js` | Tabela de parcelas | VERIFIED | `data-testid="parcelas-table"`, `aria-label="HISTÓRICO DE PARCELAS"`, 4 colunas, empty state, zero `style={`, zero `gridStyle` |

---

## 3. Verificação de Vínculos (Key Links)

| De | Para | Via | Status | Detalhes |
|----|------|-----|--------|----------|
| `playwright.config.js` | `e2e/global-teardown.js` | `globalTeardown` property | WIRED | Linha 24 confirmada |
| `e2e/portal.spec.js` | `e2e/helpers.js` + `e2e/fixtures.js` | `import { login }` / `LOCATARIO` | WIRED | Linhas 2–3 confirmadas |
| `src/proxy.js` | `supabase.rpc('is_proprietario')` | role gate /portal | WIRED | Linhas 44–47 confirmadas |
| `src/app/login/page.js` | `/dashboard` ou `/portal/dashboard` | ternário `isProprietario` | WIRED | Linha 177 confirmada |
| `src/app/portal/dashboard/page.js` | `PortalDashboard.js` | import default | WIRED | Linha 1 confirmada |
| `PortalDashboard.js` | `queries-client.js` | `getLocatarioByUserId → getContratoAtivoByLocatario → getParcelasPortal` | WIRED | Linhas 5 e 23–29 confirmadas |
| `ParcelsTable.js` | `StatusBadge` | import default | WIRED | Linha 3 confirmada |
| `ContratoCard.js` | `utils.js` (fmtBRL, fmtData) | named imports | WIRED | Linha 3 confirmada |
| `getParcelasPortal` | tabela `parcelas` | `.neq('status', 'futura')` | WIRED | Linha 145 confirmada |

---

## 4. Rastreamento de Dados (Level 4)

| Artefato | Variável de Dados | Fonte | Produz Dados Reais | Status |
|----------|------------------|-------|-------------------|--------|
| `PortalDashboard.js` | `contrato`, `parcelas` | `getContratoAtivoByLocatario(loc.id)` → `getParcelasPortal(ct.id)` | Sim — query Supabase com join `unidades(nome, valor_mensal)` | FLOWING (código) / NÃO VERIFICADO em E2E |
| `ContratoCard.js` | prop `contrato` | recebido de `PortalDashboard` via fetch chain | Sim — usa `fmtBRL`, `fmtData`, `StatusBadge` com dados do banco | FLOWING (código) |
| `ParcelsTable.js` | prop `parcelas` | recebido de `PortalDashboard` via `getParcelasPortal` | Sim — `.neq('status','futura')` elimina futuras na query | FLOWING (código) |

Nota: o flow de dados está corretamente implementado no código. A verificação E2E falha por conflito de env de build, não por dados desconectados.

---

## 5. Spot-Checks Comportamentais

| Comportamento | Verificação | Resultado | Status |
|--------------|-------------|-----------|--------|
| Seed cria cadeia FK | `grep "locatario@test.romma.local" e2e/seed.mjs` | FOUND | PASS |
| Teardown respeita ordem FK | `grep -n "from('parcelas')" global-teardown.js` mostra ordem correta | Confirmado | PASS |
| Nenhum `status: 'futura'` no seed | `grep "status: 'futura'" e2e/seed.mjs` | 0 matches | PASS |
| `startsWith('/portal')` em proxy | `grep -c` | 2 ocorrências | PASS |
| `rpc('is_proprietario')` em login | `grep -c` | 1 ocorrência | PASS |
| PORT-01/02/03 declarados | `grep -n "PORT-0[123]" portal.spec.js` | 3 testes | PASS |
| PORT-02/PORT-03 E2E passa | Reportado no SUMMARY 02-03 | Falha confirmada após 3 tentativas | FAIL |

---

## 6. Cobertura de Requisitos

| Requisito | Plano | Descrição | Status | Evidência |
|-----------|-------|-----------|--------|-----------|
| PORT-01 | 02-02 | Locatário faz login com email/senha do convite | SATISFIED | Login → `rpc('is_proprietario')` → redirect `/portal/dashboard` — código wired e funcional |
| PORT-02 | 02-03 | Locatário visualiza contrato ativo (unidade, valor, início/fim, status) | BLOCKED | Implementação correta; E2E PORT-02 falha por root cause de env |
| PORT-03 | 02-03 | Locatário visualiza histórico (paga/pendente/vencida, sem futura) | BLOCKED | Implementação correta; E2E PORT-03 falha por root cause de env |
| VIS-03 | 02-02, 02-03 | Portal com design Obsidian Blueprint consistente | SATISFIED | Zero inline styles; Tailwind v4 com tokens do sistema; eyebrow, romma-page |
| TEST-03 | 02-01, 02-03 | Testes E2E cobrem Portal do Locatário | BLOCKED | Specs existem e estão corretos; PORT-02/PORT-03 falham por env override |

---

## 7. Anti-Padrões Encontrados

| Arquivo | Linha | Padrão | Severidade | Impacto |
|---------|-------|--------|------------|---------|
| `e2e/seed.mjs` | — | `status_convite` ausente | Informativo | Coluna não existe no schema. Plan 01 acceptance criteria exigia `status_convite: 'aceito'`. Desvio documentado no SUMMARY 01. Sem impacto funcional — RLS não depende desta coluna para os testes. |
| `src/proxy.js` | 35 | `/dashboard` guard redireciona locatário para `/` em vez de `/portal/dashboard` | Aviso | Comportamento pré-existente de Phase 1. Se locatário tentar acessar /dashboard diretamente, é redirecionado para `/` (raiz) em vez do portal. Não é blocker da Fase 2 — fora do escopo definido. |

Nenhum marcador `TBD`, `FIXME`, ou `XXX` encontrado nos arquivos modificados nesta fase.

---

## 8. Verificação Humana Necessária

### 1. Fluxo completo do locatário em ambiente local

**Teste:** Logar como `locatario@test.romma.local` (senha `Test1234!`) com Supabase local rodando. Acessar `/portal/dashboard`.
**Esperado:** Redirect para `/portal/dashboard`; página exibe card "CONTRATO ATIVO" com "Sala 101", "R$ 2.500", datas e status; seção "HISTÓRICO DE PARCELAS" com 3 linhas (paga/vencida/pendente), sem linha com "futura".
**Por que humano:** E2E automatizado falha por conflito de env de build. Verificação manual confirma se a implementação funciona ao apontar diretamente para o Supabase local.

### 2. Guard proxy.js — unauthenticated

**Teste:** Sem sessão ativa, acessar `http://localhost:3000/portal/dashboard`.
**Esperado:** Redirect para `/login`.
**Por que humano:** Guard de proxy requer browser com ciclo de request/response real.

### 3. Guard proxy.js — Proprietário tentando acessar /portal

**Teste:** Logar como Proprietário, depois acessar `http://localhost:3000/portal/dashboard`.
**Esperado:** Redirect para `/dashboard`.
**Por que humano:** Role gate do proxy.js (`rpc('is_proprietario')`) requer sessão autenticada real com cookies httpOnly.

---

## 9. Resumo dos Gaps

**Root cause único, três manifestações:**

Next.js 16 compila variáveis `NEXT_PUBLIC_*` a partir de `.env.local` durante `next build`. O arquivo `.env.local` aponta para o Supabase de produção. O `playwright.config.js` tenta injetar vars via `webServer.command`, mas o override ocorre em tempo de compilação — o bundle já carrega a URL de produção antes da execução. O seed popula o Supabase local; o browser client consulta produção — `getContratoAtivoByLocatario` retorna null, exibindo "Nenhum contrato ativo".

**Impacto:** TEST-03 (infra E2E), PORT-02 (visualização de contrato), PORT-03 (histórico de parcelas) marcados como BLOCKED. O código de produção está funcionalmente completo.

**Planos de resolução (do SUMMARY 02-03):**
1. Renomear `.env.local` → `.env.local.bak` antes de `next build` e restaurar após (solução cirúrgica)
2. Criar `.env.test.local` com `NEXT_PUBLIC_*` apontando para instância local (`127.0.0.1:54321`)
3. Usar `webServer.env` em `playwright.config.js` (não apenas no `command`)
4. Fazer `supabase-browser.js` ler URL de runtime config em vez de env compilada

---

## 10. Nota sobre o Success Criteria 1 do ROADMAP

O ROADMAP SC-1 descreve "login na página /portal/login". Não existe rota `/portal/login` — o login ocorre em `/login` (rota compartilhada com o Proprietário). A lógica de routing por role redireciona o Locatário para `/portal/dashboard` após autenticação. Este é um problema de redação no ROADMAP, não uma falha de implementação — o objetivo funcional (Locatário consegue logar e chegar no portal) é atingido.

---

_Verificado em: 2026-05-22_
_Verificador: Claude (gsd-verifier)_
