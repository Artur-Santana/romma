/* Romma — shared primitives, helpers, and the console shell.
   Exposes components on window for the other babel scripts. */

const { useState, useEffect, useRef, useMemo } = React;

const D = window.RommaData;
const DS = window.RommaDesignSystem_c05089;

/* ── Realtime dot ───────────────────────────────────────────────────────── */
function RDot({ label = "REALTIME · GRID.OS.ALPHA" }) {
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
      <span className="r-dot"><i /><i /></span>
      {label && <span className="r-meta">{label}</span>}
    </span>
  );
}

/* ── Status badge (square dot + mono caps), tinted by domain status ──────── */
const STATUS_MAP = {
  ativo:            { fg: "var(--success)", a: 12, label: "Ativo" },
  encerrado:        { fg: "var(--fg-3)",    a: 0,  label: "Encerrado" },
  cancelado:        { fg: "var(--fg-3)",    a: 0,  label: "Cancelado" },
  vencendo:         { fg: "var(--warning)", a: 12, label: "Vence em 7d" },
  paga:             { fg: "var(--success)", a: 12, label: "Paga" },
  pendente:         { fg: "var(--warning)", a: 12, label: "Pendente" },
  vencida:          { fg: "var(--danger)",  a: 14, label: "Vencida" },
  futura:           { fg: "var(--fg-4)",    a: 0,  label: "Futura" },
  disponivel:       { fg: "var(--success)", a: 12, label: "Disponível" },
  alugada:          { fg: "var(--fg-4)",    a: 0,  label: "Alugada" },
  aceito:           { fg: "var(--success)", a: 12, label: "Ativo" },
  pendente_convite: { fg: "var(--warning)", a: 12, label: "Convite pendente" },
};
function Badge({ status, label }) {
  const c = STATUS_MAP[status] || { fg: "var(--fg-3)", a: 4, label: status };
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 6, padding: "4px 8px",
      background: c.a ? `color-mix(in oklch, ${c.fg} ${c.a}%, transparent)` : "oklch(1 0 0 / 0.04)",
      fontFamily: "var(--font-body)", fontWeight: 700, fontSize: 10, letterSpacing: "1px",
      textTransform: "uppercase", color: c.fg, lineHeight: 1.2, whiteSpace: "nowrap",
    }}>
      <span style={{ width: 6, height: 6, background: c.fg, flexShrink: 0 }} />
      {label || c.label}
    </span>
  );
}

/* ── Eyebrow ─────────────────────────────────────────────────────────────── */
function Eyebrow({ tone = "muted", children, style }) {
  const cls = tone === "indigo" ? "r-eyebrow indigo" : tone === "warning" ? "r-eyebrow warning" : tone === "gold" ? "r-eyebrow gold" : "r-eyebrow";
  return <span className={cls} style={style}>{children}</span>;
}

/* ── Page header (eyebrow + title + subtitle + optional CTA) ─────────────── */
function PageHeader({ eyebrow, title, subtitle, cta, mobile, right }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: mobile ? "flex-start" : "flex-end", gap: 16, marginBottom: "var(--rd-block)" }}>
      <div style={{ display: "flex", flexDirection: "column", gap: 8, minWidth: 0 }}>
        <Eyebrow tone="indigo">{eyebrow}</Eyebrow>
        <h1 className="r-title" style={{ fontSize: mobile ? "var(--rt-title-sm)" : "var(--rt-title)" }}>{title}</h1>
        {subtitle && <span className="r-meta" style={{ fontSize: 11 }}>{subtitle}</span>}
      </div>
      {cta && (
        <button onClick={cta.onClick} className="r-cta" style={{
          all: "unset", boxSizing: "border-box", cursor: "pointer", flexShrink: 0,
          display: "inline-flex", alignItems: "center", gap: 10, padding: mobile ? "10px 14px" : "12px 18px",
          background: "var(--primary)", color: "var(--fg-1)",
          fontFamily: "var(--font-body)", fontWeight: 700, fontSize: 12, letterSpacing: "1.2px", textTransform: "uppercase", whiteSpace: "nowrap",
          transition: "background var(--dur-fast)",
        }}
          onMouseEnter={(e) => (e.currentTarget.style.background = "var(--primary-hover)")}
          onMouseLeave={(e) => (e.currentTarget.style.background = "var(--primary)")}
        >
          <span style={{ fontFamily: "var(--font-mono)", opacity: 0.85 }}>{cta.code}</span>
          {!mobile && <span>{cta.label}</span>}
        </button>
      )}
      {right}
    </div>
  );
}

