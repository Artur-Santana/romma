# Phase 18: Acesso — Login / Cadastro / Redefinir - Pattern Map

**Mapped:** 2026-06-13
**Files analyzed:** 10 (6 new components + 4 modified files)
**Analogs found:** 10 / 10

---

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|-------------------|------|-----------|----------------|---------------|
| `src/components/auth/AuthFrame.js` | component | request-response | `src/app/login/page.js` (LoginPage + BottomMeta + TopStrip, lines 11-25, 324-344) | exact — extract from existing |
| `src/components/auth/AuthAside.js` | component | request-response | `src/app/login/page.js` (LeftPanel, lines 27-64) | exact — extract from existing |
| `src/components/auth/CornerBrackets.js` | component | — | `src/app/login/page.js` (LeftPanel absolute spans, lines 27-64) | role-match — new decoration layer |
| `src/components/auth/AuthField.js` | component | request-response | `src/app/signup/page.js` (Field, lines 112-159) | exact — extract from existing |
| `src/components/auth/AuthBanner.js` | component | — | `src/app/signup/page.js` (ErrorBanner + EmailSentBanner, lines 75-110) | exact — generalise into variant prop |
| `src/components/auth/SubmitButton.js` | component | — | `src/app/login/page.js` (bracket button block, lines 287-310) | exact — extract from existing |
| `src/app/login/page.js` | component | request-response | itself (existing — redesign) | self |
| `src/app/signup/page.js` | component | request-response | itself (existing — extend + redesign) | self |
| `src/app/auth/reset-password/page.js` | component | request-response | itself (existing — redesign + bug-fix) | self |
| `src/actions/auth.js` | service | request-response | itself (existing — extend signature) | self |
| `src/app/auth/confirm/route.js` | middleware | request-response | itself (existing — extend tentarRegistrarProprietario) | self |

---

## Pattern Assignments

### `src/components/auth/AuthFrame.js` (component shell)

**Analog:** `src/app/login/page.js` (lines 11-25, 324-344)

**Imports pattern** (lines 1-2 of login/page.js):
```javascript
"use client"

import Image from "next/image"
import { useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase-browser"
import { cn } from "@/lib/utils"
```

**Shell structure pattern** (lines 333-344 of login/page.js):
```javascript
export default function LoginPage() {
  return (
    <div className="h-screen flex flex-col bg-background overflow-hidden">
      <TopStrip />
      <main className="grid grid-cols-1 lg:grid-cols-2 overflow-hidden flex-1">
        <LeftPanel />
        <RightPanel />
      </main>
      <BottomMeta />
    </div>
  )
}
```

**AuthFrame target shape** — parameterise for Phase 18:
```javascript
// src/components/auth/AuthFrame.js
"use client"

export default function AuthFrame({ children }) {
  return (
    <div className="h-screen flex flex-col bg-background overflow-hidden">
      <TopStrip />
      <main
        style={{
          display: "grid",
          gridTemplateColumns: "1.05fr 1fr",  // lg only — mobile: 1 col
          flex: 1,
          overflow: "hidden",
        }}
        className="grid-cols-1 lg:grid-cols-[1.05fr_1fr]"
      >
        <AuthAside />
        <div
          className="r-scroll"
          style={{ overflowY: "auto", display: "flex", alignItems: "center",
                   justifyContent: "center", padding: "40px 56px" }}
        >
          {children}
        </div>
      </main>
      <BottomMeta />
    </div>
  )
}
```

**TopStrip pattern** (lines 11-25 of login/page.js — copy verbatim, update px to 20px per UI-SPEC):
```javascript
function TopStrip() {
  return (
    <div
      className="flex items-center justify-between shrink-0"
      style={{
        height: 28,
        background: "rgba(18,18,18,0.95)",
        borderBottom: "1px solid var(--border-2)",
        padding: "0 20px",
        fontFamily: "var(--font-mono)",
        fontSize: 10,
        letterSpacing: "0.5px",
        color: "var(--fg-4)",
        zIndex: 2,
      }}
    >
      <span>INTEGRATED_SYSTEM_NODE: 0X449F</span>
      <div className="hidden lg:flex items-center gap-4">
        <span>GRID.OS.ALPHA</span>
        <span className="flex items-center gap-1.5">
          <span className="r-dot"><i /><i /></span>
          ONLINE
        </span>
      </div>
    </div>
  )
}
```

