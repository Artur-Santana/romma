# Phase 18: Acesso — Login / Cadastro / Redefinir - Context

**Gathered:** 2026-06-13
**Status:** Ready for planning

<domain>
## Phase Boundary

Redesign das 3 telas de Acesso (login, cadastro, redefinir senha) para a **variante A** (split-panel) do design handoff, com cadastro completo e fluxo de redefinição. Telas já existem (`/login`, `/signup`, `/auth/reset-password`) — esta fase é redesign + extensão de campos + persistência.

Entrega ACESSO-01..04:
- Layout split-panel variante A (foto dessaturada + cantoneiras douradas à esquerda, formulário à direita; stack só-formulário no mobile).
- Login: senha exibir/ocultar, checkbox "manter sessão", link "esqueci minha senha", botão bracket `[>] ACESSAR SISTEMA → [···] AUTENTICANDO → [OK] 200`.
- Cadastro: nome, sobrenome, email, telefone (máscara), senha, confirmar senha + validações; banner "Verifique seu e-mail"; sobrenome/telefone persistem em `proprietarios`.
- Redefinir: envia link por email + confirmação de sucesso.

NÃO inclui: outras telas; AUTH-02 (cancelado — ver decisões).
</domain>

<decisions>
## Implementation Decisions

### Layout & Fidelidade Visual
- Fonte do layout: **Variante A do handoff (`.planning/design/js/auth.jsx`) 1:1** — split-panel, foto dessaturada + cantoneiras douradas, top strip, bottom meta.
- Extrair componentes compartilhados (`AuthFrame`/`AuthAside`/`CornerBrackets`/`TopStrip`) reusados pelas 3 telas.
- Reusar a imagem de prédio já presente em `/login` (next/image).
- Consumir tokens da Phase 17: `--rt-*` e classes `.r-*` (`.r-title`, `.r-label`, `.r-meta`, `.r-dot`, etc.).

### Formulário & Validação
- Máscara de telefone à mão (sem lib): formato `(99) 99999-9999`, **armazena só dígitos** (mesmo padrão que será usado em Locatários — Phase 23).
- Form state: objeto único `useState` (convenção do projeto); validação inline antes do submit; reset via função nomeada.
- Bracket button por estado (loading/success): `[>] ACESSAR SISTEMA → [···] AUTENTICANDO → [OK] 200`, sem lib.
- Validações de cadastro bloqueiam submit inválido: obrigatórios, email válido, telefone ≥10 dígitos, senhas coincidem.
- **Política de senha (mais forte que o success criteria): ≥6 caracteres E ≥1 letra maiúscula E ≥1 número.** Validação client-side no cadastro E na tela de definir/redefinir senha. Mensagem clara do requisito.

### Persistência & Fluxo de Redefinição
- Estender `cadastrarProprietario` (src/actions/auth.js) para receber nome/sobrenome/telefone além de email/senha. Passar nome/sobrenome/telefone via `options.data` (user metadata) no `signUp`.
- Gravar nome/sobrenome/telefone em `proprietarios` no handler `/auth/confirm` (`tentarRegistrarProprietario`), lendo de `data.user.user_metadata` — a linha de proprietário já é criada nesse ponto (após verifyOtp). Colunas adicionadas na Phase 17.
- Redefinir senha: reusar `/auth/reset-password` existente; `resetPasswordForEmail` → confirmação de sucesso; redesign visual variante A.

### Múltiplos Proprietários (decisão do usuário — substitui Q4)
- **Permitir vários Proprietários por instância.** NÃO adicionar guard de instância única.
- Já é estruturalmente suportado: não há guard no código; o único UNIQUE é `proprietarios_usuario_id_unique` (um proprietário-row por usuário). Todo signup confirmado vira proprietário próprio (`/auth/confirm` comentário AUTH-01). Multi-tenant RLS (v1.1) já isola dados por `proprietario_id`.
- **AUTH-02 (banner "Instância já configurada" no 2º signup) fica CANCELADO** — não implementar; era o oposto desta decisão.
- Implicação de doc: PROJECT.md lista "Múltiplos Proprietários por instância — excluído no TCC" em Out of Scope; isso deve ser atualizado (item em deferidos abaixo).

### Claude's Discretion
- Detalhes de microcopy, ordem exata dos campos, estilo do banner de erro/sucesso.
- Implementação exata da animação do bracket button.
</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/app/login/page.js` — já tem `TopStrip`, `LeftPanel`, split-panel parcial, next/image, supabase-browser. Base do redesign.
- `src/app/signup/page.js` (333 linhas) — cadastro existente a estender com sobrenome/telefone/confirmar-senha + validações.
- `src/app/auth/reset-password/page.js` (286 linhas) — fluxo de redefinição existente a redesenhar.
- `src/actions/auth.js` — `cadastrarProprietario({ email, senha })` (estender p/ nome/sobrenome/telefone via options.data).
- `src/app/auth/confirm/route.js` — `tentarRegistrarProprietario(userId)` faz INSERT em proprietarios; ponto onde gravar nome/sobrenome/telefone do metadata.
- `.planning/design/js/auth.jsx` — spec da variante A (AuthFrame/AuthAside/CornerBrackets/bracket button/campos).
- `.planning/design/screenshots/{desktop,mobile}/01-login.png, 02-cadastro.png, 03-redefinir.png` — referência hifi.
- Tokens/classes `.r-*` da Phase 17 (globals.css).

### Established Patterns
- supabase-browser client p/ auth client-side; Server Action `cadastrarProprietario` usa createServerClient com cookies (SSR).
- `emailRedirectTo` = `${SITE_URL}/auth/confirm`.
- Server Actions retornam `{ status: 200 }` ou `{ status, erroMessage }`.
- proprietarios.nome/sobrenome/telefone (Phase 17, nullable TEXT).

### Integration Points
- signUp `options.data` → user_metadata → lido em `/auth/confirm` → gravado em `proprietarios`.
- Confirmação de signup (`type=signup`) redireciona p/ `/dashboard`.
- recovery (`type=recovery`) redireciona p/ `/auth/reset-password`.

</code_context>

<specifics>
## Specific Ideas

- Política de senha explícita: ≥6 + ≥1 maiúscula + ≥1 número (pedido direto do usuário).
- Vários proprietários permitidos (pedido direto do usuário) — sem guard de instância única.
- Bracket button: `[>] ACESSAR SISTEMA → [···] AUTENTICANDO → [OK] 200`.
- Telefone só dígitos no DB, máscara `(99) 99999-9999` na UI.

</specifics>

<deferred>
## Deferred Ideas

- **Atualizar PROJECT.md**: remover "Múltiplos Proprietários por instância — excluído no TCC" de Out of Scope, refletindo a decisão de permitir vários proprietários. (Doc update — fazer durante/após esta fase ou no fechamento da milestone.)
- AUTH-02 cancelado (não é mais deferido — é decisão revertida).

</deferred>
