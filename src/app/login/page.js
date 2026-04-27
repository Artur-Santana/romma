"use client"

import Image from "next/image"
import { useRef, useState } from "react"
import { useRouter } from "next/navigation"
import supabase from "@/lib/supabase"

function TopStrip() {
  return (
    <div style={{
      height: 28,
      background: "rgba(18,18,18,0.95)",
      borderBottom: "1px solid rgba(255,255,255,0.08)",
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      padding: "0 32px",
      fontFamily: "var(--font-mono)",
      fontSize: 10,
      color: "var(--muted-foreground)",
      letterSpacing: "0.5px",
      flexShrink: 0,
    }}>
      <span>INTEGRATED_SYSTEM_NODE: 0X449F</span>
      <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
        <span>GRID.OS.ALPHA</span>
        <span>STATUS: SYNCHRONIZED</span>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{
            width: 6,
            height: 6,
            borderRadius: 999,
            background: "var(--success)",
            display: "inline-block",
          }} />
          <span>ONLINE</span>
        </div>
      </div>
    </div>
  )
}

function LeftPanel() {
  return (
    <div className="login-left-panel" style={{
      position: "relative",
      overflow: "hidden",
      borderRight: "1px solid rgba(255,255,255,0.08)",
    }}>
      <Image
        src="/hero-building.png"
        alt="Edifício"
        fill
        style={{
          objectFit: "cover",
          objectPosition: "center",
          filter: "grayscale(0.3) contrast(1.1) brightness(0.7)",
        }}
        priority
      />
      <div style={{
        position: "absolute",
        inset: 0,
        background: "linear-gradient(180deg, rgba(0,0,0,0.3) 0%, rgba(0,0,0,0.85) 100%)",
      }} />
      <div style={{ position: "absolute", top: 40, left: 40, right: 40 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{
            fontFamily: "var(--font-mono)",
            fontSize: 9,
            color: "var(--primary-accent)",
            letterSpacing: 2,
          }}>
            CONSOLE
          </span>
          <span style={{
            fontFamily: "var(--font-body)",
            fontSize: 28,
            fontWeight: 700,
            color: "var(--foreground)",
          }}>
            ROMMA
          </span>
        </div>
      </div>
      <div style={{ position: "absolute", bottom: 64, left: 40, right: 40 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
          <span style={{
            width: 24,
            height: 1,
            background: "var(--primary-accent)",
            display: "inline-block",
          }} />
          <span style={{
            fontFamily: "var(--font-body)",
            fontWeight: 700,
            fontSize: 10,
            letterSpacing: 3,
            textTransform: "uppercase",
            color: "var(--primary-accent)",
          }}>
            ESPAÇOS COMERCIAIS
          </span>
        </div>
        <h1 className="login-headline" style={{
          fontFamily: "var(--font-body)",
          fontWeight: 700,
          lineHeight: 1,
          color: "var(--foreground)",
          margin: "0 0 20px",
        }}>
          CONTROLE INABALÁVEL<br />DE CADA<span style={{ color: "var(--primary-accent)" }}>.</span><br />ATIVO
        </h1>
        <p style={{
          fontFamily: "var(--font-body)",
          fontSize: 14,
          lineHeight: 1.55,
          color: "var(--fg-2)",
          margin: 0,
        }}>
          Gerencie contratos, locatários e parcelas em um único sistema integrado.
        </p>
      </div>
    </div>
  )
}

function EyebrowRail({ label }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <span style={{
        width: 24,
        height: 1,
        background: "var(--primary-accent)",
        display: "inline-block",
      }} />
      <span style={{
        fontFamily: "var(--font-body)",
        fontWeight: 700,
        fontSize: 10,
        letterSpacing: 3,
        textTransform: "uppercase",
        color: "var(--primary-accent)",
      }}>
        {label}
      </span>
    </div>
  )
}

function ErrorBanner() {
  return (
    <div style={{
      background: "rgba(147,0,10,0.22)",
      borderLeft: "2px solid var(--danger-fg)",
      padding: "12px 16px",
      display: "flex",
      alignItems: "flex-start",
      gap: 12,
    }}>
      <div style={{
        width: 16,
        height: 16,
        border: "1px solid var(--danger-fg)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
        marginTop: 1,
      }}>
        <span style={{
          fontFamily: "var(--font-mono)",
          fontSize: 10,
          fontWeight: 700,
          color: "var(--danger-fg)",
        }}>!</span>
      </div>
      <div>
        <div style={{
          fontSize: 11,
          fontWeight: 700,
          letterSpacing: "1.5px",
          textTransform: "uppercase",
          color: "var(--danger-fg)",
          marginBottom: 4,
        }}>
          ERRO_AUTH · 401
        </div>
        <div style={{ fontSize: 13, color: "var(--fg-2)" }}>
          Credenciais inválidas. Verifique e-mail e senha e tente novamente.
        </div>
      </div>
    </div>
  )
}

function ResetBanner() {
  return (
    <div style={{
      background: "rgba(16,185,129,0.15)",
      borderLeft: "2px solid var(--success)",
      padding: "12px 16px",
      display: "flex",
      alignItems: "flex-start",
      gap: 12,
    }}>
      <div style={{
        width: 16,
        height: 16,
        border: "1px solid var(--success)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
        marginTop: 1,
      }}>
        <span style={{
          fontFamily: "var(--font-mono)",
          fontSize: 10,
          fontWeight: 700,
          color: "var(--success)",
        }}>✓</span>
      </div>
      <div>
        <div style={{
          fontSize: 11,
          fontWeight: 700,
          letterSpacing: "1.5px",
          textTransform: "uppercase",
          color: "var(--success)",
          marginBottom: 4,
        }}>
          EMAIL_ENVIADO · 200
        </div>
        <div style={{ fontSize: 13, color: "var(--fg-2)" }}>
          Verifique sua caixa de entrada para redefinir sua senha.
        </div>
      </div>
    </div>
  )
}

function Field({ label, refLabel, type, value, onChange, focused, hasError, onFocus, onBlur, extra, inputRef }) {
  return (
    <div>
      <div style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 8,
      }}>
        <label style={{
          fontFamily: "var(--font-body)",
          fontWeight: 700,
          fontSize: 10,
          letterSpacing: 2,
          textTransform: "uppercase",
          color: focused ? "var(--primary)" : "var(--muted-foreground)",
          transition: "color 0.2s",
        }}>
          {label}
        </label>
        <span style={{
          fontFamily: "var(--font-mono)",
          fontSize: 9,
          color: "var(--muted-foreground)",
        }}>
          {refLabel}
        </span>
      </div>
      <div style={{ position: "relative" }}>
        <input
          ref={inputRef}
          type={type}
          value={value}
          onChange={onChange}
          onFocus={onFocus}
          onBlur={onBlur}
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
          }}
        />
        {extra}
      </div>
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

  // TODO(human): implement handleSubmit and handleForgotPassword below.
  // handleSubmit: empty → loading → success (router.push("/dashboard")) or error
  // handleForgotPassword: if !email focus emailRef and return; reset_loading → reset_sent
  // Both functions receive the synthetic event as first argument (call e.preventDefault()).
  // Available state setters: setStatus, setEmail, setPassword
  // Available values: email, password, remember, supabase, router, emailRef
  async function handleSubmit(e) {
    e.preventDefault()
    setStatus("loading")
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      setStatus("error")
      return
    }
    setStatus("success")
    router.push("/dashboard")
  }

  async function handleForgotPassword(e) {
    e.preventDefault()
    if (!email) {
      emailRef.current?.focus()
      return
    }
    setStatus("reset_loading")
    await supabase.auth.resetPasswordForEmail(email)
    setStatus("reset_sent")
  }

  const isLoading = status === "loading" || status === "reset_loading"
  const hasError = status === "error"
  const isSuccess = status === "success"
  const resetSent = status === "reset_sent"

  return (
    <div style={{ width: "100%", maxWidth: 420 }}>
      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 48 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{
            width: 6,
            height: 6,
            borderRadius: 999,
            background: "var(--success)",
            display: "inline-block",
          }} />
          <span style={{
            fontFamily: "var(--font-mono)",
            fontSize: 10,
            color: "var(--muted-foreground)",
            letterSpacing: "0.5px",
          }}>
            AUTH_GATEWAY · ONLINE
          </span>
        </div>
      </div>

      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 32 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <EyebrowRail label="IDENTIFICAÇÃO DO OPERADOR" />
          <h2 className="login-headline" style={{
            fontFamily: "var(--font-body)",
            fontWeight: 700,
            lineHeight: 1,
            color: "var(--foreground)",
            margin: 0,
          }}>
            ACESSO AO<br />SISTEMA<span style={{ color: "var(--primary-accent)" }}>.</span>
          </h2>
        </div>

        {hasError && <ErrorBanner />}
        {resetSent && <ResetBanner />}

        <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
          <Field
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
          <Field
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
                  position: "absolute",
                  right: 0,
                  top: "50%",
                  transform: "translateY(-50%)",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  fontFamily: "var(--font-mono)",
                  fontSize: 9,
                  color: "var(--muted-foreground)",
                  letterSpacing: 1,
                  padding: 0,
                }}
              >
                {showPassword ? "OCULTAR" : "EXIBIR"}
              </button>
            }
          />
        </div>

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div
            role="checkbox"
            aria-checked={remember}
            tabIndex={0}
            onClick={() => setRemember(v => !v)}
            onKeyDown={e => e.key === " " && setRemember(v => !v)}
            style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}
          >
            <div style={{
              width: 16,
              height: 16,
              border: `1px solid ${remember ? "var(--primary)" : "rgba(255,255,255,0.25)"}`,
              background: remember ? "var(--primary)" : "transparent",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
              transition: "all 0.15s",
            }}>
              {remember && (
                <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                  <path d="M1.5 5L4 7.5L8.5 2.5" stroke="white" strokeWidth="1.5" strokeLinecap="square" strokeLinejoin="miter" />
                </svg>
              )}
            </div>
            <span style={{
              fontFamily: "var(--font-body)",
              fontSize: 12,
              color: "var(--muted-foreground)",
              letterSpacing: 1,
              textTransform: "uppercase",
            }}>
              MANTER SESSÃO ATIVA
            </span>
          </div>
          <button
            type="button"
            onClick={handleForgotPassword}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              fontFamily: "var(--font-body)",
              fontSize: 12,
              color: "var(--muted-foreground)",
              padding: 0,
            }}
          >
            Esqueci minha senha
          </button>
        </div>

        <div style={{ position: "relative", overflow: "hidden" }}>
          <button
            type="submit"
            disabled={isLoading}
            style={{
              width: "100%",
              padding: "18px 24px",
              background: isSuccess ? "var(--success)" : "var(--primary)",
              border: "none",
              cursor: isLoading ? "default" : "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              boxShadow: isLoading ? "none" : "0 0 16px 0 var(--primary-glow)",
              transition: "background 0.3s, box-shadow 0.3s",
              color: "var(--foreground)",
            }}
          >
            <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, letterSpacing: 1 }}>
              {isLoading ? "[···]" : isSuccess ? "[OK]" : "[>]"}
            </span>
            <span style={{
              fontFamily: "var(--font-body)",
              fontWeight: 700,
              fontSize: 13,
              letterSpacing: 2,
              textTransform: "uppercase",
            }}>
              {isLoading ? "AUTENTICANDO" : isSuccess ? "ACESSO CONCEDIDO" : "ACESSAR SISTEMA"}
            </span>
            <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, letterSpacing: 1 }}>
              {isLoading ? "" : isSuccess ? "200" : "ENTER"}
            </span>
          </button>
          {isLoading && (
            <div style={{
              position: "absolute",
              bottom: 0,
              left: 0,
              height: 2,
              width: "40%",
              background: "var(--chart-1)",
              animation: "loadingBar 1.2s var(--ease-crisp) infinite",
            }} />
          )}
        </div>
      </form>
    </div>
  )
}

