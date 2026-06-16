"use client"

import { useEffect, useState } from "react";
import { criarEdificio, editarEdificio, deletarEdificio } from "@/actions/edificios";
import { getEdificios, getUnidades } from "@/lib/queries-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import PageHeader from "@/components/ui/PageHeader";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import UnifiedUnidadeModal from "@/components/ui/UnifiedUnidadeModal";

function fmtBRLk(v) {
  if (v >= 1000) {
    const k = v / 1000
    const formatted = k % 1 === 0
      ? k.toLocaleString("pt-BR")
      : k.toLocaleString("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 1 })
    return `R$ ${formatted}k`
  }
  return `R$ ${v.toLocaleString("pt-BR")}`
}

function computeStats(lista) {
  const total = lista.length
  const alugadas = lista.filter(u => u.status === "alugada").length
  const disponiveis = total - alugadas
  const ocupacaoPct = total > 0 ? Math.round((alugadas / total) * 100) : 0
  const mrr = lista
    .filter(u => u.status === "alugada")
    .reduce((s, u) => s + (parseFloat(u.valor_mensal) || 0), 0)
  const areaTotal = lista.reduce((s, u) => s + (parseFloat(u.area_m2) || 0), 0)
  return { total, alugadas, disponiveis, ocupacaoPct, mrr, areaTotal }
}

function OccupationBar({ alugadas, disponiveis }) {
  const total = alugadas + disponiveis
  if (total === 0) {
    return (
      <div style={{ height: 6, background: "var(--border-3)", width: "100%" }} />
    )
  }
  // Per-unit segments, alugadas grouped first (no interleaving) — matches design ref.
  const segments = []
  for (let i = 0; i < alugadas; i++) segments.push("alugada")
  for (let i = 0; i < disponiveis; i++) segments.push("disponivel")
  return (
    <div style={{ display: "flex", gap: 3, height: 6, width: "100%" }}>
      {segments.map((s, i) => (
        <div
          key={i}
          style={{ flex: 1, background: s === "alugada" ? "var(--indigo)" : "var(--border-3)" }}
        />
      ))}
    </div>
  )
}

function SkeletonEdificios() {
  return (
    <div className="romma-page r-fade" style={{ paddingTop: 18, paddingRight: 0, paddingBottom: 64, paddingLeft: 0, minHeight: "100%" }}>
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(min(100%, 520px), 1fr))",
        gap: 20,
        marginTop: 32,
      }}>
        {[0, 1, 2, 3].map((i) => (
          <div key={i} style={{ border: "1px solid var(--border-3)", background: "var(--surface)", padding: 20 }}>
            <Skeleton className="h-5 w-1/3 rounded-none" />
            <Skeleton className="h-3 w-2/3 mt-2 rounded-none" />
            <Skeleton className="h-8 w-full mt-4 rounded-none" />
            <Skeleton className="h-1.5 w-full mt-4 rounded-none" />
            <Skeleton className="h-8 w-32 mt-4 rounded-none" />
          </div>
        ))}
      </div>
    </div>
  )
}

