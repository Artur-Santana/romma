export default function EdificioCard({ edificio, editandoId, nomeEdit, enderecoEdit , setNomeEdit, setEnderecoEdit, setEditandoId, handleEditar, handleDeletar, handleSalvar  }) {
    return <div key={edificio.id}>
    {editandoId === edificio.id ? (
      <>
        <input value={nomeEdit} onChange={(e) => setNomeEdit(e.target.value)} />
        <input value={enderecoEdit} onChange={(e) => setEnderecoEdit(e.target.value)} />
        <button onClick={handleSalvar}>Salvar</button>
        <button onClick={() => setEditandoId(null)}>Cancelar</button>
      </>
    ) : (
      <div>
        <p>{edificio.nome}</p>
        <p>{edificio.endereco}</p>
        <button onClick={() => handleEditar(edificio)}>Editar</button>
        <button onClick={() => handleDeletar(edificio.id)}>Remover</button>
      </div>
    )}
  </div>
  }