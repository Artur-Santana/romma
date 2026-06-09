"use client"

import { useEffect, useState } from "react";
import { criarEdificio, editarEdificio, deletarEdificio } from "@/actions/edificios";
import { getEdificios } from "@/lib/queries-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import PageHeader from "@/components/ui/PageHeader";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

function SkeletonEdificios() {
  return (
    <div className="romma-page p-12 bg-background min-h-full">
      <div className="flex flex-col gap-0 border border-border-3 bg-surface">
        {[0, 1, 2].map((i) => (
          <div key={i} className={cn("p-5", i > 0 && "border-t border-border-3")}>
            <Skeleton className="h-6 w-1/3 rounded-none" />
            <Skeleton className="h-4 w-2/3 mt-2 rounded-none" />
          </div>
        ))}
      </div>
    </div>
  );
}

export default function GestaoEdificios() {
  const [edificios, setEdificios] = useState([]);
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

  async function carregarEdificios() {
    setEdificios(await getEdificios() ?? []);
  }

  useEffect(() => {
    async function fetchDados() {
      setEdificios(await getEdificios() ?? []);
      setLoadingInicial(false);
    }
    fetchDados();
  }, []);

  async function handleCriar(e) {
    e.preventDefault();
    setLoading(true);
    setErro(null);
    const result = await criarEdificio(form);
    if (result.status === 200) {
      resetForm();
      setShowForm(false);
      await carregarEdificios();
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
      await carregarEdificios();
    } else {
      setErroEdit(result.erroMessage);
    }
    setLoading(false);
  }

  async function handleDeletar(id) {
    setErro(null);
    const result = await deletarEdificio(id);
    if (result.status === 200) {
      await carregarEdificios();
    } else {
      setErro(result.erroMessage);
    }
  }

  if (loadingInicial) return <SkeletonEdificios />;

  return (
    <div className="romma-page p-12 bg-background min-h-full">
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
                "bg-indigo text-fg-1 font-body font-bold text-[12px] tracking-[1.2px] uppercase px-8 py-[14px] rounded-none mt-2",
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

      <div className="flex flex-col gap-0 border border-border-3 bg-surface">
        {edificios.length === 0 && (
          <p className="px-5 py-4 font-mono text-[12px] text-fg-5">Nenhum edifício cadastrado.</p>
        )}
        {edificios.map((edificio, i) => (
          <div
            key={edificio.id}
            className={cn("p-5", i > 0 && "border-t border-border-3")}
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
                    className="bg-indigo text-fg-1 font-body font-bold text-[11px] tracking-[1.2px] uppercase px-5 py-2 rounded-none cursor-pointer"
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
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="font-body font-bold text-[15px] text-fg-1">{edificio.nome}</p>
                  <p className="font-mono text-[11px] text-fg-4 mt-0.5 tracking-[0.3px]">{edificio.endereco}</p>
                </div>
                <div className="flex gap-2 shrink-0">
                  <button
                    onClick={() => handleEditar(edificio)}
                    style={{ all: "unset", cursor: "pointer" }}
                    className="font-mono text-[11px] text-fg-3 px-3 py-1.5 border border-border-3 hover:text-fg-1 hover:border-border-1"
                  >
                    Editar
                  </button>
                  <button
                    onClick={() => handleDeletar(edificio.id)}
                    style={{ all: "unset", cursor: "pointer" }}
                    className="font-mono text-[11px] text-danger-fg px-3 py-1.5 border border-danger-fg hover:bg-[var(--danger-bg2)]"
                  >
                    Remover
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
