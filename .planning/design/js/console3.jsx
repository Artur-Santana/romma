/* Romma — Contratos (+ Parcelas detail) & Locatários management. */

function Modal({ onClose, width = 480, children }) {
  return (
    <div onClick={(e) => { if (e.target === e.currentTarget) onClose(); }} style={{ position: "fixed", inset: 0, zIndex: 60, background: "oklch(0 0 0 / 0.72)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20, animation: "rFade 200ms var(--ease-crisp) both" }}>
      <div style={{ background: "var(--surface)", border: "1px solid var(--border-2)", width: "100%", maxWidth: width, maxHeight: "90%", overflowY: "auto" }} className="r-scroll">{children}</div>
    </div>
  );
}

function ConfirmModal({ data, onClose }) {
  if (!data) return null;
  return (
    <Modal onClose={onClose} width={440}>
      <div style={{ padding: 28, display: "flex", flexDirection: "column", gap: 14 }}>
        <Eyebrow tone={data.danger ? "warning" : "indigo"}>{data.danger ? "Ação destrutiva" : "Confirmação"}</Eyebrow>
        <h3 className="r-section">{data.title}</h3>
        <p className="r-body">{data.body}</p>
        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 6 }}>
          <Btn variant="outline" onClick={onClose} style={{ padding: "9px 16px" }}>Cancelar</Btn>
          <Btn variant={data.danger ? "danger" : "primary"} onClick={() => { data.onConfirm(); onClose(); }} style={{ padding: "9px 16px" }}>{data.confirmLabel}</Btn>
        </div>
      </div>
    </Modal>
  );
}

