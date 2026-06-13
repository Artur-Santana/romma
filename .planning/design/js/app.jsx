/* Romma — prototype shell: router, chrome, viewport toggle, tweaks. */

// Per-screen layout variant. User-approved defaults:
//   A → Login, Cadastro, Redefinir senha, Unidades Públicas
//   B → everything else      ·      Destaque (accent) → gold
const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "density": "regular",
  "accent": "gold",
  "v_auth/login": "A",
  "v_auth/signup": "A",
  "v_auth/reset": "A",
  "v_public/unidades": "A",
  "v_console/overview": "B",
  "v_console/edificios": "B",
  "v_console/unidades": "B",
  "v_console/contratos": "B",
  "v_console/contrato": "B",
  "v_console/locatarios": "B",
  "v_portal/dashboard": "B"
}/*EDITMODE-END*/;

const GROUPS = [
  { id: "auth",    label: "Acesso",   route: "auth/login" },
  { id: "console", label: "Console",  route: "console/overview" },
  { id: "public",  label: "Público",  route: "public/unidades" },
  { id: "portal",  label: "Portal",   route: "portal/dashboard" },
];

const SCREEN_LABELS = {
  "auth/login": "Login", "auth/signup": "Cadastro", "auth/reset": "Redefinir senha",
  "console/overview": "Visão Geral", "console/edificios": "Edifícios", "console/unidades": "Unidades",
  "console/contratos": "Contratos", "console/contrato": "Contrato · Parcelas", "console/locatarios": "Locatários",
  "public/unidades": "Unidades Públicas", "portal/dashboard": "Portal do Locatário",
};

function groupOf(route) { return route.split("/")[0]; }

function App() {
  const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);
  const [route, setRoute] = useState("auth/login");
  const [viewport, setViewport] = useState("desktop");
  const mobile = viewport === "mobile";
  const go = (r) => setRoute(r);
  const variantOf = (r) => t["v_" + r] || "A";
  const v = variantOf(route);

  function renderScreen() {
    switch (route) {
      case "auth/login":  return <LoginScreen go={go} mobile={mobile} variant={v} />;
      case "auth/signup": return <SignupScreen go={go} mobile={mobile} variant={v} />;
      case "auth/reset":  return <ResetScreen go={go} mobile={mobile} variant={v} />;
      case "console/overview":   return <ConsoleShell route={route} go={go} mobile={mobile} title="Dashboard"><OverviewScreen go={go} mobile={mobile} variant={v} /></ConsoleShell>;
      case "console/edificios":  return <ConsoleShell route={route} go={go} mobile={mobile} title="Edifícios"><EdificiosScreen mobile={mobile} variant={v} /></ConsoleShell>;
      case "console/unidades":   return <ConsoleShell route={route} go={go} mobile={mobile} title="Unidades"><UnidadesScreen mobile={mobile} variant={v} /></ConsoleShell>;
      case "console/contratos":  return <ConsoleShell route={route} go={go} mobile={mobile} title="Contratos"><ContratosScreen go={go} mobile={mobile} variant={v} /></ConsoleShell>;
      case "console/contrato":   return <ConsoleShell route={route} go={go} mobile={mobile} title="Parcelas" onBack={() => go("console/contratos")}><ContratoDetailScreen go={go} mobile={mobile} variant={v} /></ConsoleShell>;
      case "console/locatarios": return <ConsoleShell route={route} go={go} mobile={mobile} title="Locatários"><LocatariosScreen mobile={mobile} variant={v} /></ConsoleShell>;
      case "public/unidades":    return <PublicUnidadesScreen go={go} mobile={mobile} variant={v} />;
      case "portal/dashboard":   return <PortalScreen go={go} mobile={mobile} variant={v} />;
      default: return null;
    }
  }

  const activeGroup = groupOf(route);

  return (
    <div data-density={t.density} data-accent={t.accent} style={{ height: "100%", display: "flex", flexDirection: "column", background: "var(--neutral)" }}>
      {/* Prototype chrome */}
      <header style={{ flexShrink: 0, height: 46, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 16px", background: "#0a0a0a", borderBottom: "1px solid var(--border-2)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 16, letterSpacing: "-0.5px", color: "var(--fg-1)" }}>ROMMA</span>
          <span style={{ fontFamily: "var(--font-mono)", fontSize: 9, letterSpacing: "1.5px", color: "var(--indigo)", border: "1px solid var(--border-3)", padding: "2px 6px" }}>PROTÓTIPO</span>
        </div>
        <nav style={{ display: "flex", gap: 2 }}>
          {GROUPS.map((g) => {
            const active = activeGroup === g.id;
            return (
              <button key={g.id} onClick={() => go(g.route)} style={{ all: "unset", cursor: "pointer", padding: "7px 14px", fontFamily: "var(--font-body)", fontWeight: 700, fontSize: 11, letterSpacing: "1px", textTransform: "uppercase", color: active ? "var(--fg-1)" : "var(--fg-4)", borderBottom: `2px solid ${active ? "var(--indigo)" : "transparent"}`, transition: "color var(--dur-fast)" }}>{g.label}</button>
            );
          })}
        </nav>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ display: "flex", border: "1px solid var(--border-3)" }}>
            {["desktop", "mobile"].map((v) => (
              <button key={v} onClick={() => setViewport(v)} style={{ all: "unset", cursor: "pointer", padding: "5px 10px", fontFamily: "var(--font-mono)", fontSize: 10, letterSpacing: "0.5px", textTransform: "uppercase", background: viewport === v ? "var(--indigo)" : "transparent", color: viewport === v ? "var(--fg-1)" : "var(--fg-4)" }}>{v === "desktop" ? "▭ Desktop" : "▯ Mobile"}</button>
            ))}
          </span>
        </div>
      </header>

      {/* Stage */}
      <div style={{ flex: 1, overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center", background: mobile ? "radial-gradient(circle at 50% 40%, oklch(0.22 0 0), var(--neutral))" : "var(--background)", padding: mobile ? 20 : 0 }}>
        {mobile ? (
          <div style={{ width: 392, height: "100%", maxHeight: 844, display: "flex", flexDirection: "column", border: "1px solid var(--border-2)", boxShadow: "0 0 0 6px #000, 0 24px 60px rgba(0,0,0,0.6)", overflow: "hidden", background: "var(--background)" }}>
            {renderScreen()}
          </div>
        ) : (
          <div style={{ width: "100%", height: "100%" }}>{renderScreen()}</div>
        )}
      </div>

      {/* Tweaks */}
      <TweaksPanel>
        <TweakSection label="Layout" />
        <TweakRadio label="Densidade" value={t.density} options={["compact", "regular", "comfy"]} onChange={(v) => setTweak("density", v)} />
        <TweakRadio label="Destaque" value={t.accent} options={["gold", "indigo"]} onChange={(v) => setTweak("accent", v)} />
        <TweakSection label="Variação da tela" />
        <TweakRadio label={"Layout · " + (SCREEN_LABELS[route] || "")} value={v} options={["A", "B"]} onChange={(val) => setTweak("v_" + route, val)} />
        <TweakSection label="Telas" />
        <TweakSelect label="Ir para" value={route} options={Object.keys(SCREEN_LABELS).map((k) => ({ value: k, label: SCREEN_LABELS[k] }))} onChange={(v) => go(v)} />
      </TweaksPanel>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
