"use client"

import { useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase-browser"
import { cn } from "@/lib/utils"
import AuthFrame from "@/components/auth/AuthFrame"
import AuthField from "@/components/auth/AuthField"
import AuthBanner from "@/components/auth/AuthBanner"
import SubmitButton from "@/components/auth/SubmitButton"

const supabase = createClient()

function EyebrowRail({ label }) {
  return (
    <div className="flex items-center gap-2">
      <span
        style={{
          display: "inline-block",
          width: 24,
          height: 1,
          background: "var(--primary-hover)",
        }}
      />
      <span
        style={{
          fontFamily: "var(--font-body)",
          fontWeight: 700,
          fontSize: 11,
          letterSpacing: "3px",
          textTransform: "uppercase",
          color: "var(--primary-hover)",
        }}
      >
        {label}
      </span>
    </div>
  )
}

function SignInForm() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [status, setStatus] = useState("empty")
  const [remember, setRemember] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [focusedField, setFocusedField] = useState(null)
  const emailRef = useRef(null)
  const router = useRouter()

  async function handleSubmit(e) {
    e.preventDefault()
    setStatus("loading")
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      setStatus("error")
      return
    }
    const { data: isProprietario } = await supabase.rpc("is_proprietario")
    setStatus("success")
    await new Promise(resolve => setTimeout(resolve, 500))
    router.push(isProprietario ? "/dashboard" : "/portal/dashboard")
  }

  const isLoading = status === "loading"
  const hasError = status === "error"
  const isSuccess = status === "success"

  return (
    <div className="r-fade w-full" style={{ maxWidth: 408 }}>
      {/* Status badge */}
      <div
        className="flex justify-end"
        style={{
          marginBottom: 44,
        }}
      >
        <div
          className="flex items-center gap-1.5"
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: 10,
            letterSpacing: "0.5px",
            color: "var(--fg-4)",
          }}
        >
          <span className="r-dot"><i /><i /></span>
          AUTH_GATEWAY · ONLINE
        </div>
      </div>

      {/* Heading */}
      <div className="flex flex-col" style={{ gap: 8, marginBottom: 28 }}>
        <EyebrowRail label="Identificação do Operador" />
        <h2
          style={{
            fontFamily: "var(--font-display)",
            fontWeight: 700,
            lineHeight: 1,
            color: "var(--fg-1)",
            fontSize: "clamp(38px, 5vw, 50px)",
            letterSpacing: "-2.4px",
            margin: 0,
          }}
        >
          ACESSO AO<br />
          SISTEMA<span style={{ color: "var(--primary-hover)" }}>.</span>
        </h2>
      </div>

      {hasError && (
        <div style={{ marginBottom: 28 }}>
          <AuthBanner
            tone="danger"
            code="ERRO_AUTH · 401"
            body="Credenciais inválidas. Verifique e-mail e senha e tente novamente."
          />
        </div>
      )}

      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 28 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          <AuthField
            id="email-login"
            label="E-MAIL"
            refLabel="REF_U_AUTH_01"
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            onFocus={() => setFocusedField("email")}
            onBlur={() => setFocusedField(null)}
            focused={focusedField === "email"}
            hasError={hasError}
            inputRef={emailRef}
          />
          <AuthField
            id="senha-login"
            label="SENHA"
            refLabel="REF_U_AUTH_02"
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={e => setPassword(e.target.value)}
            onFocus={() => setFocusedField("password")}
            onBlur={() => setFocusedField(null)}
            focused={focusedField === "password"}
            hasError={hasError}
            extra={
              <button
                type="button"
                onClick={() => setShowPassword(v => !v)}
                style={{
                  all: "unset",
                  cursor: "pointer",
                  position: "absolute",
                  right: 0,
                  top: "50%",
                  transform: "translateY(-50%)",
                  fontFamily: "var(--font-mono)",
                  fontSize: 11,
                  color: "var(--fg-4)",
                  letterSpacing: "1px",
                  textTransform: "uppercase",
                }}
              >
                {showPassword ? "OCULTAR" : "EXIBIR"}
              </button>
            }
          />
        </div>

        {/* Checkbox + Forgot */}
        <div className="flex items-center justify-between">
          <div
            role="checkbox"
            aria-checked={remember}
            tabIndex={0}
            onClick={() => setRemember(v => !v)}
            onKeyDown={e => e.key === " " && setRemember(v => !v)}
            className="flex items-center gap-2 cursor-pointer"
          >
            <div
              className={cn(
                "w-4 h-4 border flex items-center justify-center shrink-0 transition-all duration-150",
                remember ? "border-primary bg-primary" : "border-[rgba(255,255,255,0.25)] bg-transparent"
              )}
            >
              {remember && (
                <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                  <path d="M1.5 5L4 7.5L8.5 2.5" stroke="white" strokeWidth="1.5" strokeLinecap="square" strokeLinejoin="miter" />
                </svg>
              )}
            </div>
            <span
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: 11,
                color: "var(--fg-4)",
                letterSpacing: "1px",
                textTransform: "uppercase",
              }}
            >
              MANTER SESSÃO ATIVA
            </span>
          </div>
          <button
            type="button"
            onClick={() => router.push("/auth/reset-password")}
            style={{
              all: "unset",
              cursor: "pointer",
              fontFamily: "var(--font-mono)",
              fontSize: 11,
              color: "var(--fg-4)",
            }}
          >
            Esqueci minha senha
          </button>
        </div>

        <SubmitButton
          isLoad={isLoading}
          isSuccess={isSuccess}
          idleLabel="ACESSAR SISTEMA"
          loadLabel="AUTENTICANDO"
          successLabel="ACESSO CONCEDIDO"
        />
      </form>

      {/* Cross-link */}
      <div
        style={{
          marginTop: 24,
          fontFamily: "var(--font-mono)",
          fontSize: 11,
          color: "var(--fg-4)",
          textAlign: "center",
        }}
      >
        Sem conta?{" "}
        <a
          href="/signup"
          style={{
            color: "var(--primary-hover)",
            textDecoration: "underline",
            textUnderlineOffset: 3,
            cursor: "pointer",
          }}
        >
          Configurar sistema
        </a>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <AuthFrame>
      <SignInForm />
    </AuthFrame>
  )
}
