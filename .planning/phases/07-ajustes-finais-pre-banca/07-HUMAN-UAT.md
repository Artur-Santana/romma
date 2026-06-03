---
status: resolved
phase: 07-ajustes-finais-pre-banca
source: [07-VERIFICATION.md]
started: 2026-06-03T00:00:00Z
updated: 2026-06-03T00:00:00Z
---

## Current Test

[awaiting human testing]

## Tests

### 1. Fluxo completo de convite em produção (token real)
expected: Enviar convite para email de teste → clicar no link → chegar autenticado em /portal/dashboard. Verificar se o flow é magic-link (sem definição de senha) ou redireciona para /auth/reset-password para definir senha.
result: aprovado pelo usuário em 2026-06-03

### 2. Botão Sair funcional no sidebar
expected: Logar como Proprietário → clicar "Sair" no footer do sidebar → redirecionar para /login com sessão encerrada.
result: aprovado pelo usuário em 2026-06-03

## Summary

total: 2
passed: 2
issues: 0
pending: 0
skipped: 0
blocked: 0

## Gaps
