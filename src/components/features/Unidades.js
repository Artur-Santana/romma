"use client"

import { useEffect, useState } from "react";
import { getEdificios, getUnidades } from "@/lib/queries-client";
import UnidadeCard from "@/components/ui/UnidadeCard";
import { criarUnidade, editarUnidade, deletarUnidade } from "@/actions/unidades";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import PageHeader from "@/components/ui/PageHeader";

export default function Unidades({}) {
  const [unidades, setUnidades] = useState([]);
  const [listaEdificios, setListaEdificios] = useState([]);
  const [editandoId, setEditandoId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [erro, setErro] = useState(null)
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    nome: "",
    descricao: "",
    area_m2: "",
    valor_mensal: "",
    valor_visivel: false,
    status: "disponivel",
    edificio_id: "",
  });
  const [formEdit, setFormEdit] = useState({
    nome: "",
    descricao: "",
    area_m2: "",
    valor_mensal: "",
    valor_visivel: false,
    status: "",
  });

  async function carregarDados() {
    setListaEdificios(await getEdificios());
    setUnidades(await getUnidades());
  }

  function resetForm() {
    setForm({ nome: "", descricao: "", area_m2: "", valor_mensal: "", valor_visivel: false, status: "disponivel", edificio_id: "" })
  }

  function resetFormEdit() {
    setFormEdit({ nome: "", descricao: "", area_m2: "", valor_mensal: "", valor_visivel: false, status: "" })
  }

  async function handleEditarUnidade(unidade) {
    setFormEdit({
      nome: unidade.nome,
      descricao: unidade.descricao,
      area_m2: unidade.area_m2,
      valor_mensal: unidade.valor_mensal,
      valor_visivel: unidade.valor_visivel,
      status: unidade.status,
    });
    setEditandoId(unidade.id);
  }

  async function handleDeletarUnidade(id) {
    const result = await deletarUnidade(id);
    if (result.status === 200) {
      setErro(null)
      setUnidades(await getUnidades());
    } else {
      setErro(result.erroMessage)
    }
  }

  async function handleSalvarUnidade(id) {
    const result = await editarUnidade(id, formEdit);
    if (result.status === 200) {
      setErro(null)
      setEditandoId(null)
      resetFormEdit()
      setUnidades(await getUnidades());
    } else {
      setErro(result.erroMessage)
    }
  }

  useEffect(() => {
    carregarDados();
  }, []);

  async function insertUnidade(e) {
    e.preventDefault();
    setLoading(true)
    setErro(null)
    const result = await criarUnidade(form);
    if (result.status === 200) {
      setErro(null)
      resetForm()
      setUnidades(await getUnidades());
      setShowForm(false)
    } else {
      setErro(result.erroMessage)
    }
    setLoading(false)
  }

  const disponiveis = unidades.filter(u => u.status === "disponivel").length
  const alugadas = unidades.filter(u => u.status === "alugada").length

  return (
    <div className="romma-page p-12 bg-background min-h-full">
      <PageHeader
        eyebrow="U.LIST · UNIDADES"
        title="Unidades."
        subtitle={`${disponiveis} disponíveis · ${alugadas} alugadas`}
        cta={{ label: showForm ? "Fechar" : "Nova Unidade", code: showForm ? "×" : "U+", onClick: () => setShowForm(v => !v) }}
      />

      {showForm && (
        <div className="border border-indigo p-8 mb-8 bg-surface">
          <span className="eyebrow eyebrow--indigo mb-5 block">NOVA UNIDADE</span>
          <form onSubmit={insertUnidade}>
            <div className="grid grid-cols-2 gap-4 mb-4">

              <label className="flex flex-col gap-1.5">
                <span className="font-mono text-[10px] tracking-[1px] uppercase text-fg-4">Edifício</span>
                <Select
                  value={form.edificio_id}
                  onValueChange={(v) => setForm({ ...form, edificio_id: v })}
                >
                  <SelectTrigger className="w-full h-9 rounded-none border-border-3 bg-surface text-fg-1 font-mono text-xs">
                    <SelectValue placeholder="Selecionar edifício..." />
                  </SelectTrigger>
                  <SelectContent>
                    {listaEdificios.map((edificio) => (
                      <SelectItem key={edificio.id} value={edificio.id}>
                        {edificio.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </label>

              <label className="flex flex-col gap-1.5">
                <span className="font-mono text-[10px] tracking-[1px] uppercase text-fg-4">Nome da unidade</span>
                <Input
                  type="text"
                  placeholder="Nome da unidade"
                  value={form.nome}
                  onChange={(e) => setForm({ ...form, nome: e.target.value })}
                  required
                  className="h-9 rounded-none border-border-3 bg-surface text-fg-1"
                />
              </label>

              <label className="flex flex-col gap-1.5">
                <span className="font-mono text-[10px] tracking-[1px] uppercase text-fg-4">Descrição</span>
                <Input
                  type="text"
                  placeholder="Descrição"
                  value={form.descricao}
                  onChange={(e) => setForm({ ...form, descricao: e.target.value })}
                  className="h-9 rounded-none border-border-3 bg-surface text-fg-1"
                />
              </label>

              <label className="flex flex-col gap-1.5">
                <span className="font-mono text-[10px] tracking-[1px] uppercase text-fg-4">Área (m²)</span>
                <Input
                  type="number"
                  placeholder="Área (m²)"
                  value={form.area_m2}
                  onChange={(e) => setForm({ ...form, area_m2: e.target.value })}
                  className="h-9 rounded-none border-border-3 bg-surface text-fg-1"
                />
              </label>

              <label className="flex flex-col gap-1.5">
                <span className="font-mono text-[10px] tracking-[1px] uppercase text-fg-4">Valor mensal (R$)</span>
                <Input
                  type="number"
                  placeholder="Valor mensal (R$)"
                  value={form.valor_mensal}
                  onChange={(e) => setForm({ ...form, valor_mensal: e.target.value })}
                  className="h-9 rounded-none border-border-3 bg-surface text-fg-1"
                />
              </label>

              <label className="flex flex-col gap-1.5">
                <span className="font-mono text-[10px] tracking-[1px] uppercase text-fg-4">Status</span>
                <Select
                  value={form.status}
                  onValueChange={(v) => setForm({ ...form, status: v })}
                >
                  <SelectTrigger className="w-full h-9 rounded-none border-border-3 bg-surface text-fg-1 font-mono text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="disponivel">Disponível</SelectItem>
                    <SelectItem value="alugada">Alugada</SelectItem>
                  </SelectContent>
                </Select>
              </label>

            </div>

            <div
              role="checkbox"
              aria-checked={form.valor_visivel}
              tabIndex={0}
              onClick={() => setForm({ ...form, valor_visivel: !form.valor_visivel })}
              onKeyDown={e => e.key === " " && setForm({ ...form, valor_visivel: !form.valor_visivel })}
              className="flex items-center gap-2 cursor-pointer mb-4"
            >
              <div className={cn(
                "w-4 h-4 border flex items-center justify-center shrink-0",
                form.valor_visivel ? "border-indigo bg-indigo" : "border-border-3 bg-transparent"
              )}>
                {form.valor_visivel && (
                  <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                    <path d="M1.5 5L4 7.5L8.5 2.5" stroke="white" strokeWidth="1.5" strokeLinecap="square" strokeLinejoin="miter" />
                  </svg>
                )}
              </div>
              <span className="font-mono text-[10px] text-fg-4 tracking-[1px] uppercase">Exibir valor publicamente</span>
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
              {loading ? "Salvando..." : "Criar Unidade"}
            </Button>
          </form>
        </div>
      )}

      <div className="flex flex-col gap-0 border border-border-3 bg-surface">
        {unidades.length === 0 && (
          <p className="px-5 py-4 font-mono text-[12px] text-fg-5">Nenhuma unidade cadastrada.</p>
        )}
        {unidades.map((unidade) => (
          <UnidadeCard
            key={unidade.id}
            unidade={unidade}
            editandoId={editandoId}
            nomeEdit={formEdit.nome}
            descricaoEdit={formEdit.descricao}
            area_m2Edit={formEdit.area_m2}
            valor_mensalEdit={formEdit.valor_mensal}
            valor_visivelEdit={formEdit.valor_visivel}
            setEditandoId={setEditandoId}
            setNomeEdit={(v) => setFormEdit({ ...formEdit, nome: v })}
            setDescricaoEdit={(v) => setFormEdit({ ...formEdit, descricao: v })}
            setArea_m2Edit={(v) => setFormEdit({ ...formEdit, area_m2: v })}
            setValor_mensalEdit={(v) => setFormEdit({ ...formEdit, valor_mensal: v })}
            setValor_visivelEdit={(v) => setFormEdit({ ...formEdit, valor_visivel: v })}
            statusEdit={formEdit.status}
            setStatusEdit={(v) => setFormEdit({ ...formEdit, status: v })}
            handleEditarUnidade={handleEditarUnidade}
            handleDeletarUnidade={handleDeletarUnidade}
            handleSalvarUnidade={handleSalvarUnidade}
          />
        ))}
      </div>
    </div>
  );
}
