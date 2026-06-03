# Phase 2: Portal do Locatário - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-05-22
**Phase:** 02-portal-do-locat-rio
**Areas discussed:** Login routing, Auth guard no proxy.js, Queries do portal, Testes E2E (PORT-01)

---

## Login Routing

| Option | Description | Selected |
|--------|-------------|----------|
| Modificar /login existente | Adicionar RPC is_proprietario() pós-auth, redirecionar por role | ✓ |
| Criar /portal/login separado | Nova página customizada para Locatário, evita tocar no /login atual | |

**User's choice:** Modificar /login existente

**Q2 — Loading durante RPC:**

| Option | Description | Selected |
|--------|-------------|----------|
| Mostrar AUTENTICANDO até RPC resolver | Mantém spinner até redirect acontecer | ✓ (após clarificação) |
| Redirecionar para /portal e deixar layout.js decidir | Login sempre vai para /portal, layout.js faz RPC server-side | |

**Notes:** Usuário solicitou clarificação sobre o que é RPC e como impacta a decisão. Após explicação do fluxo auth+RPC+redirect e da diferença de ~100-200ms, optou por RPC no client com AUTENTICANDO cobrindo toda a sequência.

**Q3 — Eyebrow label:**

| Option | Description | Selected |
|--------|-------------|----------|
| Mesmo label para todos | Label genérico, sem lógica pré-auth | ✓ |
| Label diferente por role | Impossível detectar role antes do login | |

---

## Auth Guard no proxy.js

| Option | Description | Selected |
|--------|-------------|----------|
| Adicionar /portal/** ao proxy.js | Guard duplo, consistente com /dashboard | ✓ |
| Só layout.js | Mais simples, suficiente para TCC | |

**User's choice:** Adicionar ao proxy.js

**Q2 — Proprietário acessa /portal:**

| Option | Description | Selected |
|--------|-------------|----------|
| Redirecionar para /dashboard | proxy.js checa is_proprietario() → redirect | ✓ |
| Deixar acessar /portal | Portal ficaria vazio (Proprietário sem registro em locatarios) | |

---

## Queries do Portal

| Option | Description | Selected |
|--------|-------------|----------|
| Nova getContratoAtivoByLocatario | Função específica com join de unidade, não toca na existente | ✓ |
| Estender getContratosByLocatario | Adicionar join e filtro na função existente | |

**User's choice:** Nova função

**Q2 — Filtro de parcelas futuras:**

| Option | Description | Selected |
|--------|-------------|----------|
| Nova getParcelasPortal (filtro na query) | .neq('status', 'futura') no Supabase | ✓ (após clarificação) |
| Filtrar no componente ParcelsTable | Busca tudo, filtra em JS | |

**Notes:** Usuário solicitou clarificação sobre o questionamento. Após explicação da diferença entre filtrar no banco vs no JS, escolheu filtrar na query como boa prática.

---

## Testes E2E (PORT-01)

**Q1 — Dados de teste para locatário:**

| Option | Description | Selected |
|--------|-------------|----------|
| Seed no global-setup.js | Automatizado, reproduzível, usa admin API | ✓ (após clarificação) |
| Dados manuais no Supabase | Simples agora, quebra se banco resetado | |

**Notes:** Usuário solicitou clarificação sobre a diferença entre as abordagens e como os testes funcionam em geral. Após explicação detalhada do fluxo (global-setup → seed → build → start → testes) e da diferença seed vs manual, optou pelo seed automatizado.

**Q2 — Teardown:**
Usuário perguntou se os dados de teste persistem após os testes. Após explicação de que sim (upsert permanente), propôs e confirmou a prática de **teardown**: `global-teardown.js` deleta contrato, parcelas, locatário de teste após suite. Usuários em `auth.users` preservados. Confirmado como boa prática.

**Q3 — Segurança da admin API:**
Usuário perguntou se `SUPABASE_ROLE_KEY` fica exposto no git. Verificado: `.env.test` está no `.gitignore` — chave nunca vai pro repositório.

---

## Claude's Discretion

- Estrutura exata do `global-teardown.js` e ordem de deleção (FK constraints)
- `maybeSingle()` vs `single()` em `getContratoAtivoByLocatario`
- Ordem das colunas na `ParcelsTable`

## Deferred Ideas

- Notificação push/email para Locatário quando parcela vence — nova capability, pós-TCC
- Logout visível no portal — Fase 3 (Refatoração) ou polimento
