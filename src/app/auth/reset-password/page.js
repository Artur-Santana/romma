"use client"

import { Suspense, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase-browser"
import { validarSenha } from "@/lib/auth-form"
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

function ResetPasswordForm() {
  const router = useRouter()

  // Sub-flow detection: check for an active recovery session on mount.
  // If a recovery session exists (arrived via /auth/confirm recovery redirect) →
  // show DEFINE-NEW-PASSWORD form. Otherwise show REQUEST-EMAIL form.
  const [isDefineFlow, setIsDefineFlow] = useState(null) // null = detecting
  const [form, setForm] = useState({ email: "", senha: "", confirmarSenha: "" })
  const [status, setStatus] = useState("idle")
  const [erro, setErro] = useState(null)
  const [erroEnvioMsg, setErroEnvioMsg] = useState(null)
  const [showSenha, setShowSenha] = useState(false)
  const [showConfirmar, setShowConfirmar] = useState(false)
  const [focusedField, setFocusedField] = useState(null)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      // A recovery session means the user clicked the reset link and was redirected
      // from /auth/confirm with an active session.
      setIsDefineFlow(!!session)
    })
  }, [])

  // REQUEST-EMAIL sub-flow handler
  async function handleEnviarLink(e) {
    e.preventDefault()
    setErro(null)
    setErroEnvioMsg(null)
    if (!form.email.trim()) {
      setErroEnvioMsg("Informe o e-mail antes de continuar.")
      setErro("VALIDACAO")
      return
    }
    setStatus("loading")
    const { error } = await supabase.auth.resetPasswordForEmail(form.email, {
      redirectTo: `${window.location.origin}/auth/confirm?next=recovery`,
    })
    if (error) {
      setErroEnvioMsg(error.message || "Ocorreu um erro ao enviar o e-mail. Tente novamente.")
      setErro("ERRO_ENVIO")
      setStatus("idle")
      return
    }
    setStatus("sent")
  }

  // DEFINE-NEW-PASSWORD sub-flow handler
  async function handleDefinirSenha(e) {
    e.preventDefault()
    setErro(null)

    const erroSenha = validarSenha(form.senha)
    if (erroSenha) {
      setErro("SENHA_INVALIDA")
      return
    }

    if (form.senha !== form.confirmarSenha) {
      setErro("SENHAS_DIVERGENTES")
      return
    }

    setStatus("loading")
    const { error } = await supabase.auth.updateUser({ password: form.senha })
    if (error) {
      setErro("ERRO_SUPABASE")
      setStatus("idle")
      return
    }

    setStatus("success")
    setTimeout(async () => {
      const { data: isProprietario } = await supabase.rpc("is_proprietario")
      router.push(isProprietario ? "/dashboard" : "/portal/dashboard")
    }, 1500)
  }

  const isLoading = status === "loading"
  const isSent = status === "sent"
  const isSuccess = status === "success"

  // While detecting session, render nothing to avoid flicker
  if (isDefineFlow === null) {
    return <div className="r-fade w-full" style={{ maxWidth: 408 }} />
  }

  // ── DEFINE-NEW-PASSWORD sub-flow ──────────────────────────────────────────
  if (isDefineFlow) {
    return (
      <div className="r-fade w-full" style={{ maxWidth: 408 }}>
        {/* Status badge */}
        <div className="flex justify-end" style={{ marginBottom: 44 }}>
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
            RECOVERY · ONLINE
          </div>
        </div>

        {/* Heading */}
        <div className="flex flex-col" style={{ gap: 8, marginBottom: 28 }}>
          <EyebrowRail label="Recuperação de Acesso · Nova Senha" />
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
            DEFINIR<br />
            NOVA SENHA<span style={{ color: "var(--primary-hover)" }}>.</span>
          </h2>
        </div>

        {erro === "SENHA_INVALIDA" && (
          <div style={{ marginBottom: 24 }}>
            <AuthBanner
              tone="danger"
              code="ERRO · SENHA_INVÁLIDA"
              body="A senha não atende aos requisitos mínimos."
            />
          </div>
        )}

        {erro === "SENHAS_DIVERGENTES" && (
          <div style={{ marginBottom: 24 }}>
            <AuthBanner
              tone="danger"
              code="ERRO · SENHAS_DIVERGENTES"
              body="As senhas não coincidem. Verifique e tente novamente."
            />
          </div>
        )}

        {erro === "ERRO_SUPABASE" && (
          <div style={{ marginBottom: 24 }}>
            <AuthBanner
              tone="danger"
              code="ERRO_AUTH · 500"
              body="Ocorreu um erro ao definir a senha. Tente novamente."
            />
          </div>
        )}

        {isSuccess && (
          <div style={{ marginBottom: 24 }}>
            <AuthBanner
              tone="success"
              code="SENHA_DEFINIDA · 200"
              body="Senha definida com sucesso. Redirecionando..."
            />
          </div>
        )}

        <form
          onSubmit={handleDefinirSenha}
          style={{ display: "flex", flexDirection: "column", gap: 28 }}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
            <AuthField
              id="nova-senha-reset"
              label="NOVA SENHA"
              type={showSenha ? "text" : "password"}
              value={form.senha}
              onChange={e => setForm({ ...form, senha: e.target.value })}
              onFocus={() => setFocusedField("senha")}
              onBlur={() => setFocusedField(null)}
              focused={focusedField === "senha"}
              hasError={erro === "SENHA_INVALIDA"}
              hint="Mínimo 6 caracteres, 1 letra maiúscula e 1 número."
              extra={
                <button
                  type="button"
                  onClick={() => setShowSenha(v => !v)}
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
                  {showSenha ? "OCULTAR" : "EXIBIR"}
                </button>
              }
            />
            <AuthField
              id="confirmar-senha-reset"
              label="CONFIRMAR SENHA"
              type={showConfirmar ? "text" : "password"}
              value={form.confirmarSenha}
              onChange={e => setForm({ ...form, confirmarSenha: e.target.value })}
              onFocus={() => setFocusedField("confirmarSenha")}
              onBlur={() => setFocusedField(null)}
              focused={focusedField === "confirmarSenha"}
              hasError={erro === "SENHAS_DIVERGENTES"}
              extra={
                <button
                  type="button"
                  onClick={() => setShowConfirmar(v => !v)}
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
                  {showConfirmar ? "OCULTAR" : "EXIBIR"}
                </button>
              }
            />
          </div>

          <SubmitButton
            isLoad={isLoading}
            isSuccess={isSuccess}
            idleLabel="DEFINIR SENHA"
            loadLabel="DEFININDO"
            successLabel="SENHA DEFINIDA"
          />
        </form>
      </div>
    )
  }

  // ── REQUEST-EMAIL sub-flow ────────────────────────────────────────────────
  return (
    <div className="r-fade w-full" style={{ maxWidth: 408 }}>
      {/* Back button */}
      <button
        type="button"
        onClick={() => router.push("/login")}
        style={{
          all: "unset",
          cursor: "pointer",
          fontFamily: "var(--font-mono)",
          fontSize: 11,
          color: "var(--fg-4)",
          letterSpacing: "0.5px",
          marginBottom: 32,
          display: "block",
        }}
      >
        ← LOGIN
      </button>

      {/* Status badge */}
      <div className="flex justify-end" style={{ marginBottom: 44 }}>
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
          RECOVERY · ONLINE
        </div>
      </div>

      {/* Heading */}
      <div className="flex flex-col" style={{ gap: 8, marginBottom: 28 }}>
        <EyebrowRail label="Recuperação de Acesso" />
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
          REDEFINIR<br />
          SENHA<span style={{ color: "var(--primary-hover)" }}>.</span>
        </h2>
        <p
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: 12,
            color: "var(--fg-3)",
            lineHeight: 1.5,
            margin: 0,
            marginTop: 8,
          }}
        >
          Informe o e-mail da conta. Enviaremos um link seguro para criar uma nova senha.
        </p>
      </div>

      {isSent && (
        <div style={{ marginBottom: 24 }}>
          <AuthBanner
            tone="success"
            code="E-MAIL_ENVIADO · 200"
            body="Verifique sua caixa de entrada para redefinir a senha."
          />
        </div>
      )}

      {(erro === "ERRO_ENVIO" || erro === "VALIDACAO") && (
        <div style={{ marginBottom: 24 }}>
          <AuthBanner
            tone={erro === "VALIDACAO" ? "warning" : "danger"}
            code={erro === "VALIDACAO" ? "ENTRADA · INVÁLIDA" : "ERRO_AUTH · 500"}
            body={erroEnvioMsg || "Ocorreu um erro ao enviar o e-mail. Tente novamente."}
          />
        </div>
      )}

      {!isSent && (
        <form
          onSubmit={handleEnviarLink}
          style={{ display: "flex", flexDirection: "column", gap: 28 }}
        >
          <AuthField
            id="email-reset"
            label="E-MAIL"
            refLabel="REF_U_RST_01"
            type="email"
            value={form.email}
            onChange={e => setForm({ ...form, email: e.target.value })}
            onFocus={() => setFocusedField("email")}
            onBlur={() => setFocusedField(null)}
            focused={focusedField === "email"}
          />

          <SubmitButton
            isLoad={isLoading}
            isSuccess={false}
            idleLabel="ENVIAR LINK"
            loadLabel="ENVIANDO"
            successLabel="ENVIADO"
          />
        </form>
      )}
    </div>
  )
}

export default function ResetPasswordPage() {
  return (
    <AuthFrame>
      <Suspense fallback={null}>
        <ResetPasswordForm />
      </Suspense>
    </AuthFrame>
  )
}
