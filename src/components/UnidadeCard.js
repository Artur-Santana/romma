export default function UnidadeCard({ unidade, editandoId, nomeEdit, descricaoEdit, area_m2Edit, valor_mensalEdit, valor_visivelEdit, setEditandoId, setNomeEdit, setDescricaoEdit, setArea_m2Edit, setValor_mensalEdit, setValor_visivelEdit, statusEdit, setStatusEdit, handleEditarUnidade, handleDeletarUnidade, handleSalvarUnidade}){
    return <div>
        {editandoId === unidade.id ? (
            <>
            <input value={nomeEdit} onChange={(e) => setNomeEdit(e.target.value)}/>
            <input value={descricaoEdit} onChange={(e) => setDescricaoEdit(e.target.value)}/>
            <input value={area_m2Edit} onChange={(e) => setArea_m2Edit(e.target.value)}/>
            <input value={valor_mensalEdit} onChange={(e) => setValor_mensalEdit(e.target.value)}/>
            <input type="checkbox" checked={valor_visivelEdit} onChange={(e) => setValor_visivelEdit(e.target.checked)}/>
            <input value={statusEdit} onChange={(e) => setStatusEdit(e.target.value)}/>
            <button onClick={handleSalvarUnidade}>Salvar</button> 
            <button onClick={() => setEditandoId(null)}>Cancelar</button>
            </>
        ):
        (
            <div>
                <p>{unidade.nome}</p>
                <p>{unidade.descricao}</p>
                <p>{unidade.area_m2}</p>
                <p>{unidade.valor_mensal}</p>
                <p>{unidade.valor_visivel}</p>
                <button onClick={() =>handleEditarUnidade(unidade)}>Editar</button>
                <button onClick={() =>handleDeletarUnidade(unidade.id)}>Remover</button>
            </div>
        )}
    </div>
}