**BottomMeta pattern** (lines 324-331 of login/page.js — update to border-1, py 10px per UI-SPEC):
```javascript
function BottomMeta() {
  return (
    <div
      className="flex justify-between items-center shrink-0"
      style={{
        padding: "10px 20px",
        borderTop: "1px solid var(--border-1)",
        fontFamily: "var(--font-mono)",
        fontSize: 10,
        letterSpacing: "0.5px",
        color: "var(--fg-5)",
      }}
    >
      <span>ROMMA © 2026 · CONSOLE v2.4.1</span>
      <span className="hidden lg:inline">SESSION_ID: 0XFF8A-2310 // TLS 1.3</span>
    </div>
  )
}
```

---

### `src/components/auth/AuthAside.js` (left panel component)

**Analog:** `src/app/login/page.js` (LeftPanel, lines 27-64)

**Core pattern** (lines 27-64 of login/page.js — exact extract, add CornerBrackets):
```javascript
// LeftPanel in login/page.js is the direct analog. Copy it, rename to AuthAside,
// and insert <CornerBrackets /> inside the relative container.

function AuthAside() {
  return (
    <div
      className="hidden lg:block relative overflow-hidden"
      style={{ borderRight: "1px solid var(--border-2)" }}
    >
      <Image
        src="/hero-building.png"
        alt="Edifício"
        fill
        style={{ objectFit: "cover", filter: "grayscale(0.3) contrast(1.1) brightness(0.62)" }}
        priority
      />
      <div
        className="absolute inset-0"
        style={{ background: "linear-gradient(180deg,rgba(0,0,0,0.25) 0%,rgba(0,0,0,0.88) 100%)" }}
      />
      <CornerBrackets />   {/* NEW — not in current LeftPanel */}
      {/* wordmark — top:36px left:36px (UI-SPEC) */}
      <div style={{ position: "absolute", top: 36, left: 36, right: 36 }}>
        {/* ... see AuthAside content in UI-SPEC */}
      </div>
      {/* copyblock — bottom:56px (UI-SPEC) */}
      <div style={{ position: "absolute", bottom: 56, left: 36, right: 36 }}>
        {/* ... headline + body copy */}
      </div>
    </div>
  )
}
```

**Image filter** — canonical value from UI-SPEC (not the existing `brightness(0.7)`):
```
filter: "grayscale(0.3) contrast(1.1) brightness(0.62)"
```
(Existing files use `brightness(0.7)` — override to `0.62` per handoff.)

**Wordmark pattern** (lines 39-47 of login/page.js — update tracking to 2px per UI-SPEC):
```javascript
<div className="flex items-center gap-2.5">
  <span style={{ fontFamily:"var(--font-mono)", fontSize:11, color:"var(--primary-hover)", letterSpacing:"2px" }}>
    CONSOLE
  </span>
  <span style={{ fontFamily:"var(--font-display)", fontSize:26, fontWeight:700, color:"var(--fg-1)", letterSpacing:"-0.5px" }}>
    ROMMA
  </span>
</div>
```

---

### `src/components/auth/CornerBrackets.js` (decoration — new file)

**Analog:** None existing in codebase. UI-SPEC defines fully.

**Pattern from UI-SPEC (18-UI-SPEC.md lines 224-231):**
```javascript
// src/components/auth/CornerBrackets.js
"use client"

export default function CornerBrackets() {
  const base = {
    position: "absolute",
    width: 22,
    height: 22,
    borderColor: "rgba(201,168,76,0.7)",  // var(--highlight) at 0.7 opacity
    borderStyle: "solid",
    borderWidth: 0,
  }
  const corners = [
    { top: 16, left: 16,  borderTopWidth: 1, borderLeftWidth: 1  },
    { top: 16, right: 16, borderTopWidth: 1, borderRightWidth: 1 },
    { bottom: 16, left: 16,  borderBottomWidth: 1, borderLeftWidth: 1 },
    { bottom: 16, right: 16, borderBottomWidth: 1, borderRightWidth: 1 },
  ]
  return (
    <>
      {corners.map((style, i) => (
        <span key={i} style={{ ...base, ...style }} />
      ))}
    </>
  )
}
```

