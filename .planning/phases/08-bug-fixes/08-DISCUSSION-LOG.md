# Phase 8: Bug Fixes - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-06-05
**Phase:** 08-bug-fixes
**Areas discussed:** BUG-01 (Revogar), BUG-03 (Status convite), BUG-02 (Estado de erro), BUG-04 (Link de volta)

---

## BUG-01 — Escopo do revogar

| Option | Description | Selected |
|--------|-------------|----------|
| Guard 'não está pendente' bloqueia | Action retorna 400 mesmo com locatário claramente pendente na UI | |
| FK violation ao deletar | Action retorna erro de FK constraint | |
| Não sei exatamente — investigar | Não chegou a testar a fundo, executor deve investigar causa raiz | ✓ |
| alert() é o único problema | Ação funciona, mas erro aparece em alert() em vez de inline | |

**User's choice:** Investigar causa raiz
**Notes:** —

| Option | Description | Selected |
|--------|-------------|----------|
| Investigar causa raiz, corrigir o necessário | Executor investiga guard + FK, corrige causa + substitui alert() | ✓ |
| Só substituir alert() por inline | Mudar apenas UX | |

**User's choice:** Investigar causa raiz, corrigir o que for necessário

---

## BUG-03 — Causa raiz do status_convite

| Option | Description | Selected |
|--------|-------------|----------|
| Em /auth/confirm/route.js | Após verifyOtp com type='invite', atualizar via supabaseAdmin | ✓ |
| Via trigger no Supabase | Migration com trigger em auth.users ON UPDATE | |

**User's choice:** Em /auth/confirm/route.js
**Notes:** Causa raiz identificada durante análise: /auth/confirm nunca atualiza status_convite → 'aceito'. BUG-01 e BUG-03 são relacionados.

| Option | Description | Selected |
|--------|-------------|----------|
| Retornar erro descritivo | Guard: verificar contratos vinculados, retornar erro claro se houver | ✓ |
| Ignorar — pendente nunca terá contrato | Assumir domínio garante isso | |

**User's choice:** Retornar erro descritivo

---

## BUG-02 — Separação de estado de erro

| Option | Description | Selected |
|--------|-------------|----------|
| Em Unidades.js, via prop para UnidadeCard | Mantém padrão atual, renomeia para erroEdit | ✓ |
| Dentro do UnidadeCard (estado local) | Card gerencia próprio estado | |

**User's choice:** Em Unidades.js, passado via prop

| Option | Description | Selected |
|--------|-------------|----------|
| Limpar ao iniciar qualquer nova ação | setErroDelete/setErroEdit(null) no início de cada handler | ✓ |
| Limpar ao clicar fora / fechar | Adicionar botão X ou timeout | |

**User's choice:** Ao iniciar qualquer nova ação

---

## BUG-04 — Link de volta

| Option | Description | Selected |
|--------|-------------|----------|
| Substituir span 'Unidades Disponíveis' | Link ← Voltar no lugar do label atual | ✓ |
| Adicionar nova linha acima | Manter span existente, link separado | |

**User's choice:** Substituir o span 'Unidades Disponíveis'

---

## Claude's Discretion

- Estratégia para obter user.id após verifyOtp em /auth/confirm (getUser() vs query por email)
- Limpeza de erroDelete no início de handleSalvarUnidade (evitar exibição de erro antigo)

## Deferred Ideas

None — discussion stayed within phase scope.
