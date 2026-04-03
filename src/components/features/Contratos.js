import supabase from "@/lib/supabase";
import supabaseJWT from "@/lib/supabaseJWT";
import { useEffect } from "react";
import { useState } from "react";
import { getContratos, getLocatarios, getUnidades } from "@/lib/queries";

export default function Contratos({}) {
    const [unidades, setUnidades] = useState([])
    const [locatarios, setLocatarios] = useState([])
    const [contratos, setContratos] = useState([])
    const [form, setForm] = useState({})
    const [formEdit, setFormEdit] = useState({})
    const [editandoId, setEditandoId] = useState(null)

    useEffect(() => {
        async function carregarDados() {
            setUnidades(await getUnidades())
            setLocatarios(await getLocatarios())
            setContratos(await getContratos())
            setForm({
                data_inicio: "",
                data_fim: "",
                status: 'ativo',
                observacoes: "",
                unidade_id: "",
                locatario_id: "",
            })
        }
        carregarDados()
    }, [])

    function resetForm() {
        setForm({
            data_inicio: "",
            data_fim: "",
            status: 'ativo',
            observacoes: "",
            unidade_id: "",
            locatario_id: "",
        })
    }

    async function insertContrato(e) {
        e.preventDefault()
        const { data, error } = await supabase.from('contratos').insert(form).select().single()
        if (!error) {
            const { errorUpdateUnidade } = await supabase.from('unidades').update({status:"alugada"}).eq("id",form.unidade_id)
            if (!errorUpdateUnidade){
                setContratos(await getContratos())
                console.log('jwt key:', process.env.NEXT_PUBLIC_SUPABASE_JWT?.substring(0, 20))
                const { dataFunction, errorFunction } = await supabaseJWT.functions.invoke('gerar-parcelas', {
                    body: { contrato_id: data.id },
                    headers: { Authorization: 'Bearer ' + process.env.NEXT_PUBLIC_SUPABASE_JWT}
                })
                resetForm()
            }
        }
    }

    async function handleSalvarContrato(e) {
        const { error } = await supabase.from('contratos').update(formEdit).eq('id',editandoId)
        if (!error) {
            setEditandoId(null)
            setContratos(await getContratos())
        }
    }

    async function handleEditarContrato(locatario) {
        setEditandoId(locatario.id)
        setFormEdit({
            data_inicio: locatario.data_inicio,
            data_fim: locatario.data_fim,
            status: locatario.status,
            observacoes: locatario.observacoes
        })
    }

    async function handleDeletarContrato(contrato) {
        const { errorDeleteContrato } = await supabase.from('contratos').delete().eq('id',contrato.id)
        if (!errorDeleteContrato) {
            const { errorUpdateUnidade } = await supabase.from('unidades').update({status:"disponivel"}).eq("id",contrato.unidade_id)
            if (!errorUpdateUnidade){
                setContratos(await getContratos())
            }
        }
    }

    return (
        <main>
            <form onSubmit={insertContrato}>
                <input placeholder="Data Inicio" value={form.data_inicio} onChange={(e)=> setForm({...form,data_inicio:e.target.value})} type="date"></input>
                <input placeholder="Data Fim" value={form.data_fim} onChange={(e)=> setForm({...form,data_fim:e.target.value})} type="date"></input>
                <input placeholder="Status" value={form.status} onChange={(e)=> setForm({...form,status:e.target.value})}></input>
                <input placeholder="Observacoes" value={form.observacoes} onChange={(e)=> setForm({...form,observacoes:e.target.value})}></input>
                <select value={form.unidade_id} onChange={(e)=> setForm({...form, unidade_id: e.target.value})}>
                    <option value={""}>Selecione</option>
                    {unidades.map(unidade =>(
                        <option key={unidade.id} value={unidade.id}>{unidade.nome}</option>
                    ))}
                </select>
                <select value={form.locatario_id} onChange={(e) => setForm({...form, locatario_id: e.target.value})}>
                    <option value={""}>Selecione</option>
                    {locatarios.map(locatario =>(
                        <option key={locatario.id} value={locatario.id}>{locatario.nome_razao_social}</option>
                    ))}
                </select>
                <button type="submit">Enviar</button>
            </form>

            {contratos.map(contrato =>(
                <div key={contrato.id}>
                    {editandoId === contrato.id ? (
                        <>
                            <input value={formEdit.data_inicio} onChange={(e)=> setFormEdit({...formEdit,data_inicio:e.target.value})}></input>
                            <input value={formEdit.data_fim} onChange={(e)=> setFormEdit({...formEdit,data_fim:e.target.value})}></input>
                            <input value={formEdit.status} onChange={(e)=> setFormEdit({...formEdit,status:e.target.value})}></input>
                            <input value={formEdit.observacoes} onChange={(e)=> setFormEdit({...formEdit,observacoes:e.target.value})}></input>
                            <button onClick={handleSalvarContrato}>Salvar</button>
                            <button onClick={()=> setEditandoId(null)}>Cancelar</button>
                        </>
                    ): (
                        <>
                        <p>Data de Inicio: {contrato.data_inicio}</p>
                        <p>Data de Final: {contrato.data_fim}</p>
                        <p>Status: {contrato.status}</p>
                        <p>Unidade: {contrato.unidades.nome}</p>
                        <p>Locatario: {contrato.locatarios.nome_razao_social}</p>
                        <button onClick={()=> handleEditarContrato(contrato)}>Editar</button>
                        <button onClick={()=> handleDeletarContrato(contrato)}>Deletar</button>
                        </>
                    )}
                </div>
            ))}
        </main>
    )
}
