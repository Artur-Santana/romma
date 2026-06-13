/* Romma — Portal do Locatário (tenant view) with two refined variations.
   Added functionality: Pagar agora (PIX + QR), baixar comprovante, falar com proprietário. */

function PortalShell({ go, mobile, children }) {
  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column", background: "var(--background)", position: "relative" }}>
      <div style={{ height: 28, flexShrink: 0, background: "rgba(18,18,18,0.95)", borderBottom: "1px solid var(--border-2)", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 20px", fontFamily: "var(--font-mono)", fontSize: 10.5, color: "var(--fg-4)", letterSpacing: "0.5px" }}>
        <span>PORTAL_NODE: 0X771C</span>
        <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}><span className="r-dot"><i /><i /></span>ONLINE</span>
      </div>
      <div className="r-scroll" style={{ flex: 1, minHeight: 0, overflowY: "auto" }}>{children}</div>
    </div>
  );
}

// Deterministic faux-QR — 25×25 crisp module grid seeded from a string.
function FauxQR({ seed = "romma", size = 132 }) {
  const n = 25;
  const cells = useMemo(() => {
    let s = 0; for (let i = 0; i < seed.length; i++) s = (s * 131 + seed.charCodeAt(i)) >>> 0;
    const rnd = () => { s = (s * 1103515245 + 12345) & 0x7fffffff; return s / 0x7fffffff; };
    const arr = [];
    for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) {
      const finder = (x < 7 && y < 7) || (x >= n - 7 && y < 7) || (x < 7 && y >= n - 7);
      arr.push(finder ? null : rnd() > 0.5);
    }
    return arr;
  }, [seed]);
  const Finder = ({ top, left }) => (
    <div style={{ position: "absolute", top, left, width: size * 7 / n, height: size * 7 / n, border: `${size / n}px solid #0a0a0c`, boxSizing: "border-box" }}>
      <div style={{ position: "absolute", inset: size / n, background: "#0a0a0c" }} />
    </div>
  );
  const u = size / n;
  return (
    <div style={{ position: "relative", width: size, height: size, background: "#fff", padding: 0 }}>
      <div style={{ position: "absolute", inset: u, display: "grid", gridTemplateColumns: `repeat(${n}, 1fr)`, gridTemplateRows: `repeat(${n}, 1fr)`, width: size - 2 * u, height: size - 2 * u }}>
        {cells.map((on, i) => <div key={i} style={{ background: on ? "#0a0a0c" : "transparent" }} />)}
      </div>
      <Finder top={u} left={u} /><Finder top={u} left={size - u - size * 7 / n} /><Finder top={size - u - size * 7 / n} left={u} />
    </div>
  );
}