---

### `src/components/auth/AuthField.js` (input component)

**Analog:** `src/app/signup/page.js` (Field, lines 112-159) — more complete than login/page.js Field (has `id`, `disabled`, `htmlFor`)

**Full pattern** (lines 112-159 of signup/page.js — copy verbatim, adjust padding to 12px per UI-SPEC):
```javascript
// src/components/auth/AuthField.js
"use client"

import { cn } from "@/lib/utils"

export default function AuthField({ id, label, refLabel, type, value, onChange,
  focused, hasError, onFocus, onBlur, extra, inputRef, disabled, hint }) {
  return (
    <div>
      <div className="flex justify-between items-center" style={{ marginBottom: 8 }}>
        <label
          htmlFor={id}
          style={{
            fontFamily: "var(--font-mono)",
            fontWeight: 700,
            fontSize: 11,
            letterSpacing: "1.5px",
            textTransform: "uppercase",
            color: focused ? "var(--primary-hover)" : "var(--fg-4)",
            transition: "color var(--dur-fast)",
          }}
        >
          {label}
        </label>
        {refLabel && (
          <span className="r-meta" style={{ color: "var(--fg-5)" }}>
            {refLabel}
          </span>
        )}
      </div>
      <div className="relative">
        <input
          id={id}
          ref={inputRef}
          type={type}
          value={value}
          onChange={onChange}
          onFocus={onFocus}
          onBlur={onBlur}
          disabled={disabled}
          style={{
            all: "unset",
            display: "block",
            width: "100%",
            padding: "12px 56px 12px 0",  // UI-SPEC: 12px (not 14px from current files)
            fontSize: 16,
            fontFamily: "var(--font-body)",
            color: "var(--fg-1)",
            borderBottom: `1px solid ${hasError ? "var(--danger-fg)" : focused ? "var(--primary-hover)" : "var(--border-2)"}`,
            boxShadow: focused ? "0 1px 0 0 var(--primary-hover)" : "none",
            transition: "border-color var(--dur-fast), box-shadow var(--dur-fast)",
            boxSizing: "border-box",
            opacity: disabled ? 0.4 : 1,
            cursor: disabled ? "not-allowed" : "text",
          }}
        />
        {extra}
      </div>
      {hint && (
        <p className="r-meta" style={{ marginTop: 6, color: "var(--fg-5)" }}>
          {hint}
        </p>
      )}
    </div>
  )
}
```

**Key delta from existing files:**
- Padding: `12px` top/bottom (not `14px` as in current login/signup) — per UI-SPEC line 96
- Border idle: `var(--border-2)` (not `rgba(255,255,255,0.12)`)
- Label focused: `var(--primary-hover)` (not `var(--primary)`)
- Added `hint` prop for password policy hint (`.r-meta` below the field)

---

### `src/components/auth/AuthBanner.js` (banner component)

**Analog:** `src/app/signup/page.js` (ErrorBanner + EmailSentBanner, lines 75-110)

**Generalised pattern** (merge of both existing banner variants):
```javascript
// src/components/auth/AuthBanner.js
"use client"

const TONES = {
  danger:  { bg: "rgba(147,0,10,0.20)",     border: "var(--danger-fg)", mark: "!" },
  success: { bg: "rgba(16,185,129,0.13)",   border: "var(--success)",   mark: "✓" },
  warning: { bg: "var(--warning-bg)",        border: "var(--warning)",   mark: "·" },
}

export default function AuthBanner({ tone = "danger", code, body }) {
  const { bg, border, mark } = TONES[tone]
  return (
    <div
      style={{
        background: bg,
        borderLeft: `2px solid ${border}`,
        padding: "12px 14px",
        display: "flex",
        alignItems: "flex-start",
        gap: 12,
      }}
    >
      <div
        style={{
          width: 16, height: 16, border: `1px solid ${border}`,
          display: "flex", alignItems: "center", justifyContent: "center",
          flexShrink: 0,
        }}
      >
        <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, fontWeight: 700, color: border }}>
          {mark}
        </span>
      </div>
      <div>
        <div className="r-label" style={{ color: border, marginBottom: 4 }}>
          {code}
        </div>
        <div style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--fg-2)", lineHeight: 1.45 }}>
          {body}
        </div>
      </div>
    </div>
  )
}
```