function RightPanel() {
  return (
    <div className="login-right-panel" style={{
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
    }}>
      <SignInForm />
    </div>
  )
}

function BottomMeta() {
  return (
    <div style={{
      padding: "12px 32px",
      borderTop: "1px solid rgba(255,255,255,0.05)",
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      fontFamily: "var(--font-mono)",
      fontSize: 10,
      color: "var(--muted-foreground)",
      letterSpacing: "0.5px",
      flexShrink: 0,
    }}>
      <span>ROMMA © 2026 · CONSOLE v2.4.1</span>
      <span>SESSION_ID: 0XFF8A-2310 // TLS 1.3</span>
    </div>
  )
}

export default function LoginPage() {
  return (
    <>
      <style>{`
        .login-main { display: grid; grid-template-columns: 1fr 1fr; overflow: hidden; flex: 1; }
        .login-left-panel { display: block; }
        .login-right-panel { padding: 64px 48px; }
        .login-headline { font-size: 56px; letter-spacing: -2.6px; }
        @media (max-width: 900px) {
          .login-main { grid-template-columns: 1fr; }
          .login-left-panel { display: none; }
          .login-right-panel { padding: 40px 24px; }
          .login-headline { font-size: 44px; letter-spacing: -2px; }
        }
      `}</style>
      <div style={{
        height: "100vh",
        display: "flex",
        flexDirection: "column",
        background: "var(--background)",
        overflow: "hidden",
      }}>
        <TopStrip />
        <main className="login-main">
          <LeftPanel />
          <RightPanel />
        </main>
        <BottomMeta />
      </div>
    </>
  )
}