function PixModal({ valor, parcela, onClose, onConfirm }) {
  const [copied, setCopied] = useState(false);
  const code = "00020126580014BR.GOV.BCB.PIX0136romma-2026-c1-p12520400005303986540" + String(valor) + "5802BR5909ROMMA LTDA6009SAO PAULO62070503***6304A1B2";
  return (
    <div onClick={(e) => { if (e.target === e.currentTarget) onClose(); }} style={{ position: "fixed", inset: 0, zIndex: 60, background: "oklch(0 0 0 / 0.74)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20, animation: "rFade 200ms var(--ease-crisp)" }}>
      <div className="r-scroll" style={{ width: "100%", maxWidth: 420, background: "var(--surface)", border: "1px solid var(--indigo)", maxHeight: "92%", overflowY: "auto" }}>
        <div style={{ padding: 26 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
            <div><Eyebrow tone="indigo" style={{ marginBottom: 6 }}>Pagamento via PIX</Eyebrow><h3 className="r-section">Parcela {String(parcela).padStart(2, "0")}/12</h3></div>
            <button onClick={onClose} style={{ all: "unset", cursor: "pointer", width: 30, height: 30, border: "1px solid var(--border-3)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--fg-3)", fontFamily: "var(--font-mono)" }}>✕</button>
          </div>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 14, marginBottom: 20 }}>
            <FauxQR seed={code} />
            <div style={{ textAlign: "center" }}>
              <div className="r-label" style={{ marginBottom: 6 }}>Valor a pagar</div>
              <div className="r-metric" style={{ fontSize: 36, color: "var(--primary-hover)" }}>{D.fmtBRL(valor)}</div>
            </div>
          </div>
          <div style={{ border: "1px solid var(--border-3)", background: "var(--surface-hi)", padding: "12px 14px", marginBottom: 16 }}>
            <div className="r-label" style={{ marginBottom: 8 }}>PIX Copia e Cola</div>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span className="r-data" style={{ fontSize: 11, color: "var(--fg-3)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1 }}>{code}</span>
              <button onClick={() => { setCopied(true); setTimeout(() => setCopied(false), 1800); }} className="r-ghostbtn" style={{ all: "unset", cursor: "pointer", fontFamily: "var(--font-mono)", fontSize: 10, fontWeight: 700, color: copied ? "var(--success)" : "var(--indigo)", letterSpacing: "0.5px", textTransform: "uppercase", flexShrink: 0 }}>{copied ? "✓ Copiado" : "Copiar"}</button>
            </div>
          </div>
          <span className="r-meta" style={{ display: "block", textAlign: "center", marginBottom: 16 }}>Ao confirmar, o painel do proprietário é atualizado automaticamente para <span style={{ color: "var(--success)" }}>Pago</span>. (Processamento de pagamento ainda não implementado.)</span>
          <Btn full code="[✓]" trailing="200" onClick={onConfirm} style={{ padding: "15px 22px" }}>Já efetuei o pagamento</Btn>
        </div>
      </div>
    </div>
  );
}

function ComprovanteModal({ p, loc, uni, edi, valor, onClose }) {
  return (
    <div onClick={(e) => { if (e.target === e.currentTarget) onClose(); }} style={{ position: "fixed", inset: 0, zIndex: 60, background: "oklch(0 0 0 / 0.74)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20, animation: "rFade 200ms var(--ease-crisp)" }}>
      <div className="r-scroll" style={{ width: "100%", maxWidth: 420, background: "var(--surface)", border: "1px solid var(--border-2)", maxHeight: "92%", overflowY: "auto" }}>
        <div style={{ padding: 26 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 18 }}>
            <div><Eyebrow tone="indigo" style={{ marginBottom: 6 }}>Comprovante · GRID.OS</Eyebrow><h3 className="r-section">Pagamento Confirmado</h3></div>
            <button onClick={onClose} style={{ all: "unset", cursor: "pointer", width: 30, height: 30, border: "1px solid var(--border-3)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--fg-3)", fontFamily: "var(--font-mono)" }}>✕</button>
          </div>
          {/* receipt */}
          <div style={{ border: "1px solid var(--border-3)", background: "var(--surface-hi)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 18px", borderBottom: "1px solid var(--border-3)" }}>
              <span style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 18, letterSpacing: "-0.5px", color: "var(--fg-1)" }}>ROMMA</span>
              <span style={{ fontFamily: "var(--font-body)", fontWeight: 700, fontSize: 10, letterSpacing: "1.5px", textTransform: "uppercase", color: "var(--success)", border: "1px solid var(--success)", padding: "4px 8px" }}>Pago</span>
            </div>
            <div style={{ padding: "18px", display: "flex", flexDirection: "column", gap: 12 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                <span className="r-label">Valor pago</span>
                <span style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 28, letterSpacing: "-1px", color: "var(--fg-1)" }}>{D.fmtBRL(valor)}</span>
              </div>
              <div style={{ height: 1, background: "var(--border-3)" }} />
              {[
                ["Parcela", `${String(p.numero).padStart(2, "0")}/12`],
                ["Locatário", loc?.nome_razao_social],
                ["Unidade", `${uni?.nome} · ${edi?.nome}`],
                ["Vencimento", D.fmtData(p.data_vencimento)],
                ["Pago em", D.fmtData(p.data_pagamento)],
                ["Forma", "PIX"],
                ["Autenticação", `RM-2026-${p.id.toUpperCase()}-0X${(p.numero * 4492).toString(16).toUpperCase()}`],
              ].map(([k, v]) => (
                <div key={k} style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
                  <span className="r-meta">{k}</span>
                  <span className="r-data" style={{ fontSize: 12, color: "var(--fg-2)", textAlign: "right" }}>{v}</span>
                </div>
              ))}
            </div>
          </div>
          <span className="r-meta" style={{ display: "block", textAlign: "center", margin: "14px 0" }}>Documento gerado eletronicamente · válido sem assinatura.</span>
          <Btn full code="⤓" onClick={onClose} style={{ padding: "14px 22px" }}>Baixar PDF</Btn>
        </div>
      </div>
    </div>
  );
}

function NextPayment({ valor, parcela, days, onPagar }) {
  return (
    <div style={{ border: "1px solid var(--indigo)", background: "oklch(0.339 0.179 301.68 / 0.08)", padding: "var(--rd-panel)" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <Eyebrow tone="indigo" style={{ marginBottom: 8 }}>Próximo Vencimento</Eyebrow>
          <div className="r-metric" style={{ fontSize: 40 }}>{D.fmtBRL(valor)}</div>
          <div className="r-meta" style={{ marginTop: 6 }}>Parcela {parcela}/12 · vence 19/06/2026</div>
        </div>
        <Badge status="pendente" />
      </div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, marginTop: 16, flexWrap: "wrap" }}>
        <span style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--warning)" }}>⏱ {days} dia(s) restantes</span>
        <Btn code="PIX" trailing="→" onClick={onPagar} style={{ padding: "10px 16px" }}>Pagar Agora</Btn>
      </div>
    </div>
  );
}

function PaymentHistory({ mobile, parcelas, onComprovante }) {
  return (
    <section>
      <Eyebrow tone="indigo" style={{ marginBottom: 14 }}>Histórico de Parcelas</Eyebrow>
      <div className="r-panel" style={{ overflowX: "auto" }}>
        <div style={{ display: "grid", gridTemplateColumns: "56px 1fr 1fr 1fr 110px", background: "var(--surface-hi)", borderBottom: "1px solid var(--border-3)", minWidth: mobile ? 460 : "auto" }}>
          {["#", "Vencimento", "Pagamento", "Status", "Comprovante"].map((h) => <span key={h} className="r-label" style={{ padding: "11px var(--rd-row-x)", fontSize: 10 }}>{h}</span>)}
        </div>
        {parcelas.map((p, i) => (
          <div key={p.id} style={{ display: "grid", gridTemplateColumns: "56px 1fr 1fr 1fr 110px", alignItems: "center", borderTop: i > 0 ? "1px solid var(--border-3)" : "none", minWidth: mobile ? 460 : "auto" }}>
            <span className="r-data" style={{ padding: "var(--rd-row-y) var(--rd-row-x)", fontWeight: 700 }}>{String(p.numero).padStart(2, "0")}</span>
            <span className="r-data" style={{ padding: "var(--rd-row-y) var(--rd-row-x)", fontSize: 13, color: "var(--fg-3)" }}>{D.fmtData(p.data_vencimento)}</span>
            <span className="r-data" style={{ padding: "var(--rd-row-y) var(--rd-row-x)", fontSize: 13, color: p.data_pagamento ? "var(--success)" : "var(--fg-5)" }}>{p.data_pagamento ? D.fmtData(p.data_pagamento) : "—"}</span>
            <span style={{ padding: "var(--rd-row-y) var(--rd-row-x)" }}><Badge status={p.status} /></span>
            <span style={{ padding: "var(--rd-row-y) var(--rd-row-x)" }}>
              {p.status === "paga"
                ? <button onClick={() => onComprovante(p)} className="r-ghostbtn" style={{ all: "unset", cursor: "pointer", fontFamily: "var(--font-mono)", fontSize: 10, fontWeight: 700, color: "var(--fg-3)", letterSpacing: "0.5px", textTransform: "uppercase" }}>⤓ Baixar</button>
                : <span className="r-meta" style={{ color: "var(--fg-5)" }}>—</span>}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}

function PortalScreen({ go, mobile, variant }) {
  const c = D.contratos[0];
  const loc = D.locatarios.find((l) => l.id === c.locatario_id);
  const uni = D.unidades.find((u) => u.id === c.unidade_id);
  const edi = D.edificios.find((e) => e.id === uni?.edificio_id);
  const [parcelas, setParcelas] = useState(D.parcelasContrato);
  const [pix, setPix] = useState(false);
  const [comprovanteP, setComprovanteP] = useState(null);
  const [toast, setToast] = useState(null);

  const pagas = parcelas.filter((p) => p.status === "paga").length;
  const total = parcelas.length;
  const pending = parcelas.find((p) => p.status === "pendente" || p.status === "vencida");
  const days = Math.ceil((new Date("2026-06-19") - new Date(D.TODAY)) / 86400000);
  const pad = mobile ? "20px var(--rd-gutter-m) 60px" : "var(--rd-page-y) 48px 64px";

  function showToast(msg, ok = true) { setToast({ msg, ok }); setTimeout(() => setToast(null), 2800); }
  // NOTE: ao confirmar o PIX aqui, a parcela vira "paga". No produto real, o
  // pagamento sincroniza com o painel do proprietário (Visão Geral / Contrato),
  // que passa a exibir a parcela como PAGA automaticamente. Pagamento ainda não
  // é processado de verdade — por ora apenas marcamos o estado local.
  function confirmPix() { if (pending) setParcelas((ps) => ps.map((p) => (p.id === pending.id ? { ...p, status: "paga", data_pagamento: D.TODAY } : p))); setPix(false); showToast("Pagamento confirmado · painel do proprietário atualizado"); }
  function comprovante(p) { setComprovanteP(p); }

  const summary = [
    { label: "Unidade", value: uni?.nome }, { label: "Valor mensal", value: D.fmtBRL(uni?.valor_mensal) },
    { label: "Início", value: D.fmtData(c.data_inicio) }, { label: "Fim", value: D.fmtData(c.data_fim) },
  ];

  const head = (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 }}>
      <span className="r-eyebrow indigo">Portal do Locatário</span>
      <button onClick={() => go("auth/login")} className="r-ghostbtn" style={{ all: "unset", cursor: "pointer", fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--fg-3)", letterSpacing: "0.5px" }}>⏻ Sair</button>
    </div>
  );

  return (
    <PortalShell go={go} mobile={mobile}>
      <div className="r-fade" style={{ maxWidth: 980, margin: "0 auto", padding: pad }}>
        {head}
        <h1 className="r-title" style={{ fontSize: mobile ? "var(--rt-title-sm)" : "var(--rt-title)" }}>Seu Contrato.</h1>
        <p className="r-meta" style={{ marginTop: 6, marginBottom: "var(--rd-block)" }}>{loc?.nome_razao_social} · acesso restrito — contrato e histórico de parcelas.</p>

        {variant === "B" ? (
          /* ── Variant B: payment-forward dashboard ─────────────────────── */
          <React.Fragment>
            <div style={{ display: "grid", gridTemplateColumns: mobile ? "1fr" : "1.1fr 1fr", gap: "var(--rd-block-sm)", marginBottom: "var(--rd-block)" }}>
              {pending
                ? <NextPayment valor={uni?.valor_mensal} parcela={pending.numero} days={days} onPagar={() => setPix(true)} />
                : <div style={{ border: "1px solid var(--success)", background: "rgba(16,185,129,0.08)", padding: "var(--rd-panel)", display: "flex", flexDirection: "column", justifyContent: "center", gap: 8 }}><Eyebrow style={{ color: "var(--success)" }}>Em dia</Eyebrow><div className="r-section">Nenhuma parcela em aberto.</div><span className="r-meta">Todas as parcelas deste ciclo foram pagas.</span></div>}
              <div style={{ border: "1px solid var(--border-3)", background: "var(--surface)", padding: "var(--rd-panel)" }}>
                <Eyebrow tone="indigo" style={{ marginBottom: 12 }}>Progresso do Contrato</Eyebrow>
                <div style={{ display: "flex", alignItems: "baseline", gap: 10, marginBottom: 14 }}><span className="r-metric" style={{ fontSize: 40 }}>{pagas}<span style={{ fontSize: 18, color: "var(--fg-4)" }}>/{total}</span></span><span className="r-meta">parcelas pagas</span></div>
                <div style={{ display: "flex", gap: 3 }}>{parcelas.map((p) => <div key={p.id} style={{ flex: 1, height: 24, background: p.status === "paga" ? "var(--success)" : p.status === "pendente" ? "var(--warning)" : "var(--surface-hi)" }} />)}</div>
                <div style={{ display: "flex", justifyContent: "space-between", marginTop: 12 }}><span className="r-meta">{uni?.nome}</span><span className="r-meta" style={{ color: "var(--success)" }}>{Math.round((pagas / total) * 100)}% adimplente</span></div>
              </div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: mobile ? "1fr 1fr" : "repeat(4, 1fr)", border: "1px solid var(--border-3)", marginBottom: "var(--rd-block)" }}>
              {summary.map((s, i) => (
                <div key={s.label} style={{ padding: "var(--rd-cell)", borderTop: mobile && i >= 2 ? "1px solid var(--border-3)" : "none", borderRight: mobile ? (i % 2 === 0 ? "1px solid var(--border-3)" : "none") : (i < 3 ? "1px solid var(--border-3)" : "none") }}>
                  <div className="r-label" style={{ marginBottom: 8 }}>{s.label}</div>
                  <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 20, letterSpacing: "-0.4px", color: "var(--fg-1)" }}>{s.value}</div>
                </div>
              ))}
            </div>
            <PaymentHistory mobile={mobile} parcelas={parcelas} onComprovante={comprovante} />
          </React.Fragment>
        ) : (
          /* ── Variant A: refined classic contract card + table ─────────── */
          <React.Fragment>
            <section style={{ border: "1px solid var(--border-3)", background: "var(--surface)", padding: "var(--rd-panel)", marginBottom: "var(--rd-block)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 18 }}>
                <Eyebrow tone="indigo">Contrato Ativo</Eyebrow><Badge status="ativo" />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: mobile ? "1fr 1fr" : "repeat(4, 1fr)", gap: 20 }}>
                {summary.map((s) => (
                  <div key={s.label}>
                    <div className="r-label" style={{ marginBottom: 8 }}>{s.label}</div>
                    <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 22, letterSpacing: "-0.5px", color: "var(--fg-1)" }}>{s.value}</div>
                  </div>
                ))}
              </div>
              <div style={{ height: 1, background: "var(--border-3)", margin: "18px 0 16px" }} />
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10 }}>
                <span className="r-meta">{edi?.nome} · {uni?.area_m2} m²</span>
                <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                  <span className="r-meta" style={{ color: "var(--success)" }}>{pagas}/{total} pagas · {Math.round((pagas / total) * 100)}% adimplente</span>
                  {pending && <Btn code="PIX" trailing="→" onClick={() => setPix(true)} style={{ padding: "9px 14px" }}>Pagar {D.fmtBRL(uni?.valor_mensal)}</Btn>}
                </div>
              </div>
            </section>
            <PaymentHistory mobile={mobile} parcelas={parcelas} onComprovante={comprovante} />
          </React.Fragment>
        )}
      </div>
      {pix && pending && <PixModal valor={uni?.valor_mensal} parcela={pending.numero} onClose={() => setPix(false)} onConfirm={confirmPix} />}
      {comprovanteP && <ComprovanteModal p={comprovanteP} loc={loc} uni={uni} edi={edi} valor={uni?.valor_mensal} onClose={() => setComprovanteP(null)} />}
      {toast && <div style={{ position: "fixed", bottom: 24, left: "50%", transform: "translateX(-50%)", zIndex: 70, background: "var(--surface-hi)", border: `1px solid ${toast.ok ? "var(--success)" : "var(--indigo)"}`, padding: "12px 20px", display: "flex", alignItems: "center", gap: 10, animation: "rFade 200ms var(--ease-crisp)" }}><span style={{ color: toast.ok ? "var(--success)" : "var(--indigo)", fontFamily: "var(--font-mono)" }}>[OK]</span><span className="r-data" style={{ fontSize: 13, color: "var(--fg-1)" }}>{toast.msg}</span></div>}
    </PortalShell>
  );
}

Object.assign(window, { PortalScreen });