**Usage pattern** (copied from signup/page.js lines 219-232):
```javascript
{erroLocal && <AuthBanner tone="danger" code="ERRO_VALIDAÇÃO" body={erroLocal} />}
{isEmailSent && (
  <AuthBanner
    tone="success"
    code="VERIFIQUE SEU E-MAIL · 200"
    body="Enviamos um link de ativação. Confirme para liberar o console."
  />
)}
```

---

### `src/components/auth/SubmitButton.js` (bracket button)

**Analog:** `src/app/login/page.js` (bracket button block, lines 287-310)

**Full pattern** (lines 287-310 of login/page.js — extract as component):
```javascript
// src/components/auth/SubmitButton.js
"use client"

export default function SubmitButton({ isLoad, isSuccess, idleLabel, loadLabel, successLabel }) {
  return (
    <div style={{ position: "relative", overflow: "hidden" }}>
      <button
        type="submit"
        disabled={isLoad}
        style={{
          all: "unset",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          width: "100%",
          padding: "17px 22px",
          background: isSuccess ? "var(--success)" : "var(--primary)",
          cursor: isLoad ? "default" : "pointer",
          boxShadow: isLoad || isSuccess ? "none" : "0 0 16px 0 var(--primary-glow)",
          transition: "background var(--dur-base), box-shadow var(--dur-base)",
          boxSizing: "border-box",
          color: "var(--fg-1)",
        }}
      >
        <span style={{ fontFamily: "var(--font-mono)", fontSize: 12, letterSpacing: "1px" }}>
          {isLoad ? "[···]" : isSuccess ? "[OK]" : "[>]"}
        </span>
        <span style={{ fontFamily: "var(--font-body)", fontWeight: 700, fontSize: 11,
                       letterSpacing: "2px", textTransform: "uppercase" }}>
          {isLoad ? loadLabel : isSuccess ? successLabel : idleLabel}
        </span>
        <span style={{ fontFamily: "var(--font-mono)", fontSize: 12, letterSpacing: "1px" }}>
          {isLoad ? "" : isSuccess ? "200" : "ENTER"}
        </span>
      </button>
      {isLoad && (
        <div
          style={{
            position: "absolute", bottom: 0, left: 0,
            height: 2, width: "40%",
            background: "var(--chart-1)",
            animation: "rBar 1s linear infinite",
          }}
        />
      )}
    </div>
  )
}
```

**Key delta from existing:** Padding changed to `17px 22px` per UI-SPEC (current files use `18px 24px`). Button label font changed from `text-sm` (14px) to 11px to match UI-SPEC Tier 3. Bracket uses 12px mono.

---

### `src/app/login/page.js` (redesign)

**Analog:** itself (existing)

**Structure to preserve** (lines 155-313):
- `SignInForm` component owns all state: `email`, `password`, `status`, `remember`, `showPassword`, `focusedField`
- `handleSubmit` pattern (lines 165-177) — keep `rpc('is_proprietario')` role check before redirect
- `handleForgotPassword` (lines 179-191) — MOVE behavior to `/auth/reset-password` page (UI-SPEC decision: "Esqueci minha senha" navigates to `/auth/reset-password`, does not inline reset)
- Custom checkbox pattern (lines 256-285) — keep verbatim, update label style to mono 11px per UI-SPEC

**Auth pattern** (lines 168-177 of login/page.js — canonical `rpc('is_proprietario')` usage):
```javascript
const { error } = await supabase.auth.signInWithPassword({ email, password })
if (error) { setStatus("error"); return }
const { data: isProprietario } = await supabase.rpc("is_proprietario")
setStatus("success")
await new Promise(resolve => setTimeout(resolve, 500))
router.push(isProprietario ? "/dashboard" : "/portal/dashboard")
```

**"Esqueci minha senha" change** — replaces `handleForgotPassword` call with navigation:
```javascript
// Replace handleForgotPassword button onClick with:
<button type="button" onClick={() => router.push("/auth/reset-password")}
  style={{ all: "unset", cursor: "pointer", fontFamily: "var(--font-mono)",
           fontSize: 11, color: "var(--fg-4)" }}>
  Esqueci minha senha
</button>
```

