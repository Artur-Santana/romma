/* Romma — Dashboard "Visão Geral" with two refined variations. */

function useOverviewMetrics() {
  return useMemo(() => {
    const u = D.unidades, c = D.contratos;
    const alugadas = u.filter((x) => x.status === "alugada").length;
    const ativos = c.filter((x) => x.status === "ativo");
    const mrr = ativos.reduce((s, x) => s + (u.find((y) => y.id === x.unidade_id)?.valor_mensal || 0), 0);
    const occ = Math.round((alugadas / u.length) * 100);
    const vencendo = ativos.filter((x) => {
      const diff = (new Date(x.data_fim) - new Date(D.TODAY)) / 86400000;
      return diff >= 0 && diff <= 7;
    });
    return { total: u.length, alugadas, disp: u.length - alugadas, ativos: ativos.length, mrr, occ, vencendo, ativosList: ativos };
  }, []);
}

function recentContracts(list, n) {
  return list.slice(0, n).map((c) => {
    const loc = D.locatarios.find((l) => l.id === c.locatario_id);
    const uni = D.unidades.find((u) => u.id === c.unidade_id);
    const edi = D.edificios.find((e) => e.id === uni?.edificio_id);
    const diff = (new Date(c.data_fim) - new Date(D.TODAY)) / 86400000;
    return { c, loc, uni, edi, expiring: diff >= 0 && diff <= 7 };
  });
}

/* Vertical cash-flow chart: recebido (solid) vs previsto (ghost) */
function CashFlowChart({ height = 132 }) {
  return (
    <div style={{ display: "flex", alignItems: "flex-end", gap: 10, height }}>
      {D.fluxo.map((f, i) => (
        <div key={f.mes} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 8, height: "100%", justifyContent: "flex-end" }}>
          <div style={{ position: "relative", width: "100%", flex: 1, display: "flex", alignItems: "flex-end", justifyContent: "center" }}>
            {/* previsto ghost */}
            <div style={{ position: "absolute", bottom: 0, width: "62%", height: `${f.previsto}%`, background: "var(--secondary)", opacity: 0.5 }} />
            {/* recebido solid */}
            <div style={{ position: "relative", width: "62%", height: `${f.recebido}%`, background: f.peak ? "var(--highlight)" : "var(--primary-hover)", boxShadow: f.peak ? "0 0 6px 0 var(--highlight)" : "none", transformOrigin: "bottom", animation: `rGrow var(--dur-base) var(--ease-crisp)`, animationDelay: `${i * 60}ms` }} />
          </div>
          <span className="r-meta" style={{ fontSize: 9 }}>{f.mes}</span>
        </div>
      ))}
    </div>
  );
}

/* Horizontal occupancy bar split into unit cells */
function OccupancyBar({ m }) {
  return (
    <div style={{ display: "flex", gap: 3 }}>
      {Array.from({ length: m.total }).map((_, i) => (
        <div key={i} style={{ flex: 1, height: 28, background: i < m.alugadas ? "var(--primary-hover)" : "var(--surface-hi)", border: i < m.alugadas ? "none" : "1px solid var(--border-3)" }} />
      ))}
    </div>
  );
}

function MetricCell({ index, label, value, sub, warn, divider }) {
  const fg = warn ? "var(--warning)" : undefined;
  return (
    <div style={{ position: "relative", padding: "var(--rd-cell)", display: "flex", flexDirection: "column", gap: 7, background: warn ? "var(--warning-bg)" : "transparent", borderRight: divider ? "1px solid var(--border-3)" : "none" }}>
      <span style={{ position: "absolute", top: 12, right: 12, fontFamily: "var(--font-mono)", fontSize: 9, color: "var(--fg-5)" }}>{index}</span>
      <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, letterSpacing: "1px", textTransform: "uppercase", color: fg || "var(--fg-4)" }}>{label}</span>
      <span className="r-metric" style={{ color: fg || "var(--fg-1)" }}>{value}</span>
      <span style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: fg || "var(--fg-4)" }}>{sub}</span>
    </div>
  );
}

