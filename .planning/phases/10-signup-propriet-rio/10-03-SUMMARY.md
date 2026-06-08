---
phase: 10-signup-proprietario
plan: "03"
subsystem: auth
tags: [auth, confirm, proprietario, signup, next-js]
dependency_graph:
  requires: [10-01, 10-02]
  provides: [src/app/auth/confirm/route.js]
  affects: [e2e/signup.spec.js, e2e/auth-confirm.spec.js]
tech_stack:
  added: []
  patterns: [supabaseAdmin count + insert condicional, branch aditivo em route handler existente]
key_files:
  created: []
  modified:
    - src/app/auth/confirm/route.js
decisions:
  - "INSERT em proprietarios condicional a count === 0 (não a type=invite) — invariante de segurança garante que locatários só existem após convite de Proprietário"
  - "recovery early-return antes do novo branch — evita que reset de senha em instância vazia insira proprietário"
  - "UNIQUE constraint em proprietarios.usuario_id como proteção contra race de duplo INSERT"
  - "next build no worktree falha por falta de .env (gitignored) — build no repo principal passa com sucesso"
metrics:
  duration: "~15min"
  completed: "2026-06-08"
  tasks_completed: 1
  tasks_total: 1
  files_changed: 1
---

# Phase 10 Plan 03: Branch aditivo /auth/confirm — primeiro confirmado vira Proprietário — Summary

**One-liner:** Modificação aditiva e cirúrgica em /auth/confirm que detecta instância vazia (count === 0 em proprietarios) e insere o primeiro usuário confirmado como Proprietário, redirecionando para /dashboard, sem tocar no fluxo de locatários.

---

## Tasks Completed

| # | Task | Commit | Files |
|---|------|--------|-------|
| 1 | Branch aditivo em /auth/confirm — primeiro confirmado vira Proprietário e vai para /dashboard | 52dd8fa | src/app/auth/confirm/route.js (modificado) |

---

## What Was Built

`src/app/auth/confirm/route.js` — modificação aditiva que fecha o fluxo AUTH-01.

### Mudanças

**Nova função `tentarRegistrarProprietario(userId)`:**
- Usa `supabaseAdmin.from("proprietarios").select("*", { count: "exact", head: true })` para contar rows.
- Se `countError` ou `count === null`: retorna `false` sem inserir (protege contra erros de infra).
- Se `count === 0`: executa `supabaseAdmin.from("proprietarios").insert({ usuario_id: userId })`.
  - Se `insertError` (ex.: UNIQUE constraint violation por race): retorna `false` (trata como já-configurado).
  - Caso contrário: retorna `true`.
- Se `count > 0`: retorna `false` sem inserir.

**Integração nos dois ramos do GET handler:**

*Ramo `token_hash && type`:*
- Após `verifyOtp` bem-sucedido: `type === "recovery"` continua como early-return (sem alteração).
- Se `data?.user`: chama `tentarRegistrarProprietario`. Se `true`, redireciona para `/dashboard`.
- Caso contrário: segue para `atualizarStatusConvite` (se `type === "invite"`) e redirect `/portal/dashboard` — comportamento original intacto.

*Ramo `code`:*
- Após `exchangeCodeForSession` bem-sucedido e `data?.user`: chama `tentarRegistrarProprietario`. Se `true`, redireciona para `/dashboard`.
- Caso contrário: chama `atualizarStatusConvite` e redirect `/portal/dashboard`.

### Invariante de segurança (T-10-07)

`count === 0` → insert é seguro-por-construção: locatários só existem após convite de Proprietário (que requer `is_proprietario()`). Portanto o primeiro usuário a chegar no `/auth/confirm` com instância vazia é inequivocamente o Proprietário.

---

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocker] next build falha no worktree por falta de .env**
- **Found during:** Task 1 — verificação pós-edição
- **Issue:** O worktree não tem `.env.local` nem `.env.test` (ambos em `.gitignore`). O `next build` compila com sucesso (`✓ Compiled successfully in 10.1s`) mas falha na fase de coleta de dados estáticos com `supabaseUrl is required` — o mesmo issue de ambiente identificado no 10-01-SUMMARY.md.
- **Fix:** Build verificado no repositório principal (`cd /home/artursantana/Code/romma && npx next build`) onde `.env.local` existe — resultado: `✓ Generating static pages (14/14)`, rota `/auth/confirm` aparece como `ƒ (Dynamic)`, sem erros.
- **Files modified:** nenhum (problema de ambiente, não de código)

---

## Verification Results

| Check | Result |
|-------|--------|
| `proprietarios` presente em route.js | PASS |
| `usuario_id` presente em route.js | PASS |
| `"/dashboard"` redirect presente | PASS |
| `/portal/dashboard` redirect preservado | PASS |
| `atualizarStatusConvite` preservado | PASS |
| `type === "recovery"` → `/auth/reset-password` preservado | PASS |
| `/login?error=invite_invalid` fallback preservado | PASS |
| `count === 0` check presente | PASS |
| INSERT NÃO condicionado a `type === "invite"` | PASS |
| `npx next build` no repo principal | PASS (build completo, 14 páginas geradas) |

---

## Known Stubs

Nenhum. Esta tarefa modifica apenas lógica de backend em um route handler — nenhuma UI exibida ao usuário.

---

## Threat Flags

Nenhuma superfície nova introduzida além das já documentadas no threat_model do plano:
- T-10-07: locatário cair no branch de Proprietário — mitigado por `count === 0` + invariante de segurança
- T-10-08: registro órfão por email inválido — mitigado (INSERT só após verifyOtp bem-sucedido)
- T-10-09: race de duplo INSERT — mitigado por UNIQUE constraint + tratamento de insertError

---

## User Setup Required

Conforme `user_setup` do plano (fora do escopo desta implementação):

1. **Supabase Dashboard → Authentication → Emails → Confirm signup:** Verificar/ajustar template para que o link de confirmação use `{{ .ConfirmationURL }}` compatível com `/auth/confirm`.
2. **Supabase Dashboard → Authentication → URL Configuration → Redirect URLs:** Garantir que `{origin}/auth/confirm` (dev) e o domínio Vercel (prod) estão na allow-list.

---

## Self-Check: PASSED

- `src/app/auth/confirm/route.js` existe no worktree: FOUND
- Commit `52dd8fa` existe: FOUND
- `10-03-SUMMARY.md` criado no diretório correto: `.planning/phases/10-signup-propriet-rio/`