**Layout migration:** Replace inline `TopStrip`, `LeftPanel`, `BottomMeta` with `<AuthFrame>`, import `AuthField`, `AuthBanner`, `SubmitButton` from `@/components/auth/`.

---

### `src/app/signup/page.js` (extend + redesign)

**Analog:** itself (existing, lines 161-303)

**Form state pattern** (lines 162-168 of signup/page.js — extend to 6 fields per project convention):
```javascript
const [form, setForm] = useState({
  nome: "",
  sobrenome: "",
  email: "",
  telefone: "",
  senha: "",
  confirmarSenha: "",
})
const [status, setStatus] = useState("empty")
const [erroLocal, setErroLocal] = useState(null)
const [showSenha, setShowSenha] = useState(false)
const [focusedField, setFocusedField] = useState(null)

function resetarForm() {
  setForm({ nome: "", sobrenome: "", email: "", telefone: "", senha: "", confirmarSenha: "" })
}
```

**Inline validation pattern** (lines 173-197 of signup/page.js — extend with new rules):
```javascript
async function handleSubmit(e) {
  e.preventDefault()
  setErroLocal(null)

  if (!form.nome.trim() || !form.sobrenome.trim()) {
    setErroLocal("Informe nome e sobrenome."); return
  }
  if (!/\S+@\S+\.\S+/.test(form.email)) {
    setErroLocal("Informe um e-mail válido."); return
  }
  if (form.telefone.replace(/\D/g, "").length < 10) {
    setErroLocal("Informe um telefone válido (com DDD)."); return
  }
  const erroSenha = validarSenha(form.senha)
  if (erroSenha) { setErroLocal(erroSenha); return }
  if (form.senha !== form.confirmarSenha) {
    setErroLocal("As senhas não coincidem."); return
  }

  setStatus("loading")
  const result = await cadastrarProprietario({
    email: form.email,
    senha: form.senha,
    nome: form.nome,
    sobrenome: form.sobrenome,
    telefone: form.telefone.replace(/\D/g, ""),  // digits only to DB
  })
  if (result.status !== 200) {
    setErroLocal(result.erroMessage || "Não foi possível criar a conta.")
    setStatus("error"); return
  }
  setStatus("email_sent")
}
```

**Phone mask pattern** (new utility inline per RESEARCH.md Pattern 3):
```javascript
function maskPhone(value) {
  const digits = value.replace(/\D/g, "").slice(0, 11)
  if (digits.length <= 10) {
    return digits.replace(/(\d{2})(\d{4})(\d{0,4})/, "($1) $2-$3").replace(/-$/, "")
  }
  return digits.replace(/(\d{2})(\d{5})(\d{0,4})/, "($1) $2-$3").replace(/-$/, "")
}

// In JSX:
<AuthField
  id="telefone-signup"
  label="TELEFONE"
  refLabel="REF_U_INIT_04"
  type="tel"
  value={form.telefone}
  onChange={e => setForm({ ...form, telefone: maskPhone(e.target.value) })}
  ...
/>
```

**Nome + Sobrenome 2-col grid** (UI-SPEC: `grid-cols-[1fr_1fr] gap-4`):
```javascript
<div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
  <AuthField id="nome-signup" label="NOME" refLabel="REF_U_INIT_01" ... />
  <AuthField id="sobrenome-signup" label="SOBRENOME" refLabel="REF_U_INIT_02" ... />
</div>
```

**Hide form on success** (lines 234-299 of signup/page.js — keep `{!isEmailSent && (...)}` pattern):
```javascript
{isEmailSent && <AuthBanner tone="success" code="VERIFIQUE SEU E-MAIL · 200" body="..." />}
{!isEmailSent && (
  <>
    {/* fields + SubmitButton */}
  </>
)}
```

---

### `src/app/auth/reset-password/page.js` (redesign + dual sub-flow + bug-fix)

**Analog:** itself (existing, lines 113-258)

