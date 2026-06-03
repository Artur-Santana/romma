---
phase: 07-ajustes-finais-pre-banca
fixed_at: 2026-06-02T00:00:00Z
review_path: .planning/phases/07-ajustes-finais-pre-banca/07-REVIEW.md
iteration: 1
findings_in_scope: 8
fixed: 8
skipped: 0
status: all_fixed
---

# Phase 07: Code Review Fix Report

**Fixed at:** 2026-06-02T00:00:00Z
**Source review:** .planning/phases/07-ajustes-finais-pre-banca/07-REVIEW.md
**Iteration:** 1

**Summary:**
- Findings in scope: 8 (CR-01..04, WR-01..04)
- Fixed: 8
- Skipped: 0

## Fixed Issues

### CR-01: `deletarLocatario` orphans auth user

**Files modified:** `src/actions/locatarios.js`
**Commit:** d92d254
**Applied fix:** Adicionado fetch de `usuario_id` antes de deletar a linha da tabela `locatarios`, seguido de chamada a `supabaseAdmin.auth.admin.deleteUser(loc.usuario_id)` com captura e retorno de erro. Isso evita que o auth user fique orphan após exclusão do locatário.

---

### CR-02: `resetPasswordForEmail` sem `redirectTo`

**Files modified:** `src/app/login/page.js`, `src/app/auth/confirm/route.js`
**Commit:** 6391331
**Applied fix:** Adicionado `redirectTo: \`\${window.location.origin}/auth/confirm\`` na chamada `resetPasswordForEmail`. Na rota confirm, adicionado branching por `type === "recovery"` que redireciona para `/auth/reset-password` em vez de `/portal/dashboard`.

---

### CR-03: Senha vazia aceita sem validação de comprimento mínimo

**Files modified:** `src/app/auth/reset-password/page.js`
**Commit:** 6206367
**Applied fix:** Adicionada validação `form.password.length < 6` em `handleSubmit` antes da verificação de igualdade das senhas. Adicionado banner `SENHA_CURTA` com mensagem "A senha deve ter pelo menos 6 caracteres." (min 6 chars conforme instrução do prompt, alinhado com padrão Supabase).

---

### CR-04: `revogarConvite` ignora erro de `deleteUser`

**Files modified:** `src/actions/locatarios.js`
**Commit:** d92d254
**Applied fix:** Substituído `await supabaseAdmin.auth.admin.deleteUser(...)` sem captura de erro por destructuring `{ error: authDelErr }` com retorno `{ status: 500, erroMessage: authDelErr.message }` em caso de falha. Fix incluído no mesmo commit que CR-01.

---

### WR-01: Comparação de datas com UTC causa erro de 3h por dia (UTC-3)

**Files modified:** `src/components/features/Contratos.js`
**Commit:** 3b3381d
**Applied fix:** Adicionada função `getTodayLocal()` no escopo de módulo que retorna a data local no formato `YYYY-MM-DD` sem desvio UTC. A linha `vencido` agora usa `getTodayLocal()` em vez de `new Date().toISOString().split("T")[0]`.

**Status:** fixed: requires human verification — esta é uma correção de lógica de fuso horário; o comportamento exato da fronteira `data_fim === hoje` (vencendo vs. vencido) deve ser confirmado manualmente.

---

### WR-02: `convidarLocatario` não valida formato de email nem documento

**Files modified:** `src/actions/locatarios.js`
**Commit:** e5bb750
**Applied fix:** Adicionadas constantes `EMAIL_RE` e `DOCUMENTO_RE` no escopo do módulo. Incluídas validações logo após a verificação de campos obrigatórios: rejeita emails mal formados com status 400 e documentos que não sejam CPF (11 dígitos) ou CNPJ (14 dígitos) puros. Verificado que o formulário envia `documento` como texto puro sem formatação.

---

### WR-03: `PortalDashboard` instancia `createClient()` no escopo de módulo

**Files modified:** `src/components/features/portal/PortalDashboard.js`
**Commit:** fe1955e
**Applied fix:** Movida a linha `const supabase = createClient()` do escopo de módulo para dentro da função do componente `PortalDashboard()`, garantindo que cada render cria seu próprio cliente com sessão fresca.

---

### WR-04: Botão "Ver Arquivo" sem `onClick` — elemento interativo não funcional

**Files modified:** `src/components/features/Contratos.js`
**Commit:** b0b8888
**Applied fix:** Adicionados atributos `disabled` e classes `opacity-50 cursor-not-allowed` ao botão "Ver Arquivo →", tornando-o visualmente inativo e semanticamente desabilitado. Evita clique sem resposta durante a banca.

---

_Fixed: 2026-06-02T00:00:00Z_
_Fixer: Claude (gsd-code-fixer)_
_Iteration: 1_
