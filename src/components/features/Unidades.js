import supabase from "@/lib/supabase";
import { useEffect } from "react";
import { useState } from "react";
import { getEdificios, getUnidades } from "@/lib/queries-client";
import UnidadeCard from "@/components/ui/UnidadeCard";

export default function Unidades({}) {
  const [unidades, setUnidades] = useState([]);
  const [nome, setNome] = useState("");
  const [descricao, setDescricao] = useState("");
  const [area_m2, setArea_m2] = useState("");
  const [valor_mensal, setValor_mensal] = useState("");
  const [valor_visivel, setValor_visivel] = useState(false);
  const [status, setStatus] = useState("");
  const [edificio_id, setEdificio_id] = useState("");
  const [listaEdificios, setListaEdificios] = useState([]);
  const [editandoId, setEditandoId] = useState(null);
  const [nomeEdit, setNomeEdit] = useState("");
  const [descricaoEdit, setDescricaoEdit] = useState("");
  const [area_m2Edit, setArea_m2Edit] = useState("");
  const [valor_mensalEdit, setValor_mensalEdit] = useState("");
  const [statusEdit, setStatusEdit] = useState("");
  const [valor_visivelEdit, setValor_visivelEdit] = useState("");

  async function carregarDados() {
    const data = await getEdificios();
    setListaEdificios(data);
    setUnidades(await getUnidades());
  }

  async function handleEditarUnidade(unidade) {
    setNomeEdit(unidade.nome);
    setDescricaoEdit(unidade.descricao);
    setArea_m2Edit(unidade.area_m2);
    setEditandoId(unidade.id);
    setValor_mensalEdit(unidade.valor_mensal);
    setValor_visivelEdit(unidade.valor_visivel);
  }

  async function handleDeletarUnidade(id) {
    const { error } = await supabase.from("unidades").delete().eq("id", id);
    if (!error) {
      setUnidades(await getUnidades());
    }
  }

  async function handleSalvarUnidade(id) {
    const { error } = await supabase
      .from("unidades")
      .update({
        nome: nomeEdit,
        descricao: descricaoEdit,
        area_m2: area_m2Edit,
        valor_mensal: valor_mensalEdit,
        valor_visivel: valor_visivelEdit,
        status: statusEdit,
      })
      .eq("id", editandoId);
    if (!error) {
      setEditandoId(null);
      setUnidades(await getUnidades());
    }
  }

  useEffect(() => {
    carregarDados();
  }, []);

  async function insertUnidade(e) {
    e.preventDefault();
    const { error } = await supabase
      .from("unidades")
      .insert({
        nome,
        descricao,
        area_m2,
        valor_mensal,
        status,
        valor_visivel,
        edificio_id,
      });
    if (!error) {
      setUnidades(await getUnidades());
    }
  }

  return (
    <main>
      <form onSubmit={insertUnidade}>
        <select
          value={edificio_id}
          onChange={(e) => setEdificio_id(e.target.value)}
        >
          {listaEdificios.map((edificio) => (
            <option key={edificio.id} value={edificio.id}>
              {edificio.nome}
            </option>
          ))}
        </select>
        <input
          placeholder="nome"
          value={nome}
          onChange={(e) => setNome(e.target.value)}
          type="text"
        ></input>
        <input
          placeholder="descricao"
          value={descricao}
          onChange={(e) => setDescricao(e.target.value)}
          type="text"
        ></input>
        <input
          placeholder="area_m2"
          value={area_m2}
          onChange={(e) => setArea_m2(e.target.value)}
          type="number"
        ></input>
        <input
          placeholder="valor_mensal"
          value={valor_mensal}
          onChange={(e) => setValor_mensal(e.target.value)}
          type="number"
        ></input>
        <select
          value={status}
          onChange={(e) => {
            setStatus(e.target.value);
          }}
        >
          <option key={"disponivel"} value={"disponivel"}>
            Disponivel
          </option>
          <option key={"alugada"} value={"alugada"}>
            Alugada
          </option>
        </select>
        <label>Valor_visivel</label>
        <input
          checked={valor_visivel}
          onChange={(e) => setValor_visivel(e.target.checked)}
          type="checkbox"
        ></input>
        <button type="submit">Enviar</button>
      </form>
      {unidades.map((unidade) => (
        <UnidadeCard
          key={unidade.id}
          unidade={unidade}
          editandoId={editandoId}
          nomeEdit={nomeEdit}
          descricaoEdit={descricaoEdit}
          area_m2Edit={area_m2Edit}
          valor_mensalEdit={valor_mensalEdit}
          valor_visivelEdit={valor_visivelEdit}
          setEditandoId={setEditandoId}
          setNomeEdit={setNomeEdit}
          setDescricaoEdit={setDescricaoEdit}
          setArea_m2Edit={setArea_m2Edit}
          setValor_mensalEdit={setValor_mensalEdit}
          setValor_visivelEdit={setValor_visivelEdit}
          statusEdit={statusEdit}
          setStatusEdit={setStatusEdit}
          handleEditarUnidade={handleEditarUnidade}
          handleDeletarUnidade={handleDeletarUnidade}
          handleSalvarUnidade={handleSalvarUnidade}
        />
      ))}
    </main>
  );
}