function VencendoBanner({ m, go, mobile }) {
  if (!m.vencendo.length) return null;
  const c = m.vencendo[0];
  const loc = D.locatarios.find((l) => l.id === c.locatario_id);
  const uni = D.unidades.find((u) => u.id === c.unidade_id);
  const diff = Math.ceil((new Date(c.data_fim) - new Date(D.TODAY)) / 86400000);
  return (
    <div style={{ background: "var(--warning-bg)", borderLeft: "2px solid var(--warning)", padding: mobile ? "12px 14px" : "14px 20px", marginBottom: "var(--rd-block-sm)", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
      <div style={{ minWidth: 0 }}>
        <Eyebrow tone="warning" style={{ marginBottom: 3 }}>Atenção · Contratos a vencer</Eyebrow>
        <span style={{ fontSize: 13, color: "var(--warning)" }}>{loc?.nome_razao_social} · {uni?.nome} — vence em {diff} dia(s) ({D.fmtData(c.data_fim)}){m.vencendo.length > 1 ? ` +${m.vencendo.length - 1}` : ""}</span>
      </div>
      {!mobile && <button onClick={() => go("console/contratos")} className="r-ghostbtn" style={{ all: "unset", cursor: "pointer", fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--warning)", border: "1px solid var(--warning)", padding: "7px 14px", letterSpacing: "0.5px", flexShrink: 0 }}>Renovar →</button>}
    </div>
  );
}

const QUICK = [
  { code: "U+", label: "Nova Unidade", route: "console/unidades" },
  { code: "L+", label: "Novo Locatário", route: "console/locatarios" },
  { code: "C+", label: "Novo Contrato", route: "console/contratos" },
  { code: "GRID.OS", label: "Página Pública", route: "public/unidades" },
];

function QuickActions({ go, mobile }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: mobile ? "1fr 1fr" : "repeat(4, 1fr)", border: "1px solid var(--border-3)" }}>
      {QUICK.map((a, i) => (
        <button key={a.code} onClick={() => go(a.route)} className="r-cell" style={{
          all: "unset", boxSizing: "border-box", display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: mobile ? "16px 16px" : "18px 22px",
          borderRight: mobile ? (i % 2 === 0 ? "1px solid var(--border-3)" : "none") : (i < 3 ? "1px solid var(--border-3)" : "none"),
          borderTop: mobile && i >= 2 ? "1px solid var(--border-3)" : "none",
        }}>
          <span style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0 }}>
            <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--indigo)", letterSpacing: "1px", flexShrink: 0 }}>{a.code}</span>
            <span style={{ fontFamily: "var(--font-body)", fontWeight: 600, fontSize: mobile ? 12 : 13.5, color: "var(--fg-2)", letterSpacing: "0.5px", textTransform: "uppercase", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{a.label}</span>
          </span>
          <span style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--fg-4)" }}>→</span>
        </button>
      ))}
    </div>
  );
}

