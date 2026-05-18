"use client"

import { useEffect, useState } from "react";
import { getContratos, getLocatarios, getUnidades } from "@/lib/queries-client";
import Link from "next/link";
import { gerarParcelas, criarContrato, editarContrato, cancelarContrato } from "@/actions/contratos";

export default function Contratos({}) {
    const [unidades, setUnidades] = useState([])
    const [locatarios, setLocatarios] = useState([])
    const [contratos, setContratos] = useState([])
    const [form, setForm] = useState({ data_inicio: "", data_fim: "", status: 'ativo', observacoes: "", unidade_id: "", locatario_id: "" })
    const [formEdit, setFormEdit] = useState({ data_inicio: "", data_fim: "", status: "", observacoes: "" })
    const [editandoId, setEditandoId] = useState(null)
    const [confirmandoId, setConfirmandoId] = useState(null)
    const [erro, setErro] = useState(null)

    useEffect(() => {
        async function carregarDados() {
            setUnidades(await getUnidades() ?? [])
            setLocatarios(await getLocatarios() ?? [])
            setContratos(await getContratos() ?? [])
        }
        carregarDados()
    }, [])

    function resetForm() {
        setForm({ data_inicio: "", data_fim: "", status: 'ativo', observacoes: "", unidade_id: "", locatario_id: "" })
    }

    function resetFormEdit() {
        setFormEdit({ data_inicio: "", data_fim: "", status: "", observacoes: "" })
    }

    async function insertContrato(e) {
        e.preventDefault()
        const result = await criarContrato(form)
        if (result.status === 200) {
            setErro(null)
            const parcResult = await gerarParcelas(result.data.id)
            if (parcResult.status !== 200) setErro(parcResult.erroMessage ?? 'Erro ao gerar parcelas.')
            setContratos(await getContratos())
            setUnidades(await getUnidades())
            resetForm()
        } else {
            setErro(result.erroMessage)
        }
    }

    async function handleSalvarContrato() {
        const result = await editarContrato(editandoId, formEdit)
        if (result.status === 200) {
            setErro(null)
            setEditandoId(null)
            resetFormEdit()
            setContratos(await getContratos())
        } else {
            setErro(result.erroMessage)
        }
    }

    async function handleEditarContrato(contrato) {
        resetFormEdit()
        setEditandoId(contrato.id)
        setFormEdit({
            data_inicio: contrato.data_inicio,
            data_fim: contrato.data_fim,
            status: contrato.status,
            observacoes: contrato.observacoes
        })
    }

    async function handleCancelarContrato(contrato) {
        setConfirmandoId(contrato.id)
    }

    async function confirmarCancelamento(contrato) {
        const result = await cancelarContrato(contrato.id, contrato.unidade_id)
        if (result.status === 200) {
            setErro(null)
        } else {
            setErro(result.erroMessage)
        }
        setContratos(await getContratos())
        setConfirmandoId(null)
    }

    return (
        <main>
            <form onSubmit={insertContrato}>
                <input placeholder="Data Inicio" value={form.data_inicio} onChange={(e) => setForm({ ...form, data_inicio: e.target.value })} type="date" />
                <input placeholder="Data Fim" value={form.data_fim} onChange={(e) => setForm({ ...form, data_fim: e.target.value })} type="date" />
                <label>Ativo</label>
                <input placeholder="Observacoes" value={form.observacoes} onChange={(e) => setForm({ ...form, observacoes: e.target.value })} />
                <select value={form.unidade_id} onChange={(e) => setForm({ ...form, unidade_id: e.target.value })}>
                    <option value="">Selecione</option>
                    {unidades.map(unidade => (
                        <option key={unidade.id} value={unidade.id}>{unidade.nome}</option>
                    ))}
                </select>
                <select value={form.locatario_id} onChange={(e) => setForm({ ...form, locatario_id: e.target.value })}>
                    <option value="">Selecione</option>
                    {locatarios.map(locatario => (
                        <option key={locatario.id} value={locatario.id}>{locatario.nome_razao_social}</option>
                    ))}
                </select>
                <button type="submit">Enviar</button>
            </form>

            {erro && <p>ERRO!: {erro}</p>}

            {contratos.map(contrato => {
                const encerrado = contrato.status === 'ativo' && contrato.data_fim < new Date().toISOString().split('T')[0]
                return (
                    <div key={contrato.id}>
                        {editandoId === contrato.id ? (
                            <>
                                <input value={formEdit.data_inicio} onChange={(e) => setFormEdit({ ...formEdit, data_inicio: e.target.value })} />
                                <input value={formEdit.data_fim} onChange={(e) => setFormEdit({ ...formEdit, data_fim: e.target.value })} />
                                <input value={formEdit.status} onChange={(e) => setFormEdit({ ...formEdit, status: e.target.value })} />
                                <input value={formEdit.observacoes} onChange={(e) => setFormEdit({ ...formEdit, observacoes: e.target.value })} />
                                <button onClick={handleSalvarContrato}>Salvar</button>
                                <button onClick={() => { setEditandoId(null); resetFormEdit() }}>Cancelar</button>
                            </>
                        ) : (
                            <>
                                <p>Data de Inicio: {contrato.data_inicio}</p>
                                <p>Data de Final: {contrato.data_fim}</p>
                                <p>Status: {encerrado ? "Encerrado" : contrato.status === 'cancelado' ? "Cancelado" : "Ativo"}</p>
                                <p>Locatario: {contrato.locatarios.nome_razao_social}</p>
                                <Link href={`/dashboard/contratos/${contrato.id}`}>Ver Parcelas</Link>
                                <button onClick={() => handleEditarContrato(contrato)}>Editar</button>
                                {contrato.status === 'ativo' && !encerrado && (
                                    <button onClick={() => handleCancelarContrato(contrato)}>Cancelar Contrato</button>
                                )}
                                {confirmandoId === contrato.id ? (
                                    <>
                                        <span>Confirmar Cancelamento?</span>
                                        <button onClick={() => confirmarCancelamento(contrato)}>Sim</button>
                                        <button onClick={() => setConfirmandoId(null)}>Não</button>
                                    </>
                                ) : (
                                    <></>
                                )}
                            </>
                        )}
                    </div>
                )
            })}
        </main>
    )
}
