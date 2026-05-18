"use client"

import { useEffect, useState } from "react";
import { getEdificios, getUnidades } from "@/lib/queries-client";
import UnidadeCard from "@/components/ui/UnidadeCard";
import { criarUnidade, editarUnidade, deletarUnidade } from "@/actions/unidades";

export default function Unidades({}) {
  const [unidades, setUnidades] = useState([]);
  const [listaEdificios, setListaEdificios] = useState([]);
  const [editandoId, setEditandoId] = useState(null);
  const [erro, setErro] = useState(null)
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
    const result = await criarUnidade(form);
    if (result.status === 200) {
      setErro(null)
      resetForm()
      setUnidades(await getUnidades());
    } else {
      setErro(result.erroMessage)
    }
  }

  return (
    <main>
      <form onSubmit={insertUnidade}>
        <select
          value={form.edificio_id}
          onChange={(e) => setForm({ ...form, edificio_id: e.target.value })}
        >
          {listaEdificios.map((edificio) => (
            <option key={edificio.id} value={edificio.id}>
              {edificio.nome}
            </option>
          ))}
        </select>
        <input
          placeholder="nome"
          value={form.nome}
          onChange={(e) => setForm({ ...form, nome: e.target.value })}
          type="text"
        />
        <input
          placeholder="descricao"
          value={form.descricao}
          onChange={(e) => setForm({ ...form, descricao: e.target.value })}
          type="text"
        />
        <input
          placeholder="area_m2"
          value={form.area_m2}
          onChange={(e) => setForm({ ...form, area_m2: e.target.value })}
          type="number"
        />
        <input
          placeholder="valor_mensal"
          value={form.valor_mensal}
          onChange={(e) => setForm({ ...form, valor_mensal: e.target.value })}
          type="number"
        />
        <select
          value={form.status}
          onChange={(e) => setForm({ ...form, status: e.target.value })}
        >
          <option value="disponivel">Disponivel</option>
          <option value="alugada">Alugada</option>
        </select>
        <label>Valor_visivel</label>
        <input
          checked={form.valor_visivel}
          onChange={(e) => setForm({ ...form, valor_visivel: e.target.checked })}
          type="checkbox"
        />
        <button type="submit">Enviar</button>
      </form>

      {erro && <p>ERRO!: {erro}</p>}
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
    </main>
  );
}
