# Phase 15: Testes - Context

**Gathered:** 2026-06-12
**Status:** Ready for planning

<domain>
## Phase Boundary

Cobertura automatizada dos fluxos novos do v1.1 e testes unitários das Server Actions críticas. Duas frentes:
- **TEST-01:** Testes **unitários** (novo framework — não existe hoje) das Server Actions críticas: signup guard, revogar acesso, editar/deletar unidade, encerrar/cancelar contrato.
- **TEST-02:** Suite **E2E** cobrindo novos fluxos (signup, /unidades redesign, mobile 375px, toast). Specs já existem — auditar e completar buracos, não reescrever.

Fora de escopo: novas features, refactor de Actions além do necessário pra testabilidade, cobertura 100%/exaustiva.

</domain>

<decisions>
## Implementation Decisions

### Framework Unit
- **D-01:** Framework = **Vitest**. ESM nativo, zero-config com Next 16, API tipo Jest, `vi.mock` built-in para mockar a chain do Supabase. (Rejeitados: node:test — mock ESM chato; Jest — atrito de config ESM/Next 16.)
- **D-02:** Adicionar script `test:unit` no package.json. Specs unit em diretório dedicado (planner decide path exato; sugestão: `test/unit/` ou colocar junto às Actions — seguir convenção que o planner achar mais limpa, sem misturar com `e2e/`).

### CI
- **D-03:** Unit tests rodam em **job separado** do E2E no GitHub Actions. Roda antes/paralelo ao job `e2e`. Falha de unit **bloqueia merge**.

### Estratégia de Mock
- **D-04:** **Mock total da chain** — `vi.mock` de `@supabase/ssr`, `supabaseAdmin` (`lib/supabaseAdmin.js`), e `next/headers` (`cookies()`). Testa a Action inteira (auth guard → query → status), não só lógica pura. Sem refactor obrigatório das Actions.
- **D-05:** **Factory de mock compartilhada** — um helper único (ex: `test/helpers/supabaseMock.js`) com builder encadeável reutilizável (`.from().select().eq()...`). DRY, setup uma vez.

### Cobertura Unit (quais Actions / casos)
- **D-06:** Actions cobertas (de `src/actions/`): **signup guard** (`auth.js` cadastrarProprietario + guard instância única), **revogarConvite/revogar acesso** (`locatarios.js`), **editar/deletar unidade** (`unidades.js`), **encerrar/cancelar contrato** (`contratos.js`).
- **D-07:** Profundidade por Action = **happy path + erro de validação + guard de autorização** (≈3 casos cada).
- **D-08:** **Multi-tenant é prioridade com asserção explícita** — cada Action de mutação deve provar `.eq('proprietario_id', user.id)` no mock. Fecha regressão de IDOR introduzida/fechada na Phase 11.

### Escopo E2E (TEST-02)
- **D-09:** Abordagem = **auditar + completar buracos**. Rodar suite atual, mapear cobertura vs success criteria (signup flow, /unidades redesign, mobile 375px ≥1 jornada completa, toast feedback), preencher só o que falta. Não reescrever o que já passa em CI.

### Separação E2E em blocos menores
- **D-10:** **Split por domínio** dos specs gigantes: `crud.spec.js` (27KB) e `toast-feedback.spec.js` (17KB) quebrados por domínio (edificios / unidades / contratos / locatarios). Mais legível, falha localizada. NÃO adicionar Playwright projects agora (mantém config simples; deferido).

### Claude's Discretion
- Path/estrutura exata dos diretórios de unit test.
- Config do Vitest (vitest.config.js) — environment (node, já que Server Actions), globals.
- Forma exata do builder encadeável na factory de mock.
- Como dividir os specs grandes em arquivos (nomes, agrupamento de testes).

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Requirements & Roadmap
- `.planning/REQUIREMENTS.md` — TEST-01, TEST-02 definições + success criteria
- `.planning/ROADMAP.md` §"Phase 15: Testes" — goal + 3 success criteria

### Server Actions sob teste (TEST-01)
- `src/actions/auth.js` — cadastrarProprietario + guard instância única
- `src/actions/locatarios.js` — revogarConvite / revogar acesso (4-space indent, padrão diferente)
- `src/actions/unidades.js` — editar/deletar unidade (single-quote style)
- `src/actions/contratos.js` — encerrar/cancelar contrato
- `src/lib/supabaseAdmin.js` — cliente service-role server-only (alvo de mock)

### E2E existente (TEST-02 — auditar/completar/split)
- `e2e/crud.spec.js` (27KB — split por domínio)
- `e2e/toast-feedback.spec.js` (17KB — split por domínio)
- `e2e/signup.spec.js`, `e2e/public-pages.spec.js`, `e2e/mobile-responsive.spec.js`, `e2e/desktop-scale.spec.js` — já cobrem novos fluxos
- `e2e/server-actions.spec.js` — validação de Actions via E2E (referência de padrão)
- `e2e/helpers.js`, `e2e/fixtures.js`, `e2e/seed.mjs`, `playwright.config.js` — infra E2E
- `.github/workflows/` (workflow E2E existente — adicionar job unit)

### Convenções
- `CLAUDE.md` — terminologia, padrão Server Actions (`erroMessage` not `errorMessage`, retorno `{status}`), clientes Supabase
- Stack: JS sem TS, ESM, Next 16

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `e2e/helpers.js` + `e2e/fixtures.js` — login helper + PROPRIETARIO fixture, reusados em todos specs E2E.
- `e2e/server-actions.spec.js` — padrão de teste de validação de Action (trim, UUID regex) já estabelecido a nível E2E; serve de referência pro que migrar/cobrir em unit.

### Established Patterns
- Server Actions retornam `{ status: 200 }` ou `{ status: 4xx|5xx, erroMessage }` — asserções unit batem nesse contrato.
- Auth guard: função `authGuard()` local por arquivo (exceto `gerarParcelas` inline). UUID validado com `/^[0-9a-f]{8}-.../i` redeclarado por arquivo.
- Multi-tenant: mutações filtram `.eq('proprietario_id', user.id)` (Phase 11) — D-08 testa isso.
- Mutações usam `supabaseAdmin` (service-role). signup usa `@supabase/ssr` + `cookies()` — mocks diferentes por Action.

### Integration Points
- Novo job unit no GitHub Actions workflow ao lado do `e2e`.
- `package.json` scripts: adicionar `test:unit` (atual só tem `test:e2e`).
- devDependencies: adicionar `vitest`.

</code_context>

<specifics>
## Specific Ideas

- Vitest environment = `node` (Server Actions rodam server-side, sem DOM).
- Factory de mock deve suportar chain encadeável do supabase-js: `.from().select().eq().single()` etc.
- Specs grandes (`crud`, `toast-feedback`) divididos por domínio de negócio (edificios/unidades/contratos/locatarios).

</specifics>

<deferred>
## Deferred Ideas

- **Playwright projects** (smoke/crud/visual) para execução seletiva — config extra, pós-banca.
- **Cobertura exaustiva** (todos branches, FK constraints, edge cases de status) — pós-banca; agora foco em happy+erro+guard.
- **Extrair lógica pura das Actions** (validarUUID, guards como funções puras) — refactor maior, deferido; mock total cobre por ora.

None críticos perdidos — discussão ficou no escopo da fase.

</deferred>

---

*Phase: 15-testes*
*Context gathered: 2026-06-12*
