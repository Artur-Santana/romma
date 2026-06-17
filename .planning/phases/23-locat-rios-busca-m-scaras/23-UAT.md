---
status: complete
phase: 23-locat-rios-busca-m-scaras
source: [23-01-SUMMARY.md, 23-02-SUMMARY.md]
started: "2026-06-17T00:00:00.000Z"
updated: "2026-06-17T15:00:00.000Z"
---

## Current Test

[testing complete]

## Tests

### 1. Busca de locatários
expected: No dashboard Locatários, existe um campo de busca com ícone ⌕. Ao digitar nome, e-mail ou documento (CPF/CNPJ), a lista filtra em tempo real. Um contador "X resultado(s)" aparece refletindo o total filtrado.
result: pass

### 2. Máscaras de documento
expected: Ao convidar um novo locatário, o campo CPF/CNPJ aplica máscara automática (ex: 123.456.789-09 ou 12.345.678/0001-99). No segmented PF/PJ, ao trocar o tipo, o documento é re-formatado para a máscara correta.
result: pass

### 3. Máscara de telefone no modal editar
expected: Ao abrir o modal de edição de um locatário, o campo Telefone já exibe o valor formatado (ex: (11) 91234-5678). Editar o campo mantém a máscara aplicada.
result: pass

### 4. Layout desktop — cards de locatários
expected: Em tela desktop (>768px), os locatários são exibidos em uma grade de cards. Cada card contém: avatar com inicial, nome/tipo/documento, e-mail, badge de status do convite, contador de contratos e botões de ação (Editar, Reenviar, Revogar).
result: pass

### 5. Layout mobile — rows com ações visíveis
expected: Em tela mobile (375px), os locatários aparecem como linhas (rows). Os botões de ação ficam sempre visíveis no footer da row, sem precisar de hover.
result: pass

### 6. Reenviar convite
expected: Clicar "Reenviar" num locatário com convite pendente muda o botão para "✓ Reenviado" por ~2 segundos, depois volta ao normal, sem reload da página. O convite é realmente reenviado (e-mail chega ou não gera erro).
result: blocked
blocked_by: third-party
reason: "email rate limit exceeded — Supabase Auth bloqueou reenvio após múltiplos testes. SA e lógica verificados via network intercept: código correto (status 200 → setResent, status !200 → toast.error). Path de sucesso não confirmável visualmente nesta sessão."

### 7. ConfirmDialog ao revogar
expected: Clicar "Revogar" abre um diálogo de confirmação (não revoga imediatamente). Cancelar fecha sem ação. Confirmar revoga o locatário. Se falhar (ex: locatário tem contratos), um toast de erro aparece na tela principal.
result: pass

### 8. Modal editar — campos restritos
expected: Ao editar um locatário, o modal exibe APENAS os campos Nome, E-mail e Telefone. Não há campos de Tipo (PF/PJ) nem Documento. Salvar persiste apenas esses três campos sem alterar tipo ou documento existentes.
result: pass

## Summary

total: 8
passed: 7
issues: 0
pending: 0
skipped: 0
blocked: 1

## Gaps

[none]
