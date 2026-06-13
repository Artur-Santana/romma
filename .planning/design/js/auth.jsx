/* Romma — Auth screens: Login, Signup, Reset. Split-panel desktop, stacked mobile. */

function AuthFrame({ mobile, variant, children }) {
  const isB = variant === "B" && !mobile;
  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column", background: "var(--background)", overflow: "hidden", position: "relative" }}>
      {/* top strip */}
      <div style={{ height: 28, flexShrink: 0, zIndex: 2, background: "rgba(18,18,18,0.95)", borderBottom: "1px solid var(--border-2)", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 20px", fontFamily: "var(--font-mono)", fontSize: 10.5, color: "var(--fg-4)", letterSpacing: "0.5px" }}>
        <span>INTEGRATED_SYSTEM_NODE: 0X449F</span>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          {!mobile && <span>GRID.OS.ALPHA</span>}
          <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}><span className="r-dot"><i /><i /></span>ONLINE</span>
        </div>
      </div>
      {isB ? (
        /* Variant B — full-bleed console card */
        <main style={{ flex: 1, position: "relative", overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <img src="assets/hero-building.png" alt="" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", filter: "grayscale(0.4) contrast(1.1) brightness(0.45)" }} />
          <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, rgba(10,10,12,0.7), rgba(0,0,0,0.92))" }} />
          <div style={{ position: "absolute", inset: 0, background: "var(--primary)", opacity: 0.08 }} />
          <CornerBrackets />
          <div className="r-scroll" style={{ position: "relative", zIndex: 2, width: "100%", maxHeight: "100%", overflowY: "auto", display: "flex", justifyContent: "center", padding: "40px 24px" }}>
            <div style={{ width: "100%", maxWidth: 460, background: "rgba(18,18,20,0.82)", border: "1px solid var(--border-2)", backdropFilter: "blur(6px)", padding: "40px 44px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 28, justifyContent: "center" }}>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--primary-hover)", letterSpacing: "2px" }}>CONSOLE</span>
                <span style={{ fontFamily: "var(--font-display)", fontSize: 24, fontWeight: 700, color: "var(--fg-1)", letterSpacing: "-0.5px" }}>ROMMA</span>
              </div>
              {children}
            </div>
          </div>
        </main>
      ) : (
        <main style={{ flex: 1, display: "grid", gridTemplateColumns: mobile ? "1fr" : "1.05fr 1fr", overflow: "hidden" }}>
          {!mobile && <AuthAside />}
          <div className="r-scroll" style={{ minHeight: 0, overflowY: "auto", display: "flex", alignItems: "center", justifyContent: "center", padding: mobile ? "32px 22px" : "40px 56px" }}>
            {children}
          </div>
        </main>
      )}
      {/* bottom meta */}
      <div style={{ flexShrink: 0, zIndex: 2, padding: "10px 20px", borderTop: "1px solid var(--border-1)", display: "flex", justifyContent: "space-between", fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--fg-5)", letterSpacing: "0.5px" }}>
        <span>ROMMA © 2026 · CONSOLE v2.4.1</span>
        {!mobile && <span>SESSION_ID: 0XFF8A-2310 // TLS 1.3</span>}
      </div>
    </div>
  );
}

function AuthAside() {
  return (
    <div style={{ position: "relative", overflow: "hidden", borderRight: "1px solid var(--border-2)" }}>
      <img src="assets/hero-building.png" alt="" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", objectPosition: "center", filter: "grayscale(0.3) contrast(1.1) brightness(0.62)" }} />
      <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, rgba(0,0,0,0.25) 0%, rgba(0,0,0,0.88) 100%)" }} />
      {/* blueprint corner brackets in gold */}
      <CornerBrackets />
      <div style={{ position: "absolute", top: 36, left: 36, right: 36, display: "flex", alignItems: "center", gap: 10 }}>
        <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--primary-hover)", letterSpacing: "2px" }}>CONSOLE</span>
        <span style={{ fontFamily: "var(--font-display)", fontSize: 26, fontWeight: 700, color: "var(--fg-1)", letterSpacing: "-0.5px" }}>ROMMA</span>
      </div>
      <div style={{ position: "absolute", bottom: 56, left: 36, right: 36 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
          <span style={{ width: 24, height: 1, background: "var(--primary-hover)" }} />
          <span style={{ fontFamily: "var(--font-body)", fontWeight: 700, fontSize: 11, letterSpacing: "3px", textTransform: "uppercase", color: "var(--primary-hover)" }}>Espaços Comerciais</span>
        </div>
        <h1 className="headline" style={{ fontSize: 52, letterSpacing: "-2.6px", margin: 0, color: "var(--fg-1)" }}>
          CONTROLE INABALÁVEL<br />DE CADA<span style={{ color: "var(--primary-hover)" }}>.</span><br />ATIVO
        </h1>
        <p className="r-body" style={{ marginTop: 16, maxWidth: 360, color: "var(--fg-2)" }}>Gerencie contratos, locatários e parcelas em um único sistema integrado.</p>
      </div>
    </div>
  );
}

function CornerBrackets() {
  const b = { position: "absolute", width: 22, height: 22, borderColor: "var(--highlight)", opacity: 0.7 };
  return (
    <React.Fragment>
      <span style={{ ...b, top: 18, left: 18, borderTop: "1px solid", borderLeft: "1px solid" }} />
      <span style={{ ...b, top: 18, right: 18, borderTop: "1px solid", borderRight: "1px solid" }} />
      <span style={{ ...b, bottom: 18, left: 18, borderBottom: "1px solid", borderLeft: "1px solid" }} />
      <span style={{ ...b, bottom: 18, right: 18, borderBottom: "1px solid", borderRight: "1px solid" }} />
    </React.Fragment>
  );
}

/* Underline field with mono label + ref code */
function AuthField({ label, refLabel, type = "text", value, onChange, extra, error, autoFocus, inputRef }) {
  const [focused, setFocused] = useState(false);
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
        <label style={{ fontFamily: "var(--font-mono)", fontWeight: 700, fontSize: 11, letterSpacing: "1.5px", textTransform: "uppercase", color: focused ? "var(--primary-hover)" : "var(--fg-4)", transition: "color var(--dur-fast)" }}>{label}</label>
        <span style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--fg-5)" }}>{refLabel}</span>
      </div>
      <div style={{ position: "relative" }}>
        <input
          ref={inputRef} type={type} value={value} onChange={onChange} autoFocus={autoFocus}
          onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
          style={{
            all: "unset", display: "block", width: "100%", padding: "13px 56px 13px 0", fontSize: 16,
            fontFamily: "var(--font-body)", color: "var(--fg-1)",
            borderBottom: `1px solid ${error ? "var(--danger-fg)" : focused ? "var(--primary-hover)" : "var(--border-2)"}`,
            boxShadow: focused ? "0 1px 0 0 var(--primary-hover)" : "none", transition: "border-color var(--dur-fast), box-shadow var(--dur-fast)", boxSizing: "border-box",
          }}
        />
        {extra}
      </div>
    </div>
  );
}

function AuthBanner({ tone, code, text }) {
  const c = tone === "success" ? "var(--success)" : tone === "danger" ? "var(--danger-fg)" : "var(--warning)";
  const bg = tone === "success" ? "rgba(16,185,129,0.13)" : tone === "danger" ? "rgba(147,0,10,0.20)" : "var(--warning-bg)";
  const mark = tone === "success" ? "✓" : tone === "danger" ? "!" : "·";
  return (
    <div style={{ background: bg, borderLeft: `2px solid ${c}`, padding: "12px 14px", display: "flex", gap: 12, alignItems: "flex-start" }}>
      <span style={{ width: 16, height: 16, border: `1px solid ${c}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 1, fontFamily: "var(--font-mono)", fontSize: 11, fontWeight: 700, color: c }}>{mark}</span>
      <div>
        <div style={{ fontFamily: "var(--font-body)", fontWeight: 700, fontSize: 11, letterSpacing: "1.5px", textTransform: "uppercase", color: c, marginBottom: 3 }}>{code}</div>
        <div style={{ fontFamily: "var(--font-mono)", fontSize: 13, color: "var(--fg-2)", lineHeight: 1.45 }}>{text}</div>
      </div>
    </div>
  );
}

function SubmitButton({ status, idle, loading, success, enter }) {
  const isLoad = status === "loading";
  const isOk = status === "success";
  return (
    <div style={{ position: "relative", overflow: "hidden" }}>
      <button type="submit" disabled={isLoad} style={{
        all: "unset", boxSizing: "border-box", width: "100%", cursor: isLoad ? "default" : "pointer",
        padding: "17px 22px", display: "flex", alignItems: "center", justifyContent: "space-between",
        background: isOk ? "var(--success)" : "var(--primary)", color: "var(--fg-1)",
        boxShadow: isLoad ? "none" : "0 0 16px 0 var(--primary-glow)", transition: "background var(--dur-base), box-shadow var(--dur-base)",
      }}>
        <span style={{ fontFamily: "var(--font-mono)", fontSize: 12, letterSpacing: "1px" }}>{isLoad ? "[···]" : isOk ? "[OK]" : "[>]"}</span>
        <span style={{ fontFamily: "var(--font-body)", fontWeight: 700, fontSize: 13, letterSpacing: "2px", textTransform: "uppercase" }}>{isLoad ? loading : isOk ? success : idle}</span>
        <span style={{ fontFamily: "var(--font-mono)", fontSize: 12, letterSpacing: "1px" }}>{isLoad ? "" : isOk ? "200" : enter}</span>
      </button>
      {isLoad && <div style={{ position: "absolute", bottom: 0, left: 0, height: 2, width: "40%", background: "var(--chart-1)", animation: "rBar 1s linear infinite" }} />}
    </div>
  );
}

/* ── LOGIN ───────────────────────────────────────────────────────────────── */
function LoginScreen({ go, mobile, variant }) {
  const [email, setEmail] = useState("carlos.mendes@romma.io");
  const [pwd, setPwd] = useState("••••••••");
  const [show, setShow] = useState(false);
  const [remember, setRemember] = useState(true);
  const [status, setStatus] = useState("idle");

  function submit(e) {
    e.preventDefault();
    setStatus("loading");
    setTimeout(() => { setStatus("success"); setTimeout(() => go("console/overview"), 480); }, 900);
  }

  return (
    <AuthFrame mobile={mobile} variant={variant}>
      <div style={{ width: "100%", maxWidth: 408 }}>
        <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: mobile ? 28 : 44 }}>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}><span className="r-dot"><i /><i /></span><span className="r-meta">AUTH_GATEWAY · ONLINE</span></span>
        </div>
        <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: 28 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ width: 24, height: 1, background: "var(--primary-hover)" }} />
              <span style={{ fontFamily: "var(--font-body)", fontWeight: 700, fontSize: 11, letterSpacing: "3px", textTransform: "uppercase", color: "var(--primary-hover)" }}>Identificação do Operador</span>
            </div>
            <h2 className="headline" style={{ fontSize: mobile ? 38 : 50, letterSpacing: "-2.4px", margin: 0 }}>ACESSO AO<br />SISTEMA<span style={{ color: "var(--primary-hover)" }}>.</span></h2>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
            <AuthField label="E-mail" refLabel="REF_U_AUTH_01" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
            <AuthField label="Senha" refLabel="REF_U_AUTH_02" type={show ? "text" : "password"} value={pwd} onChange={(e) => setPwd(e.target.value)}
              extra={<button type="button" onClick={() => setShow((v) => !v)} style={{ all: "unset", position: "absolute", right: 0, top: "50%", transform: "translateY(-50%)", cursor: "pointer", fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--fg-4)", letterSpacing: "1px" }}>{show ? "OCULTAR" : "EXIBIR"}</button>} />
          </div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div onClick={() => setRemember((v) => !v)} style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
              <span style={{ width: 16, height: 16, border: `1px solid ${remember ? "var(--primary)" : "var(--border-2)"}`, background: remember ? "var(--primary)" : "transparent", display: "flex", alignItems: "center", justifyContent: "center", transition: "all var(--dur-fast)" }}>
                {remember && <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M1.5 5L4 7.5L8.5 2.5" stroke="white" strokeWidth="1.5" strokeLinecap="square" /></svg>}
              </span>
              <span style={{ fontFamily: "var(--font-body)", fontSize: 11, color: "var(--fg-4)", letterSpacing: "1px", textTransform: "uppercase" }}>Manter sessão ativa</span>
            </div>
            <button type="button" onClick={() => go("auth/reset")} style={{ all: "unset", cursor: "pointer", fontFamily: "var(--font-body)", fontSize: 12, color: "var(--fg-4)" }}>Esqueci minha senha</button>
          </div>
          <SubmitButton status={status} idle="Acessar Sistema" loading="Autenticando" success="Acesso Concedido" enter="ENTER" />
          <div style={{ textAlign: "center", fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--fg-4)" }}>
            Sem conta? <button type="button" onClick={() => go("auth/signup")} style={{ all: "unset", cursor: "pointer", color: "var(--primary-hover)", textDecoration: "underline", textUnderlineOffset: 3 }}>Configurar sistema</button>
          </div>
        </form>
      </div>
    </AuthFrame>
  );
}

/* ── SIGNUP ──────────────────────────────────────────────────────────────── */
function SignupScreen({ go, mobile, variant }) {
  const [email, setEmail] = useState("");
  const [nome, setNome] = useState("");
  const [sobrenome, setSobrenome] = useState("");
  const [telefone, setTelefone] = useState("");
  const [pwd, setPwd] = useState("");
  const [pwd2, setPwd2] = useState("");
  const [show, setShow] = useState(false);
  const [status, setStatus] = useState("idle");
  const [err, setErr] = useState(null);

  function submit(e) {
    e.preventDefault();
    setErr(null);
    if (!nome.trim() || !sobrenome.trim()) { setErr("Informe nome e sobrenome."); return; }
    if (!/\S+@\S+\.\S+/.test(email)) { setErr("Informe um e-mail válido."); return; }
    if (telefone.replace(/\D/g, "").length < 10) { setErr("Informe um telefone válido."); return; }
    if (pwd.length < 6) { setErr("A senha deve ter no mínimo 6 caracteres."); return; }
    if (pwd !== pwd2) { setErr("As senhas não coincidem."); return; }
    setStatus("loading");
    setTimeout(() => setStatus("sent"), 1000);
  }
  const sent = status === "sent";

  return (
    <AuthFrame mobile={mobile} variant={variant}>
      <div style={{ width: "100%", maxWidth: 408 }}>
        <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: mobile ? 28 : 44 }}>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}><span className="r-dot"><i /><i /></span><span className="r-meta">SIGNUP_GATEWAY · ONLINE</span></span>
        </div>
        <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ width: 24, height: 1, background: "var(--primary-hover)" }} />
              <span style={{ fontFamily: "var(--font-body)", fontWeight: 700, fontSize: 11, letterSpacing: "3px", textTransform: "uppercase", color: "var(--primary-hover)" }}>Configuração Inicial</span>
            </div>
            <h2 className="headline" style={{ fontSize: mobile ? 34 : 46, letterSpacing: "-2.4px", margin: 0 }}>CONFIGURAR<br />SISTEMA<span style={{ color: "var(--primary-hover)" }}>.</span></h2>
          </div>
          {sent && <AuthBanner tone="success" code="Verifique seu email · 200" text="Enviamos um link de ativação. Confirme para liberar o console." />}
          {err && <AuthBanner tone="danger" code="Erro_validação" text={err} />}
          {!sent && (
            <React.Fragment>
              <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                  <AuthField label="Nome" refLabel="REF_U_INIT_01" value={nome} onChange={(e) => setNome(e.target.value)} error={!!err} />
                  <AuthField label="Sobrenome" refLabel="REF_U_INIT_02" value={sobrenome} onChange={(e) => setSobrenome(e.target.value)} error={!!err} />
                </div>
                <AuthField label="E-mail" refLabel="REF_U_INIT_03" type="email" value={email} onChange={(e) => setEmail(e.target.value)} error={!!err} />
                <AuthField label="Telefone" refLabel="REF_U_INIT_04" type="tel" value={telefone} onChange={(e) => setTelefone(maskPhone(e.target.value))} error={!!err} />
                <AuthField label="Senha" refLabel="REF_U_INIT_05" type={show ? "text" : "password"} value={pwd} onChange={(e) => setPwd(e.target.value)} error={!!err}
                  extra={<button type="button" onClick={() => setShow((v) => !v)} style={{ all: "unset", position: "absolute", right: 0, top: "50%", transform: "translateY(-50%)", cursor: "pointer", fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--fg-4)", letterSpacing: "1px" }}>{show ? "OCULTAR" : "EXIBIR"}</button>} />
                <AuthField label="Confirmar senha" refLabel="REF_U_INIT_06" type={show ? "text" : "password"} value={pwd2} onChange={(e) => setPwd2(e.target.value)} error={!!err} />
              </div>
              <SubmitButton status={status === "sent" ? "idle" : status} idle="Configurar Sistema" loading="Configurando" success="" enter="ENTER" />
            </React.Fragment>
          )}
          <div style={{ textAlign: "center", fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--fg-4)" }}>
            Já tem conta? <button type="button" onClick={() => go("auth/login")} style={{ all: "unset", cursor: "pointer", color: "var(--primary-hover)", textDecoration: "underline", textUnderlineOffset: 3 }}>Acessar sistema</button>
          </div>
        </form>
      </div>
    </AuthFrame>
  );
}

/* ── RESET ───────────────────────────────────────────────────────────────── */
function ResetScreen({ go, mobile, variant }) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState("idle");
  function submit(e) { e.preventDefault(); setStatus("loading"); setTimeout(() => setStatus("sent"), 900); }
  const sent = status === "sent";
  return (
    <AuthFrame mobile={mobile} variant={variant}>
      <div style={{ width: "100%", maxWidth: 408 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: mobile ? 28 : 44 }}>
          <button type="button" onClick={() => go("auth/login")} className="r-ghostbtn" style={{ all: "unset", cursor: "pointer", fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--fg-4)", letterSpacing: "0.5px" }}>← LOGIN</button>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}><span className="r-dot"><i /><i /></span><span className="r-meta">RECOVERY · ONLINE</span></span>
        </div>
        <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: 28 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ width: 24, height: 1, background: "var(--primary-hover)" }} />
              <span style={{ fontFamily: "var(--font-body)", fontWeight: 700, fontSize: 11, letterSpacing: "3px", textTransform: "uppercase", color: "var(--primary-hover)" }}>Recuperação de Acesso</span>
            </div>
            <h2 className="headline" style={{ fontSize: mobile ? 38 : 50, letterSpacing: "-2.4px", margin: 0 }}>REDEFINIR<br />SENHA<span style={{ color: "var(--primary-hover)" }}>.</span></h2>
            <p className="r-body" style={{ marginTop: 2 }}>Informe o e-mail da conta. Enviaremos um link seguro para criar uma nova senha.</p>
          </div>
          {sent && <AuthBanner tone="success" code="Email_enviado · 200" text="Verifique sua caixa de entrada para redefinir a senha." />}
          {!sent && (
            <React.Fragment>
              <AuthField label="E-mail" refLabel="REF_U_RST_01" type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoFocus />
              <SubmitButton status={status} idle="Enviar Link" loading="Enviando" success="" enter="ENTER" />
            </React.Fragment>
          )}
        </form>
      </div>
    </AuthFrame>
  );
}

Object.assign(window, { LoginScreen, SignupScreen, ResetScreen });
