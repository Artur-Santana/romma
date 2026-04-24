"use client"

import supabase from "@/lib/supabase";
import { useEffect } from "react";
import { useState } from "react";
import { convidarLocatario } from "@/actions/locatarios";
import { getLocatarios } from "@/lib/queries-client";

export default function Locatarios({}) {
  const [nome_razao_social, setNome_razao_social] = useState("");
  const [tipo, setTipo] = useState("");
  const [documento, setDocumento] = useState("");
  const [email, setEmail] = useState("");
  const [telefone, setTelefone] = useState("");
  const [editandoId, setEditandoId] = useState(null);
  const [locatarios, setlocatarios] = useState([]);
  const [editForm, setEditForm] = useState({});

  useEffect(() => {
    async function carregarLocatarios() {
      setlocatarios(await getLocatarios());
    }
    carregarLocatarios();
  }, []);

  async function handleConvidarLocatario(e) {
    e.preventDefault();
    const { status } = await convidarLocatario(
      email,
      nome_razao_social,
      documento,
      telefone,
      tipo,
    );
    if (status == 200) {
      setlocatarios(await getLocatarios());
    }
  }

  async function handleEditarLocatario(locatario) {
    setEditandoId(locatario.id);
    setEditForm({
      nome_razao_social: locatario.nome_razao_social,
      tipo: locatario.tipo,
      documento: locatario.documento,
      telefone: locatario.telefone,
    });
  }

  async function handleSalvarLocatario(e) {
    const { error } = await supabase
      .from("locatarios")
      .update(editForm)
      .eq("id", editandoId);
    if (!error) {
      setEditandoId(null);
      setlocatarios(await getLocatarios());
    }
  }

  async function handleDeletarlocatario(id) {
    const { error } = await supabase.from("locatarios").delete().eq("id", id);
    if (!error) {
      setlocatarios(await getLocatarios());
    }
  }

  return (
    <main>
      <form onSubmit={handleConvidarLocatario}>
        <input
          placeholder="Nome"
          value={nome_razao_social}
          onChange={(e) => setNome_razao_social(e.target.value)}
          type="text"
        ></input>
        <select value={tipo} onChange={(e) => setTipo(e.target.value)}>
          <option value="">Selecione...</option>
          <option key={"pf"} value={"pf"}>
            Pessoa Fisica
          </option>
          <option key={"pj"} value={"pj"}>
            Pessoa Juridica
          </option>
        </select>
        <input
          placeholder="Documento"
          value={documento}
          onChange={(e) => setDocumento(e.target.value)}
          type="text"
        ></input>
        <input
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          type="email"
        ></input>
        <input
          placeholder="Telefone "
          value={telefone}
          onChange={(e) => setTelefone(e.target.value)}
          type="tel"
        ></input>
        <button type="submit">Enviar</button>
      </form>
      {locatarios.map((locatario) => (
        <div key={locatario.id}>
          {editandoId === locatario.id ? (
            <div>
              <input
                value={editForm.nome_razao_social}
                onChange={(e) =>
                  setEditForm({
                    ...editForm,
                    nome_razao_social: e.target.value,
                  })
                }
              ></input>
              <select
                value={editForm.tipo}
                defaultValue={editForm.tipo}
                onChange={(e) =>
                  setEditForm({ ...editForm, tipo: e.target.value })
                }
              >
                <option key={"pf"} value={"pf"}>
                  Pessoa Fisica
                </option>
                <option key={"pj"} value={"pj"}>
                  Pessoa Juridica
                </option>
              </select>
              <input
                value={editForm.documento}
                onChange={(e) =>
                  setEditForm({ ...editForm, documento: e.target.value })
                }
              ></input>
              <input
                value={editForm.telefone}
                onChange={(e) =>
                  setEditForm({ ...editForm, telefone: e.target.value })
                }
              ></input>
              <button onClick={handleSalvarLocatario}>Salvar</button>
              <button onClick={() => setEditandoId(null)}>Cancelar</button>
            </div>
          ) : (
            <div>
              <p>{locatario.nome_razao_social}</p>
              <p>{locatario.tipo}</p>
              <p>{locatario.documento}</p>
              <p>{locatario.email}</p>
              <button onClick={() => handleDeletarlocatario(locatario.id)}>
                Deletar Locatario
              </button>
              <button onClick={() => handleEditarLocatario(locatario)}>
                Editar
              </button>
            </div>
          )}
        </div>
      ))}
    </main>
  );
}
