"use client"

import { Suspense, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { createClient } from "@/lib/supabase-browser"

function TopStrip() {
  return (
    <div className="h-7 bg-[rgba(18,18,18,0.95)] border-b border-[rgba(255,255,255,0.08)] flex items-center justify-between px-8 font-mono text-xs text-muted-foreground tracking-[0.5px] shrink-0">
      <span>ROMMA · RESET_PASSWORD</span>
      <div className="flex items-center gap-4">
        <span>GRID.OS.ALPHA</span>
        <span>STATUS: SYNCHRONIZED</span>
        <div className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-success inline-block" />
          <span>ONLINE</span>
        </div>
      </div>
    </div>
  )
}

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

function ErrorBanner({ title, body }) {
  return (
    <div className="bg-[rgba(147,0,10,0.22)] border-l-2 border-danger-fg px-4 py-3 flex items-start gap-3">
      <div className="w-4 h-4 border border-danger-fg flex items-center justify-center shrink-0 mt-px">
        <span className="font-mono text-xs font-bold text-danger-fg">!</span>
      </div>
      <div>
        <div className="text-xs font-headline-hanken font-bold tracking-[1.5px] uppercase text-danger-fg mb-1">
          {title}
        </div>
        <div className="text-sm font-mono text-fg-2">
          {body}
        </div>
      </div>
    </div>
  )
}

function SuccessBanner() {
  return (
    <div className="bg-[rgba(16,185,129,0.15)] border-l-2 border-success px-4 py-3 flex items-start gap-3">
      <div className="w-4 h-4 border border-success flex items-center justify-center shrink-0 mt-px">
        <span className="font-mono text-xs font-bold text-success">✓</span>
      </div>
      <div>
        <div className="text-xs font-headline-hanken font-bold tracking-[1.5px] uppercase text-success mb-1">
          SENHA_DEFINIDA · 200
        </div>
        <div className="text-sm font-mono text-fg-2">
          Senha definida com sucesso. Redirecionando...
        </div>
      </div>
    </div>
  )
}

function Field({ label, value, onChange, focused, onFocus, onBlur }) {
  return (
    <div>
      <div className="mb-2">
        <label
          style={{
            fontFamily: "var(--font-body)",
            fontWeight: 700,
            fontSize: 12,
            letterSpacing: "2px",
            textTransform: "uppercase",
            color: focused ? "var(--primary)" : "var(--muted-foreground)",
            transition: "color 0.2s",
            display: "block",
          }}
        >
          {label}
        </label>
      </div>
      <input
        type="password"
        value={value}
        onChange={onChange}
        onFocus={onFocus}
        onBlur={onBlur}
        style={{
          all: "unset",
          display: "block",
          width: "100%",
          padding: "14px 0",
          fontSize: 16,
          fontFamily: "var(--font-body)",
          color: "var(--foreground)",
          borderBottom: `1px solid ${focused ? "var(--primary)" : "rgba(255,255,255,0.12)"}`,
          boxShadow: focused ? "0 1px 0 0 var(--primary)" : "none",
          transition: "border-color 0.2s, box-shadow 0.2s",
          boxSizing: "border-box",
        }}
      />
    </div>
  )
}

function ResetPasswordForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const errorParam = searchParams.get("error")
  const supabase = createClient()

  const [form, setForm] = useState({ password: "", confirmPassword: "" })
  const [status, setStatus] = useState("idle")
  const [erro, setErro] = useState(null)
  const [focusedField, setFocusedField] = useState(null)

  const isTokenInvalid = errorParam === "invite_invalid"

  async function handleSubmit(e) {
    e.preventDefault()
    setErro(null)

    if (!form.password || form.password.length < 6) {
      setErro("SENHA_CURTA")
      return
    }

    if (form.password !== form.confirmPassword) {
      setErro("SENHAS_DIVERGENTES")
      return
    }

    setStatus("loading")
    const { error } = await supabase.auth.updateUser({ password: form.password })
    if (error) {
      setErro("ERRO_SUPABASE")
      setStatus("idle")
      return
    }

    setStatus("success")
    setTimeout(() => {
      router.push("/portal/dashboard")
    }, 1500)
  }

  const isLoading = status === "loading"
  const isSuccess = status === "success"

  return (
    <div className="w-full max-w-[420px]">
      <div className="flex flex-col gap-8">
        <div className="flex flex-col gap-2">
          <EyebrowRail label="AUTENTICAÇÃO · NOVA SENHA" />
          <h2
            style={{
              fontFamily: "var(--font-display)",
              fontWeight: 700,
              fontSize: 48,
              lineHeight: 1,
              letterSpacing: "-2.4px",
              color: "var(--fg-1)",
              margin: 0,
            }}
          >
            Definir Nova Senha.
          </h2>
        </div>

        {isTokenInvalid && (
          <ErrorBanner
            title="ERRO_AUTH · TOKEN_INVÁLIDO"
            body="Link expirado ou inválido. Solicite um novo convite ao proprietário."
          />
        )}

        {erro === "SENHA_CURTA" && (
          <ErrorBanner
            title="ERRO · SENHA_INVÁLIDA"
            body="A senha deve ter pelo menos 6 caracteres."
          />
        )}

        {erro === "SENHAS_DIVERGENTES" && (
          <ErrorBanner
            title="ERRO · SENHAS_DIVERGENTES"
            body="As senhas não coincidem. Verifique e tente novamente."
          />
        )}

        {erro === "ERRO_SUPABASE" && (
          <ErrorBanner
            title="ERRO_AUTH · 500"
            body="Ocorreu um erro ao definir a senha. Tente novamente."
          />
        )}

        {isSuccess && <SuccessBanner />}

        <form onSubmit={handleSubmit} className="flex flex-col gap-7">
          <Field
            label="NOVA SENHA"
            value={form.password}
            onChange={e => setForm({ ...form, password: e.target.value })}
            onFocus={() => setFocusedField("password")}
            onBlur={() => setFocusedField(null)}
            focused={focusedField === "password"}
          />
          <Field
            label="CONFIRMAR SENHA"
            value={form.confirmPassword}
            onChange={e => setForm({ ...form, confirmPassword: e.target.value })}
            onFocus={() => setFocusedField("confirmPassword")}
            onBlur={() => setFocusedField(null)}
            focused={focusedField === "confirmPassword"}
          />

          <button
            type="submit"
            disabled={isLoading || isSuccess}
            style={{
              all: "unset",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: "100%",
              padding: "18px 24px",
              background: "var(--primary)",
              cursor: isLoading || isSuccess ? "default" : "pointer",
              opacity: isLoading || isSuccess ? 0.7 : 1,
              transition: "opacity 0.2s",
            }}
          >
            <span
              style={{
                fontFamily: "var(--font-body)",
                fontWeight: 700,
                fontSize: 12,
                letterSpacing: "2px",
                textTransform: "uppercase",
                color: "var(--foreground)",
              }}
            >
              {isLoading ? "Definindo..." : "Definir nova senha"}
            </span>
          </button>
        </form>
      </div>
    </div>
  )
}

export default function ResetPasswordPage() {
  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        background: "var(--background)",
      }}
    >
      <TopStrip />
      <main
        style={{
          flex: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "32px 24px",
        }}
      >
        <Suspense fallback={null}>
          <ResetPasswordForm />
        </Suspense>
      </main>
    </div>
  )
}