/* ── CONTRATOS ─────────────────────────────────────────────────────────── */
function ContratosScreen({ go, mobile, variant }) {
  const [list, setList] = useState(D.contratos);
  const [showForm, setShowForm] = useState(false);
  const [confirm, setConfirm] = useState(null);
  const [removing, setRemoving] = useState(new Set());
  const blank = { locatario_id: "", unidade_id: "", data_inicio: "", data_fim: "", observacoes: "" };
  const [form, setForm] = useState(blank);
  const [q, setQ] = useState("");
  const [onlyVencendo, setOnlyVencendo] = useState(false);
  const [showArquivo, setShowArquivo] = useState(false);
  const daysLeft = (c) => Math.ceil((new Date(c.data_fim) - new Date(D.TODAY)) / 86400000);

  const ativos = list.filter((c) => c.status === "ativo");
  const arquivo = list.filter((c) => c.status !== "ativo");
  const encerrados = arquivo.length;
  const dispUnits = D.unidades.filter((u) => u.status === "disponivel");
  const selUnit = D.unidades.find((u) => u.id === form.unidade_id);

  function isExpiring(c) { const diff = (new Date(c.data_fim) - new Date(D.TODAY)) / 86400000; return c.status === "ativo" && diff >= 0 && diff <= 7; }
  function create(e) { e.preventDefault(); setList((l) => [{ ...form, id: "n" + Date.now(), status: "ativo" }, ...l]); setForm(blank); setShowForm(false); }
  function remove(id) { setRemoving((s) => new Set([...s, id])); setTimeout(() => { setList((l) => l.map((c) => (c.id === id ? { ...c, status: "encerrado" } : c))); setRemoving((s) => { const n = new Set(s); n.delete(id); return n; }); }, 240); }

  const pad = mobile ? "var(--rd-page-y) var(--rd-gutter-m) 80px" : "var(--rd-page-y) var(--rd-gutter) 64px";
  const COL = "108px 1.6fr 1.5fr 0.9fr 1fr 1.1fr 92px";
  const isB = variant === "B" && !mobile;
  const pctElapsed = (c) => { const a = new Date(c.data_inicio), b = new Date(c.data_fim), n = new Date(D.TODAY); return Math.max(4, Math.min(100, Math.round(((n - a) / (b - a)) * 100))); };
  const nameOf = (c) => (D.locatarios.find((l) => l.id === c.locatario_id)?.nome_razao_social || "") + " " + (D.unidades.find((u) => u.id === c.unidade_id)?.nome || "");
  const vencendoCount = ativos.filter(isExpiring).length;
  const view = ativos.filter((c) => {
    if (onlyVencendo && !isExpiring(c)) return false;
    if (q && !nameOf(c).toLowerCase().includes(q.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="r-fade" style={{ padding: pad }}>
      <ConfirmModal data={confirm} onClose={() => setConfirm(null)} />
      <PageHeader eyebrow="SISTEMA.02 // VÍNCULOS" title="Contratos." subtitle={`${ativos.length} ativos · ${encerrados} encerrados`} mobile={mobile}
        cta={{ label: showForm ? "Fechar" : "Novo Contrato", code: showForm ? "×" : "C+", onClick: () => setShowForm((v) => !v) }} />

      {showForm && (
        <div style={{ border: "1px solid var(--indigo)", padding: mobile ? 18 : 24, marginBottom: "var(--rd-block)", background: "var(--surface)" }}>
          <Eyebrow tone="indigo" style={{ marginBottom: 16 }}>Novo Contrato</Eyebrow>
          <form onSubmit={create}>
            <div style={{ display: "grid", gridTemplateColumns: mobile ? "1fr" : "1fr 1fr", gap: 14, marginBottom: 14 }}>
              <FormField label="Locatário"><FSelect value={form.locatario_id} onChange={(e) => setForm({ ...form, locatario_id: e.target.value })}><option value="">Selecionar...</option>{D.locatarios.map((l) => <option key={l.id} value={l.id}>{l.nome_razao_social}</option>)}</FSelect></FormField>
              <FormField label="Unidade (disponíveis)"><FSelect value={form.unidade_id} onChange={(e) => setForm({ ...form, unidade_id: e.target.value })}><option value="">Selecionar...</option>{dispUnits.map((u) => <option key={u.id} value={u.id}>{u.nome}</option>)}</FSelect></FormField>
              <FormField label="Data de início"><FInput type="date" value={form.data_inicio} onChange={(e) => setForm({ ...form, data_inicio: e.target.value })} /></FormField>
              <FormField label="Data de término"><FInput type="date" value={form.data_fim} onChange={(e) => setForm({ ...form, data_fim: e.target.value })} /></FormField>
            </div>
            {selUnit && <div style={{ display: "flex", alignItems: "center", gap: 14, padding: "10px 14px", marginBottom: 14, border: "1px solid var(--border-3)", background: "var(--surface-hi)" }}><FLabel>Valor mensal</FLabel><span className="r-data" style={{ fontSize: 16, color: "var(--fg-1)", fontWeight: 700 }}>{D.fmtBRL(selUnit.valor_mensal)}</span></div>}
            <div style={{ display: "flex", gap: 8 }}><Btn type="submit" code="✓">Criar Contrato</Btn><Btn variant="outline" onClick={() => setShowForm(false)}>Cancelar</Btn></div>
          </form>
        </div>
      )}

      {/* search + vencendo filter */}
      <div style={{ display: "flex", gap: 8, marginBottom: "var(--rd-block-sm)", flexWrap: "wrap", alignItems: "center" }}>
        <div style={{ position: "relative", flex: mobile ? "1 1 100%" : "0 0 260px" }}>
          <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--fg-5)" }}>⌕</span>
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar por locatário ou unidade..." style={{ all: "unset", boxSizing: "border-box", width: "100%", padding: "9px 12px 9px 30px", fontSize: 13, fontFamily: "var(--font-body)", color: "var(--fg-1)", background: "var(--surface-hi)", border: "1px solid var(--border-3)" }} />
        </div>
        <button onClick={() => setOnlyVencendo((v) => !v)} style={{ all: "unset", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 7, padding: "9px 14px", fontFamily: "var(--font-mono)", fontSize: 10, letterSpacing: "0.5px", textTransform: "uppercase", border: `1px solid ${onlyVencendo ? "var(--warning)" : "var(--border-3)"}`, background: onlyVencendo ? "var(--warning-bg)" : "transparent", color: onlyVencendo ? "var(--warning)" : "var(--fg-4)" }}><span style={{ width: 6, height: 6, background: "var(--warning)" }} />Vencendo · {vencendoCount}</button>
        {(q || onlyVencendo) && <span className="r-meta">{view.length} resultado(s)</span>}
      </div>

      {isB && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(330px, 1fr))", gap: 12 }}>
          {view.length === 0 && <div style={{ padding: "40px 24px", textAlign: "center", gridColumn: "1 / -1" }}><span className="r-meta">Nenhum contrato corresponde aos filtros.</span></div>}
          {view.map((c, i) => {
            const loc = D.locatarios.find((l) => l.id === c.locatario_id);
            const uni = D.unidades.find((u) => u.id === c.unidade_id);
            const edi = D.edificios.find((e) => e.id === uni?.edificio_id);
            const exp = isExpiring(c);
            const isRem = removing.has(c.id);
            const pct = pctElapsed(c);
            const ask = () => setConfirm({ title: "Cancelar contrato?", body: `Isso encerrará o contrato de ${loc?.nome_razao_social} na unidade ${uni?.nome} e marcará a unidade como disponível.`, danger: true, confirmLabel: "Cancelar Contrato", onConfirm: () => remove(c.id) });
            return (
              <div key={c.id} style={{ border: `1px solid ${exp ? "var(--warning)" : "var(--border-3)"}`, background: "var(--surface)", padding: "var(--rd-panel)", display: "flex", flexDirection: "column", gap: 14, opacity: isRem ? 0 : 1, transform: isRem ? "scale(0.98)" : "scale(1)", transition: "opacity 220ms ease, transform 220ms ease" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10 }}>
                  <div style={{ minWidth: 0 }}>
                    <span className="r-meta" style={{ color: "var(--fg-5)" }}>REF_C_{String(i + 1).padStart(3, "0")}</span>
                    <div className="r-subhead" style={{ marginTop: 4, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{loc?.nome_razao_social}</div>
                    <div className="r-meta" style={{ marginTop: 2 }}>{uni?.nome} · {edi?.nome.replace("Edifício ", "").replace("Centro Empresarial ", "CE ")}</div>
                  </div>
                  <Badge status={exp ? "vencendo" : c.status} />
                </div>
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                    <span className="r-meta">{D.fmtData(c.data_inicio)}</span>
                    <span className="r-meta" style={{ color: exp ? "var(--warning)" : "var(--fg-4)" }}>{daysLeft(c)} dias → {D.fmtData(c.data_fim)}</span>
                  </div>
                  <div style={{ height: 4, background: "var(--surface-hi)" }}><div style={{ height: "100%", width: `${pct}%`, background: exp ? "var(--warning)" : "var(--primary-hover)" }} /></div>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid var(--border-3)", paddingTop: 12 }}>
                  <span className="r-data" style={{ fontSize: 16, color: "var(--fg-1)", fontWeight: 700 }}>{D.fmtBRL(uni?.valor_mensal)}<span className="r-meta">/mês</span></span>
                  <div style={{ display: "flex", gap: 12 }}>
                    <button onClick={() => go("console/contrato")} className="r-ghostbtn" style={{ all: "unset", cursor: "pointer", fontFamily: "var(--font-mono)", fontSize: 10, fontWeight: 700, color: "var(--fg-3)", letterSpacing: "1px", textTransform: "uppercase" }}>Ver →</button>
                    <button onClick={ask} className="r-ghostbtn" style={{ all: "unset", cursor: "pointer", fontFamily: "var(--font-mono)", fontSize: 10, fontWeight: 700, color: "var(--danger-fg)", letterSpacing: "1px", textTransform: "uppercase" }}>Cancelar</button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {!isB && (
      <div style={{ overflowX: "auto" }} className="r-scroll">
        <div className="r-panel" style={{ minWidth: mobile ? "auto" : 720 }}>
          {!mobile && (
            <div style={{ display: "grid", gridTemplateColumns: COL, background: "var(--surface-hi)", borderBottom: "1px solid var(--border-3)" }}>
              {["ID", "Locatário", "Unidade", "Início", "Término", "Status", "Ações"].map((h) => <span key={h} className="r-label" style={{ padding: "11px var(--rd-row-x)", fontSize: 10 }}>{h}</span>)}
            </div>
          )}
          {view.length === 0 && <div style={{ padding: "40px 24px", textAlign: "center" }}><span className="r-meta">Nenhum contrato corresponde aos filtros.</span></div>}
          {view.map((c, i) => {
            const loc = D.locatarios.find((l) => l.id === c.locatario_id);
            const uni = D.unidades.find((u) => u.id === c.unidade_id);
            const edi = D.edificios.find((e) => e.id === uni?.edificio_id);
            const exp = isExpiring(c);
            const isRem = removing.has(c.id);
            const ask = () => setConfirm({ title: "Cancelar contrato?", body: `Isso encerrará o contrato de ${loc?.nome_razao_social} na unidade ${uni?.nome} e marcará a unidade como disponível.`, danger: true, confirmLabel: "Cancelar Contrato", onConfirm: () => remove(c.id) });
            if (mobile) {
              return (
                <div key={c.id} onClick={() => go("console/contrato")} className="r-rowlink" style={{ padding: "12px var(--rd-row-x)", borderTop: i > 0 ? "1px solid var(--border-3)" : "none", display: "flex", flexDirection: "column", gap: 6, opacity: isRem ? 0 : 1, transition: "opacity 220ms ease" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}><span className="r-subhead" style={{ fontSize: 14 }}>{loc?.nome_razao_social}</span><Badge status={exp ? "vencendo" : c.status} /></div>
                  <div style={{ display: "flex", justifyContent: "space-between" }}><span className="r-meta">{uni?.nome} · {D.fmtData(c.data_inicio)}→{D.fmtData(c.data_fim)}</span></div>
                </div>
              );
            }
            return (
              <div key={c.id} style={{ display: "grid", gridTemplateColumns: COL, alignItems: "center", borderTop: i > 0 ? "1px solid var(--border-3)" : "none", opacity: isRem ? 0 : 1, transform: isRem ? "scale(0.98)" : "scale(1)", transition: "opacity 220ms ease, transform 220ms ease" }}>
                <span className="r-data" style={{ padding: "var(--rd-row-y) var(--rd-row-x)", color: "var(--fg-4)", fontSize: 12 }}>REF_C_{String(i + 1).padStart(3, "0")}</span>
                <span className="r-subhead" style={{ padding: "var(--rd-row-y) var(--rd-row-x)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{loc?.nome_razao_social}</span>
                <div style={{ padding: "var(--rd-row-y) var(--rd-row-x)", minWidth: 0 }}><div className="r-data" style={{ color: "var(--fg-1)" }}>{uni?.nome}</div><div className="r-meta">{edi?.nome.replace("Edifício ", "").replace("Centro Empresarial ", "CE ")}</div></div>
                <span className="r-data" style={{ padding: "var(--rd-row-y) var(--rd-row-x)", color: "var(--fg-3)", fontSize: 13 }}>{D.fmtData(c.data_inicio)}</span>
                <span className="r-data" style={{ padding: "var(--rd-row-y) var(--rd-row-x)", color: exp ? "var(--warning)" : "var(--fg-3)", fontSize: 13 }}>{D.fmtData(c.data_fim)}<span className="r-meta" style={{ display: "block", color: exp ? "var(--warning)" : "var(--fg-5)" }}>{daysLeft(c)} dias</span></span>
                <span style={{ padding: "var(--rd-row-y) var(--rd-row-x)" }}><Badge status={exp ? "vencendo" : c.status} /></span>
                <div style={{ padding: "var(--rd-row-y) 10px", display: "flex", flexDirection: "column", gap: 6, alignItems: "flex-start" }}>
                  <button onClick={() => go("console/contrato")} className="r-ghostbtn" style={{ all: "unset", cursor: "pointer", fontFamily: "var(--font-mono)", fontSize: 10, fontWeight: 700, color: "var(--fg-3)", letterSpacing: "1px", textTransform: "uppercase" }}>Ver →</button>
                  <button onClick={ask} className="r-ghostbtn" style={{ all: "unset", cursor: "pointer", fontFamily: "var(--font-mono)", fontSize: 10, fontWeight: 700, color: "var(--danger-fg)", letterSpacing: "1px", textTransform: "uppercase" }}>Cancelar</button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
      )}

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 20px", border: "1px solid var(--border-3)", marginTop: "var(--rd-block-sm)" }}>
        <span className="r-meta" style={{ fontSize: 11 }}>Contratos encerrados são preservados como histórico imutável.</span>
        <button onClick={() => setShowArquivo((v) => !v)} className="r-ghostbtn" style={{ all: "unset", cursor: "pointer", fontFamily: "var(--font-mono)", fontSize: 11, fontWeight: 700, letterSpacing: "1px", textTransform: "uppercase", color: showArquivo ? "var(--indigo)" : "var(--fg-3)" }}>{showArquivo ? "⌃ Ocultar Arquivo" : `Ver Arquivo (${encerrados}) →`}</button>
      </div>

      {showArquivo && (
        <div style={{ marginTop: "var(--rd-block-sm)" }}>
          <Eyebrow style={{ marginBottom: 12 }}>Arquivo · Contratos Encerrados</Eyebrow>
          {arquivo.length === 0 ? (
            <div style={{ padding: "32px 24px", textAlign: "center", border: "1px solid var(--border-3)" }}><span className="r-meta">Nenhum contrato encerrado ainda.</span></div>
          ) : (
            <div className="r-panel">
              {arquivo.map((c, i) => {
                const loc = D.locatarios.find((l) => l.id === c.locatario_id);
                const uni = D.unidades.find((u) => u.id === c.unidade_id);
                const edi = D.edificios.find((e) => e.id === uni?.edificio_id);
                return (
                  <div key={c.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, padding: "var(--rd-row-y) var(--rd-row-x)", borderTop: i > 0 ? "1px solid var(--border-3)" : "none", opacity: 0.78 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0 }}>
                      <span className="r-data" style={{ color: "var(--fg-5)", fontSize: 11, flexShrink: 0 }}>ARQ_{String(i + 1).padStart(3, "0")}</span>
                      <div style={{ minWidth: 0 }}>
                        <div className="r-subhead" style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{loc?.nome_razao_social}</div>
                        <div className="r-meta">{uni?.nome} · {edi?.nome.replace("Edifício ", "").replace("Centro Empresarial ", "CE ")} · {D.fmtData(c.data_inicio)}→{D.fmtData(c.data_fim)}</div>
                      </div>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 14, flexShrink: 0 }}>
                      <Badge status="encerrado" />
                      {!mobile && <button onClick={() => go("console/contrato")} className="r-ghostbtn" style={{ all: "unset", cursor: "pointer", fontFamily: "var(--font-mono)", fontSize: 10, fontWeight: 700, color: "var(--fg-4)", letterSpacing: "1px", textTransform: "uppercase" }}>Ver →</button>}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ── CONTRATO DETAIL (Parcelas) ────────────────────────────────────────── */
function ContratoDetailScreen({ go, mobile, variant }) {
  const isB = variant === "B" && !mobile;
  const c = D.contratos[0];
  const loc = D.locatarios.find((l) => l.id === c.locatario_id);
  const uni = D.unidades.find((u) => u.id === c.unidade_id);
  const edi = D.edificios.find((e) => e.id === uni?.edificio_id);
  const [parc, setParc] = useState(D.parcelasDetalhe);
  const [toast, setToast] = useState(null);
  const [termFim, setTermFim] = useState(c.data_fim);
  const [extraUnits, setExtraUnits] = useState([]); // expansão
  const [renew, setRenew] = useState(null); // 'renovar' | 'expandir'
  const pagas = parc.filter((p) => p.status === "paga").length;
  const valor = (uni?.valor_mensal || 0) + extraUnits.reduce((s, u) => s + (u.valor_mensal || 0), 0);
  const totalContrato = parc.length * valor;
  const totalPago = pagas * valor;
  const emAberto = parc.filter((p) => p.status === "pendente" || p.status === "vencida").length * valor;
  const vencidas = parc.filter((p) => p.status === "vencida").length;
  function registrar(id) { setParc((ps) => ps.map((p) => (p.id === id ? { ...p, status: "paga", data_pagamento: D.TODAY } : p))); setToast("Pagamento registrado · " + D.fmtData(D.TODAY)); setTimeout(() => setToast(null), 2600); }
  function showToast(m) { setToast(m); setTimeout(() => setToast(null), 2800); }
  function doRenovar(months) { const d = new Date(termFim); d.setMonth(d.getMonth() + months); const iso = d.toISOString().slice(0, 10); setTermFim(iso); setRenew(null); showToast(`Contrato renovado até ${D.fmtData(iso)}`); }
  function doExpandir(u) { setExtraUnits((a) => [...a, u]); setRenew(null); showToast(`Unidade ${u.nome} adicionada ao contrato`); }
  const pad = mobile ? "var(--rd-page-y) var(--rd-gutter-m) 80px" : "var(--rd-page-y) var(--rd-gutter) 64px";
  const unidadesLabel = extraUnits.length ? `${uni?.nome} +${extraUnits.length}` : uni?.nome;

  const summary = [
    { label: "Unidade", value: unidadesLabel }, { label: "Edifício", value: edi?.nome },
    { label: "Valor mensal", value: D.fmtBRL(valor) }, { label: "Início", value: D.fmtData(c.data_inicio) },
    { label: "Término", value: D.fmtData(termFim) },
  ];

  return (
    <div className="r-fade" style={{ padding: pad, position: "relative" }}>
      <button onClick={() => go("console/contratos")} className="r-ghostbtn" style={{ all: "unset", cursor: "pointer", fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--fg-4)", letterSpacing: "0.5px", marginBottom: 16, display: "inline-block" }}>← Contratos</button>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: "var(--rd-block)", gap: 16, flexWrap: "wrap" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <Eyebrow tone="indigo">CONTRATO · REF_C_001</Eyebrow>
          <h1 className="r-title" style={{ fontSize: mobile ? "var(--rt-title-sm)" : "var(--rt-title)" }}>{loc?.nome_razao_social}</h1>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <Badge status="ativo" />
          <button onClick={() => setRenew("renovar")} className="r-ghostbtn" style={{ all: "unset", cursor: "pointer", fontFamily: "var(--font-body)", fontWeight: 700, fontSize: 11, letterSpacing: "1px", textTransform: "uppercase", color: "var(--fg-2)", border: "1px solid var(--border-3)", padding: "9px 14px" }}>Renovar</button>
          <button onClick={() => setRenew("expandir")} className="r-ghostbtn" style={{ all: "unset", cursor: "pointer", fontFamily: "var(--font-body)", fontWeight: 700, fontSize: 11, letterSpacing: "1px", textTransform: "uppercase", color: "var(--fg-1)", background: "var(--primary)", padding: "9px 14px" }}>Expandir</button>
        </div>
      </div>

      {/* Summary grid */}
      <div style={{ display: "grid", gridTemplateColumns: mobile ? "1fr 1fr" : "repeat(5, 1fr)", border: "1px solid var(--border-3)", marginBottom: "var(--rd-block)" }}>
        {summary.map((s, i) => (
          <div key={s.label} style={{ padding: "var(--rd-cell)", borderTop: mobile && i >= 2 ? "1px solid var(--border-3)" : "none", borderRight: mobile ? (i % 2 === 0 ? "1px solid var(--border-3)" : "none") : (i < 4 ? "1px solid var(--border-3)" : "none") }}>
            <div className="r-label" style={{ fontSize: 10, marginBottom: 8 }}>{s.label}</div>
            <div className="r-subhead" style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 18, letterSpacing: "-0.4px" }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Financial summary */}
      <div style={{ display: "grid", gridTemplateColumns: mobile ? "1fr 1fr" : "repeat(4, 1fr)", border: "1px solid var(--border-3)", marginBottom: "var(--rd-block-sm)" }}>
        {[
          { l: "Valor do contrato", v: D.fmtBRLk(totalContrato), s: parc.length + " parcelas" },
          { l: "Total recebido", v: D.fmtBRLk(totalPago), s: pagas + " pagas", ok: true },
          { l: "Em aberto", v: D.fmtBRLk(emAberto), s: (parc.length - pagas) + " parcelas", gold: true },
          { l: "Inadimplência", v: vencidas > 0 ? D.fmtBRLk(vencidas * valor) : "R$0", s: vencidas + " vencida(s)", danger: vencidas > 0 },
        ].map((m, i) => (
          <div key={m.l} style={{ padding: "14px var(--rd-cell)", background: m.danger ? "var(--danger-bg2)" : "transparent", borderRight: mobile ? (i % 2 === 0 ? "1px solid var(--border-3)" : "none") : (i < 3 ? "1px solid var(--border-3)" : "none"), borderTop: mobile && i >= 2 ? "1px solid var(--border-3)" : "none" }}>
            <div className="r-label" style={{ fontSize: 9.5, marginBottom: 7, color: m.danger ? "var(--danger-fg)" : m.gold ? "var(--highlight)" : m.ok ? "var(--success)" : "var(--fg-4)" }}>{m.l}</div>
            <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 24, letterSpacing: "-1px", color: m.danger ? "var(--danger-fg)" : m.gold ? "var(--highlight)" : m.ok ? "var(--success)" : "var(--fg-1)" }}>{m.v}</div>
            <div className="r-meta" style={{ marginTop: 4 }}>{m.s}</div>
          </div>
        ))}
      </div>

      {/* Progress */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
        <div><Eyebrow tone="indigo" style={{ marginBottom: 5 }}>SISTEMA.PARCELAS</Eyebrow><h2 className="r-section">Cronograma de Parcelas</h2></div>
        <span className="r-meta">{pagas}/{parc.length} pagas</span>
      </div>
      <div style={{ display: "flex", gap: 3, marginBottom: "var(--rd-block-sm)" }}>
        {parc.map((p) => <div key={p.id} style={{ flex: 1, height: 6, background: p.status === "paga" ? "var(--success)" : p.status === "vencida" ? "var(--danger)" : p.status === "pendente" ? "var(--warning)" : "var(--surface-hi)" }} />)}
      </div>

      {isB ? (
        <div className="r-panel" style={{ padding: "var(--rd-panel)" }}>
          {parc.map((p, i) => {
            const col = p.status === "paga" ? "var(--success)" : p.status === "vencida" ? "var(--danger)" : p.status === "pendente" ? "var(--warning)" : "var(--fg-5)";
            return (
              <div key={p.id} style={{ display: "flex", gap: 16 }}>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                  <span style={{ width: 12, height: 12, background: p.status === "futura" ? "transparent" : col, border: p.status === "futura" ? "1px solid var(--fg-5)" : "none", flexShrink: 0, marginTop: 3 }} />
                  {i < parc.length - 1 && <span style={{ flex: 1, width: 1, background: "var(--border-3)", minHeight: 28 }} />}
                </div>
                <div style={{ flex: 1, paddingBottom: i < parc.length - 1 ? 18 : 0 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 }}>
                    <span className="r-subhead" style={{ fontSize: 15 }}>Parcela {String(p.numero).padStart(2, "0")}</span>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      {(p.status === "pendente" || p.status === "vencida") && <button onClick={() => registrar(p.id)} className="r-ghostbtn" style={{ all: "unset", cursor: "pointer", fontFamily: "var(--font-mono)", fontSize: 10, fontWeight: 700, color: "var(--success)", letterSpacing: "0.5px", textTransform: "uppercase", border: "1px solid color-mix(in oklch, var(--success) 40%, transparent)", padding: "5px 9px" }}>✓ Registrar</button>}
                      <Badge status={p.status} />
                    </div>
                  </div>
                  <div className="r-meta" style={{ marginTop: 5, display: "flex", gap: 14, flexWrap: "wrap" }}>
                    <span>Venc · <span style={{ color: p.status === "vencida" ? "var(--danger-fg)" : "var(--fg-3)" }}>{D.fmtData(p.data_vencimento)}</span></span>
                    <span>Pago · <span style={{ color: p.data_pagamento ? "var(--success)" : "var(--fg-5)" }}>{p.data_pagamento ? D.fmtData(p.data_pagamento) : "—"}</span></span>
                    <span style={{ color: "var(--fg-2)" }}>{D.fmtBRL(uni?.valor_mensal)}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
      <div className="r-panel" style={{ overflowX: "auto" }}>
        <div style={{ display: "grid", gridTemplateColumns: "60px 1fr 1fr 1.1fr 1fr", background: "var(--surface-hi)", borderBottom: "1px solid var(--border-3)", minWidth: mobile ? 460 : "auto" }}>
          {["#", "Vencimento", "Pagamento", "Valor", "Status"].map((h) => <span key={h} className="r-label" style={{ padding: "11px var(--rd-row-x)", fontSize: 10 }}>{h}</span>)}
        </div>
        {parc.map((p, i) => (
          <div key={p.id} style={{ display: "grid", gridTemplateColumns: "60px 1fr 1fr 1.1fr 1fr", alignItems: "center", borderTop: i > 0 ? "1px solid var(--border-3)" : "none", minWidth: mobile ? 460 : "auto" }}>
            <span className="r-data" style={{ padding: "var(--rd-row-y) var(--rd-row-x)", fontWeight: 700 }}>{String(p.numero).padStart(2, "0")}</span>
            <span className="r-data" style={{ padding: "var(--rd-row-y) var(--rd-row-x)", fontSize: 13, color: p.status === "vencida" ? "var(--danger-fg)" : "var(--fg-3)" }}>{D.fmtData(p.data_vencimento)}</span>
            <span className="r-data" style={{ padding: "var(--rd-row-y) var(--rd-row-x)", fontSize: 13, color: p.data_pagamento ? "var(--success)" : "var(--fg-5)" }}>{p.data_pagamento ? D.fmtData(p.data_pagamento) : "—"}</span>
            <span className="r-data" style={{ padding: "var(--rd-row-y) var(--rd-row-x)", fontSize: 13 }}>{D.fmtBRL(uni?.valor_mensal)}</span>
            <span style={{ padding: "var(--rd-row-y) var(--rd-row-x)", display: "flex", alignItems: "center", gap: 10 }}><Badge status={p.status} />{(p.status === "pendente" || p.status === "vencida") && <button onClick={() => registrar(p.id)} className="r-ghostbtn" style={{ all: "unset", cursor: "pointer", fontFamily: "var(--font-mono)", fontSize: 9.5, fontWeight: 700, color: "var(--success)", letterSpacing: "0.5px", textTransform: "uppercase" }}>✓ Registrar</button>}</span>
          </div>
        ))}
      </div>
      )}
      {toast && <div style={{ position: "fixed", bottom: 24, left: "50%", transform: "translateX(-50%)", zIndex: 70, background: "var(--surface-hi)", border: "1px solid var(--success)", padding: "12px 20px", display: "flex", alignItems: "center", gap: 10, animation: "rFade 200ms var(--ease-crisp)" }}><span style={{ color: "var(--success)", fontFamily: "var(--font-mono)" }}>[OK]</span><span className="r-data" style={{ fontSize: 13, color: "var(--fg-1)" }}>{toast}</span></div>}

      {renew && (
        <Modal onClose={() => setRenew(null)} width={500}>
          <div style={{ padding: 28 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 18 }}>
              <div><Eyebrow tone="indigo" style={{ marginBottom: 6 }}>{renew === "renovar" ? "Renovação" : "Expansão"}</Eyebrow><h3 className="r-section">{renew === "renovar" ? "Renovar Contrato" : "Expandir Contrato"}</h3></div>
              <button onClick={() => setRenew(null)} style={{ all: "unset", cursor: "pointer", width: 30, height: 30, border: "1px solid var(--border-3)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--fg-3)", fontFamily: "var(--font-mono)" }}>✕</button>
            </div>
            {renew === "renovar" ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                <p className="r-body" style={{ fontSize: 13 }}>Término atual: <strong style={{ color: "var(--fg-1)" }}>{D.fmtData(termFim)}</strong>. Estenda o prazo do contrato:</p>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
                  {[{ m: 12, l: "+12 meses" }, { m: 24, l: "+24 meses" }, { m: 6, l: "+6 meses" }].map((o) => (
                    <button key={o.m} onClick={() => doRenovar(o.m)} className="r-ghostbtn" style={{ all: "unset", cursor: "pointer", textAlign: "center", padding: "16px 10px", border: "1px solid var(--border-3)", background: "var(--surface-hi)" }}>
                      <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 20, color: "var(--fg-1)" }}>{o.l.split(" ")[0]}</div>
                      <div className="r-meta" style={{ marginTop: 4 }}>{o.l.split(" ")[1]}</div>
                    </button>
                  ))}
                </div>
                <span className="r-meta">O cronograma de parcelas será estendido automaticamente até o novo término.</span>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                <p className="r-body" style={{ fontSize: 13 }}>Adicione outra unidade disponível a este contrato. O valor mensal será somado.</p>
                <div className="r-panel" style={{ maxHeight: 240, overflowY: "auto" }}>
                  {D.unidades.filter((u) => u.status === "disponivel" && !extraUnits.some((e) => e.id === u.id)).map((u, i) => {
                    const ed2 = D.edificios.find((e) => e.id === u.edificio_id);
                    return (
                      <div key={u.id} onClick={() => doExpandir(u)} className="r-rowlink" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, padding: "11px 14px", borderTop: i > 0 ? "1px solid var(--border-3)" : "none" }}>
                        <div style={{ minWidth: 0 }}><div className="r-data" style={{ fontSize: 13, color: "var(--fg-1)" }}>{u.nome}</div><div className="r-meta">{ed2?.nome.replace("Edifício ", "").replace("Centro Empresarial ", "CE ")} · {u.area_m2} m²</div></div>
                        <div style={{ display: "flex", alignItems: "center", gap: 12, flexShrink: 0 }}><span className="r-data" style={{ fontSize: 13 }}>{D.fmtBRL(u.valor_mensal)}</span><span className="r-meta" style={{ color: "var(--indigo)" }}>Adicionar +</span></div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
}

/* ── LOCATÁRIOS ────────────────────────────────────────────────────────── */
function onlyDigits(s) { return (s || "").replace(/\D/g, ""); }
function maskCPF(v) { const d = onlyDigits(v).slice(0, 11); return d.replace(/(\d{3})(\d)/, "$1.$2").replace(/(\d{3})(\d)/, "$1.$2").replace(/(\d{3})(\d{1,2})$/, "$1-$2"); }
function maskCNPJ(v) { const d = onlyDigits(v).slice(0, 14); return d.replace(/(\d{2})(\d)/, "$1.$2").replace(/(\d{3})(\d)/, "$1.$2").replace(/(\d{3})(\d)/, "$1/$2").replace(/(\d{4})(\d{1,2})$/, "$1-$2"); }
function maskDocumento(tipo, v) { return tipo === "pj" ? maskCNPJ(v) : maskCPF(v); }
function maskPhone(v) { const d = onlyDigits(v).slice(0, 11); if (d.length <= 10) return d.replace(/(\d{2})(\d)/, "($1) $2").replace(/(\d{4})(\d{1,4})$/, "$1-$2"); return d.replace(/(\d{2})(\d)/, "($1) $2").replace(/(\d{5})(\d{1,4})$/, "$1-$2"); }
function fmtDoc(tipo, doc) {
  if (!doc) return "—";
  if (tipo === "pj") return doc.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, "$1.$2.$3/$4-$5");
  return doc.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
}

function LocatariosScreen({ mobile, variant }) {
  const isB = variant === "B" && !mobile;
  const [list, setList] = useState(D.locatarios);
  const [invite, setInvite] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [removing, setRemoving] = useState(new Set());
  const blank = { email: "", nome_razao_social: "", tipo: "pj", documento: "", telefone: "" };
  const [form, setForm] = useState(blank);
  const [q, setQ] = useState("");
  const [resent, setResent] = useState(new Set());
  const [confirm, setConfirm] = useState(null);
  function reenviar(id) { setResent((s) => new Set([...s, id])); setTimeout(() => setResent((s) => { const n = new Set(s); n.delete(id); return n; }), 2200); }
  const view = list.filter((l) => !q || (l.nome_razao_social + " " + l.email + " " + l.documento).toLowerCase().includes(q.toLowerCase()));

  const ativos = list.filter((l) => l.status_convite === "aceito").length;
  const pend = list.filter((l) => l.status_convite === "pendente").length;
  const COL = "1.8fr 0.5fr 1.2fr 1.4fr 0.7fr 1.2fr 70px";

  function send(e) { e.preventDefault(); setList((l) => [...l, { ...form, id: "n" + Date.now(), status_convite: "pendente" }]); setForm(blank); setInvite(false); }
  function doRevoke(id) { setRemoving((s) => new Set([...s, id])); setTimeout(() => setList((l) => l.filter((x) => x.id !== id)), 220); }
  function revoke(l) { setConfirm({ title: "Revogar acesso?", body: `O convite/acesso de ${l.nome_razao_social} será revogado. Esta ação não pode ser desfeita.`, danger: true, confirmLabel: "Revogar Acesso", onConfirm: () => doRevoke(l.id) }); }
  function saveEdit() { setList((l) => l.map((x) => (x.id === editTarget.id ? editTarget : x))); setEditTarget(null); }

  const pad = mobile ? "var(--rd-page-y) var(--rd-gutter-m) 80px" : "var(--rd-page-y) var(--rd-gutter) 64px";

  return (
    <div className="r-fade" style={{ padding: pad }}>
      <ConfirmModal data={confirm} onClose={() => setConfirm(null)} />
      <PageHeader eyebrow="SISTEMA.03 // PESSOAS" title="Locatários." subtitle={`${ativos} ativos · ${pend} convites pendentes`} mobile={mobile}
        cta={{ label: "Convidar Locatário", code: "L+", onClick: () => { setForm(blank); setInvite(true); } }} />

      {/* search */}
      <div style={{ display: "flex", gap: 8, marginBottom: "var(--rd-block-sm)", flexWrap: "wrap", alignItems: "center" }}>
        <div style={{ position: "relative", flex: mobile ? "1 1 100%" : "0 0 300px" }}>
          <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--fg-5)" }}>⌕</span>
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar por nome, e-mail ou documento..." style={{ all: "unset", boxSizing: "border-box", width: "100%", padding: "9px 12px 9px 30px", fontSize: 13, fontFamily: "var(--font-body)", color: "var(--fg-1)", background: "var(--surface-hi)", border: "1px solid var(--border-3)" }} />
        </div>
        {q && <span className="r-meta">{view.length} resultado(s)</span>}
      </div>

      {isB && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 12 }}>
          {view.length === 0 && <div style={{ padding: "40px 24px", textAlign: "center", gridColumn: "1 / -1" }}><span className="r-meta">Nenhum locatário encontrado.</span></div>}
          {view.map((l) => {
            const cs = D.contratos.filter((c) => c.locatario_id === l.id);
            const ativosCount = cs.filter((c) => c.status === "ativo").length;
            const pendente = l.status_convite === "pendente";
            const isRem = removing.has(l.id);
            return (
              <div key={l.id} style={{ border: "1px solid var(--border-3)", background: "var(--surface)", padding: "var(--rd-panel)", display: "flex", flexDirection: "column", gap: 12, opacity: isRem ? 0 : 1, transform: isRem ? "scale(0.98)" : "scale(1)", transition: "opacity 220ms ease, transform 220ms ease" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <Avatar name={l.nome_razao_social} dim={pendente} size={40} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div className="r-subhead" style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{l.nome_razao_social}</div>
                    <div className="r-meta">{l.tipo.toUpperCase()} · {fmtDoc(l.tipo, l.documento)}</div>
                  </div>
                </div>
                <div className="r-meta" style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{l.email}</div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid var(--border-3)", paddingTop: 12, gap: 10 }}>
                  <div style={{ display: "flex", gap: 12, alignItems: "center", minWidth: 0 }}>
                    <Badge status={pendente ? "pendente_convite" : "aceito"} />
                    <span className="r-meta">{ativosCount}/{cs.length} contrato(s)</span>
                  </div>
                  {pendente ? (
                    <div style={{ display: "flex", gap: 10 }}>
                      <button onClick={() => reenviar(l.id)} className="r-ghostbtn" style={{ all: "unset", cursor: "pointer", fontFamily: "var(--font-mono)", fontSize: 10, fontWeight: 700, color: resent.has(l.id) ? "var(--success)" : "var(--indigo)", letterSpacing: "0.5px", textTransform: "uppercase" }}>{resent.has(l.id) ? "✓ Reenviado" : "Reenviar"}</button>
                      <button onClick={() => revoke(l)} className="r-ghostbtn" style={{ all: "unset", cursor: "pointer", fontFamily: "var(--font-mono)", fontSize: 10, fontWeight: 700, color: "var(--danger-fg)", letterSpacing: "0.5px", textTransform: "uppercase" }}>Revogar</button>
                    </div>
                  ) : (
                    <button onClick={() => setEditTarget({ ...l })} className="r-ghostbtn" style={{ all: "unset", cursor: "pointer", fontFamily: "var(--font-mono)", fontSize: 10, fontWeight: 700, color: "var(--fg-3)", letterSpacing: "0.5px", textTransform: "uppercase" }}>Editar</button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {!isB && (
      <div style={{ overflowX: "auto" }} className="r-scroll">
        <div className="r-panel" style={{ minWidth: mobile ? "auto" : 760 }}>
          {!mobile && (
            <div style={{ display: "grid", gridTemplateColumns: COL, background: "var(--surface-hi)" }}>
              {["Nome", "Tipo", "Documento", "Email", "Contratos", "Status", "Ações"].map((h) => <span key={h} className="r-label" style={{ padding: "11px var(--rd-row-x)", fontSize: 9.5 }}>{h}</span>)}
            </div>
          )}
          {view.map((l, i) => {
            const cs = D.contratos.filter((c) => c.locatario_id === l.id);
            const ativosCount = cs.filter((c) => c.status === "ativo").length;
            const pendente = l.status_convite === "pendente";
            const isRem = removing.has(l.id);
            if (mobile) {
              return (
                <div key={l.id} style={{ padding: "12px var(--rd-row-x)", borderTop: i > 0 ? "1px solid var(--border-3)" : "none", display: "flex", flexDirection: "column", gap: 10, opacity: isRem ? 0 : 1, transition: "opacity 220ms ease" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <Avatar name={l.nome_razao_social} dim={pendente} />
                    <div style={{ flex: 1, minWidth: 0 }}><div className="r-subhead" style={{ fontSize: 14 }}>{l.nome_razao_social}</div><div className="r-meta">{l.tipo.toUpperCase()} · {fmtDoc(l.tipo, l.documento)}</div></div>
                    <Badge status={pendente ? "pendente_convite" : "aceito"} />
                  </div>
                  <div style={{ display: "flex", gap: 8, borderTop: "1px solid var(--border-3)", paddingTop: 10 }}>
                    {pendente ? (
                      <React.Fragment>
                        <button onClick={() => reenviar(l.id)} className="r-ghostbtn" style={{ all: "unset", cursor: "pointer", fontFamily: "var(--font-mono)", fontSize: 10, fontWeight: 700, color: resent.has(l.id) ? "var(--success)" : "var(--indigo)", letterSpacing: "0.5px", textTransform: "uppercase", padding: "4px 0" }}>{resent.has(l.id) ? "✓ Reenviado" : "Reenviar convite"}</button>
                        <span style={{ flex: 1 }} />
                        <button onClick={() => revoke(l)} className="r-ghostbtn" style={{ all: "unset", cursor: "pointer", fontFamily: "var(--font-mono)", fontSize: 10, fontWeight: 700, color: "var(--danger-fg)", letterSpacing: "0.5px", textTransform: "uppercase", padding: "4px 0" }}>Revogar</button>
                      </React.Fragment>
                    ) : (
                      <React.Fragment>
                        <span className="r-meta">{ativosCount}/{cs.length} contrato(s)</span>
                        <span style={{ flex: 1 }} />
                        <button onClick={() => setEditTarget({ ...l })} className="r-ghostbtn" style={{ all: "unset", cursor: "pointer", fontFamily: "var(--font-mono)", fontSize: 10, fontWeight: 700, color: "var(--fg-3)", letterSpacing: "0.5px", textTransform: "uppercase", padding: "4px 0" }}>Editar</button>
                      </React.Fragment>
                    )}
                  </div>
                </div>
              );
            }
            return (
              <div key={l.id} style={{ display: "grid", gridTemplateColumns: COL, alignItems: "center", borderTop: i > 0 ? "1px solid var(--border-3)" : "none", opacity: isRem ? 0 : 1, transform: isRem ? "scale(0.98)" : "scale(1)", transition: "opacity 220ms ease, transform 220ms ease" }}>
                <div style={{ padding: "var(--rd-row-y) var(--rd-row-x)", display: "flex", alignItems: "center", gap: 12, minWidth: 0 }}>
                  <Avatar name={l.nome_razao_social} dim={pendente} />
                  <span className="r-subhead" style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{l.nome_razao_social}</span>
                </div>
                <span className="r-meta" style={{ padding: "var(--rd-row-y) var(--rd-row-x)", fontSize: 10 }}>{l.tipo.toUpperCase()}</span>
                <span className="r-data" style={{ padding: "var(--rd-row-y) var(--rd-row-x)", fontSize: 13 }}>{fmtDoc(l.tipo, l.documento)}</span>
                <span className="r-data" style={{ padding: "var(--rd-row-y) var(--rd-row-x)", fontSize: 12, color: "var(--fg-3)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{l.email}</span>
                <span className="r-data" style={{ padding: "var(--rd-row-y) var(--rd-row-x)", fontSize: 13 }}>{ativosCount}/{cs.length}</span>
                <span style={{ padding: "var(--rd-row-y) var(--rd-row-x)" }}><Badge status={pendente ? "pendente_convite" : "aceito"} /></span>
                <div style={{ padding: "var(--rd-row-y) 10px", display: "flex", flexDirection: "column", gap: 6 }}>
                  {pendente ? (
                    <React.Fragment>
                      <button onClick={() => reenviar(l.id)} className="r-ghostbtn" style={{ all: "unset", cursor: "pointer", fontFamily: "var(--font-mono)", fontSize: 10, fontWeight: 700, color: resent.has(l.id) ? "var(--success)" : "var(--indigo)", letterSpacing: "0.5px", textTransform: "uppercase" }}>{resent.has(l.id) ? "✓ Reenviado" : "Reenviar"}</button>
                      <button onClick={() => revoke(l)} className="r-ghostbtn" style={{ all: "unset", cursor: "pointer", fontFamily: "var(--font-mono)", fontSize: 10, fontWeight: 700, color: "var(--danger-fg)", letterSpacing: "0.5px", textTransform: "uppercase" }}>Revogar</button>
                    </React.Fragment>
                  ) : (
                    <button onClick={() => setEditTarget({ ...l })} className="r-ghostbtn" style={{ all: "unset", cursor: "pointer", fontFamily: "var(--font-mono)", fontSize: 10, fontWeight: 700, color: "var(--fg-3)", letterSpacing: "0.5px", textTransform: "uppercase" }}>Editar</button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
      )}

      {/* Invite callout */}
      <div style={{ marginTop: "var(--rd-block-sm)", padding: "16px 20px", border: "1px solid var(--indigo)", background: "oklch(0.339 0.179 301.68 / 0.06)", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <Eyebrow tone="indigo">Fluxo de Convite</Eyebrow>
          <span className="r-body" style={{ maxWidth: 520, color: "var(--fg-2)", fontSize: 13 }}>Convide um locatário pelo e-mail. Ele recebe um token único, define a senha e o vínculo é selado. Você pode revogar antes do aceite.</span>
        </div>
        <Btn onClick={() => { setForm(blank); setInvite(true); }} trailing="→">Convidar</Btn>
      </div>

      {invite && (
        <Modal onClose={() => setInvite(false)}>
          <div style={{ padding: 28 }}>
            <Eyebrow tone="indigo" style={{ marginBottom: 6 }}>Novo Locatário</Eyebrow>
            <h3 className="r-section" style={{ marginBottom: 20 }}>Enviar Convite</h3>
            <form onSubmit={send} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <FormField label="Email *"><FInput type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></FormField>
              <FormField label="Nome / Razão Social *"><FInput required value={form.nome_razao_social} onChange={(e) => setForm({ ...form, nome_razao_social: e.target.value })} /></FormField>
              <FormField label="Tipo">
                <div style={{ display: "flex" }}>
                  {["pf", "pj"].map((t) => <button key={t} type="button" onClick={() => setForm({ ...form, tipo: t, documento: maskDocumento(t, form.documento) })} style={{ all: "unset", cursor: "pointer", padding: "9px 18px", fontFamily: "var(--font-mono)", fontWeight: 700, fontSize: 11, letterSpacing: "1px", textTransform: "uppercase", border: "1px solid var(--border-3)", background: form.tipo === t ? "var(--indigo)" : "var(--surface-hi)", color: form.tipo === t ? "var(--fg-1)" : "var(--fg-4)" }}>{t === "pf" ? "Pessoa Física" : "Pessoa Jurídica"}</button>)}
                </div>
              </FormField>
              <FormField label={form.tipo === "pj" ? "CNPJ *" : "CPF *"}><FInput required value={form.documento} placeholder={form.tipo === "pj" ? "00.000.000/0000-00" : "000.000.000-00"} onChange={(e) => setForm({ ...form, documento: maskDocumento(form.tipo, e.target.value) })} /></FormField>
              <FormField label="Telefone *"><FInput type="tel" required value={form.telefone} placeholder="(11) 99999-9999" onChange={(e) => setForm({ ...form, telefone: maskPhone(e.target.value) })} /></FormField>
              <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 6 }}><Btn variant="outline" onClick={() => setInvite(false)} style={{ padding: "9px 16px" }}>Cancelar</Btn><Btn type="submit" trailing="→" style={{ padding: "9px 18px" }}>Enviar Convite</Btn></div>
            </form>
          </div>
        </Modal>
      )}

      {editTarget && (
        <Modal onClose={() => setEditTarget(null)}>
          <div style={{ padding: 28 }}>
            <Eyebrow tone="indigo" style={{ marginBottom: 6 }}>Locatário</Eyebrow>
            <h3 className="r-section" style={{ marginBottom: 20 }}>Editar Locatário</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <FormField label="Nome / Razão Social"><FInput value={editTarget.nome_razao_social} onChange={(e) => setEditTarget({ ...editTarget, nome_razao_social: e.target.value })} /></FormField>
              <FormField label="Email"><FInput type="email" value={editTarget.email} onChange={(e) => setEditTarget({ ...editTarget, email: e.target.value })} /></FormField>
              <FormField label="Telefone"><FInput value={editTarget.telefone} onChange={(e) => setEditTarget({ ...editTarget, telefone: maskPhone(e.target.value) })} /></FormField>
              <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 6 }}><Btn variant="outline" onClick={() => setEditTarget(null)} style={{ padding: "9px 16px" }}>Cancelar</Btn><Btn onClick={saveEdit} trailing="→" style={{ padding: "9px 18px" }}>Salvar</Btn></div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

Object.assign(window, { ContratosScreen, ContratoDetailScreen, LocatariosScreen, Modal });