/* ── Solid action button ─────────────────────────────────────────────────── */
function Btn({ children, onClick, variant = "primary", code, trailing, type = "button", style, disabled, full }) {
  const variants = {
    primary: { background: "var(--primary)", color: "var(--fg-1)", border: "1px solid transparent" },
    outline: { background: "transparent", color: "var(--fg-2)", border: "1px solid var(--border-3)" },
    ghost:   { background: "transparent", color: "var(--fg-3)", border: "1px solid transparent" },
    danger:  { background: "color-mix(in oklch, var(--destructive) 14%, transparent)", color: "var(--danger-fg)", border: "1px solid color-mix(in oklch, var(--destructive) 30%, transparent)" },
  };
  return (
    <button type={type} onClick={onClick} disabled={disabled} style={{
      all: "unset", boxSizing: "border-box", cursor: disabled ? "not-allowed" : "pointer",
      display: "inline-flex", alignItems: "center", justifyContent: code || trailing ? "space-between" : "center",
      gap: 10, padding: "11px 18px", width: full ? "100%" : "auto", opacity: disabled ? 0.5 : 1,
      fontFamily: "var(--font-body)", fontWeight: 700, fontSize: 12, letterSpacing: "1.2px", textTransform: "uppercase",
      transition: "background var(--dur-fast), border-color var(--dur-fast), color var(--dur-fast)",
      ...variants[variant], ...style,
    }}
      onMouseEnter={(e) => { if (disabled) return; if (variant === "primary") e.currentTarget.style.background = "var(--primary-hover)"; if (variant === "outline" || variant === "ghost") e.currentTarget.style.background = "var(--surface-hi)"; }}
      onMouseLeave={(e) => { if (disabled) return; e.currentTarget.style.background = variants[variant].background; }}
    >
      {code && <span style={{ fontFamily: "var(--font-mono)", opacity: 0.85 }}>{code}</span>}
      <span>{children}</span>
      {trailing && <span style={{ fontFamily: "var(--font-mono)", opacity: 0.85 }}>{trailing}</span>}
    </button>
  );
}

/* ── Avatar chip (square, mono initials) ─────────────────────────────────── */
function Avatar({ name, dim = false, size = 32 }) {
  return (
    <div style={{
      width: size, height: size, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center",
      background: dim ? "transparent" : "var(--surface-hi)", border: dim ? "1px solid var(--border-2)" : "none",
      fontFamily: "var(--font-mono)", fontSize: 10, fontWeight: 700, letterSpacing: "0.5px",
      color: dim ? "var(--fg-4)" : "var(--fg-1)",
    }}>{D.initials(name)}</div>
  );
}

/* ── Console nav model ───────────────────────────────────────────────────── */
const CONSOLE_NAV = [
  { route: "console/overview",   code: "VG", label: "Visão Geral" },
  { route: "console/edificios",  code: "ED", label: "Edifícios",  badge: String(D.edificios.length) },
  { route: "console/unidades",   code: "UN", label: "Unidades",   badge: String(D.unidades.length) },
  { route: "console/contratos",  code: "CT", label: "Contratos",  badge: String(D.contratos.filter((c) => c.status === "ativo").length) },
  { route: "console/locatarios", code: "LC", label: "Locatários", badge: String(D.locatarios.length) },
];