**Dual sub-flow pattern** — use `useSearchParams` (already imported in file, line 115):
```javascript
const searchParams = useSearchParams()
// No token_hash param → email-request sub-flow
// Supabase sets recovery session before redirecting here (handled by /auth/confirm)
// Distinguish sub-flows via a session check or a query param set by /auth/confirm redirect
```

**Per RESEARCH.md Open Question 1 resolution:** The existing `/auth/confirm` already redirects `type=recovery` to `/auth/reset-password`. The simplest split: check `searchParams.get("error")` is absent AND attempt `supabase.auth.getSession()` — if there's an active session from recovery, show the define-new-password form. Otherwise show the email-request form.

**handleForgotPassword pattern** — moved from login/page.js (lines 179-191):
```javascript
// Replicated here from login/page.js handleForgotPassword
async function handleEnviarLink(e) {
  e.preventDefault()
  setStatus("loading")
  const { error } = await supabase.auth.resetPasswordForEmail(form.email, {
    redirectTo: `${window.location.origin}/auth/confirm`,
  })
  if (error) { setStatus("error"); return }
  setStatus("sent")
}
```

**Bug-fix: role-aware redirect** (replaces line 149-151 of reset-password/page.js):
```javascript
// BEFORE (bug — always sends to locatário portal):
router.push("/portal/dashboard")

// AFTER (fixed — same pattern as login/page.js lines 173-176):
const { data: isProprietario } = await supabase.rpc("is_proprietario")
router.push(isProprietario ? "/dashboard" : "/portal/dashboard")
```

**Password policy validator** (shared across signup and reset-password):
```javascript
function validarSenha(senha) {
  if (senha.length < 6) return "A senha deve ter no mínimo 6 caracteres, 1 letra maiúscula e 1 número."
  if (!/[A-Z]/.test(senha)) return "A senha deve ter no mínimo 6 caracteres, 1 letra maiúscula e 1 número."
  if (!/[0-9]/.test(senha)) return "A senha deve ter no mínimo 6 caracteres, 1 letra maiúscula e 1 número."
  return null
}
```

**Form state pattern** (lines 119-122 of reset-password/page.js — keep object style):
```javascript
const [form, setForm] = useState({ email: "", senha: "", confirmarSenha: "" })
const [status, setStatus] = useState("idle")
const [erro, setErro] = useState(null)
```

**Supabase client** (line 117 of reset-password/page.js — keep browser client for `updateUser`):
```javascript
const supabase = createClient()  // from "@/lib/supabase-browser"
```

**`Suspense` wrapper** (line 281 of reset-password/page.js — required for `useSearchParams`):
```javascript
// Keep existing Suspense wrapper on the form component — required by Next.js 16
export default function ResetPasswordPage() {
  return (
    <AuthFrame>
      <Suspense fallback={null}>
        <ResetPasswordForm />
      </Suspense>
    </AuthFrame>
  )
}
```

---

### `src/actions/auth.js` (extend signature)

**Analog:** itself (existing, lines 1-46)

**Imports pattern** (lines 1-4 of auth.js — unchanged):
```javascript
"use server"

import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
```

**Server Action return convention** (lines 8-9, 42-45 of auth.js — established project spelling `erroMessage`):
```javascript
// Guard pattern:
if (!email || !senha || !nome || !sobrenome || !telefone) {
  return { status: 400, erroMessage: "Todos os campos são obrigatórios." }
}
// Success:
return { status: 200 }
// Error:
return { status: error.status ?? 500, erroMessage: error.message }
```

**SSR client setup** (lines 14-30 of auth.js — copy verbatim, unchanged):
```javascript
const cookieStore = await cookies()
const supabase = createServerClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  {
    cookies: {
      getAll() { return cookieStore.getAll() },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) =>
          cookieStore.set(name, value, options)
        )
      },
    },
  }
)
```

**Extended signUp call** (lines 32-39 of auth.js — add `options.data`):
```javascript
// BEFORE (current line 33-39):
const { error } = await supabase.auth.signUp({
  email,
  password: senha,
  options: {
    emailRedirectTo: `${siteUrl}/auth/confirm`,
  },
})

// AFTER:
const { error } = await supabase.auth.signUp({
  email,
  password: senha,
  options: {
    data: { nome, sobrenome, telefone },   // user_metadata — read in /auth/confirm
    emailRedirectTo: `${siteUrl}/auth/confirm`,
  },
})
```

