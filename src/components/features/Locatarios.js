"use client"

import { useEffect, useState } from "react";
import { convidarLocatario, editarLocatario, deletarLocatario } from "@/actions/locatarios";
import { getLocatarios } from "@/lib/queries-client";

function mascararDocumento(doc) {
  if (!doc) return ''
  return doc.slice(0, -2).replace(/\d/g, '*') + doc.slice(-2)
}

function resetForm() {
  return { nome_razao_social: '', tipo: '', documento: '', email: '', telefone: '' }
}

export default function Locatarios({}) {
  const [form, setForm] = useState(resetForm())
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
      form.email,
      form.nome_razao_social,
      form.documento,
      form.telefone,
      form.tipo,
    );
    if (status == 200) {
      setlocatarios(await getLocatarios() ?? []);
      setForm(resetForm());
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

  async function handleDeletarLocatario(id) {
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
          value={form.nome_razao_social}
          onChange={(e) => setForm({ ...form, nome_razao_social: e.target.value })}
          type="text"
        ></input>
        <select value={form.tipo} onChange={(e) => setForm({ ...form, tipo: e.target.value })}>
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
          value={form.documento}
          onChange={(e) => setForm({ ...form, documento: e.target.value })}
          type="text"
        ></input>
        <input
          placeholder="Email"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          type="email"
        ></input>
        <input
          placeholder="Telefone "
          value={form.telefone}
          onChange={(e) => setForm({ ...form, telefone: e.target.value })}
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
              <p>{mascararDocumento(locatario.documento)}</p>
              <p>{locatario.email}</p>
              <button onClick={() => handleDeletarLocatario(locatario.id)} className="cursor-pointer px-3 py-1 bg-destructive text-foreground hover:opacity-80 transition-opacity">
                Deletar Locatário
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