/* ── Console shell: top strip + sidebar (desktop) / bottom nav (mobile) ──── */
function ConsoleShell({ route, go, mobile, title, onBack, children }) {
  if (mobile) {
    return (
      <div style={{ display: "flex", flexDirection: "column", height: "100%", background: "var(--background)" }}>
        {/* mobile top bar */}
        <div style={{ height: 52, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 16px", borderBottom: "1px solid var(--border-3)", background: "var(--surface)" }}>
          {onBack
            ? <button onClick={onBack} className="r-ghostbtn" style={{ all: "unset", cursor: "pointer", fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--fg-3)", letterSpacing: "0.5px" }}>← VOLTAR</button>
            : <span style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 18, letterSpacing: "-0.5px", color: "var(--fg-1)" }}>ROMMA</span>}
          <span className="r-label" style={{ fontSize: 10 }}>{title}</span>
        </div>
        <div className="r-scroll" style={{ flex: 1, minHeight: 0, overflowY: "auto", overflowX: "hidden" }}>{children}</div>
        {/* mobile bottom nav */}
        <div style={{ flexShrink: 0, display: "grid", gridTemplateColumns: "repeat(5, 1fr)", borderTop: "1px solid var(--border-3)", background: "var(--surface)" }}>
          {CONSOLE_NAV.map((n) => {
            const active = route === n.route;
            return (
              <button key={n.code} onClick={() => go(n.route)} style={{
                all: "unset", cursor: "pointer", textAlign: "center", padding: "10px 2px 12px",
                borderTop: `2px solid ${active ? "var(--indigo)" : "transparent"}`,
                display: "flex", flexDirection: "column", gap: 3, alignItems: "center",
              }}>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: active ? "var(--indigo)" : "var(--fg-5)" }}>{n.code}</span>
                <span style={{ fontFamily: "var(--font-body)", fontWeight: 700, fontSize: 8.5, letterSpacing: "0.5px", textTransform: "uppercase", color: active ? "var(--fg-1)" : "var(--fg-4)" }}>{n.label.split(" ")[0]}</span>
              </button>
            );
          })}
        </div>
      </div>
    );
  }
  // desktop
  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      {/* top strip */}
      <div style={{ height: 28, flexShrink: 0, background: "rgba(18,18,18,0.95)", borderBottom: "1px solid var(--border-2)", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 24px", fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--fg-4)", letterSpacing: "0.5px" }}>
        <span>INTEGRATED_SYSTEM_NODE: 0X449F</span>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <span>GRID.OS.ALPHA</span>
          <span>STATUS: SYNCHRONIZED</span>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}><span className="r-dot"><i /><i /></span>ONLINE</span>
        </div>
      </div>
      <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
        {/* sidebar */}
        <div style={{ width: 248, flexShrink: 0, background: "var(--background)", borderRight: "1px solid var(--border-2)", display: "flex", flexDirection: "column" }}>
          <div style={{ padding: "26px 28px 20px" }}>
            <Eyebrow tone="indigo">Console · Proprietário</Eyebrow>
            <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 26, letterSpacing: "-1px", color: "var(--fg-1)", marginTop: 6 }}>ROMMA</div>
          </div>
          <nav style={{ flex: 1 }}>
            {CONSOLE_NAV.map((n) => {
              const active = route === n.route || (n.route === "console/contratos" && route === "console/contrato");
              return (
                <button key={n.code} onClick={() => go(n.route)} style={{
                  all: "unset", boxSizing: "border-box", cursor: "pointer", width: "100%",
                  display: "flex", alignItems: "center", justifyContent: "space-between", padding: "11px 28px",
                  borderLeft: `2px solid ${active ? "var(--indigo)" : "transparent"}`,
                  background: active ? "var(--surface)" : "transparent", transition: "background var(--dur-fast)",
                }}
                  onMouseEnter={(e) => { if (!active) e.currentTarget.style.background = "oklch(0.265 0 0)"; }}
                  onMouseLeave={(e) => { if (!active) e.currentTarget.style.background = "transparent"; }}
                >
                  <span style={{ fontFamily: "var(--font-body)", fontWeight: 700, fontSize: 12, letterSpacing: "1.2px", textTransform: "uppercase", color: active ? "var(--fg-1)" : "var(--fg-3)" }}>{n.label}</span>
                  {n.badge && <span style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: active ? "var(--indigo)" : "var(--fg-5)" }}>{n.badge}</span>}
                </button>
              );
            })}
          </nav>
          <div style={{ borderTop: "1px solid var(--border-2)", padding: "20px 28px 24px", display: "flex", flexDirection: "column", gap: 10 }}>
            <button onClick={() => go("public/unidades")} className="r-ghostbtn" style={{ all: "unset", cursor: "pointer", fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--fg-3)", letterSpacing: "0.5px" }}>→ Ver Página Pública</button>
            <span style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--fg-5)", letterSpacing: "0.5px", marginTop: 4 }}>{D.operador.email}</span>
            <button onClick={() => go("auth/login")} className="r-ghostbtn" style={{ all: "unset", cursor: "pointer", fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--fg-3)", letterSpacing: "0.5px", marginTop: 4 }}>⏻ Encerrar Sessão</button>
          </div>
        </div>
        {/* main */}
        <main className="r-scroll" style={{ flex: 1, minHeight: 0, overflowY: "auto", background: "var(--background)" }}>
          <div style={{ maxWidth: 1480, margin: "0 auto" }}>{children}</div>
        </main>
      </div>
    </div>
  );
}

Object.assign(window, { RDot, Badge, Eyebrow, PageHeader, Btn, Avatar, ConsoleShell, CONSOLE_NAV });
