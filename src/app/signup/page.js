"use client"

import Image from "next/image"
import Link from "next/link"
import { useState } from "react"
import { cadastrarProprietario } from "@/actions/auth"
import { cn } from "@/lib/utils"

function TopStrip() {
  return (
    <div className="h-7 bg-[rgba(18,18,18,0.95)] border-b border-[rgba(255,255,255,0.08)] flex items-center justify-between px-8 font-mono text-xs text-muted-foreground tracking-[0.5px] shrink-0">
      <span>INTEGRATED_SYSTEM_NODE: 0X449F</span>
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

function LeftPanel() {
  return (
    <div className="hidden lg:block relative overflow-hidden border-r border-[rgba(255,255,255,0.08)]">
      <Image
        src="/hero-building.png"
        alt="Edifício"
        fill
        className="object-cover object-center filter-[grayscale(0.3)_contrast(1.1)_brightness(0.7)]"
        priority
      />
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,0.3)_0%,rgba(0,0,0,0.85)_100%)]" />
      <div className="absolute top-10 left-10 right-10">
        <div className="flex items-center gap-2.5">
          <span className="font-mono text-xs text-primary-accent tracking-[2px]">
            CONSOLE
          </span>
          <span className="font-body text-3xl font-bold text-foreground">
            ROMMA
          </span>
        </div>
      </div>
      <div className="absolute bottom-16 left-10 right-10">
        <div className="flex items-center gap-2 mb-4">
          <span className="w-6 h-px bg-primary-accent inline-block" />
          <span className="font-body font-bold text-xs tracking-[3px] uppercase text-primary-accent">
            ESPAÇOS COMERCIAIS
          </span>
        </div>
        <h1 className="font-body font-bold leading-none text-foreground text-[44px] lg:text-[56px] tracking-[-2px] lg:tracking-[-2.6px] mt-0 mb-5">
          CONTROLE INABALÁVEL<br />DE CADA<span className="text-primary-accent">.</span><br />ATIVO
        </h1>
        <p className="font-body text-sm leading-[1.55] text-fg-2 m-0">
          Gerencie contratos, locatários e parcelas em um único sistema integrado.
        </p>
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

function ErrorBanner({ header, body, footer }) {
  return (
    <div className="bg-[rgba(147,0,10,0.22)] border-l-2 border-danger-fg px-4 py-3 flex items-start gap-3">
      <div className="w-4 h-4 border border-danger-fg flex items-center justify-center shrink-0 mt-px">
        <span className="font-mono text-xs font-bold text-danger-fg">!</span>
      </div>
      <div>
        <div className="text-xs font-headline-hanken font-bold tracking-[1.5px] uppercase text-danger-fg mb-1">
          {header}
        </div>
        <div className="text-sm font-mono text-fg-2">
          {body}
        </div>
        {footer}
      </div>
    </div>
  )
}

function EmailSentBanner() {
  return (
    <div className="bg-[rgba(16,185,129,0.15)] border-l-2 border-success px-4 py-3 flex items-start gap-3">
      <div className="w-4 h-4 border border-success flex items-center justify-center shrink-0 mt-px">
        <span className="font-mono text-xs font-bold text-success">✓</span>
      </div>
      <div>
        <div className="text-xs font-headline-hanken font-bold tracking-[1.5px] uppercase text-success mb-1">
          VERIFIQUE SEU EMAIL · 200
        </div>
        <div className="text-sm font-mono text-fg-2">
          Verifique sua caixa de entrada e clique no link para ativar sua conta.
        </div>
      </div>
    </div>
  )
}

function Field({ id, label, refLabel, type, value, onChange, focused, hasError, onFocus, onBlur, extra, inputRef, disabled }) {
  return (
    <div>
      <div className="flex justify-between items-center mb-2">
        <label
          htmlFor={id}
          className={cn(
            "font-body font-bold text-xs tracking-[2px] uppercase transition-colors duration-200",
            focused ? "text-primary" : "text-muted-foreground"
          )}
        >
          {label}
        </label>
        <span className="font-mono text-xs text-muted-foreground">
          {refLabel}
        </span>
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
            padding: "14px 60px 14px 0",
            fontSize: 16,
            fontFamily: "var(--font-body)",
            color: "var(--foreground)",
            borderBottom: `1px solid ${hasError ? "var(--danger-fg)" : focused ? "var(--primary)" : "rgba(255,255,255,0.12)"}`,
            boxShadow: focused ? "0 1px 0 0 var(--primary)" : "none",
            transition: "border-color 0.2s, box-shadow 0.2s",
            boxSizing: "border-box",
            opacity: disabled ? 0.4 : 1,
            cursor: disabled ? "not-allowed" : "text",
          }}
        />
        {extra}
      </div>
    </div>
  )
}

