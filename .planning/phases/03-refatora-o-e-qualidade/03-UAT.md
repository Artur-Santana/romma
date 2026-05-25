---
status: complete
phase: 03-refatora-o-e-qualidade
source: [03-01-SUMMARY.md, 03-02-SUMMARY.md, 03-03-SUMMARY.md, 03-04-SUMMARY.md]
started: 2026-05-25T22:00:00Z
updated: 2026-05-25T22:15:00Z
---

## Current Test

[testing complete]

## Tests

### 1. Botão "Sair" no Portal do Locatário
expected: Acesse o portal do Locatário (/portal). No header, deve aparecer um botão "Sair" no canto superior direito. Ao clicar, o texto muda para "Saindo..." brevemente e depois redireciona para /login. Tentar voltar ao portal após logout redireciona para /login.
result: pass

### 2. Cancelar Contrato — unidade volta a "disponível"
expected: No dashboard do Proprietário, vá em Contratos, cancele um contrato ativo. A unidade associada deve aparecer como "disponível" (status atualizado). O contrato aparece como "cancelado".
result: pass

### 3. Encerrar Contrato — unidade volta a "disponível"
expected: No dashboard do Proprietário, encerre um contrato ativo. A unidade associada deve aparecer como "disponível". O contrato aparece como "encerrado".
result: pass

### 4. Editar Locatário — salva corretamente
expected: No dashboard, edite um Locatário (nome, documento, email, telefone). Confirme que os dados foram salvos corretamente ao reabrir ou recarregar. Campos como usuario_id não devem ser alterados.
result: issue
reported: "Não existe botão para editar o locatário"
severity: major

### 5. Lint — zero errors
expected: Execute `npm run lint` no terminal do projeto. Deve retornar 0 errors (pode ter até 8 warnings de no-img-element em src/app/page.js — isso é esperado).
result: pass

### 6. Build — passa sem errors
expected: Execute `npm run build` no terminal do projeto. Deve compilar com sucesso ("Compiled successfully"). Zero errors de build.
result: pass

## Summary

total: 6
passed: 5
issues: 1
pending: 0
skipped: 0
blocked: 0

## Gaps

- truth: "Locatário pode ser editado (nome, documento, email, telefone) via UI do dashboard"
  status: failed
  reason: "User reported: Não existe botão para editar o locatário"
  severity: major
  test: 4
  root_cause: ""
  artifacts: []
  missing: []
  debug_session: ""
