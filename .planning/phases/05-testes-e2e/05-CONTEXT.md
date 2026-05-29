# Phase 5: Testes E2E - Context

**Gathered:** 2026-05-29
**Status:** Ready for planning

<domain>
## Phase Boundary

Fase 5 entrega: specs Playwright cobrindo TEST-01 (CRUD completo do Proprietário: Edifícios/Unidades/Locatários/Contratos), TEST-02 (ciclo de Parcelas via Edge Function gerar-parcelas), TEST-04 (fluxo Realtime: unidade some da listagem pública após criar contrato ativo).

Infraestrutura de testes já existe (`e2e/`, `playwright.config.js`, `seed.mjs`, helpers, fixtures, global-setup/teardown). Fase 5 amplia essa infraestrutura e escreve os specs ausentes.

**Fora de escopo:** testes unitários, testes de integração de API, CI/CD pipeline, visual regression testing, cobertura do Portal do Locatário (PORT-01/02/03 já existem em `portal.spec.js`).

</domain>

<decisions>
## Implementation Decisions

### Isolamento de dados (TEST-01)
- **D-01:** Dados criados pelos testes de CRUD devem usar prefixo `"E2E-"` no nome (ex: `"E2E-Edifício Teste"`, `"E2E-Sala 301"`). `global-teardown.js` deve ser estendido para deletar entidades com nome começando em `"E2E-"` (edificios, unidades, locatarios criados pelos specs).
- **D-02:** Testes de editar/deletar criam a entidade no `beforeAll`/`test` com nome `"E2E-"`, editam ela no próprio teste. Não dependem de dados do seed. Isso garante isolamento mesmo se o seed for reescrito.

### Invite de Locatário (TEST-01)
- **D-03:** O teste de convidar Locatário verifica apenas que a UI exibe mensagem de sucesso após preencher o email e submeter o formulário. Não verifica entrega do email (responsabilidade do Supabase/InBucket).
- **D-04:** Email do Locatário convidado nos testes: dinâmico com timestamp — `e2e-${Date.now()}@test.romma.local`. O `global-teardown.js` deve deletar usuários cujo email começa com `"e2e-"` via admin API.

### Edge Function gerar-parcelas (TEST-02)
- **D-05:** TEST-02 testa via UI: criar contrato (sem parcelas pré-existentes) → interagir com botão/ação "Gerar Parcelas" na UI do contrato → verificar que a tabela de parcelas exibe parcelas. Testa o fluxo real do usuário, não a EF isoladamente.
- **D-06:** O spec de TEST-02 cria sua própria cadeia de dados no `beforeAll` usando o padrão de criação via `supabaseAdmin` já presente em `seed.mjs`. Dados criados pelo spec usam prefixo `"E2E-"`. Independente do seed principal (que cria parcelas manualmente, sem EF).

### Realtime (TEST-04)
- **D-07:** Estrutura do teste TEST-04: login como Proprietário → abrir `/unidades` (verificar unidade disponível aparece) → criar contrato para essa unidade via dashboard → navegar de volta para `/unidades` → verificar que a unidade não aparece mais na listagem. Testa o estado final, não o evento Realtime em si (a limitação disponível→alugada não propaga RT via RLS está documentada em CLAUDE.md).
- **D-08:** O `seed.mjs` deve ser ampliado com uma segunda unidade: `"Sala E2E Disponivel"`, `status: 'disponivel'`, sem contrato associado. Esta unidade é a que TEST-04 usa. O teardown já limpa por nome "Sala E2E" (via pattern de limpeza a ser adicionado por D-01).

### Claude's Discretion
- Estrutura exata dos seletores para shadcn Select nos formulários de CRUD (ex: select de `edificio_id` em criar Unidade) — usar `page.selectOption()` ou click+select conforme o componente renderizar.
- Nome e organização dos spec files: um spec por entidade (edificios.spec.js, contratos.spec.js) ou agrupado por requisito (crud.spec.js). Usar o padrão que mantiver o arquivo legível.
- Timeout values para operações com Edge Function (pode ser mais lento que operações DB diretas — ajustar `expect.timeout` no test se necessário).
- Ordem dos testes dentro de cada spec (criar → verificar → editar → deletar vs suites separadas).

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Escopo e Requisitos
- `.planning/ROADMAP.md` — Phase 5 goal, success criteria, TEST-01/02/04
- `.planning/REQUIREMENTS.md` — definições formais de TEST-01, TEST-02, TEST-04

