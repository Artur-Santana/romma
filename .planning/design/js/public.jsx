/* Romma — Public Unidades listing (realtime) + detail sheet. Mobile-first, responsive.
   Functionality: sort control. (Favoritar + viewers signal removed per feedback.) */

function shortBuilding(n) { return (n || "").replace("Edifício ", "").replace("Centro Empresarial ", "CE ").replace("Torre ", ""); }

const SORTS = [
  { id: "rel", label: "Relevância" },
  { id: "valor_asc", label: "Menor valor" },
  { id: "valor_desc", label: "Maior valor" },
  { id: "area_desc", label: "Maior área" },
];
function sortUnits(list, sort) {
  const a = [...list];
  if (sort === "valor_asc") a.sort((x, y) => x.valor_mensal - y.valor_mensal);
  else if (sort === "valor_desc") a.sort((x, y) => y.valor_mensal - x.valor_mensal);
  else if (sort === "area_desc") a.sort((x, y) => y.area_m2 - x.area_m2);
  return a;
}

function PublicUnitCard({ u, edi, onSelect, removing }) {
  const valor = u.valor_visivel ? `${D.fmtBRL(u.valor_mensal)}/mês` : "Consulte o proprietário";
  return (
    <div onClick={() => onSelect(u)} className="r-rowlink" style={{
      border: "1px solid var(--border-2)", background: "var(--surface)", padding: 18, cursor: "pointer",
      display: "flex", flexDirection: "column", gap: 14, animation: removing ? "rUnitOut 600ms var(--ease-crisp) forwards" : "none",
    }}>
      <div style={{ position: "relative", height: 116, overflow: "hidden", border: "1px solid var(--border-3)" }}>
        <img src="assets/Detalhe_Arquitetonico.png" alt="" style={{ width: "100%", height: "100%", objectFit: "cover", filter: "grayscale(0.3) contrast(1.1) brightness(0.6)" }} />
        <div style={{ position: "absolute", inset: 0, background: "var(--primary-hover)", opacity: 0.12 }} />
        <div style={{ position: "absolute", top: 10, right: 10 }}><Badge status="disponivel" /></div>
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10 }}>
        <div style={{ minWidth: 0 }}>
          <div className="r-subhead" style={{ fontSize: 17, letterSpacing: "-0.3px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{u.nome}</div>
          <div className="r-meta" style={{ marginTop: 4, letterSpacing: "1px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{shortBuilding(edi?.nome)}</div>
        </div>
      </div>
      <p className="r-body" style={{ fontSize: 13, margin: 0, color: "var(--fg-4)" }}>{u.descricao}</p>
      <div style={{ height: 1, background: "var(--border-2)" }} />
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span className="r-meta" style={{ letterSpacing: "1px" }}>{u.area_m2} m²</span>
        <span style={{ fontFamily: "var(--font-mono)", fontWeight: 700, fontSize: 13, letterSpacing: "0.5px", color: u.valor_visivel ? "var(--primary-hover)" : "var(--fg-4)" }}>{valor}</span>
      </div>
    </div>
  );
}

function UnitSheet({ u, edi, onClose, onSimular, simulating }) {
  return (
    <div onClick={(e) => { if (e.target === e.currentTarget) onClose(); }} style={{ position: "fixed", inset: 0, zIndex: 60, background: "oklch(0 0 0 / 0.7)", display: "flex", alignItems: "flex-end", justifyContent: "center" }}>
      <div style={{ width: "100%", maxWidth: 520, background: "var(--surface)", borderTop: "1px solid var(--indigo)", maxHeight: "92%", overflowY: "auto", animation: "rSheetUp 320ms var(--ease-crisp) both" }} className="r-scroll">
        <div style={{ padding: 24 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 18 }}>
            <div><Eyebrow tone="indigo" style={{ marginBottom: 6 }}>Unidade · {shortBuilding(edi?.nome)}</Eyebrow><h2 className="r-title" style={{ fontSize: 28 }}>{u.nome}</h2></div>
            <button onClick={onClose} style={{ all: "unset", cursor: "pointer", width: 30, height: 30, border: "1px solid var(--border-3)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--fg-3)", fontFamily: "var(--font-mono)" }}>✕</button>
          </div>
          <div style={{ position: "relative", height: 160, marginBottom: 18, overflow: "hidden", border: "1px solid var(--border-3)" }}>
            <img src="assets/Detalhe_Arquitetonico.png" alt="" style={{ width: "100%", height: "100%", objectFit: "cover", filter: "grayscale(0.3) contrast(1.1) brightness(0.65)" }} />
            <div style={{ position: "absolute", inset: 0, background: "var(--primary-hover)", opacity: 0.16 }} />
          </div>
          <p className="r-body" style={{ marginBottom: 18 }}>{u.descricao}</p>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", border: "1px solid var(--border-3)", marginBottom: 18 }}>
            <div style={{ padding: 18, borderRight: "1px solid var(--border-3)" }}><div className="r-label" style={{ marginBottom: 8 }}>Área</div><div className="r-metric" style={{ fontSize: 30 }}>{u.area_m2}<span style={{ fontSize: 14, color: "var(--fg-4)" }}> m²</span></div></div>
            <div style={{ padding: 18 }}><div className="r-label" style={{ marginBottom: 8 }}>Valor mensal</div><div className="r-metric" style={{ fontSize: 30, color: u.valor_visivel ? "var(--primary-hover)" : "var(--fg-4)" }}>{u.valor_visivel ? D.fmtBRLk(u.valor_mensal) : "—"}</div>{!u.valor_visivel && <div className="r-meta" style={{ marginTop: 4 }}>Consulte o proprietário</div>}</div>
          </div>
          {u.valor_visivel && (
            <div style={{ border: "1px solid var(--border-3)", padding: "12px 16px", marginBottom: 18, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span className="r-label">Valor / m²</span>
              <span className="r-data" style={{ fontSize: 14, color: "var(--fg-1)" }}>{D.fmtBRL(Math.round(u.valor_mensal / u.area_m2))}<span className="r-meta">/m²</span></span>
            </div>
          )}
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 18 }}>
            <span className="r-meta">LOC: −23.561° S, 46.656° W</span>
            <span className="r-meta">REF: RM-2026-{u.id.toUpperCase()}</span>
          </div>
          <Btn full code={simulating ? "[···]" : "[>]"} trailing={simulating ? "" : "ENTER"} onClick={() => onSimular(u.id)} style={{ padding: "16px 22px" }}>{simulating ? "Processando" : "Simular Aluguel"}</Btn>
        </div>
      </div>
    </div>
  );
}

function PublicUnidadesScreen({ go, mobile, variant }) {
  const isB = variant === "B" && !mobile;
  const [tab, setTab] = useState("todos");
  const [sort, setSort] = useState("rel");
  const [removedIds, setRemovedIds] = useState(new Set());
  const [removingId, setRemovingId] = useState(null);
  const [selected, setSelected] = useState(null);
  const [simulating, setSimulating] = useState(false);

  const available = D.unidades.filter((u) => u.status === "disponivel" && !removedIds.has(u.id));
  const tabs = [{ id: "todos", label: "Todos" }, ...D.edificios.map((e) => ({ id: e.id, label: shortBuilding(e.nome) }))];
  const ediById = Object.fromEntries(D.edificios.map((e) => [e.id, e]));
  let filtered = tab === "todos" ? available : available.filter((u) => u.edificio_id === tab);
  filtered = sortUnits(filtered, sort);

  function simular(uid) {
    setSimulating(true);
    setTimeout(() => { setSimulating(false); setSelected(null); setRemovingId(uid); setTimeout(() => { setRemovedIds((s) => new Set([...s, uid])); setRemovingId(null); }, 560); }, 800);
  }

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column", background: "var(--background)", position: "relative", overflow: "hidden" }}>
      {/* header */}
      <div style={{ flexShrink: 0, padding: "18px var(--rd-gutter-m) 18px", borderBottom: "1px solid var(--border-3)" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <button onClick={() => go("auth/login")} className="r-ghostbtn" style={{ all: "unset", cursor: "pointer", fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--fg-4)", letterSpacing: "1px", textTransform: "uppercase" }}>← Voltar</button>
            <RDot label="REALTIME" />
          </div>
          <h1 className="r-title" style={{ fontSize: mobile ? 30 : 40, whiteSpace: "pre-line" }}>{mobile ? "Unidades\nDisponíveis." : "Unidades Disponíveis."}</h1>
        </div>
      </div>
      {/* tabs */}
      <div style={{ flexShrink: 0, borderBottom: "1px solid var(--border-3)" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", padding: "12px var(--rd-gutter-m)" }}>
          <div className="r-noscroll" style={{ display: "flex", gap: 6, overflowX: "auto" }}>
            {tabs.map((t) => {
              const count = t.id === "todos" ? available.length : available.filter((u) => u.edificio_id === t.id).length;
              const active = tab === t.id;
              return (
                <button key={t.id} onClick={() => setTab(t.id)} style={{ all: "unset", cursor: "pointer", flexShrink: 0, display: "inline-flex", gap: 8, alignItems: "center", padding: "9px 14px", fontFamily: "var(--font-body)", fontWeight: 700, fontSize: 10, letterSpacing: "0.5px", textTransform: "uppercase", border: `1px solid ${active ? "var(--indigo)" : "var(--border-3)"}`, background: active ? "oklch(0.339 0.179 301.68 / 0.20)" : "transparent", color: active ? "var(--fg-1)" : "var(--fg-3)" }}>
                  {t.label}<span style={{ color: active ? "var(--indigo)" : "var(--fg-5)" }}>{count}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
      {/* count + sort */}
      <div style={{ flexShrink: 0, borderBottom: "1px solid var(--border-3)" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", padding: "10px var(--rd-gutter-m)", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
          <span className="r-meta" style={{ opacity: 0.6 }}>{filtered.length} {filtered.length === 1 ? "UNIDADE" : "UNIDADES"}</span>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span className="r-label" style={{ fontSize: 9 }}>Ordenar</span>
            <div className="r-noscroll" style={{ display: "flex", gap: 4, overflowX: "auto" }}>
              {SORTS.map((s) => (
                <button key={s.id} onClick={() => setSort(s.id)} style={{ all: "unset", cursor: "pointer", flexShrink: 0, padding: "5px 10px", fontFamily: "var(--font-mono)", fontSize: 10, letterSpacing: "0.5px", border: `1px solid ${sort === s.id ? "var(--indigo)" : "var(--border-3)"}`, background: sort === s.id ? "oklch(0.339 0.179 301.68 / 0.18)" : "transparent", color: sort === s.id ? "var(--fg-1)" : "var(--fg-4)" }}>{s.label}</button>
              ))}
            </div>
          </div>
        </div>
      </div>
      {/* list */}
      <div className="r-scroll" style={{ flex: 1, minHeight: 0, overflowY: "auto" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", padding: "var(--rd-gutter-m)" }}>
          {filtered.length === 0 ? (
            <div style={{ padding: "72px 24px", textAlign: "center", display: "flex", flexDirection: "column", gap: 12, alignItems: "center" }}>
              <div style={{ width: 48, height: 48, border: "1px solid var(--border-3)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--fg-4)" }}>—</div>
              <span className="r-subhead" style={{ fontSize: 20 }}>Nenhuma unidade disponível</span>
              <p className="r-body" style={{ maxWidth: 260, margin: 0 }}>Todas as unidades estão ocupadas no momento. Volte em breve.</p>
            </div>
          ) : isB ? (
            <div className="r-panel">
              {filtered.map((u, i) => {
                const edi = ediById[u.edificio_id];
                return (
                  <div key={u.id} onClick={() => setSelected(u)} className="r-rowlink" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, padding: "var(--rd-row-y) var(--rd-row-x)", borderTop: i > 0 ? "1px solid var(--border-3)" : "none", animation: removingId === u.id ? "rUnitOut 600ms var(--ease-crisp) forwards" : "none" }}>
                    <div style={{ minWidth: 0, flex: 1, display: "flex", alignItems: "baseline", gap: 12 }}>
                      <span className="r-subhead" style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{u.nome}</span>
                      <span className="r-meta" style={{ letterSpacing: "1px", flexShrink: 0 }}>{shortBuilding(edi?.nome)}</span>
                    </div>
                    <span className="r-meta" style={{ width: 64, textAlign: "right", flexShrink: 0 }}>{u.area_m2} m²</span>
                    <span style={{ width: 150, textAlign: "right", flexShrink: 0, fontFamily: "var(--font-mono)", fontWeight: 700, fontSize: 13, color: u.valor_visivel ? "var(--primary-hover)" : "var(--fg-4)" }}>{u.valor_visivel ? D.fmtBRL(u.valor_mensal) + "/mês" : "Consulte"}</span>
                    <span style={{ flexShrink: 0 }}><Badge status="disponivel" /></span>
                    <span className="r-meta" style={{ flexShrink: 0 }}>→</span>
                  </div>
                );
              })}
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: mobile ? "1fr" : "repeat(auto-fill, minmax(280px, 1fr))", gap: 12 }}>
              {filtered.map((u) => <PublicUnitCard key={u.id} u={u} edi={ediById[u.edificio_id]} onSelect={setSelected} removing={removingId === u.id} />)}
            </div>
          )}
          <div style={{ padding: "28px 0 8px", textAlign: "center" }}><span className="r-meta" style={{ letterSpacing: "1.5px", color: "var(--fg-5)" }}>POWERED BY ROMMA · GRID.OS</span></div>
        </div>
      </div>
      {selected && <UnitSheet u={selected} edi={ediById[selected.edificio_id]} onClose={() => setSelected(null)} onSimular={simular} simulating={simulating} />}
    </div>
  );
}

Object.assign(window, { PublicUnidadesScreen });