---

### `src/app/auth/confirm/route.js` (extend tentarRegistrarProprietario)

**Analog:** itself (existing, lines 22-34)

**Route Handler imports** (lines 1-3 of route.js — unchanged):
```javascript
import { NextResponse } from "next/server"
import { createServer } from "@/lib/supabase-server"
import supabaseAdmin from "@/lib/supabaseAdmin"
```

**Extended function signature** (lines 25-34 of route.js — add `userMetadata` param):
```javascript
// BEFORE:
async function tentarRegistrarProprietario(userId) {
  const { error: insertError } = await supabaseAdmin
    .from("proprietarios")
    .insert({ usuario_id: userId })
  if (insertError && insertError.code !== "23505") return false
  return true
}

// AFTER:
async function tentarRegistrarProprietario(userId, userMetadata = {}) {
  const { nome, sobrenome, telefone } = userMetadata
  const { error: insertError } = await supabaseAdmin
    .from("proprietarios")
    .insert({ usuario_id: userId, nome, sobrenome, telefone })
  if (insertError && insertError.code !== "23505") return false
  return true
}
```

**Both call sites** (lines 57 and 75 of route.js — pass `data.user.user_metadata`):
```javascript
// token_hash path (line 57):
const viroupProprietario = await tentarRegistrarProprietario(data.user.id, data.user.user_metadata)

// code path (line 75):
const viroupProprietario = await tentarRegistrarProprietario(data.user.id, data.user.user_metadata)
```

**UNIQUE conflict handling** (line 31-32 of route.js — unchanged, re-confirmation is already idempotent):
```javascript
if (insertError && insertError.code !== "23505") return false
```

---

## Shared Patterns

### Supabase Browser Client (all 3 page files)
**Source:** `src/lib/supabase-browser.js` (entire file)
**Apply to:** `login/page.js`, `signup/page.js` (indirectly via Server Action), `reset-password/page.js`
```javascript
import { createClient } from "@/lib/supabase-browser"
const supabase = createClient()
// Module-level instantiation (pattern from login/page.js line 9)
```

### Role-Aware Redirect (`is_proprietario` RPC)
**Source:** `src/app/login/page.js` lines 173-176
**Apply to:** `reset-password/page.js` (bug-fix) and `login/page.js` (existing — keep)
```javascript
const { data: isProprietario } = await supabase.rpc("is_proprietario")
router.push(isProprietario ? "/dashboard" : "/portal/dashboard")
```

### `cn` Utility Import
**Source:** `src/app/login/page.js` line 7 and `src/app/signup/page.js` line 7
**Apply to:** Any auth component using conditional class names
```javascript
import { cn } from "@/lib/utils"
```

### EyebrowRail Pattern
**Source:** `src/app/login/page.js` (EyebrowRail, lines 66-75)
**Apply to:** All 3 redesigned pages (via inline usage in form panels or extracted to AuthFrame)
```javascript
function EyebrowRail({ label }) {
  return (
    <div className="flex items-center gap-2">
      <span className="w-6 h-px bg-primary-accent inline-block" />
      <span className="font-body font-bold text-xs tracking-[3px] uppercase text-primary-accent">
        {label}
      </span>
    </div>
  )
}
```
Note: `bg-primary-accent` maps to `var(--primary-hover)` — confirm token in globals.css. In Phase 18 shared components use the inline `var(--primary-hover)` style directly.

### Password Toggle Extra Slot
**Source:** `src/app/login/page.js` lines 243-251 and `src/app/signup/page.js` lines 261-270
**Apply to:** Senha and ConfirmarSenha fields in `signup/page.js` and `reset-password/page.js`
```javascript
// Passed as `extra` prop to AuthField:
extra={
  <button
    type="button"
    onClick={() => setShowSenha(v => !v)}
    style={{ all: "unset", cursor: "pointer", position: "absolute", right: 0,
             top: "50%", transform: "translateY(-50%)", fontFamily: "var(--font-mono)",
             fontSize: 11, color: "var(--fg-4)", letterSpacing: "1px",
             textTransform: "uppercase" }}
  >
    {showSenha ? "OCULTAR" : "EXIBIR"}
  </button>
}
```

