"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import { maskPhone, soDigitos, validarCadastro } from "@/lib/auth-form"
import { cadastrarProprietario } from "@/actions/auth"
import AuthFrame from "@/components/auth/AuthFrame"
import AuthField from "@/components/auth/AuthField"
import AuthBanner from "@/components/auth/AuthBanner"
import SubmitButton from "@/components/auth/SubmitButton"

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

function SignupForm() {
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
  const [showConfirmar, setShowConfirmar] = useState(false)
  const [focusedField, setFocusedField] = useState(null)
  const router = useRouter()

  function resetarForm() {
    setForm({ nome: "", sobrenome: "", email: "", telefone: "", senha: "", confirmarSenha: "" })
  }

  const isLoading = status === "loading"
  const isEmailSent = status === "email_sent"

  async function handleSubmit(e) {
    e.preventDefault()
    setErroLocal(null)

    const erro = validarCadastro(form)
    if (erro) {
      setErroLocal(erro)
      return
    }

    setStatus("loading")
    const result = await cadastrarProprietario({
      email: form.email,
      senha: form.senha,
      nome: form.nome,
      sobrenome: form.sobrenome,
      telefone: soDigitos(form.telefone),
    })

    if (result.status !== 200) {
      setErroLocal(result.erroMessage || "Não foi possível criar a conta.")
      setStatus("error")
      return
    }

    setStatus("email_sent")
  }

  return (
    <div className="r-fade w-full" style={{ maxWidth: 408 }}>
      {/* Status badge */}
      <div
        className="flex justify-end"
        style={{ marginBottom: 44 }}
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
          SIGNUP_GATEWAY · ONLINE
        </div>
      </div>

      {/* Heading */}
      <div className="flex flex-col" style={{ gap: 8, marginBottom: 24 }}>
        <EyebrowRail label="Configuração Inicial" />
        <h2
          style={{
            fontFamily: "var(--font-display)",
            fontWeight: 700,
            lineHeight: 1,
            color: "var(--fg-1)",
            fontSize: "clamp(34px, 4.5vw, 46px)",
            letterSpacing: "-2.4px",
            margin: 0,
          }}
        >
          CONFIGURAR<br />
          SISTEMA<span style={{ color: "var(--primary-hover)" }}>.</span>
        </h2>
      </div>

      {/* Success banner — always visible when email sent */}
      {isEmailSent && (
        <div style={{ marginBottom: 24 }}>
          <AuthBanner
            tone="success"
            code="VERIFIQUE SEU E-MAIL · 200"
            body="Enviamos um link de ativação. Confirme para liberar o console."
          />
        </div>
      )}

      {/* Error banner */}
      {erroLocal && (
        <div style={{ marginBottom: 24 }}>
          <AuthBanner
            tone="danger"
            code="ERRO_VALIDAÇÃO"
            body={erroLocal}
          />
        </div>
      )}

      {/* Form fields — hidden on email_sent */}
      {!isEmailSent && (
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          {/* Nome + Sobrenome — 2-col grid */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <AuthField
              id="nome-signup"
              label="NOME"
              refLabel="REF_U_INIT_01"
              type="text"
              value={form.nome}
              onChange={e => setForm({ ...form, nome: e.target.value })}
              onFocus={() => setFocusedField("nome")}
              onBlur={() => setFocusedField(null)}
              focused={focusedField === "nome"}
              disabled={isLoading}
            />
            <AuthField
              id="sobrenome-signup"
              label="SOBRENOME"
              refLabel="REF_U_INIT_02"
              type="text"
              value={form.sobrenome}
              onChange={e => setForm({ ...form, sobrenome: e.target.value })}
              onFocus={() => setFocusedField("sobrenome")}
              onBlur={() => setFocusedField(null)}
              focused={focusedField === "sobrenome"}
              disabled={isLoading}
            />
          </div>

          <AuthField
            id="email-signup"
            label="E-MAIL"
            refLabel="REF_U_INIT_03"
            type="email"
            value={form.email}
            onChange={e => setForm({ ...form, email: e.target.value })}
            onFocus={() => setFocusedField("email")}
            onBlur={() => setFocusedField(null)}
            focused={focusedField === "email"}
            disabled={isLoading}
          />

          <AuthField
            id="telefone-signup"
            label="TELEFONE"
            refLabel="REF_U_INIT_04"
            type="tel"
            value={form.telefone}
            onChange={e => setForm({ ...form, telefone: maskPhone(e.target.value) })}
            onFocus={() => setFocusedField("telefone")}
            onBlur={() => setFocusedField(null)}
            focused={focusedField === "telefone"}
            disabled={isLoading}
          />

          <AuthField
            id="senha-signup"
            label="SENHA"
            refLabel="REF_U_INIT_05"
            type={showSenha ? "text" : "password"}
            value={form.senha}
            onChange={e => setForm({ ...form, senha: e.target.value })}
            onFocus={() => setFocusedField("senha")}
            onBlur={() => setFocusedField(null)}
            focused={focusedField === "senha"}
            disabled={isLoading}
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
            id="confirmar-senha-signup"
            label="CONFIRMAR SENHA"
            refLabel="REF_U_INIT_06"
            type={showConfirmar ? "text" : "password"}
            value={form.confirmarSenha}
            onChange={e => setForm({ ...form, confirmarSenha: e.target.value })}
            onFocus={() => setFocusedField("confirmarSenha")}
            onBlur={() => setFocusedField(null)}
            focused={focusedField === "confirmarSenha"}
            disabled={isLoading}
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

          <SubmitButton
            isLoad={isLoading}
            isSuccess={false}
            idleLabel="CONFIGURAR SISTEMA"
            loadLabel="CONFIGURANDO"
            successLabel="CONFIGURADO"
          />
        </form>
      )}

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
        Já tem conta?{" "}
        <a
          href="/login"
          style={{
            color: "var(--primary-hover)",
            textDecoration: "underline",
            textUnderlineOffset: 3,
            cursor: "pointer",
          }}
        >
          Acessar sistema
        </a>
      </div>
    </div>
  )
}

export default function SignUpPage() {
  return (
    <AuthFrame>
      <SignupForm />
    </AuthFrame>
  )
}
