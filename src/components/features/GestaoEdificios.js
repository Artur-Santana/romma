"use client"

import { useEffect, useState } from "react";
import EdificioCard from "../ui/EdificioCard";
import { criarEdificio, editarEdificio, deletarEdificio } from "@/actions/edificios";
import { getEdificios } from "@/lib/queries-client";

export default function GestaoEdificios({}) {
  const [edificios, setEdificios] = useState([]);
  const [form, setForm] = useState({ nome: "", endereco: "" });
  const [editandoId, setEditandoId] = useState(null);
  const [formEdit, setFormEdit] = useState({ nome: "", endereco: "" });
  const [erro, setErro] = useState(null);

  function resetForm() {
    setForm({ nome: "", endereco: "" })
  }

  function resetFormEdit() {
    setFormEdit({ nome: "", endereco: "" })
  }

  async function carregarEdificios() {
    setEdificios(await getEdificios() ?? []);
  }

  useEffect(() => {
    async function fetchDados() {
      setEdificios(await getEdificios() ?? []);
    }
    fetchDados();
  }, []);

  async function insertEdificio(e) {
    e.preventDefault();
    const result = await criarEdificio(form);
    if (result.status === 200) {
      setErro(null)
      resetForm()
      await carregarEdificios();
    } else {
      setErro(result.erroMessage)
    }
  }

  async function handleDeletar(id) {
    const result = await deletarEdificio(id);
    if (result.status === 200) {
      setErro(null)
      await carregarEdificios();
    } else {
      setErro(result.erroMessage)
    }
  }

  async function handleEditar(edificio) {
    setFormEdit({ nome: edificio.nome, endereco: edificio.endereco });
    setEditandoId(edificio.id);
  }

  async function handleSalvar() {
    const result = await editarEdificio(editandoId, formEdit);
    if (result.status === 200) {
      setErro(null)
      setEditandoId(null);
      resetFormEdit()
      await carregarEdificios();
    } else {
      setErro(result.erroMessage)
    }
  }

  return (
    <main>
      <form onSubmit={insertEdificio}>
        <input
          value={form.nome}
          onChange={(e) => setForm({ ...form, nome: e.target.value })}
          type="text"
          placeholder="Nome do edificio"
        />
        <input
          value={form.endereco}
          onChange={(e) => setForm({ ...form, endereco: e.target.value })}
          type="text"
          placeholder="Endereço"
        />
        <button type="submit">Enviar</button>
      </form>

      {erro && <p>ERRO!: {erro}</p>}
      <h1>Pagina de dashboard!</h1>

      {edificios.map((edificio) => (
        <EdificioCard
          key={edificio.id}
          edificio={edificio}
          editandoId={editandoId}
          nomeEdit={formEdit.nome}
          enderecoEdit={formEdit.endereco}
          setNomeEdit={(v) => setFormEdit({ ...formEdit, nome: v })}
          setEnderecoEdit={(v) => setFormEdit({ ...formEdit, endereco: v })}
          setEditandoId={setEditandoId}
          handleEditar={handleEditar}
          handleDeletar={handleDeletar}
          handleSalvar={handleSalvar}
        />
      ))}
    </main>
  );
}
