"use client"

import { useEffect } from "react";
import { useState } from "react";
import { convidarLocatario, editarLocatario, deletarLocatario } from "@/actions/locatarios";
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
  const [erroConvite, setErroConvite] = useState("");

  useEffect(() => {
    async function carregarLocatarios() {
      setlocatarios(await getLocatarios() ?? []);
    }
    carregarLocatarios();
  }, []);

  async function handleConvidarLocatario(e) {
    e.preventDefault();
    const { status, erroMessage } = await convidarLocatario(
      email,
      nome_razao_social,
      documento,
      telefone,
      tipo,
    );
    if (status == 200) {
      setlocatarios(await getLocatarios() ?? []);
      setNome_razao_social("");
      setTipo("");
      setDocumento("");
      setEmail("");
      setTelefone("");
      setErroConvite("");
    } else {
      setErroConvite(erroMessage ?? "Erro ao enviar convite.");
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

  async function handleSalvarLocatario() {
    const { status } = await editarLocatario(editandoId, editForm);
    if (status === 200) {
      setEditandoId(null);
      setlocatarios(await getLocatarios());
    }
  }

  async function handleDeletarlocatario(id) {
    const { status } = await deletarLocatario(id);
    if (status === 200) {
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
      {erroConvite && <p>{erroConvite}</p>}
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
              <button onClick={handleSalvarLocatario} className="cursor-pointer px-3 py-1 bg-primary text-primary-foreground hover:bg-primary-hover transition-colors">Salvar</button>
              <button onClick={() => setEditandoId(null)} className="cursor-pointer px-3 py-1 bg-secondary text-secondary-foreground hover:bg-muted transition-colors">Cancelar</button>
            </div>
          ) : (
            <div>
              <p>{locatario.nome_razao_social}</p>
              <p>{locatario.tipo}</p>
              <p>{locatario.documento}</p>
              <p>{locatario.email}</p>
              <button onClick={() => handleDeletarlocatario(locatario.id)} className="cursor-pointer px-3 py-1 bg-destructive text-foreground hover:opacity-80 transition-opacity">
                Deletar Locatario
              </button>
              <button onClick={() => handleEditarLocatario(locatario)} className="cursor-pointer px-3 py-1 bg-primary text-primary-foreground hover:bg-primary-hover transition-colors">
                Editar
              </button>
            </div>
          )}
        </div>
      ))}
    </main>
  );
}