function SignUpForm() {
  const [email, setEmail] = useState("")
  const [senha, setSenha] = useState("")
  const [status, setStatus] = useState("empty")
  const [showSenha, setShowSenha] = useState(false)
  const [focusedField, setFocusedField] = useState(null)
  const [erroLocal, setErroLocal] = useState(null)

  const isLoading = status === "loading"
  const isEmailSent = status === "email_sent"
  const isError = status === "error"

  async function handleSubmit(e) {
    e.preventDefault()
    setErroLocal(null)

    if (!email || !/\S+@\S+\.\S+/.test(email)) {
      setErroLocal("Informe um e-mail válido.")
      return
    }
    if (!senha || senha.length < 6) {
      setErroLocal("A senha deve ter no mínimo 6 caracteres.")
      return
    }

    setStatus("loading")

    const result = await cadastrarProprietario({ email, senha })

    if (result.status !== 200) {
      setErroLocal(result.erroMessage || "Não foi possível criar a conta.")
      setStatus("error")
      return
    }

    setStatus("email_sent")
  }

  return (
    <div className="w-full max-w-[420px]">
      <div className="flex justify-end mb-12">
        <div className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-success inline-block" />
          <span className="font-mono text-xs text-muted-foreground tracking-[0.5px]">
            SIGNUP_GATEWAY · ONLINE
          </span>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-8">
        <div className="flex flex-col gap-2">
          <EyebrowRail label="CONFIGURAÇÃO INICIAL DO SISTEMA" />
          <h2 className="font-body font-bold leading-none text-foreground text-[44px] lg:text-[56px] tracking-[-2px] lg:tracking-[-2.6px] m-0">
            CONFIGURAR<br />SISTEMA<span className="text-primary-accent">.</span>
          </h2>
        </div>

        {isEmailSent && <EmailSentBanner />}

        {isError && !erroLocal && (
          <ErrorBanner
            header="ERRO_AUTH"
            body="Não foi possível criar a conta. Verifique os dados e tente novamente."
          />
        )}

        {erroLocal && (
          <ErrorBanner
            header="ERRO_VALIDAÇÃO"
            body={erroLocal}
          />
        )}

        {!isEmailSent && (
          <>
            <div className="flex flex-col gap-7">
              <Field
                id="email-signup"
                label="E-MAIL"
                refLabel="REF_U_INIT_01"
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                onFocus={() => setFocusedField("email")}
                onBlur={() => setFocusedField(null)}
                focused={focusedField === "email"}
                hasError={isError || !!erroLocal}
                disabled={isLoading}
              />
              <Field
                id="senha-signup"
                label="SENHA"
                refLabel="REF_U_INIT_02"
                type={showSenha ? "text" : "password"}
                value={senha}
                onChange={e => setSenha(e.target.value)}
                onFocus={() => setFocusedField("senha")}
                onBlur={() => setFocusedField(null)}
                focused={focusedField === "senha"}
                hasError={isError || !!erroLocal}
                disabled={isLoading}
                extra={
                  <button
                    type="button"
                    onClick={() => setShowSenha(v => !v)}
                    className="absolute right-0 top-1/2 -translate-y-1/2 bg-transparent border-0 cursor-pointer font-mono text-xs text-muted-foreground tracking-[1px] p-0"
                  >
                    {showSenha ? "OCULTAR" : "EXIBIR"}
                  </button>
                }
              />
            </div>

            <div className="relative overflow-hidden">
              <button
                type="submit"
                disabled={isLoading}
                className={cn(
                  "w-full px-6 py-[18px] border-0 flex items-center justify-between transition-[background,box-shadow] duration-300 text-foreground",
                  isEmailSent ? "bg-success" : "bg-primary",
                  isLoading ? "cursor-default shadow-none" : "shadow-[0_0_16px_0_var(--primary-glow)] cursor-pointer"
                )}
              >
                <span className="font-mono text-xs tracking-[1px]">
                  {isLoading ? "[···]" : isEmailSent ? "[OK]" : "[>]"}
                </span>
                <span className="font-body font-bold text-sm tracking-[2px] uppercase">
                  {isLoading ? "CONFIGURANDO" : isEmailSent ? "VERIFIQUE SEU EMAIL" : "CONFIGURAR SISTEMA"}
                </span>
                <span className="font-mono text-xs tracking-[1px]">
                  {isLoading ? "" : isEmailSent ? "" : "ENTER"}
                </span>
              </button>
              {isLoading && (
                <div className="absolute bottom-0 left-0 h-0.5 w-[40%] bg-chart-1 animate-loading-bar" />
              )}
            </div>
          </>
        )}
      </form>
    </div>
  )
}

function RightPanel() {
  return (
    <div className="px-6 py-10 lg:px-12 lg:py-16 flex items-center justify-center">
      <SignUpForm />
    </div>
  )
}

function BottomMeta() {
  return (
    <div className="px-8 py-3 border-t border-[rgba(255,255,255,0.05)] flex justify-between items-center font-mono text-xs text-muted-foreground tracking-[0.5px] shrink-0">
      <span>ROMMA © 2026 · CONSOLE v2.4.1</span>
      <span>SESSION_ID: 0XFF8A-2310 // TLS 1.3</span>
    </div>
  )
}

export default function SignUpPage() {
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
