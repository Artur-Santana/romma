// "use client" transforma esse arquivo em um Client Component.
// Isso é necessário sempre que você usar hooks (useState, useEffect)
// ou eventos de usuário (onClick, onChange).
// Sem isso, o Next.js trata o arquivo como Server Component e os hooks não funcionam.
"use client"

// Importações: cada coisa que você usa precisa ser importada antes de usar.
import supabase from "@/lib/supabase";       // cliente do Supabase (conexão com o banco)
import { useEffect } from "react";           // hook para rodar código após renderizar
import { useState } from "react";            // hook para criar variáveis de estado reativas
import { useRouter } from "next/navigation"; // hook para navegar entre páginas via código

export default function Dashboard() {

  // =========================================================
  // ESTADOS — variáveis reativas que, quando mudam, atualizam a tela
  // Sintaxe: const [valor, setValor] = useState(valorInicial)
  // =========================================================

  const [usuario, setUsuario] = useState(null)       // usuário logado (null = ainda não verificado)
  const [edificios, setEdificios] = useState([])      // lista de edifícios ([] = lista vazia)
  
  // Estados do formulário de criação
  const [nome, setNome] = useState("")               // campo nome do novo edifício
  const [endereco, setEndereco] = useState("")       // campo endereço do novo edifício

  // Estados do modo de edição inline
  const [editandoId, setEditandoId] = useState(null) // id do edifício sendo editado (null = nenhum)
  const [nomeEdit, setNomeEdit] = useState("")       // valor do campo nome durante edição
  const [enderecoEdit, setEnderecoEdit] = useState("") // valor do campo endereço durante edição

  // useRouter permite redirecionar o usuário para outra página via código
  const router = useRouter()

  // =========================================================
  // useEffect — roda UMA VEZ quando o componente aparece na tela
  // O [] vazio no final é a lista de dependências — sem dependências = só executa no mount
  // =========================================================

  // Verifica se há sessão ativa. Se não houver, redireciona para /login.
  useEffect(() => {
    async function verificarSessao() {
      const { data } = await supabase.auth.getUser() // busca o usuário logado
      if (!data.user) {
        router.push("/login") // sem usuário → vai para login
      } else {
        setUsuario(data.user) // com usuário → salva no estado para usar na tela
      }
    }
    verificarSessao()
  }, [])

  // =========================================================
  // FUNÇÕES DE DADOS — comunicação com o Supabase
  // =========================================================

  // Busca todos os edifícios do banco e atualiza o estado.
  // Definida fora do useEffect para poder ser chamada de outros lugares (ex: após insert/delete).
  async function getEdificios() {
    const { data } = await supabase.from("edificios").select("*")
    if (data) setEdificios(data) // substitui a lista inteira pela versão mais recente do banco
  }

  // Chama getEdificios() uma vez quando a página carrega.
  useEffect(() => {
    getEdificios()
  }, [])

  // =========================================================
  // HANDLERS — funções chamadas por eventos do usuário (submit, click)
  // =========================================================

  // Cria um novo edifício no banco com os valores dos campos nome e endereço.
  async function insertEdificio(e) {
    e.preventDefault() // impede o comportamento padrão do form (recarregar a página)
    const { error } = await supabase
      .from("edificios")
      .insert({ nome, endereco }) // insere usando os estados dos inputs
    if (!error) {
      getEdificios() // re-busca a lista para mostrar o novo item na tela
    }
  }

  // Faz logout do usuário e redireciona para /login.
  async function handleLogout() {
    await supabase.auth.signOut()
    router.push("/login")
  }

  // Deleta um edifício pelo id.
  // .eq("id", id) é o filtro — sem ele, deletaria TODOS os registros.
  async function handleDeletar(id) {
    const { error } = await supabase
      .from("edificios")
      .delete()
      .eq("id", id)
    if (!error) {
      getEdificios() // atualiza a lista após deletar
    }
  }

  // Ativa o modo de edição de um edifício.
  // Não faz nada no banco — só preenche os estados de edição e seta o editandoId.
  // Quando editandoId === edificio.id, o item da lista vira um formulário.
  async function handleEditar(edificio) {
    setNomeEdit(edificio.nome)           // pré-preenche o input com o valor atual
    setEnderecoEdit(edificio.endereco)   // pré-preenche o input com o valor atual
    setEditandoId(edificio.id)           // marca qual item está sendo editado
  }

  // Salva as alterações do edifício em edição no banco.
  async function handleSalvar() {
    const { error } = await supabase
      .from("edificios")
      .update({ nome: nomeEdit, endereco: enderecoEdit }) // novos valores
      .eq("id", editandoId) // filtra pelo id do item sendo editado
    if (!error) {
      setEditandoId(null) // sai do modo de edição (volta para modo visualização)
      getEdificios()      // atualiza a lista com os dados novos
    }
  }

  // =========================================================
  // JSX — o que é renderizado na tela
  // =========================================================

  return (
    <main>

      {/* Formulário de criação de edifício */}
      {/* onSubmit conecta o evento de submit à função insertEdificio */}
      <form onSubmit={insertEdificio}>
        {/* value={nome} torna o input "controlado" — ele sempre reflete o estado */}
        {/* onChange atualiza o estado a cada tecla digitada */}
        <input
          value={nome}
          onChange={(e) => setNome(e.target.value)}
          type="text"
          placeholder="Nome do edificio"
        />
        <input
          value={endereco}
          onChange={(e) => setEndereco(e.target.value)}
          type="text"
          placeholder="Endereço"
        />
        <button type="submit">Enviar</button>
      </form>

      <h1>Pagina de dashboard!</h1>

      {/* usuario?.email usa optional chaining (?.) — evita erro se usuario ainda for null */}
      <p>Olá {usuario?.email}</p>

      {/* Renderiza a lista de edifícios */}
      {/* .map() percorre cada item do array e retorna um elemento JSX */}
      {/* key={edificio.id} é obrigatório — o React usa para identificar cada item na lista */}
      {edificios.map(edificio => (
        <div key={edificio.id}>

          {/* Ternário: condição ? (se verdadeiro) : (se falso) */}
          {/* Se editandoId for igual ao id desse edifício → modo edição */}
          {/* Se não → modo visualização */}
          {editandoId === edificio.id ? (

            // MODO EDIÇÃO — inputs preenchidos + botões salvar/cancelar
            <>
              <input value={nomeEdit} onChange={(e) => setNomeEdit(e.target.value)} />
              <input value={enderecoEdit} onChange={(e) => setEnderecoEdit(e.target.value)} />
              <button onClick={handleSalvar}>Salvar</button>
              {/* Cancelar: reseta editandoId para null, voltando ao modo visualização */}
              <button onClick={() => setEditandoId(null)}>Cancelar</button>
            </>

          ) : (

            // MODO VISUALIZAÇÃO — texto + botões editar/remover
            <div>
              <p>{edificio.nome}</p>
              <p>{edificio.endereco}</p>
              {/* Passa o objeto inteiro para handleEditar poder pré-preencher os inputs */}
              <button onClick={() => handleEditar(edificio)}>Editar</button>
              {/* Passa só o id para handleDeletar saber qual deletar */}
              <button onClick={() => handleDeletar(edificio.id)}>Remover</button>
            </div>

          )}
        </div>
      ))}

      <button onClick={handleLogout}>Sair</button>
    </main>
  )
}