### Infraestrutura de Testes (a ampliar)
- `playwright.config.js` — config completa: `fullyParallel: false`, `workers: 1`, `timeout: 30_000`, `.env.test`, `globalSetup/Teardown`, `webServer`
- `e2e/seed.mjs` — seed atual (adicionar "Sala E2E Disponivel" para TEST-04, conforme D-08)
- `e2e/global-teardown.js` — teardown atual (estender para limpar por prefix "E2E-" e emails "e2e-", conforme D-01/D-04)
- `e2e/fixtures.js` — constantes PROPRIETARIO/LOCATARIO
- `e2e/helpers.js` — função `login(page, { email, password })` — reutilizar em todos os specs

### Referências Canônicas de Specs
- `e2e/dashboard.spec.js` — padrão de spec com `test.beforeEach` + login + `page.waitForURL` + assertions com timeout
- `e2e/portal.spec.js` — padrão de spec com múltiplas suites aninhadas (`test.describe`)

### Contexto do Projeto
- `CLAUDE.md` (raiz do projeto) — convenções de código, terminologia (Proprietário, Locatário, Edifício, Unidade, Contrato, Parcela), limitação RT conhecida

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `login(page, credentials)` em `e2e/helpers.js` — usar como `beforeEach` em todos os specs que requerem autenticação
- `PROPRIETARIO` / `LOCATARIO` em `e2e/fixtures.js` — constantes de credenciais
- Padrão `supabaseAdmin` em `e2e/seed.mjs` — criar dados de teste diretamente via admin API no `beforeAll` dos specs que precisam de dados próprios
- `global-teardown.js` — estender este arquivo (não criar novo) para limpar dados E2E-

### Established Patterns
- `test.beforeEach`: login + `waitForURL` — padrão já estabelecido em dashboard.spec.js e portal.spec.js
- `test.use({ viewport: { width: 1440, height: 900 } })` — para testes de desktop (romma-desktop-only)
- `input[placeholder="nome"]` como seletor — padrão atual (server-actions.spec.js)
- `page.locator('.romma-desktop-only')` para restringir assertions ao layout desktop
- `await expect(locator).toBeVisible({ timeout: 10_000 })` — timeout explícito em todas as assertions

### Integration Points
- Edge Function `gerar-parcelas` roda em `http://127.0.0.1:54321/functions/v1/gerar-parcelas` no ambiente local — requer `supabase functions serve` rodando
- Seed roda via `globalSetup` antes de todos os testes — modificações no `seed.mjs` afetam toda a suíte
- `.env.test` aponta para Supabase local (`http://127.0.0.1:54321`) — testes nunca tocam o Supabase de produção

</code_context>

<specifics>
## Specific Ideas

- Para TEST-04 (Realtime), a verificação final em `/unidades` é: a unidade com nome `"Sala E2E Disponivel"` não deve aparecer na listagem após o contrato ser criado. Usar `await expect(page.getByText('Sala E2E Disponivel')).toHaveCount(0)` após navegação.
- Para TEST-02 (Edge Function), o fluxo na UI de Contratos já tem um botão/ação para gerar parcelas — o spec deve localizar esse elemento pela UI existente (não criar novo).
- Testes de cancelar/encerrar Contrato (TEST-01) devem verificar que o status da Unidade volta para `disponivel` — isso valida a lógica de negócio além do status do contrato em si.

</specifics>

<deferred>
## Deferred Ideas

- CI/CD pipeline (GitHub Actions) para rodar os testes E2E automaticamente — fora do escopo do TCC.
- Visual regression testing — fora do escopo.
- Cobertura de error states (falha de DB, timeout da EF) — fora do escopo desta fase.
- TEST-03 (Portal do Locatário) — já coberto por `portal.spec.js` existente (PORT-01/02/03).

</deferred>

---

*Phase: 05-testes-e2e*
*Context gathered: 2026-05-29*