/* Contratos recentes table (desktop) / cards (mobile) */
function ContratosPanel({ go, mobile, rows }) {
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 14 }}>
        <div><Eyebrow tone="indigo" style={{ marginBottom: 5 }}>SISTEMA.01</Eyebrow><h2 className="r-section">Contratos Recentes</h2></div>
        <button onClick={() => go("console/contratos")} className="r-ghostbtn" style={{ all: "unset", cursor: "pointer", fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--indigo)", letterSpacing: "0.5px" }}>Ver todos →</button>
      </div>
      <div className="r-panel">
        {!mobile && (
          <div style={{ display: "grid", gridTemplateColumns: "2.4fr 1fr 1fr 1.2fr", padding: "11px var(--rd-row-x)", background: "var(--surface-hi)" }}>
            {["Locatário · Unidade", "Valor mensal", "Término", "Status"].map((c) => <span key={c} className="r-label" style={{ fontSize: 10 }}>{c}</span>)}
          </div>
        )}
        {rows.map(({ c, loc, uni, edi, expiring }, i) => mobile ? (
          <div key={c.id} onClick={() => go("console/contrato")} className="r-rowlink" style={{ padding: "12px var(--rd-row-x)", display: "flex", flexDirection: "column", gap: 6, borderTop: i > 0 ? "1px solid var(--border-3)" : "none" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
              <span className="r-subhead" style={{ fontSize: 14 }}>{loc?.nome_razao_social}</span>
              <span className="r-data">{D.fmtBRL(uni?.valor_mensal)}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span className="r-meta">{uni?.nome} · {D.fmtData(c.data_fim)}</span>
              <Badge status={expiring ? "vencendo" : c.status} />
            </div>
          </div>
        ) : (
          <div key={c.id} onClick={() => go("console/contrato")} className="r-rowlink" style={{ display: "grid", gridTemplateColumns: "2.4fr 1fr 1fr 1.2fr", padding: "var(--rd-row-y) var(--rd-row-x)", borderTop: "1px solid var(--border-3)", alignItems: "center" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0 }}>
              <Avatar name={loc?.nome_razao_social} />
              <div style={{ minWidth: 0 }}><div className="r-subhead" style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{loc?.nome_razao_social}</div><div className="r-meta" style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{uni?.nome} · {edi?.nome.replace("Edifício ", "").replace("Centro Empresarial ", "CE ")}</div></div>
            </div>
            <span className="r-data">{D.fmtBRL(uni?.valor_mensal)}</span>
            <span className="r-data" style={{ color: expiring ? "var(--warning)" : "var(--fg-3)" }}>{D.fmtData(c.data_fim)}</span>
            <Badge status={expiring ? "vencendo" : c.status} />
          </div>
        ))}
      </div>
    </div>
  );
}

function ParcelasPanel({ mobile }) {
  const rows = D.parcelasDetalhe.filter((p) => p.status !== "futura").slice(0, 5);
  const data = [
    { loc: "Nexus Tecnologia LTDA", uni: "Conjunto 1204", edi: "Ed. Paulista", valor: 12400, info: "6d restantes", warn: false },
    { loc: "Vértice Consultoria", uni: "Sala 802", edi: "Torre Faria Lima", valor: 8900, info: "2d atraso", warn: true },
    { loc: "Atlas Comércio S.A.", uni: "Loja 04", edi: "CE Berrini", valor: 21000, info: "11d restantes", warn: false },
    { loc: "Meridian Studio", uni: "Sala 305", edi: "Ed. Paulista", valor: 6200, info: "19d restantes", warn: false },
  ];
  return (
    <div>
      <div style={{ marginBottom: 14 }}><Eyebrow tone="indigo" style={{ marginBottom: 5 }}>SISTEMA.02</Eyebrow><h2 className="r-section">Parcelas</h2></div>
      <div className="r-panel">
        {data.map((p, i) => (
          <div key={i} style={{ padding: "var(--rd-row-y) var(--rd-row-x)", display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: i > 0 ? "1px solid var(--border-3)" : "none" }}>
            <div style={{ minWidth: 0 }}><div className="r-subhead" style={{ fontSize: 14, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.loc}</div><div className="r-meta" style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.uni} · {p.edi}</div></div>
            <div style={{ textAlign: "right" }}><div className="r-data">{D.fmtBRL(p.valor)}</div><div className="r-meta" style={{ color: p.warn ? "var(--warning)" : "var(--fg-4)" }}>{p.info}</div></div>
          </div>
        ))}
      </div>
    </div>
  );
}

function OverviewScreen({ go, mobile, variant }) {
  const m = useOverviewMetrics();
  const metrics = [
    { index: "01", label: "Ocupação", value: `${m.occ}%`, sub: `${m.alugadas} de ${m.total} unidades` },
    { index: "02", label: "MRR", value: D.fmtBRLk(m.mrr), sub: `${m.ativos} contrato(s) ativo(s)` },
    { index: "03", label: "Receita Esperada", value: "R$12,4k", sub: "1 parcela em aberto" },
    { index: "04", label: "Vencendo em 7 dias", value: String(m.vencendo.length), sub: `${m.vencendo.length} contrato(s)`, warn: true },
  ];
  const pad = mobile ? "var(--rd-page-y) var(--rd-gutter-m) 80px" : "var(--rd-page-y) var(--rd-gutter) 64px";

  /* ── MOBILE ─────────────────────────────────────────────────────────── */
  if (mobile) {
    return (
      <div className="r-fade" style={{ padding: pad }}>
        <PageHeader eyebrow="CONSOLE.OS // PROPRIETÁRIO" title="Visão Geral." subtitle={`${D.operador.nome} · ${D.edificios.length} edifícios`} mobile />
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", border: "1px solid var(--border-3)", marginBottom: "var(--rd-block-sm)" }}>
          {metrics.map((mm, i) => (
            <div key={mm.index} style={{ borderRight: i % 2 === 0 ? "1px solid var(--border-3)" : "none", borderTop: i >= 2 ? "1px solid var(--border-3)" : "none" }}>
              <MetricCell {...mm} />
            </div>
          ))}
        </div>
        <VencendoBanner m={m} go={go} mobile />
        <div style={{ marginBottom: "var(--rd-block)" }}>
          <Eyebrow tone="indigo" style={{ marginBottom: 10 }}>FLUXO · PREVISÃO 2026</Eyebrow>
          <div className="r-panel" style={{ padding: "16px 14px" }}><CashFlowChart height={108} /></div>
        </div>
        <div style={{ marginBottom: "var(--rd-block)" }}><ContratosPanel go={go} mobile rows={recentContracts(m.ativosList, 3)} /></div>
        <Eyebrow tone="indigo" style={{ marginBottom: 10 }}>Ações Rápidas</Eyebrow>
        <QuickActions go={go} mobile />
      </div>
    );
  }

  /* ── DESKTOP variant B: editorial / data-forward ────────────────────── */
  if (variant === "B") {
    return (
      <div className="r-fade" style={{ padding: pad }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: "var(--rd-block)" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <Eyebrow tone="indigo">CONSOLE.OS // VISÃO DO PROPRIETÁRIO</Eyebrow>
            <h1 className="r-title">Visão Geral.</h1>
            <div style={{ display: "flex", alignItems: "center", gap: 14, marginTop: 2 }}>
              <span className="r-meta" style={{ fontSize: 11 }}>OPERADOR · {D.operador.nome}</span>
              <span style={{ width: 1, height: 11, background: "var(--border-2)" }} />
              <span className="r-meta" style={{ fontSize: 11 }}>{m.total} UNIDADES · {m.ativos} CONTRATOS</span>
            </div>
          </div>
          <RDot label="REALTIME · GRID.OS.ALPHA" />
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1.55fr 1fr", gap: "var(--rd-block-sm)", marginBottom: "var(--rd-block)" }}>
          {/* Hero: occupancy + cashflow */}
          <div className="r-panel" style={{ padding: "var(--rd-panel)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 18 }}>
              <div><Eyebrow tone="indigo" style={{ marginBottom: 8 }}>Taxa de Ocupação</Eyebrow><div style={{ display: "flex", alignItems: "baseline", gap: 12 }}><span className="r-metric" style={{ fontSize: 56 }}>{m.occ}%</span><span className="r-data" style={{ color: "var(--fg-4)" }}>{m.alugadas}/{m.total} unidades</span></div></div>
              <div style={{ textAlign: "right" }}><Eyebrow style={{ marginBottom: 8 }}>Disponíveis</Eyebrow><span className="r-metric" style={{ fontSize: 34, color: "var(--success)" }}>{m.disp}</span></div>
            </div>
            <OccupancyBar m={m} />
            <div style={{ height: 1, background: "var(--border-3)", margin: "20px 0 18px" }} />
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
              <Eyebrow tone="gold">Previsão de Fluxo · 2026</Eyebrow>
              <span className="r-meta" style={{ color: "var(--highlight)" }}>+12,4% vs. trimestre ant.</span>
            </div>
            <CashFlowChart height={130} />
          </div>
          {/* Stacked metrics */}
          <div style={{ display: "flex", flexDirection: "column", gap: "var(--rd-block-sm)" }}>
            <div style={{ border: "1px solid var(--border-3)", display: "grid", gridTemplateRows: "1fr 1fr" }}>
              <div style={{ borderBottom: "1px solid var(--border-3)" }}><MetricCell index="02" label="MRR" value={D.fmtBRLk(m.mrr)} sub={`${m.ativos} contrato(s) ativo(s)`} /></div>
              <MetricCell index="03" label="Receita Esperada" value="R$12,4k" sub="1 parcela em aberto" />
            </div>
            <div style={{ border: "1px solid var(--border-3)" }}><MetricCell index="04" label="Vencendo em 7 dias" value={String(m.vencendo.length)} sub={`${m.vencendo.length} contrato(s)`} warn /></div>
          </div>
        </div>
        <VencendoBanner m={m} go={go} />
        <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "var(--rd-block-sm)", marginBottom: "var(--rd-block)" }}>
          <ContratosPanel go={go} rows={recentContracts(m.ativosList, 4)} />
          <ParcelasPanel />
        </div>
        <QuickActions go={go} />
      </div>
    );
  }

  /* ── DESKTOP variant A: refined classic grid ────────────────────────── */
  return (
    <div className="r-fade" style={{ padding: pad }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: "var(--rd-block)" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <Eyebrow tone="indigo">CONSOLE.OS // VISÃO DO PROPRIETÁRIO</Eyebrow>
          <h1 className="r-title">Visão Geral.</h1>
          <div style={{ display: "flex", alignItems: "center", gap: 14, marginTop: 2 }}>
            <span className="r-meta" style={{ fontSize: 11 }}>OPERADOR · {D.operador.nome}</span>
            <span style={{ width: 1, height: 11, background: "var(--border-2)" }} />
            <span className="r-meta" style={{ fontSize: 11 }}>{m.total} UNIDADES · {m.ativos} CONTRATOS</span>
          </div>
        </div>
        <RDot label="REALTIME · GRID.OS.ALPHA" />
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", border: "1px solid var(--border-3)", marginBottom: "var(--rd-block)" }}>
        {metrics.map((mm, i) => <MetricCell key={mm.index} {...mm} divider={i < 3} />)}
      </div>
      <VencendoBanner m={m} go={go} />
      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "var(--rd-block-sm)", marginBottom: "var(--rd-block)" }}>
        <ContratosPanel go={go} rows={recentContracts(m.ativosList, 4)} />
        <ParcelasPanel />
      </div>
      <QuickActions go={go} />
    </div>
  );
}

Object.assign(window, { OverviewScreen });
