---
phase: 06-deploy-final-e-demo
plan: "03"
subsystem: deploy
tags: [gitignore, demo, convite, produção, cheat-sheet, realtime]
status: complete
tasks_completed: 3
tasks_total: 3

dependency_graph:
  requires: [06-01, 06-02]
  provides: [DEPL-02-validation, DEMO-01]
  affects: [.gitignore, DEMO.md, demo-cheat-sheet.html]

tech_stack:
  added: []
  patterns: [gitignore-sensitive-file, html-print-A4]

key_files:
  created:
    - DEMO.md (gitignored — roteiro completo com credenciais e fallbacks)
    - demo-cheat-sheet.html (committado — cheat sheet A4 sem dados sensíveis)
  modified:
    - .gitignore

decisions:
  - "DEMO.md adicionado ao .gitignore antes da criação do arquivo (sequência de segurança T-06-06)"
  - "Fluxo de convite testado em produção: email chegou, redirect para romma-alpha.vercel.app funcionou (não localhost)"
  - "Two Phase 7 gaps documentados como limitações com workaround — não blockers: /auth/confirm e /auth/reset-password ausentes"
  - "demo-cheat-sheet.html commitado sem credenciais; DEMO.md fica apenas local (gitignored)"

metrics:
  duration: "~45min (Tasks 1+2+3)"
  completed_date: "2026-06-01"
  tasks_completed: 3
  tasks_total: 3
---

# Phase 06 Plan 03: Validar Convite em Prod + Roteiro de Demo — Summary

**One-liner:** Fluxo de convite de Locatário validado em produção ponta a ponta; DEMO.md (gitignored) com roteiro numerado, fallback Realtime D-07 e gaps da Fase 7; demo-cheat-sheet.html A4 imprimível commitado.

---

## Completed Tasks

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Adicionar DEMO.md ao .gitignore | `255de3e` | `.gitignore` |
| 2 | Validar fluxo de convite em produção | checkpoint-approved | validação humana em prod |
| 3 | Criar DEMO.md e demo-cheat-sheet.html | `6a3700c` | `DEMO.md` (local), `demo-cheat-sheet.html` |

---

## Deviations from Plan

### Task 2 — Gaps documentados como Phase 7 (não blockers)

Durante a validação do fluxo de convite em produção, foram encontrados dois gaps:

**1. [Rule 2 — Documentação] Tela de primeiro acesso ausente**
- **Encontrado em:** Task 2 (validação humana)
- **Problema:** Locatário convidado clica no link → cai na página de login sem forma de definir senha. Falta `/auth/confirm` que processa o token Supabase `type=invite` no URL hash.
- **Decisão:** Documentado em DEMO.md com workaround (pré-definir senha via Supabase Admin). Escopo Fase 7.
- **Workaround:** Pré-definir senha do locatário.demo@romma.demo via Supabase Admin Panel antes da banca.

**2. [Rule 2 — Documentação] Esqueci senha sem página de redefinição**
- **Encontrado em:** Task 2 (validação humana)
- **Problema:** Reset de senha redireciona para home em vez de `/auth/reset-password`.
- **Decisão:** Documentado em DEMO.md com workaround. Escopo Fase 7.
- **Workaround:** Usar conta com senha pré-definida.

Ambos documentados no DEMO.md sob "Limitações Conhecidas (Fase 7)" com workarounds claros para a banca em 18/06/2026.

---

## Threat Flags

Nenhuma superfície nova além do previsto no threat model do plano (T-06-06, T-06-07, T-06-08 todos mitigados).

- T-06-06: DEMO.md criado somente após .gitignore atualizado (commit 255de3e anterior). Nunca rastreado.
- T-06-07: Redirect validado para romma-alpha.vercel.app — não localhost.
- T-06-08: demo-cheat-sheet.html não contém credenciais, emails ou dados sensíveis.

---

## Known Stubs

Nenhum stub. DEMO.md contém dados reais de demonstração (gitignored). demo-cheat-sheet.html é documentação pura sem dados dinâmicos.

---

## Self-Check: PASSED

- [x] DEMO.md existe em `/home/artursantana/Code/romma/DEMO.md`
- [x] demo-cheat-sheet.html existe em `/home/artursantana/Code/romma/demo-cheat-sheet.html`
- [x] DEMO.md contém "fallback", "Realtime", "disponível→alugada", "RLS"
- [x] `git status --porcelain DEMO.md` retorna vazio (gitignored)
- [x] Commit `255de3e` existe (Task 1 — .gitignore)
- [x] Commit `6a3700c` existe (Task 3 — demo-cheat-sheet.html)
- [x] SUMMARY.md marca status: complete, tasks_completed: 3/3
- [x] STATE.md e ROADMAP.md NÃO modificados (conforme instrução do agente continuação)
