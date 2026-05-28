import Image from 'next/image'
import { fmtBRL } from '@/lib/utils'

function refOf(u) {
  return 'UN-' + u.id.slice(0, 6).toUpperCase()
}

export default function UnidadeDetailSheet({ unidade, edificio, onClose, onSimular }) {
  return (
    <div
      className="fixed inset-0 z-50 bg-[oklch(0_0_0/0.65)] flex items-end"
      onClick={onClose}
    >
      <div
        className="w-full max-h-[85dvh] overflow-auto bg-background border-t border-indigo px-5 pt-6 pb-8 flex flex-col gap-4"
        onClick={e => e.stopPropagation()}
      >
        <div className="self-center w-8 h-[3px] bg-fg-5" />

        <div className="flex justify-between items-start">
          <div className="flex flex-col gap-1">
            <span className="font-mono text-[11px] text-fg-5 tracking-[1px] uppercase">
              {refOf(unidade)}
            </span>
            <h2 className="font-body font-bold text-[32px] tracking-[-1.6px] text-fg-1 leading-none m-0">
              {unidade.nome}
            </h2>
            {edificio && (
              <span className="text-[13px] text-fg-3">{edificio.nome}</span>
            )}
          </div>
          <button
            style={{ all: 'unset', cursor: 'pointer', display: 'flex', width: 32, height: 32, alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}
            className="border border-border-3 text-fg-3 text-[14px]"
            onClick={onClose}
          >
            ✕
          </button>
        </div>

        <div className="relative h-40 border border-border-3 overflow-hidden">
          <Image
            src="/Detalhe_Arquitetonico.png"
            alt=""
            fill
            className="object-cover opacity-10"
            sizes="100vw"
          />
        </div>

        <div className="border border-border-3 grid grid-cols-2">
          <div className="p-4 flex flex-col gap-1.5">
            <span className="font-mono text-[11px] text-fg-5 tracking-[1px] uppercase">Área</span>
            <span className="font-body font-bold text-[22px] tracking-[-0.8px] text-fg-1">
              {unidade.area_m2 != null ? `${unidade.area_m2}m²` : '—'}
            </span>
          </div>
          <div className="p-4 border-l border-border-3 flex flex-col gap-1.5">
            <span className="font-mono text-[11px] text-fg-5 tracking-[1px] uppercase">Valor Mensal</span>
            <span className="font-body font-bold text-[22px] tracking-[-0.8px] text-fg-1">
              {unidade.valor_visivel ? fmtBRL(unidade.valor_mensal) : 'Consulte o Proprietário'}
            </span>
          </div>
        </div>

        {unidade.descricao && (
          <p className="font-body text-[13px] text-fg-2 leading-[1.55] m-0">
            {unidade.descricao}
          </p>
        )}

        {edificio?.endereco && (
          <div className="bg-surface border border-border-3 px-4 py-3 flex justify-between items-center gap-3">
            <span className="font-mono text-[11px] text-fg-5 tracking-[1px] uppercase shrink-0">
              Endereço
            </span>
            <span className="text-[12px] text-fg-3 text-right">
              {edificio.endereco}
            </span>
          </div>
        )}

        <div className="flex flex-col gap-2">
          <button
            style={{ all: 'unset', cursor: 'pointer', display: 'block', width: '100%', boxSizing: 'border-box' }}
            className="py-[14px] px-5 bg-indigo font-body font-bold text-[13px] text-fg-1 text-center tracking-[0.5px]"
            onClick={() => onSimular(unidade.id)}
          >
            Tenho interesse →
          </button>
          <button
            style={{ all: 'unset', cursor: 'pointer', display: 'block', width: '100%', boxSizing: 'border-box' }}
            className="py-[14px] px-5 border border-border-3 font-body font-bold text-[13px] text-fg-3 text-center"
            onClick={onClose}
          >
            Fechar
          </button>
        </div>

        <span className="font-mono text-[11px] text-fg-5 text-center tracking-[0.5px]">
          Demo · &apos;Tenho interesse&apos; simula aluguel para fins de visualização
        </span>
      </div>
    </div>
  )
}