export default function GestaoEdificios() {
  const [edificios, setEdificios] = useState([]);
  const [unidades, setUnidades] = useState([]);
  const [expandidos, setExpandidos] = useState(new Set());
  const [modalState, setModalState] = useState(null);
  const [loadingInicial, setLoadingInicial] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ nome: "", endereco: "" });
  const [editandoId, setEditandoId] = useState(null);
  const [formEdit, setFormEdit] = useState({ nome: "", endereco: "" });
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState(null);
  const [erroEdit, setErroEdit] = useState(null);

  function resetForm() {
    setForm({ nome: "", endereco: "" });
  }

  async function carregarDados() {
    const [edificiosList, unidadesList] = await Promise.all([
      getEdificios(),
      getUnidades(),
    ])
    setEdificios(edificiosList ?? [])
    setUnidades(unidadesList ?? [])
  }

  useEffect(() => {
    async function fetchDados() {
      await carregarDados()
      setLoadingInicial(false)
    }
    fetchDados()
  }, []);

  async function handleCriar(e) {
    e.preventDefault();
    setLoading(true);
    setErro(null);
    const result = await criarEdificio(form);
    if (result.status === 200) {
      resetForm();
      setShowForm(false);
      await carregarDados();
    } else {
      setErro(result.erroMessage);
    }
    setLoading(false);
  }

  async function handleEditar(edificio) {
    setErro(null);
    setErroEdit(null);
    setFormEdit({ nome: edificio.nome, endereco: edificio.endereco });
    setEditandoId(edificio.id);
  }

  async function handleSalvar() {
    setLoading(true);
    setErroEdit(null);
    const result = await editarEdificio(editandoId, formEdit);
    if (result.status === 200) {
      setEditandoId(null);
      setFormEdit({ nome: "", endereco: "" });
      await carregarDados();
    } else {
      setErroEdit(result.erroMessage);
    }
    setLoading(false);
  }

  async function handleDeletar(id) {
    setErro(null);
    const result = await deletarEdificio(id);
    if (result.status === 200) {
      await carregarDados();
    } else {
      setErro(result.erroMessage);
    }
  }

  function toggleExpandido(edificioId) {
    setExpandidos(prev => {
      const next = new Set(prev)
      next.has(edificioId) ? next.delete(edificioId) : next.add(edificioId)
      return next
    })
  }

  // Derived map — computed inline before render
  const unidadesPorEdificio = unidades.reduce((acc, u) => {
    if (!acc[u.edificio_id]) acc[u.edificio_id] = []
    acc[u.edificio_id].push(u)
    return acc
  }, {})

  if (loadingInicial) return <SkeletonEdificios />;

  return (
    <div className="romma-page r-fade" style={{ paddingTop: 18, paddingRight: 0, paddingBottom: 64, paddingLeft: 0, minHeight: "100%" }}>
      <PageHeader
        eyebrow="E.LIST · EDIFÍCIOS"
        title="Edifícios."
        subtitle={`${edificios.length} cadastrado${edificios.length !== 1 ? "s" : ""}`}
        cta={{ label: showForm ? "Fechar" : "Novo Edifício", code: showForm ? "×" : "E+", onClick: () => { setShowForm(v => !v); setErro(null); } }}
      />

      {showForm && (
        <div className="border border-indigo p-8 mb-8 bg-surface">
          <span className="eyebrow eyebrow--indigo mb-5 block">NOVO EDIFÍCIO</span>
          <form onSubmit={handleCriar}>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <label className="flex flex-col gap-1.5">
                <span className="font-mono text-[10px] tracking-[1px] uppercase text-fg-4">Nome</span>
                <Input
                  type="text"
                  placeholder="Nome do edifício"
                  value={form.nome}
                  onChange={(e) => setForm({ ...form, nome: e.target.value })}
                  required
                  className="h-9 rounded-none border-border-3 bg-surface text-fg-1"
                />
              </label>
              <label className="flex flex-col gap-1.5">
                <span className="font-mono text-[10px] tracking-[1px] uppercase text-fg-4">Endereço</span>
                <Input
                  type="text"
                  placeholder="Endereço"
                  value={form.endereco}
                  onChange={(e) => setForm({ ...form, endereco: e.target.value })}
                  required
                  className="h-9 rounded-none border-border-3 bg-surface text-fg-1"
                />
              </label>
            </div>

            {erro && (
              <div className="bg-[var(--danger-bg2)] border-l-2 border-l-danger-fg px-4 py-3 font-mono text-[12px] text-danger-fg mb-4">
                {erro}
              </div>
            )}

            <Button
              type="submit"
              disabled={loading}
              className={cn(
                "bg-indigo text-fg-1 font-body font-bold text-[14px] tracking-[1.2px] uppercase px-10 py-[18px] rounded-none mt-2",
                loading ? "opacity-60 cursor-not-allowed" : "cursor-pointer"
              )}
            >
              {loading ? "Salvando..." : "Criar Edifício"}
            </Button>
          </form>
        </div>
      )}

      {erro && !showForm && (
        <div className="bg-[var(--danger-bg2)] border-l-2 border-l-danger-fg px-4 py-3 font-mono text-[13px] text-danger-fg mb-4">
          {erro}
        </div>
      )}

      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(min(100%, 520px), 1fr))",
        gap: 20,
        alignItems: "start",
      }}>
        {edificios.length === 0 && (
          <p className="font-mono text-[12px] text-fg-5">Nenhum edifício cadastrado.</p>
        )}
        {edificios.map((edificio, idx) => {
          const lista = unidadesPorEdificio[edificio.id] ?? []
          const stats = computeStats(lista)
          const isExpanded = expandidos.has(edificio.id)
          const n = lista.length

          return (
            <div
              key={edificio.id}
              data-testid="edificio-card"
              style={{
                border: "1px solid var(--border-3)",
                background: "var(--surface)",
                padding: 20,
              }}
            >
              {editandoId === edificio.id ? (
                <div className="flex flex-col gap-3">
                  <div className="grid grid-cols-2 gap-4">
                    <label className="flex flex-col gap-1.5">
                      <span className="font-mono text-[10px] tracking-[1px] uppercase text-fg-4">Nome</span>
                      <Input
                        value={formEdit.nome}
                        onChange={(e) => setFormEdit({ ...formEdit, nome: e.target.value })}
                        className="h-9 rounded-none border-border-3 bg-surface text-fg-1"
                      />
                    </label>
                    <label className="flex flex-col gap-1.5">
                      <span className="font-mono text-[10px] tracking-[1px] uppercase text-fg-4">Endereço</span>
                      <Input
                        value={formEdit.endereco}
                        onChange={(e) => setFormEdit({ ...formEdit, endereco: e.target.value })}
                        className="h-9 rounded-none border-border-3 bg-surface text-fg-1"
                      />
                    </label>
                  </div>
                  {erroEdit && (
                    <div className="bg-[var(--danger-bg2)] border-l-2 border-l-danger-fg px-4 py-3 font-mono text-[12px] text-danger-fg">
                      {erroEdit}
                    </div>
                  )}
                  <div className="flex gap-2 mt-1">
                    <Button
                      onClick={handleSalvar}
                      disabled={loading}
                      className="bg-indigo text-fg-1 font-body font-bold text-[13px] tracking-[1.2px] uppercase px-7 py-3 rounded-none cursor-pointer"
                    >
                      {loading ? "Salvando..." : "Salvar"}
                    </Button>
                    <button
                      onClick={() => { setEditandoId(null); setErroEdit(null); }}
                      style={{ all: "unset", cursor: "pointer" }}
                      className="font-mono text-[11px] text-fg-4 px-4 py-2 border border-border-3 hover:text-fg-1"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  {/* Card Header Row */}
                  <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16 }}>
                    <div style={{ display: "flex", gap: 14, minWidth: 0 }}>
                      <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--fg-5)", marginTop: 5, flexShrink: 0 }}>
                        {String(idx + 1).padStart(2, "0")}
                      </span>
                      <div style={{ minWidth: 0 }}>
                        <p style={{ fontFamily: "var(--font-body)", fontWeight: 700, fontSize: 20, color: "var(--fg-1)", margin: 0 }}>
                          {edificio.nome}
                        </p>
                        <p style={{ fontFamily: "var(--font-mono)", fontSize: 13, color: "var(--fg-4)", marginTop: 3 }}>
                          {edificio.endereco}
                        </p>
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
                      <button
                        onClick={() => handleEditar(edificio)}
                        style={{
                          all: "unset",
                          cursor: "pointer",
                          fontFamily: "var(--font-mono)",
                          fontSize: 10,
                          letterSpacing: "1px",
                          textTransform: "uppercase",
                          color: "var(--fg-3)",
                          padding: "7px 13px",
                          border: "1px solid var(--fg-5)",
                        }}
                        className="hover:text-fg-1"
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => handleDeletar(edificio.id)}
                        style={{
                          all: "unset",
                          cursor: "pointer",
                          fontFamily: "var(--font-mono)",
                          fontSize: 10,
                          letterSpacing: "1px",
                          textTransform: "uppercase",
                          color: "var(--danger-fg)",
                          padding: "7px 13px",
                          border: "1px solid var(--danger-fg)",
                        }}
                        className="hover:bg-[var(--danger-bg2)]"
                      >
                        Remover
                      </button>
                    </div>
                  </div>

                  {/* Stats Row — horizontal inline */}
                  <div style={{ display: "flex", gap: 16, marginTop: 11, flexWrap: "wrap" }}>
                    {[
                      { l: "Ocupação", v: `${stats.ocupacaoPct}%`, gold: false },
                      { l: "MRR", v: fmtBRLk(stats.mrr), gold: false },
                      { l: "Área", v: `${stats.areaTotal} m²`, gold: false },
                      { l: "Unidades", v: stats.total, gold: false },
                    ].map((m) => (
                      <div key={m.l}>
                        <div style={{
                          fontFamily: "var(--font-mono)",
                          fontSize: 9.5,
                          letterSpacing: "1px",
                          textTransform: "uppercase",
                          marginBottom: 6,
                          color: m.gold ? "var(--highlight)" : "var(--fg-4)",
                        }}>
                          {m.l}
                        </div>
                        <div style={{
                          fontFamily: "var(--font-display)",
                          fontWeight: 700,
                          fontSize: 15,
                          color: m.gold ? "var(--highlight)" : "var(--fg-1)",
                          whiteSpace: "nowrap",
                        }}>
                          {m.v}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Occupation Bar */}
                  <div style={{ marginTop: 10 }}>
                    <OccupationBar alugadas={stats.alugadas} disponiveis={stats.disponiveis} />
                    <p className="r-meta" style={{ color: "var(--fg-4)", marginTop: 4, display: "flex", alignItems: "center", gap: 7 }}>
                      <span style={{ width: 8, height: 8, background: "var(--indigo)", flexShrink: 0, display: "inline-block" }} />
                      {stats.alugadas} alugada(s) · {stats.disponiveis} disponível(is)
                    </p>
                  </div>

                  {/* Expand Link */}
                  <div style={{ marginTop: 9 }}>
                    <button
                      onClick={() => toggleExpandido(edificio.id)}
                      disabled={n === 0}
                      style={{
                        all: "unset",
                        cursor: n === 0 ? "not-allowed" : "pointer",
                        opacity: n === 0 ? 0.4 : 1,
                        fontFamily: "var(--font-mono)",
                        fontSize: 10.5,
                        letterSpacing: "0.5px",
                        textTransform: "uppercase",
                        color: "var(--indigo)",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 6,
                      }}
                    >
                      <span style={{ fontSize: 12 }}>{isExpanded ? "⌃" : "›"}</span>
                      {isExpanded ? "Ocultar unidades" : `Ver ${n} unidade${n !== 1 ? "s" : ""}`}
                    </button>
                  </div>

                  {/* Accordion Panel */}
                  {isExpanded && (
                    <div style={{ marginTop: 8, borderTop: "1px solid var(--border-3)" }}>
                      {lista.map((u) => {
                        const alugada = u.status === "alugada"
                        return (
                          <div
                            key={u.id}
                            data-testid="unidade-row"
                            onClick={() => setModalState({ unidade: u })}
                            style={{
                              padding: "7px 14px",
                              cursor: "pointer",
                              borderBottom: "1px solid var(--border-3)",
                              background: "transparent",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "space-between",
                              gap: 16,
                              transition: "background var(--dur-fast)",
                            }}
                            onMouseEnter={e => e.currentTarget.style.background = "var(--surface-hi)"}
                            onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                          >
                            {/* Left — name + description */}
                            <div style={{ minWidth: 0 }}>
                              <div style={{ fontFamily: "var(--font-body)", fontWeight: 600, fontSize: 13, color: "var(--fg-1)" }}>
                                {u.nome}
                              </div>
                              {u.descricao && (
                                <div style={{
                                  fontFamily: "var(--font-mono)",
                                  fontSize: 11,
                                  color: "var(--fg-4)",
                                  marginTop: 3,
                                  whiteSpace: "nowrap",
                                  overflow: "hidden",
                                  textOverflow: "ellipsis",
                                  maxWidth: 260,
                                }}>
                                  {u.descricao}
                                </div>
                              )}
                            </div>

                            {/* Right — area · value · pill · Editar */}
                            <div style={{ display: "flex", gap: 14, alignItems: "center", flexShrink: 0 }}>
                              <span style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--fg-4)" }}>
                                {u.area_m2 ? `${u.area_m2} m²` : "—"}
                              </span>
                              <span style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--fg-1)" }}>
                                {`R$ ${(parseFloat(u.valor_mensal) || 0).toLocaleString("pt-BR")}`}
                              </span>
                              <span style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: 6,
                                fontFamily: "var(--font-mono)",
                                fontSize: 9.5,
                                letterSpacing: "0.5px",
                                textTransform: "uppercase",
                                padding: "4px 8px",
                                background: alugada
                                  ? "color-mix(in oklch, var(--color-primary-hover) 20%, transparent)"
                                  : "color-mix(in oklch, var(--success) 16%, transparent)",
                                color: alugada ? "var(--color-primary-hover)" : "var(--success)",
                              }}>
                                <span style={{
                                  width: 7, height: 7, flexShrink: 0,
                                  background: alugada ? "var(--color-primary-hover)" : "var(--success)",
                                }} />
                                {alugada ? "Alugada" : "Disponível"}
                              </span>
                              <span style={{
                                fontFamily: "var(--font-mono)",
                                fontSize: 10.5,
                                letterSpacing: "0.5px",
                                textTransform: "uppercase",
                                color: "var(--indigo)",
                                display: "inline-flex",
                                alignItems: "center",
                                gap: 5,
                              }}>
                                Editar <span style={{ fontSize: 12 }}>→</span>
                              </span>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </>
              )}
            </div>
          )
        })}
      </div>

      {modalState && (
        <UnifiedUnidadeModal
          mode="edit"
          initial={modalState.unidade}
          edificios={edificios}
          lockEdificio={true}
          onClose={() => setModalState(null)}
          onSaved={() => { carregarDados(); setModalState(null) }}
        />
      )}
    </div>
  );
}
