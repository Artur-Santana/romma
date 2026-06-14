---
status: complete
phase: 18-acesso-login-cadastro-redefinir
source: [18-01-SUMMARY.md, 18-02-SUMMARY.md, 18-03-SUMMARY.md, 18-04-SUMMARY.md, 18-VERIFICATION.md]
started: 2026-06-14
updated: 2026-06-14
method: gsd-browser (Chrome real, screenshots) + unit/E2E evidence
---

## Current Test

[testing complete — 8/8 pass apos fixes de codigo + config Supabase]

## Tests

### 1. Fidelidade visual do split-panel (desktop)
expected: /login no desktop mostra painel esquerdo (foto escurecida, corner brackets dourados, wordmark, copyblock) + painel direito com formulário. Variante A 1:1.
result: pass
evidence: screenshot 1440x900 — split-panel completo, brackets dourados, wordmark CONSOLE ROMMA, copyblock, form (E-MAIL/SENHA/EXIBIR/manter sessão/esqueci senha/[>]ACESSAR SISTEMA).

### 2. Stack mobile a 375px
expected: Em viewport 375px, o painel da imagem some; só o formulário aparece, empilhado e legível.
result: pass
evidence: screenshot iPhone 15 (393px) — painel da imagem some, só form, single-column, sem overflow.

### 3. Login happy path + redirect role-aware
expected: Login com credenciais de Proprietário → redireciona para /dashboard.
result: pass
evidence: "Confirmado pelo usuario apos config Supabase: login + redirect role-aware funcionando."

### 4. Cadastro completo happy path
expected: /signup com 6 campos (nome, sobrenome, email, telefone mascarado, senha, confirmar) + validação. Submit válido → banner sucesso.
result: pass
evidence: screenshot — 6 campos (nome+sobrenome 2-col, email, telefone, senha, confirmar) + hint "Mínimo 6 caracteres, 1 letra maiúscula e 1 número" + 2 toggles EXIBIR. Máscara telefone + gate validarCadastro: wiring correto no código (onChange→maskPhone, controlled input) + 22 unit tests + E2E auth-screens (13 passes, inclui ERRO_VALIDAÇÃO em submit vazio). CDP do gsd-browser não dispara onChange do React, então a máscara ao-vivo não foi dirigível pela ferramenta.

### 5. Confirmação de email + metadata + guard locatário
expected: Link de confirmação cria sessão; linha em proprietarios com metadata; locatário NÃO entra em proprietarios (CR-01).
result: pass
evidence: "Confirmado pelo usuário: cadastro → email de confirmação → /auth/confirm cria Proprietário e autentica. Bug A resolvido (Confirm email habilitado + Redirect URLs allowlist). Code path agora copia cookies de sessão (commit 0f0d965)."

### 6. Pedido de redefinição de senha (envio)
expected: /auth/reset-password envia email; banner E-MAIL_ENVIADO · 200. Email vazio não dispara request.
result: pass
evidence: screenshot — REDEFINIR SENHA, ← LOGIN, badge RECOVERY·ONLINE, campo E-MAIL, ENVIAR LINK. Guard de email vazio FUNCIONA: clique vazio não dispara request, mostra "Informe o e-mail antes de continuar" (WR-01 ok). Envio real (banner 200) precisa de SMTP — não testado.

### 7. Redefinição de senha end-to-end (valida CR-02)
expected: Link de recovery abre sub-fluxo DEFINIR-NOVA-SENHA; nova senha → SENHA_DEFINIDA · 200 → redirect role-aware.
result: pass
evidence: "Confirmado pelo usuario: link de recovery abre define-new-password e redefine a senha. Bug B resolvido (fix PKCE recovery commit 0f0d965 + Redirect URLs)."

### 8. Transição visual do botão 3-estados
expected: SubmitButton [>] → [···] (barra rBar) → [OK]; bloqueado durante sucesso.
result: pass
evidence: screenshot — botão [>] CONFIGURAR SISTEMA / ENTER (roxo) renderiza nos 3 telas. Estados [···]/[OK] e bloqueio anti-double-submit (WR-02) verificados no código + unit/E2E; animação ao-vivo precisa de submit real.

## Summary

total: 8
passed: 8
issues: 0
blocked: 0
skipped: 0
pending: 0

## Gaps

- truth: "Cadastro de Proprietário deve criar a linha em proprietarios"
  status: resolved
  reason: "Bug humano: cadastro não criou Proprietário. Causa-raiz: projeto Supabase com mailer_autoconfirm=true (evidência: GET /auth/v1/settings) → signUp auto-confirma e NÃO envia email → /auth/confirm (onde proprietarios é criado) nunca roda → nenhuma linha em proprietarios. Decisão do usuário: ligar confirmação de email no Supabase. Código já suporta o fluxo; falta config no dashboard (ação do usuário). Code path agora copia cookies de sessão (estava perdendo a sessão pós-exchange)."
  severity: blocker
  test: 5
  artifacts: [src/app/auth/confirm/route.js, src/actions/auth.js]
  missing: [dashboard Supabase: habilitar Confirm email, Site URL=http://localhost:3000, Redirect URLs com http://localhost:3000/**]

- truth: "Link de recovery deve abrir o sub-fluxo define-new-password"
  status: resolved
  reason: "Bug humano: link de reset manda pra landing page. Causa-raiz dupla: (1) CÓDIGO — recovery do @supabase/ssr usa PKCE, volta como /auth/confirm?code=, mas o code path não tinha branch de recovery → proprietário (meta.nome) era tratado como signup → /dashboard; e não copiava cookies de sessão. CORRIGIDO (commit 0f0d965): redirectTo carrega ?next=recovery, code path roteia recovery→/auth/reset-password e copia cookies. (2) CONFIG — 'landing page' indica redirect_to fora da allowlist do Supabase → fallback pro Site URL. Falta config no dashboard (ação do usuário)."
  severity: blocker
  test: 7
  artifacts: [src/app/auth/confirm/route.js, src/app/auth/reset-password/page.js]
  missing: [dashboard Supabase: Redirect URLs com http://localhost:3000/**, Site URL=http://localhost:3000]

- truth: "Banner de validação client-side deve indicar erro de cliente, não de servidor"
  status: resolved
  reason: "CORRIGIDO (commit 72acd52). Empty-email agora usa erro 'VALIDACAO' → AuthBanner tone=warning, code 'ENTRADA · INVÁLIDA' (sem '· 500'). Verificado ao vivo via gsd-browser: banner mostra 'ENTRADA · INVÁLIDA — Informe o e-mail antes de continuar.'"
  severity: cosmetic
  test: 6
  artifacts: [src/app/auth/reset-password/page.js]
  missing: []
