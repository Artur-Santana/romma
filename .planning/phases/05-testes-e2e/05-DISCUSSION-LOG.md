# Phase 5: Testes E2E - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-05-29
**Phase:** 05-testes-e2e
**Areas discussed:** Isolamento CRUD, Invite de Locatário, Edge Function (TEST-02), Realtime (TEST-04)

---

## Isolamento CRUD (TEST-01)

| Option | Description | Selected |
|--------|-------------|----------|
| Naming convention + teardown | Prefixar dados com "E2E-", estender global-teardown.js | ✓ |
| afterEach inline cleanup | Cada suite deleta seus dados no afterEach/afterAll | |
| Ampliar seed com dados dedicados | Seed cria entidades extras pré-marcadas | |

**User's choice:** Naming convention + teardown

| Option | Description | Selected |
|--------|-------------|----------|
| Criar novo + editar novo | Cada teste de edit cria entidade E2E-, edita ela | ✓ |
| Editar dados do seed | Reusar Sala 101 / Edifício Teste E2E | |

**User's choice:** Criar novo + editar novo
**Notes:** Isolamento completo — testes não dependem de dados do seed.

---

## Invite de Locatário (TEST-01)

| Option | Description | Selected |
|--------|-------------|----------|
| Apenas mensagem de sucesso na UI | Verificar UI exibe sucesso após submit | ✓ |
| Verificar InBucket via API local | Consultar http://127.0.0.1:54324/api/v1/mailbox | |
| Pular invite, testar só editar | Usa locatário já seeded | |

**User's choice:** Apenas mensagem de sucesso na UI

| Option | Description | Selected |
|--------|-------------|----------|
| Email dinâmico com timestamp | `e2e-${Date.now()}@test.romma.local` | ✓ |
| Email fixo no seed | Mais simples, mas risco de conflito | |

**User's choice:** Email dinâmico com timestamp
**Notes:** Teardown deve deletar usuários com email prefixo "e2e-" via admin API.

---

## Edge Function gerar-parcelas (TEST-02)

| Option | Description | Selected |
|--------|-------------|----------|
| Via UI | Criar contrato → botão Gerar Parcelas → verificar tabela | ✓ |
| Via chamada direta à EF | page.evaluate()/request() com JWT | |

**User's choice:** Via UI

| Option | Description | Selected |
|--------|-------------|----------|
| Criar contrato E2E separado no spec | beforeAll cria dados próprios E2E- | ✓ |
| Modificar seed para omitir parcelas | Quebra Portal tests (PORT-03) | |

**User's choice:** Criar contrato E2E separado no spec
**Notes:** Independente do seed principal. Usa padrão supabaseAdmin de seed.mjs no beforeAll.

---

## Realtime (TEST-04)

| Option | Description | Selected |
|--------|-------------|----------|
| Criar contrato → navegar /unidades → verificar sumiço | Testa estado final | ✓ |
| Duas tabs + aguardar evento RT | Testa RT real, mas vai falhar (limitação RLS) | |

**User's choice:** Criar contrato → navegar /unidades → verificar sumiço

| Option | Description | Selected |
|--------|-------------|----------|
| Seed adiciona unidade E2E disponivel | "Sala E2E Disponivel" status disponivel | ✓ |
| Spec cria unidade via API admin no beforeAll | Mais isolado por spec | |

**User's choice:** Seed adiciona unidade E2E disponivel
**Notes:** Limitação conhecida documentada — o teste foca no estado final, não no evento RT.

---

## Claude's Discretion

- Estrutura exata de seletores para shadcn Select (page.selectOption vs click+select)
- Organização dos spec files (por entidade vs por requisito)
- Timeout values para operações com Edge Function
- Ordem dos testes dentro de cada spec

## Deferred Ideas

- CI/CD pipeline — pós-TCC
- Visual regression testing — fora do escopo
- Cobertura de error states — fora do escopo desta fase
