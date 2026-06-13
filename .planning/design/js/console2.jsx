/* Romma — console form primitives + Unidades & Edifícios management.
   UnitFormModal is the single create/edit surface (also used by Edifícios drill-in). */

/* ── Form primitives ───────────────────────────────────────────────────── */
function FLabel({ children }) {
  return <span style={{ fontFamily: "var(--font-mono)", fontSize: 10, letterSpacing: "1px", textTransform: "uppercase", color: "var(--fg-4)" }}>{children}</span>;
}
function FInput(props) {
  const [f, setF] = useState(false);
  return <input {...props} onFocus={() => setF(true)} onBlur={() => setF(false)} style={{
    all: "unset", boxSizing: "border-box", width: "100%", padding: "10px 12px", fontSize: 14,
    fontFamily: "var(--font-body)", color: "var(--fg-1)", background: "var(--surface-hi)",
    border: `1px solid ${f ? "var(--primary)" : "var(--border-3)"}`, transition: "border-color var(--dur-fast)", ...(props.style || {}),
  }} />;
}
function FSelect({ value, onChange, children }) {
  const [f, setF] = useState(false);
  return (
    <div style={{ position: "relative" }}>
      <select value={value} onChange={onChange} onFocus={() => setF(true)} onBlur={() => setF(false)} style={{
        all: "unset", boxSizing: "border-box", width: "100%", padding: "10px 34px 10px 12px", fontSize: 13,
        fontFamily: "var(--font-mono)", color: "var(--fg-1)", background: "var(--surface-hi)",
        border: `1px solid ${f ? "var(--primary)" : "var(--border-3)"}`, cursor: "pointer", transition: "border-color var(--dur-fast)",
      }}>{children}</select>
      <span style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", pointerEvents: "none", fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--fg-4)" }}>▾</span>
    </div>
  );
}
function FormField({ label, children }) {
  return <label style={{ display: "flex", flexDirection: "column", gap: 6 }}><FLabel>{label}</FLabel>{children}</label>;
}
function ErrLine({ children }) {
  return <div style={{ background: "var(--danger-bg2)", borderLeft: "2px solid var(--danger-fg)", padding: "10px 14px", fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--danger-fg)" }}>{children}</div>;
}
function FormCheck({ checked, onClick, label }) {
  return (
    <div onClick={onClick} style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
      <span style={{ width: 16, height: 16, border: `1px solid ${checked ? "var(--indigo)" : "var(--border-3)"}`, background: checked ? "var(--indigo)" : "transparent", display: "flex", alignItems: "center", justifyContent: "center" }}>
        {checked && <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M1.5 5L4 7.5L8.5 2.5" stroke="white" strokeWidth="1.5" strokeLinecap="square" /></svg>}
      </span>
      <FLabel>{label}</FLabel>
    </div>
  );
}

/* ── Cover photo field — click/drag to upload, preview, remove ─────────── */
const PLACEHOLDER_COVER = "assets/Detalhe_Arquitetonico.png";
function CoverPhotoField({ value, onChange }) {
  const inputRef = useRef(null);
  const [drag, setDrag] = useState(false);
  function readFile(file) { if (!file) return; const r = new FileReader(); r.onload = () => onChange(r.result); r.readAsDataURL(file); }
  return (
    <div>
      <FLabel>Foto de capa</FLabel>
      <input ref={inputRef} type="file" accept="image/*" style={{ display: "none" }} onChange={(e) => readFile(e.target.files[0])} />
      {value ? (
        <div style={{ position: "relative", height: 150, marginTop: 6, border: "1px solid var(--border-3)", overflow: "hidden" }}>
          <img src={value} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", filter: value === PLACEHOLDER_COVER ? "grayscale(0.3) contrast(1.1) brightness(0.7)" : "none" }} />
          <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, transparent, rgba(0,0,0,0.5))" }} />
          <div style={{ position: "absolute", bottom: 10, right: 10, display: "flex", gap: 6 }}>
            <button type="button" onClick={() => inputRef.current?.click()} className="r-ghostbtn" style={{ all: "unset", cursor: "pointer", fontFamily: "var(--font-mono)", fontSize: 10, fontWeight: 700, color: "var(--fg-1)", letterSpacing: "0.5px", textTransform: "uppercase", padding: "6px 10px", background: "rgba(0,0,0,0.55)", border: "1px solid var(--border-2)" }}>Trocar</button>
            <button type="button" onClick={() => onChange(null)} className="r-ghostbtn" style={{ all: "unset", cursor: "pointer", fontFamily: "var(--font-mono)", fontSize: 10, fontWeight: 700, color: "var(--danger-fg)", letterSpacing: "0.5px", textTransform: "uppercase", padding: "6px 10px", background: "rgba(0,0,0,0.55)", border: "1px solid color-mix(in oklch, var(--destructive) 40%, transparent)" }}>Remover</button>
          </div>
        </div>
      ) : (
        <div
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
          onDragLeave={() => setDrag(false)}
          onDrop={(e) => { e.preventDefault(); setDrag(false); readFile(e.dataTransfer.files[0]); }}
          style={{ marginTop: 6, height: 110, border: `1px dashed ${drag ? "var(--indigo)" : "var(--border-2)"}`, background: drag ? "oklch(0.339 0.179 301.68 / 0.08)" : "var(--surface-hi)", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 8, transition: "all var(--dur-fast)" }}
        >
          <span style={{ width: 30, height: 30, border: "1px solid var(--border-2)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--fg-4)", fontFamily: "var(--font-mono)" }}>⤓</span>
          <span className="r-meta">Arraste uma imagem ou clique para enviar</span>
          <button type="button" onClick={(e) => { e.stopPropagation(); onChange(PLACEHOLDER_COVER); }} style={{ all: "unset", cursor: "pointer", fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--indigo)", letterSpacing: "0.5px", textTransform: "uppercase" }}>ou usar foto de exemplo</button>
        </div>
      )}
    </div>
  );
}

/* ── Unified Unit create/edit modal ────────────────────────────────────── */
function UnitFormModal({ mode, initial, onClose, onSave }) {
  const [f, setF] = useState(() => ({
    nome: initial?.nome || "", descricao: initial?.descricao || "",
    area_m2: initial?.area_m2 ?? "", valor_mensal: initial?.valor_mensal ?? "",
    valor_visivel: initial?.valor_visivel ?? false, status: initial?.status || "disponivel",
    edificio_id: initial?.edificio_id || D.edificios[0].id, capa: initial?.capa || null,
  }));
  function submit(e) { e.preventDefault(); onSave({ ...initial, ...f, area_m2: +f.area_m2 || 0, valor_mensal: +f.valor_mensal || 0 }); }
  return (
    <Modal onClose={onClose} width={560}>
      <div style={{ padding: 28 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
          <div><Eyebrow tone="indigo" style={{ marginBottom: 6 }}>{mode === "edit" ? "Editar Unidade" : "Nova Unidade"}</Eyebrow><h3 className="r-section">{mode === "edit" ? f.nome || "Unidade" : "Cadastrar Unidade"}</h3></div>
          <button onClick={onClose} style={{ all: "unset", cursor: "pointer", width: 30, height: 30, border: "1px solid var(--border-3)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--fg-3)", fontFamily: "var(--font-mono)" }}>✕</button>
        </div>
        <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <CoverPhotoField value={f.capa} onChange={(v) => setF({ ...f, capa: v })} />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            <FormField label="Edifício"><FSelect value={f.edificio_id} onChange={(e) => setF({ ...f, edificio_id: e.target.value })}>{D.edificios.map((ed) => <option key={ed.id} value={ed.id}>{ed.nome}</option>)}</FSelect></FormField>
            <FormField label="Nome da unidade"><FInput value={f.nome} onChange={(e) => setF({ ...f, nome: e.target.value })} placeholder="Ex: Sala 1208" required /></FormField>
            <FormField label="Área (m²)"><FInput type="number" value={f.area_m2} onChange={(e) => setF({ ...f, area_m2: e.target.value })} placeholder="0" /></FormField>
            <FormField label="Valor mensal (R$)"><FInput type="number" value={f.valor_mensal} onChange={(e) => setF({ ...f, valor_mensal: e.target.value })} placeholder="0" /></FormField>
            <FormField label="Status"><FSelect value={f.status} onChange={(e) => setF({ ...f, status: e.target.value })}><option value="disponivel">Disponível</option><option value="alugada">Alugada</option></FSelect></FormField>
            <FormField label="Descrição"><FInput value={f.descricao} onChange={(e) => setF({ ...f, descricao: e.target.value })} placeholder="Opcional" /></FormField>
          </div>
          <FormCheck checked={f.valor_visivel} onClick={() => setF({ ...f, valor_visivel: !f.valor_visivel })} label="Exibir valor publicamente" />
          <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 4 }}>
            <Btn variant="outline" onClick={onClose} style={{ padding: "10px 16px" }}>Cancelar</Btn>
            <Btn type="submit" code="✓" style={{ padding: "10px 18px" }}>{mode === "edit" ? "Salvar Alterações" : "Criar Unidade"}</Btn>
          </div>
        </form>
      </div>
    </Modal>
  );
}

/* ── UNIDADES ──────────────────────────────────────────────────────────── */
function UnidadesScreen({ mobile, variant }) {
  const isB = variant === "B" && !mobile;
  const [list, setList] = useState(D.unidades);
  const [modal, setModal] = useState(null); // {mode, unit}
  const [confirm, setConfirm] = useState(null);
  const [removing, setRemoving] = useState(new Set());
  const [query, setQuery] = useState("");
  const [fEd, setFEd] = useState("all");
  const [fStatus, setFStatus] = useState("all");

  const disp = list.filter((u) => u.status === "disponivel").length;
  const alug = list.filter((u) => u.status === "alugada").length;
  const totalM2 = list.reduce((s, u) => s + (u.area_m2 || 0), 0);
  const mrrRealizado = list.filter((u) => u.status === "alugada").reduce((s, u) => s + (u.valor_mensal || 0), 0);
  const emAberto = list.filter((u) => u.status === "disponivel").reduce((s, u) => s + (u.valor_mensal || 0), 0);
  const ocultos = list.filter((u) => !u.valor_visivel).length;

  const filtered = list.filter((u) => {
    if (fEd !== "all" && u.edificio_id !== fEd) return false;
    if (fStatus !== "all" && u.status !== fStatus) return false;
    if (query && !u.nome.toLowerCase().includes(query.toLowerCase())) return false;
    return true;
  });

  function save(unit) {
    if (modal?.mode === "edit") setList((l) => l.map((u) => (u.id === unit.id ? unit : u)));
    else setList((l) => [{ ...unit, id: "n" + Date.now() }, ...l]);
    setModal(null);
  }
  function del(u) {
    setConfirm({ title: "Remover unidade?", body: `A unidade ${u.nome} será removida permanentemente do sistema.`, danger: true, confirmLabel: "Remover Unidade", onConfirm: () => {
      setRemoving((s) => new Set([...s, u.id])); setTimeout(() => setList((l) => l.filter((x) => x.id !== u.id)), 220);
    } });
  }

  const pad = mobile ? "var(--rd-page-y) var(--rd-gutter-m) 80px" : "var(--rd-page-y) var(--rd-gutter) 64px";
  return (
    <div className="r-fade" style={{ padding: pad }}>
      <ConfirmModal data={confirm} onClose={() => setConfirm(null)} />
      {modal && <UnitFormModal mode={modal.mode} initial={modal.unit} onClose={() => setModal(null)} onSave={save} />}
      <PageHeader eyebrow="U.LIST · UNIDADES" title="Unidades." subtitle={`${disp} disponíveis · ${alug} alugadas`} mobile={mobile}
        cta={{ label: "Nova Unidade", code: "U+", onClick: () => setModal({ mode: "create" }) }} />

      {/* summary metrics */}
      <div style={{ display: "grid", gridTemplateColumns: mobile ? "1fr 1fr" : "repeat(4, 1fr)", border: "1px solid var(--border-3)", marginBottom: "var(--rd-block-sm)" }}>
        {[
          { l: "Área total", v: totalM2.toLocaleString("pt-BR") + " m²", s: list.length + " unidades" },
          { l: "MRR realizado", v: D.fmtBRLk(mrrRealizado), s: alug + " alugadas" },
          { l: "Potencial em aberto", v: D.fmtBRLk(emAberto), s: disp + " disponíveis", gold: true },
          { l: "Valores ocultos", v: String(ocultos), s: "não exibidos no site" },
        ].map((m, i) => (
          <div key={m.l} style={{ padding: "14px var(--rd-cell)", borderRight: mobile ? (i % 2 === 0 ? "1px solid var(--border-3)" : "none") : (i < 3 ? "1px solid var(--border-3)" : "none"), borderTop: mobile && i >= 2 ? "1px solid var(--border-3)" : "none" }}>
            <div className="r-label" style={{ fontSize: 9.5, marginBottom: 7, color: m.gold ? "var(--highlight)" : "var(--fg-4)" }}>{m.l}</div>
            <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 26, letterSpacing: "-1px", color: m.gold ? "var(--highlight)" : "var(--fg-1)" }}>{m.v}</div>
            <div className="r-meta" style={{ marginTop: 4 }}>{m.s}</div>
          </div>
        ))}
      </div>

      {/* filter bar */}
      <div style={{ display: "flex", gap: 8, marginBottom: "var(--rd-block-sm)", flexWrap: "wrap", alignItems: "center" }}>
        <div style={{ position: "relative", flex: mobile ? "1 1 100%" : "0 0 240px" }}>
          <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--fg-5)" }}>⌕</span>
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Buscar unidade..." style={{ all: "unset", boxSizing: "border-box", width: "100%", padding: "9px 12px 9px 30px", fontSize: 13, fontFamily: "var(--font-body)", color: "var(--fg-1)", background: "var(--surface-hi)", border: "1px solid var(--border-3)" }} />
        </div>
        <div style={{ display: "flex", gap: 4 }}>
          {[{ id: "all", l: "Todos" }, { id: "disponivel", l: "Disponível" }, { id: "alugada", l: "Alugada" }].map((s) => (
            <button key={s.id} onClick={() => setFStatus(s.id)} style={{ all: "unset", cursor: "pointer", padding: "8px 12px", fontFamily: "var(--font-mono)", fontSize: 10, letterSpacing: "0.5px", textTransform: "uppercase", border: `1px solid ${fStatus === s.id ? "var(--indigo)" : "var(--border-3)"}`, background: fStatus === s.id ? "oklch(0.339 0.179 301.68 / 0.18)" : "transparent", color: fStatus === s.id ? "var(--fg-1)" : "var(--fg-4)" }}>{s.l}</button>
          ))}
        </div>
        <div style={{ flex: mobile ? "1 1 100%" : "0 0 200px" }}>
          <FSelect value={fEd} onChange={(e) => setFEd(e.target.value)}><option value="all">Todos os edifícios</option>{D.edificios.map((ed) => <option key={ed.id} value={ed.id}>{ed.nome}</option>)}</FSelect>
        </div>
        {(query || fEd !== "all" || fStatus !== "all") && <span className="r-meta">{filtered.length} resultado(s)</span>}
      </div>

      <div className={isB ? "" : "r-panel"} style={isB ? { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 12, alignItems: "start" } : undefined}>
        {filtered.length === 0 && <div style={{ padding: "40px 24px", textAlign: "center", gridColumn: "1 / -1" }}><span className="r-meta">Nenhuma unidade corresponde aos filtros.</span></div>}
        {filtered.map((u, i) => {
          const ed = D.edificios.find((e) => e.id === u.edificio_id);
          const isRem = removing.has(u.id);
          return (
            <div key={u.id} style={{ opacity: isRem ? 0 : 1, transform: isRem ? "scale(0.97)" : "scale(1)", transition: "opacity 220ms ease, transform 220ms ease", ...(isB ? { border: "1px solid var(--border-3)", background: "var(--surface)" } : { borderTop: i > 0 ? "1px solid var(--border-3)" : "none" }) }}>
              <div style={{ padding: "var(--rd-row-y) var(--rd-row-x)", display: "flex", flexDirection: isB ? "column" : "row", alignItems: isB ? "stretch" : "center", justifyContent: "space-between", gap: isB ? 14 : 12, flexWrap: mobile ? "wrap" : "nowrap" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 14, minWidth: 0, flex: 1 }}>
                  {!isB && <span style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--fg-5)", width: 20 }}>{String(i + 1).padStart(2, "0")}</span>}
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div className="r-subhead" style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{u.nome}</div>
                    <div className="r-meta" style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{ed?.nome.replace("Edifício ", "").replace("Centro Empresarial ", "CE ")} · {u.area_m2} m²{u.valor_visivel ? "" : " · valor oculto"}</div>
                  </div>
                  {isB && <Badge status={u.status} />}
                </div>
                {isB && <div style={{ height: 1, background: "var(--border-3)" }} />}
                <div style={{ display: "flex", alignItems: "center", gap: mobile ? 12 : 18, justifyContent: isB ? "space-between" : "flex-start" }}>
                  <span className="r-data" style={{ fontSize: 14 }}>{D.fmtBRL(u.valor_mensal)}<span className="r-meta">/mês</span></span>
                  {!isB && <Badge status={u.status} />}
                  <div style={{ display: "flex", gap: 6 }}>
                    <button onClick={() => setModal({ mode: "edit", unit: u })} className="r-ghostbtn" style={{ all: "unset", cursor: "pointer", fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--fg-3)", padding: "5px 9px", border: "1px solid var(--border-3)", textTransform: "uppercase", letterSpacing: "0.5px" }}>Editar</button>
                    <button onClick={() => del(u)} className="r-ghostbtn" style={{ all: "unset", cursor: "pointer", fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--danger-fg)", padding: "5px 9px", border: "1px solid color-mix(in oklch, var(--destructive) 30%, transparent)", textTransform: "uppercase", letterSpacing: "0.5px" }}>Remover</button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ── EDIFÍCIOS ─────────────────────────────────────────────────────────── */
function EdificiosScreen({ mobile, variant }) {
  const isB = variant === "B" && !mobile;
  const [units, setUnits] = useState(D.unidades);
  const [list, setList] = useState(D.edificios);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ nome: "", endereco: "" });
  const [editId, setEditId] = useState(null);
  const [edit, setEdit] = useState({ nome: "", endereco: "" });
  const [expanded, setExpanded] = useState(null);
  const [unitModal, setUnitModal] = useState(null);

  function create(e) { e.preventDefault(); setList((l) => [...l, { ...form, id: "n" + Date.now() }]); setForm({ nome: "", endereco: "" }); setShowForm(false); }
  function save() { setList((l) => l.map((x) => (x.id === editId ? { ...x, ...edit } : x))); setEditId(null); }
  function saveUnit(u) { setUnits((us) => us.map((x) => (x.id === u.id ? u : x))); setUnitModal(null); }

  const pad = mobile ? "var(--rd-page-y) var(--rd-gutter-m) 80px" : "var(--rd-page-y) var(--rd-gutter) 64px";
  return (
    <div className="r-fade" style={{ padding: pad }}>
      {unitModal && <UnitFormModal mode="edit" initial={unitModal} onClose={() => setUnitModal(null)} onSave={saveUnit} />}
      <PageHeader eyebrow="E.LIST · EDIFÍCIOS" title="Edifícios." subtitle={`${list.length} cadastrado${list.length !== 1 ? "s" : ""}`} mobile={mobile}
        cta={{ label: showForm ? "Fechar" : "Novo Edifício", code: showForm ? "×" : "E+", onClick: () => setShowForm((v) => !v) }} />
      {showForm && (
        <div style={{ border: "1px solid var(--indigo)", padding: mobile ? 18 : 24, marginBottom: "var(--rd-block)", background: "var(--surface)" }}>
          <Eyebrow tone="indigo" style={{ marginBottom: 16 }}>Novo Edifício</Eyebrow>
          <form onSubmit={create}>
            <div style={{ display: "grid", gridTemplateColumns: mobile ? "1fr" : "1fr 1.4fr", gap: 14, marginBottom: 16 }}>
              <FormField label="Nome"><FInput value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} placeholder="Nome do edifício" required /></FormField>
              <FormField label="Endereço"><FInput value={form.endereco} onChange={(e) => setForm({ ...form, endereco: e.target.value })} placeholder="Endereço completo" required /></FormField>
            </div>
            <Btn type="submit" code="✓">Criar Edifício</Btn>
          </form>
        </div>
      )}
      <div className={isB ? "" : "r-panel"} style={isB ? { display: "grid", gridTemplateColumns: mobile ? "1fr" : "1fr 1fr", gap: 12, alignItems: "start" } : undefined}>
        {list.map((ed, i) => {
          const eunits = units.filter((u) => u.edificio_id === ed.id);
          return (
            <div key={ed.id} style={{ padding: "var(--rd-row-x)", ...(isB ? { border: "1px solid var(--border-3)", background: "var(--surface)" } : { borderTop: i > 0 ? "1px solid var(--border-3)" : "none" }) }}>
              {editId === ed.id ? (
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  <div style={{ display: "grid", gridTemplateColumns: mobile ? "1fr" : "1fr 1.4fr", gap: 12 }}>
                    <FormField label="Nome"><FInput value={edit.nome} onChange={(e) => setEdit({ ...edit, nome: e.target.value })} /></FormField>
                    <FormField label="Endereço"><FInput value={edit.endereco} onChange={(e) => setEdit({ ...edit, endereco: e.target.value })} /></FormField>
                  </div>
                  <div style={{ display: "flex", gap: 8 }}><Btn onClick={save} style={{ padding: "8px 16px" }}>Salvar</Btn><Btn variant="outline" onClick={() => setEditId(null)} style={{ padding: "8px 16px" }}>Cancelar</Btn></div>
                </div>
              ) : (
                <div>
                  <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
                    <div style={{ display: "flex", gap: 14, minWidth: 0 }}>
                      <span style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--fg-5)", marginTop: 4 }}>{String(i + 1).padStart(2, "0")}</span>
                      <div style={{ minWidth: 0 }}>
                        <div className="r-subhead" style={{ fontSize: 16 }}>{ed.nome}</div>
                        <div className="r-meta" style={{ fontSize: 11, marginTop: 3 }}>{ed.endereco}</div>
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                      <button onClick={() => { setEditId(ed.id); setEdit({ nome: ed.nome, endereco: ed.endereco }); }} className="r-ghostbtn" style={{ all: "unset", cursor: "pointer", fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--fg-3)", padding: "5px 9px", border: "1px solid var(--border-3)", textTransform: "uppercase", letterSpacing: "0.5px" }}>Editar</button>
                      <button onClick={() => setList((l) => l.filter((x) => x.id !== ed.id))} className="r-ghostbtn" style={{ all: "unset", cursor: "pointer", fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--danger-fg)", padding: "5px 9px", border: "1px solid color-mix(in oklch, var(--destructive) 30%, transparent)", textTransform: "uppercase", letterSpacing: "0.5px" }}>Remover</button>
                    </div>
                  </div>
                  {(() => {
                    const alugadas = eunits.filter((u) => u.status === "alugada");
                    const occ = eunits.length ? Math.round((alugadas.length / eunits.length) * 100) : 0;
                    const mrr = alugadas.reduce((s, u) => s + (u.valor_mensal || 0), 0);
                    const m2 = eunits.reduce((s, u) => s + (u.area_m2 || 0), 0);
                    const ordered = [...alugadas, ...eunits.filter((u) => u.status !== "alugada")]; // contiguous: rented first
                    return (
                      <div style={{ marginTop: 14, paddingLeft: mobile ? 0 : 28 }}>
                        <div style={{ display: "flex", gap: 20, marginBottom: 10, flexWrap: "wrap" }}>
                          <div><span className="r-label" style={{ fontSize: 9 }}>Ocupação</span><div className="r-data" style={{ fontSize: 15, color: "var(--fg-1)", marginTop: 3 }}>{occ}%</div></div>
                          <div><span className="r-label" style={{ fontSize: 9 }}>MRR</span><div className="r-data" style={{ fontSize: 15, color: "var(--fg-1)", marginTop: 3 }}>{D.fmtBRLk(mrr)}</div></div>
                          <div><span className="r-label" style={{ fontSize: 9 }}>Área</span><div className="r-data" style={{ fontSize: 15, color: "var(--fg-1)", marginTop: 3 }}>{m2} m²</div></div>
                          <div><span className="r-label" style={{ fontSize: 9 }}>Unidades</span><div className="r-data" style={{ fontSize: 15, color: "var(--fg-1)", marginTop: 3 }}>{eunits.length}</div></div>
                        </div>
                        <div style={{ display: "flex", gap: 3, marginBottom: 6 }}>
                          {ordered.map((u) => <div key={u.id} title={`${u.nome} · ${u.status === "alugada" ? "Alugada" : "Disponível"}`} style={{ flex: 1, height: 8, background: u.status === "alugada" ? "var(--primary-hover)" : "var(--surface-hi)", border: u.status === "alugada" ? "none" : "1px solid var(--border-3)" }} />)}
                          {!eunits.length && <span className="r-meta">Sem unidades cadastradas</span>}
                        </div>
                        {eunits.length > 0 && (
                          <div style={{ display: "flex", gap: 14, alignItems: "center", marginBottom: 4 }}>
                            <span className="r-meta" style={{ display: "inline-flex", alignItems: "center", gap: 5 }}><span style={{ width: 8, height: 8, background: "var(--primary-hover)" }} />{alugadas.length} alugada(s)</span>
                            <span className="r-meta" style={{ display: "inline-flex", alignItems: "center", gap: 5 }}><span style={{ width: 8, height: 8, background: "var(--surface-hi)", border: "1px solid var(--border-3)" }} />{eunits.length - alugadas.length} disponível(is)</span>
                          </div>
                        )}
                        {eunits.length > 0 && (
                          <button onClick={() => setExpanded(expanded === ed.id ? null : ed.id)} className="r-ghostbtn" style={{ all: "unset", cursor: "pointer", fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--indigo)", letterSpacing: "0.5px", textTransform: "uppercase", marginTop: 6, display: "inline-block" }}>{expanded === ed.id ? "⌃ Ocultar unidades" : `⌄ Ver ${eunits.length} unidade(s)`}</button>
                        )}
                        {expanded === ed.id && (
                          <div style={{ marginTop: 10, border: "1px solid var(--border-3)" }}>
                            {eunits.map((u, ui) => (
                              <div key={u.id} onClick={() => setUnitModal(u)} className="r-rowlink" title={u.descricao} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, padding: "9px 12px", borderTop: ui > 0 ? "1px solid var(--border-3)" : "none", background: "var(--surface-hi)" }}>
                                <div style={{ minWidth: 0 }}>
                                  <span className="r-data" style={{ fontSize: 13, color: "var(--fg-1)" }}>{u.nome}</span>
                                  <span className="r-meta" style={{ display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 220 }}>{u.descricao}</span>
                                </div>
                                <div style={{ display: "flex", alignItems: "center", gap: 12, flexShrink: 0 }}>
                                  <span className="r-meta">{u.area_m2} m²</span>
                                  <span className="r-data" style={{ fontSize: 12 }}>{D.fmtBRL(u.valor_mensal)}</span>
                                  <Badge status={u.status} />
                                  <span className="r-meta" style={{ color: "var(--indigo)" }}>Editar →</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })()}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

Object.assign(window, { UnidadesScreen, EdificiosScreen, UnitFormModal, CoverPhotoField, FLabel, FInput, FSelect, FormField, ErrLine, FormCheck });
