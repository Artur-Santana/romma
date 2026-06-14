---
status: partial
phase: 18-acesso-login-cadastro-redefinir
source: [18-VERIFICATION.md]
started: 2026-06-14
updated: 2026-06-14
---

## Current Test

[awaiting human testing]

## Tests

### 1. Fidelidade visual do split-panel (desktop)
expected: Tela de Acesso variante A renderiza painel esquerdo com foto (brightness 0.62), corner brackets dourados e headline; painel direito com formulário. 1:1 com o handoff.
result: [pending]

### 2. Stack mobile a 375px
expected: Em viewport 375px, o AuthAside (painel da imagem) some e só o formulário aparece, empilhado.
result: [pending]

### 3. Login happy path + redirect role-aware
expected: Login com credenciais reais de Proprietário redireciona para `/dashboard`; Locatário iria para `/portal/dashboard` (via `rpc("is_proprietario")`).
result: [pending]

### 4. Cadastro completo happy path
expected: Signup com 6 campos (nome, sobrenome, email, telefone mascarado, senha, confirmar) dispara `signUp` real e mostra banner de sucesso "e-mail enviado".
result: [pending]

### 5. Round-trip de confirmação de email + metadata
expected: Link de confirmação cria sessão e popula linha em `proprietarios` com nome/sobrenome/telefone (telefone só dígitos). Locatário convidado NÃO é inserido em `proprietarios` (CR-01).
result: [pending]

### 6. Pedido de redefinição de senha (envio)
expected: `/auth/reset-password` envia email via `resetPasswordForEmail` (SMTP real); banner `E-MAIL_ENVIADO · 200`. Email vazio não dispara request (WR-01).
result: [pending]

### 7. Redefinição de senha end-to-end (valida CR-02)
expected: Clicar no link de recovery do email abre `/auth/reset-password` no sub-fluxo DEFINIR-NOVA-SENHA (sessão de recovery sobrevive ao redirect — cookies anexados ao NextResponse). Define nova senha → `SENHA_DEFINIDA · 200` → redirect role-aware.
result: [pending]

### 8. Transição visual do botão 3-estados
expected: SubmitButton transiciona [>] → [···] (barra de progresso rBar) → [OK]; bloqueado durante sucesso (sem double-submit, WR-02).
result: [pending]

## Summary

total: 8
passed: 0
issues: 0
pending: 8
skipped: 0
blocked: 0

## Gaps
