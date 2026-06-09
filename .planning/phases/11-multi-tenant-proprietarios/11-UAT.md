---
status: complete
phase: 11-multi-tenant-proprietarios
source: [11-01-SUMMARY.md, 11-02-SUMMARY.md, 11-03-SUMMARY.md, 11-04-SUMMARY.md]
started: 2026-06-09T15:30:00Z
updated: 2026-06-09T15:30:00Z
---

## Current Test

[testing complete]

## Tests

### 1. Smoke Test — app sobe sem erro após migrations
expected: Servidor dev inicia sem erros. Home page carrega em http://localhost:3000 sem erro 500 ou tela em branco.
result: pass

### 2. Página /unidades visível para visitante (anon)
expected: Acesse http://localhost:3000/unidades SEM estar logado (aba anônima). Devem aparecer cards de unidades disponíveis com nome da unidade, nome do edifício, área m², e preço (ou "Consulte o Proprietário"). Sem erro ou tela em branco.
result: pass

### 3. Página /unidades visível estando logado no dashboard
expected: Com o Proprietário logado no dashboard, abra http://localhost:3000/unidades em outra aba. As unidades disponíveis devem aparecer normalmente — o mesmo resultado que o teste anterior. (Regressão: antes deste fix, a página ficava vazia para usuários autenticados.)
result: pass

### 4. Dashboard carrega edifícios e locatários do Proprietário
expected: No dashboard, a aba Unidades/Edifícios mostra os edifícios do Proprietário logado. A aba Locatários mostra os locatários vinculados a este Proprietário. Nenhuma aba aparece vazia quando há dados cadastrados.
result: pass
note: "Não existe UI para criar edifícios diretamente — apenas unidades. Documentado como backlog para fase futura."

### 5. Criar edifício — aparece no dashboard
expected: No dashboard, clique em "Novo Edifício" (ou equivalente), preencha nome e endereço, salve. O edifício recém-criado deve aparecer na lista imediatamente, sem erro 500.
result: skipped
reason: "Não existe UI para criar edifícios — confirmado no teste 4."

### 6. Editar edifício — atualiza sem erro
expected: Clique em editar em um edifício existente, altere o nome, salve. O nome atualizado deve aparecer na lista sem erro. (Regressão crítica: antes do fix IDOR, editarEdificio não escopava por proprietario_id.)
result: skipped
reason: "Não existe UI para visualizar ou editar edifícios."

### 7. Deletar edifício — some da lista
expected: Clique em deletar em um edifício sem unidades ativas. O edifício deve sumir da lista sem erro. (Se tiver unidades, deve aparecer mensagem de erro correta — não erro 500 genérico.)
result: skipped
reason: "Não existe UI para visualizar ou deletar edifícios."

### 8. Convidar Locatário — aparece na lista
expected: Na aba Locatários, clique em convidar, preencha os dados (nome, email, CPF/CNPJ), salve. O Locatário deve aparecer na lista com status "Convite pendente", sem erro 500.
result: pass

### 9. Editar Locatário — atualiza corretamente
expected: Clique em editar em um Locatário existente, altere um campo (ex: telefone), salve. Os dados atualizados devem aparecer sem erro. (Regressão crítica: antes do fix IDOR, editarLocatario não escopava por proprietario_id.)
result: pass

### 10. Revogar convite de Locatário — some da lista
expected: Clique em "Revogar acesso" (ou equivalente) em um Locatário com convite pendente ou ativo. O Locatário deve sumir da lista sem erro 500. (Regressão crítica: antes do fix IDOR, revogarConvite não escopava por proprietario_id.)
result: issue
reported: "erro ao revogar POST /dashboard/locatarios 500 — @supabase/auth-js: Expected parameter to be UUID but is not — em deleteUser(loc.usuario_id) na linha 110"
severity: blocker

## Summary

total: 10
passed: 5
issues: 1
pending: 0
skipped: 3
blocked: 0

## Gaps

- truth: "Revogar convite de Locatário completa sem erro 500"
  status: failed
  reason: "User reported: deleteUser(loc.usuario_id) lança 'Expected parameter to be UUID but is not' — loc.usuario_id é null quando convite está pendente (auth user ainda não existe ou usuario_id não foi gravado)"
  severity: blocker
  test: 10
  artifacts:
    - path: "src/actions/locatarios.js"
      issue: "revogarConvite linha 110 chama deleteUser sem guard de null — se usuario_id for null, Supabase auth-js lança erro"
  missing:
    - "Guard null antes de deleteUser: if (!loc.usuario_id) { deletar apenas o row de locatarios e retornar status 200 }"

## Backlog Notes

- UX: Não há interface para criar, visualizar, editar ou deletar Edifícios no dashboard — Proprietário só gerencia Unidades. Edifícios existem apenas via seed/SQL. Agendar para fase futura: CRUD completo de Edifícios (criar, listar, editar, deletar via UI).