### Custom Checkbox (Login only)
**Source:** `src/app/login/page.js` lines 256-285
**Apply to:** `login/page.js` only — keep pattern, update label font to match UI-SPEC
```javascript
<div
  role="checkbox"
  aria-checked={remember}
  tabIndex={0}
  onClick={() => setRemember(v => !v)}
  onKeyDown={e => e.key === " " && setRemember(v => !v)}
  className="flex items-center gap-2 cursor-pointer"
>
  <div className={cn(
    "w-4 h-4 border flex items-center justify-center shrink-0 transition-all duration-150",
    remember ? "border-primary bg-primary" : "border-[rgba(255,255,255,0.25)] bg-transparent"
  )}>
    {remember && (
      <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
        <path d="M1.5 5L4 7.5L8.5 2.5" stroke="white" strokeWidth="1.5"
              strokeLinecap="square" strokeLinejoin="miter" />
      </svg>
    )}
  </div>
  <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--fg-4)",
                 letterSpacing: "1px", textTransform: "uppercase" }}>
    MANTER SESSÃO ATIVA
  </span>
</div>
```

### `.r-dot` Realtime Pulse (Status Badge)
**Source:** `src/app/globals.css` lines 452-455 (class already exists)
**Apply to:** All 3 page status badges + TopStrip right side
```javascript
// Usage (replace the rounded-full span pattern in existing files):
<span className="r-dot"><i /><i /></span>
```

### `r-fade` Page Entrance
**Source:** `src/app/globals.css` line 466
**Apply to:** The form card `div` (`className="r-fade"`) on all 3 pages

### Loading Bar Animation
**Source:** `src/app/login/page.js` line 309 + `globals.css` line 461 (`rBar` keyframe)
**Apply to:** `SubmitButton.js` (extracted — `animation: "rBar 1s linear infinite"`)
Note: existing files use `animate-loading-bar` Tailwind class — switch to inline `animation: "rBar 1s linear infinite"` in the extracted component to avoid Tailwind config dependency.

---

## No Analog Found

| File | Role | Data Flow | Reason |
|------|------|-----------|--------|
| `src/components/auth/CornerBrackets.js` | component | — | No decorative L-bracket pattern exists in codebase — new visual element from design handoff |

---

## Key Deltas from Existing Code

These are places where the existing analog must NOT be copied verbatim — the Phase 18 target differs:

| File | Current value | Phase 18 target | Source |
|------|--------------|-----------------|--------|
| `AuthField` padding | `14px 60px 14px 0` | `12px 56px 12px 0` | UI-SPEC line 96 |
| Image filter brightness | `brightness(0.7)` | `brightness(0.62)` | UI-SPEC line 217 |
| BottomMeta padding | `py-3 px-8` | `10px 20px` | UI-SPEC line 477 |
| TopStrip padding | `px-8` | `px-5` (20px) | UI-SPEC line 473 |
| Grid cols (main) | `lg:grid-cols-2` | `lg:grid-cols-[1.05fr_1fr]` | UI-SPEC line 54 |
| Form panel padding | `px-6 py-10 lg:px-12 lg:py-16` | `40px 56px` desktop / `32px 22px` mobile | UI-SPEC line 92 |
| Form max-width | `max-w-[420px]` | `max-w-[408px]` | UI-SPEC line 93 |
| SubmitButton padding | `py-[18px] px-6` | `17px 22px` | UI-SPEC line 279 |
| reset-password redirect | `router.push("/portal/dashboard")` | `rpc("is_proprietario")` then branch | RESEARCH.md Pitfall 2 |
| Label focus color | `var(--primary)` | `var(--primary-hover)` | UI-SPEC Tier 3 table |
| Status dot | `rounded-full bg-success` span | `.r-dot` with `<i /><i />` | globals.css line 452 |
| "Esqueci minha senha" | inline `handleForgotPassword` | `router.push("/auth/reset-password")` | UI-SPEC line 532 |

---

## Metadata

**Analog search scope:** `src/app/login/`, `src/app/signup/`, `src/app/auth/`, `src/actions/`, `src/app/globals.css`, `src/lib/supabase-browser.js`
**Files scanned:** 7 source files read in full
**Pattern extraction date:** 2026-06-13
