export default function Home() {
  return (
    <div>

      {/* Cabeçalho — logo/nome + navegação */}
      <header>
        <div className="bg-[#1A1A1A] flex justify-between p-1.25">
          <div className="text-[#6B6B6B] font-body font-medium text-xs tracking-[0.2em]">REF: RM-2026-X // GRID.OS.ALFA</div>
          <div className="text-[#6B6B6B] font-body font-medium text-xs tracking-[0.2em]">LOC: -23.608713° N, 46.754611°</div> 
          <div className="text-[#6B6B6B] font-body font-medium text-xs tracking-[0.2em]">DATA: 09.06.2026 // STATUS: OTIMIZADO</div>
        </div>
        <nav>
          {/* TODO(human): logo ou nome "Romma" + link para /unidades */}
        </nav>
      </header>

      <main>

        {/* Hero — primeira coisa que o visitante vê */}
        <section>
          <div>
            {/* TODO(human): título principal, subtítulo/slogan, botão CTA → /unidades */}
            {/* Dica de layout: no mobile fica em coluna, no desktop pode ter imagem ao lado */}
          </div>
        </section>

        {/* Sobre — o que é o Romma e para quem é */}
        <section>
          {/* TODO(human): 2-3 blocos explicando o produto */}
          {/* Dica de layout: cards em coluna no mobile, grid de 3 colunas no desktop */}
        </section>

      </main>

      {/* Rodapé — informação mínima */}
      <footer>
        {/* TODO(human): copyright ou frase curta */}
      </footer>

    </div>
  )
}
