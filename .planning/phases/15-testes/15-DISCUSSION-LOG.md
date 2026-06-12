# Phase 15: Testes - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-06-12
**Phase:** 15-testes
**Areas discussed:** Framework unit, CI, Estratégia de mock, Mock helper, Cobertura unit, Multi-tenant, Escopo E2E, Separação E2E em blocos

---

## Framework Unit

| Option | Description | Selected |
|--------|-------------|----------|
| Vitest | ESM nativo, zero-config Next 16, vi.mock built-in | ✓ |
| node:test nativo | Zero deps, mas mock ESM chato | |
| Jest | Maduro, atrito config ESM/Next 16 | |

**User's choice:** Vitest

---

## CI

| Option | Description | Selected |
|--------|-------------|----------|
| Job separado do E2E | Step unit dedicado, falha bloqueia merge | ✓ |
| Mesmo job, antes do E2E | test:unit && playwright no mesmo job | |
| Só local por ora | Sem CI agora | |

**User's choice:** Job separado do E2E

---

## Estratégia de Mock

| Option | Description | Selected |
|--------|-------------|----------|
| Mock total da chain | vi.mock @supabase/ssr + supabaseAdmin + next/headers; testa Action inteira | ✓ |
| Extrair lógica pura + testar | Refatora validação/guard pra funções puras | |
| Híbrido | Mock total nas críticas + extrair puros fáceis | |

**User's choice:** Mock total da chain

---

## Mock Helper

| Option | Description | Selected |
|--------|-------------|----------|
| Factory compartilhada | test/helpers/supabaseMock.js builder encadeável | ✓ |
| Mock inline por teste | Cada spec monta seu mock | |

**User's choice:** Factory compartilhada

---

## Cobertura Unit (casos por Action)

| Option | Description | Selected |
|--------|-------------|----------|
| Happy + erro + guard | Sucesso, validação falha, auth/IDOR guard | ✓ |
| Só happy + erro | Pula guard de autorização | |
| Exaustivo | Todos branches + edge cases | |

**User's choice:** Happy + erro + guard

---

## Multi-tenant

| Option | Description | Selected |
|--------|-------------|----------|
| Sim, asserção explícita | Provar .eq('proprietario_id', user.id) no mock | ✓ |
| Não priorizar | Multi-tenant fica pro E2E | |

**User's choice:** Sim, asserção explícita

---

## Escopo E2E (TEST-02)

| Option | Description | Selected |
|--------|-------------|----------|
| Auditar + completar buracos | Mapeia cobertura vs criteria, preenche gaps | ✓ |
| Reescrever do zero | Recria specs novos fluxos | |
| Tratar como pronto | Foca só TEST-01 | |

**User's choice:** Auditar + completar buracos

---

## Separação E2E em blocos menores

| Option | Description | Selected |
|--------|-------------|----------|
| Split crud.spec por domínio | Quebra crud.spec + toast-feedback por domínio | ✓ |
| Split + Playwright projects | Split + projects smoke/crud/visual | |
| Só arquivos novos | Não mexe nos grandes | |

**User's choice:** Split crud.spec por domínio

---

## Claude's Discretion

- Path/estrutura dos diretórios de unit test
- Config Vitest (environment node, globals)
- Forma do builder encadeável na factory de mock
- Nomes/agrupamento ao dividir os specs grandes

## Deferred Ideas

- Playwright projects (smoke/crud/visual) — pós-banca
- Cobertura exaustiva (branches, FK, edge cases status) — pós-banca
- Extrair lógica pura das Actions como funções puras — refactor maior, deferido
