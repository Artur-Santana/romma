export default function UnidadeCardPublico({ unidade }) {
    const valorFormatado = unidade.valor_visivel
        ? `${Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(unidade.valor_mensal)}/mês`
        : 'Consulte o Proprietário'

    return (
        <div className="border border-white/15 bg-background p-6 flex flex-col gap-4">
            <div className="flex flex-col gap-1">
                <span className="text-white font-headline-hanken font-bold text-lg tracking-[-0.5px]">
                    {unidade.nome}
                </span>
                <span className="text-white/50 font-headline-hanken text-sm tracking-widest">
                    {unidade.edificios?.nome ?? '—'}
                </span>
            </div>
            <div className="border-t border-white/10" />
            <div className="flex justify-between items-center">
                <span className="text-white/60 font-headline-hanken text-sm tracking-widest">
                    {unidade.area_m2} m²
                </span>
                <span className="text-primary-hover font-headline-hanken font-semibold text-sm tracking-widest">
                    {valorFormatado}
                </span>
            </div>
        </div>
    )
}
