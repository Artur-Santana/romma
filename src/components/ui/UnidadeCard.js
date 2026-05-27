"use client"

// D-08: Opção A (objeto único) — formEdit centralizado no parent (Unidades.js).
// Props: { unidade, editandoId, formEdit, onEditar, onSalvar, onDeletar, onFormChange, onCancelar, erro }
// valor_visivel excluído do modo edição (must_have define apenas 5 campos: nome, descrição, área, valor, status).

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import StatusBadge from "@/components/ui/StatusBadge"
import { fmtBRL } from "@/lib/utils"

function refOf(u) {
  return "UN-" + u.id.slice(0, 6).toUpperCase()
}

export default function UnidadeCard({
  unidade,
  editandoId,
  formEdit,
  onEditar,
  onSalvar,
  onDeletar,
  onFormChange,
  onCancelar,
  erro,
}) {
  const isEditing = editandoId === unidade.id

  if (isEditing) {
    return (
      <div className="border-t border-border-3 px-5 py-5 bg-surface">
        <div className="mb-4">
          <span className="font-mono text-[11px] text-fg-5 tracking-[1px] uppercase">{refOf(unidade)}</span>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-4">

          <label className="flex flex-col gap-1.5">
            <span className="font-mono text-[10px] tracking-[1px] uppercase text-fg-4">Nome da unidade</span>
            <Input
              type="text"
              value={formEdit.nome}
              onChange={(e) => onFormChange({ ...formEdit, nome: e.target.value })}
              className="h-9 rounded-none border-border-3 bg-surface text-fg-1"
            />
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="font-mono text-[10px] tracking-[1px] uppercase text-fg-4">Descrição</span>
            <Input
              type="text"
              value={formEdit.descricao}
              onChange={(e) => onFormChange({ ...formEdit, descricao: e.target.value })}
              className="h-9 rounded-none border-border-3 bg-surface text-fg-1"
            />
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="font-mono text-[10px] tracking-[1px] uppercase text-fg-4">Área (m²)</span>
            <Input
              type="number"
              value={formEdit.area_m2}
              onChange={(e) => onFormChange({ ...formEdit, area_m2: e.target.value })}
              className="h-9 rounded-none border-border-3 bg-surface text-fg-1"
            />
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="font-mono text-[10px] tracking-[1px] uppercase text-fg-4">Valor mensal (R$)</span>
            <Input
              type="number"
              value={formEdit.valor_mensal}
              onChange={(e) => onFormChange({ ...formEdit, valor_mensal: e.target.value })}
              className="h-9 rounded-none border-border-3 bg-surface text-fg-1"
            />
          </label>

          <label className="flex flex-col gap-1.5 col-span-2">
            <span className="font-mono text-[10px] tracking-[1px] uppercase text-fg-4">Status</span>
            <Select
              value={formEdit.status}
              onValueChange={(v) => onFormChange({ ...formEdit, status: v })}
            >
              <SelectTrigger className="w-full h-9 rounded-none border-border-3 bg-surface text-fg-1 font-mono text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="disponivel">Disponível</SelectItem>
                <SelectItem value="alugada">Alugada</SelectItem>
              </SelectContent>
            </Select>
          </label>

        </div>

        {erro && (
          <span className="font-mono text-[11px] text-danger-fg block mb-3">{erro}</span>
        )}

        <div className="flex gap-3">
          <Button
            variant="default"
            size="sm"
            onClick={() => onSalvar(unidade.id)}
            className="bg-indigo text-fg-1 font-mono font-bold text-[11px] tracking-[1px] uppercase rounded-none px-5 h-9"
          >
            Salvar
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={onCancelar}
            className="font-mono text-[10px] text-fg-3 uppercase tracking-[0.5px] font-bold h-9 px-4 rounded-none border border-border-3"
          >
            Cancelar
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="border-t border-border-3 px-5 py-4">
      <div className="flex justify-between items-start gap-3">
        <div className="flex flex-col gap-1 min-w-0">
          <span className="font-mono text-[11px] text-fg-5 tracking-[0.8px] uppercase">
            {refOf(unidade)}
          </span>
          <span className="font-display font-bold text-[18px] tracking-[-0.6px] text-fg-1">
            {unidade.nome}
          </span>
          {unidade.descricao && (
            <span className="font-body text-[12px] text-fg-3 mt-0.5 overflow-hidden text-ellipsis whitespace-nowrap">
              {unidade.descricao}
            </span>
          )}
          <div className="flex items-center gap-3 mt-1.5 flex-wrap">
            {unidade.area_m2 && (
              <span className="font-mono text-[10px] text-fg-4 tracking-[0.5px] uppercase">
                {unidade.area_m2}m²
              </span>
            )}
            {unidade.valor_visivel ? (
              <span className="font-mono text-[10px] text-fg-3 tracking-[0.5px]">
                {fmtBRL(unidade.valor_mensal)}<span className="text-fg-5">/mês</span>
              </span>
            ) : (
              <span className="font-mono text-[10px] text-fg-5 tracking-[0.5px] uppercase">
                Valor sob consulta
              </span>
            )}
            <StatusBadge status={unidade.status} />
          </div>
        </div>

        <div className="flex gap-2 shrink-0">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onEditar(unidade)}
            className="font-mono text-[10px] text-fg-3 uppercase tracking-[0.5px] font-bold p-0 h-auto"
          >
            Editar
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onDeletar(unidade.id)}
            className="font-mono text-[10px] text-danger-fg uppercase tracking-[0.5px] font-bold p-0 h-auto"
          >
            Remover
          </Button>
        </div>
      </div>
    </div>
  )
}
