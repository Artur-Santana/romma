export default function Home() {
  return (
    <div className="bg-gray-700">

      {/* Cabeçalho — logo/nome + navegação */}
      <header>
        <div className="bg-[#1A1A1A] flex justify-between py-1.25 px-5">
          <div className="text-white/40 font-headline-hanken font-medium text-xs tracking-[0.2em]">REF: RM-2026-X // GRID.OS.ALFA</div>
          <div className="text-white/40 font-headline-hanken font-medium text-xs tracking-[0.2em]">LOC: -23.608713° N, 46.754611°</div> 
          <div className="text-white/40 font-headline-hanken font-medium text-xs tracking-[0.2em]">DATA: 09.06.2026 // STATUS: OTIMIZADO</div>
        </div>
        <nav className="bg-black py-5 px-5 flex justify-between content-start">
          <div className="">
            <div className="text-white font-headline-hanken font-bold text-3xl tracking-[-1.2px]">ROMMA</div>
          </div>
          <div className="text-white/50 flex gap-15 font-headline-hanken font-normal tracking-widest text-sm p-0.5 content-center">
            <a className="content-center animacao-underscore">PROPRIEDADES</a>
            <a className="content-center">CONTRATOS</a>
            <a className="content-center">PORTAIS</a>
            <a className="content-center">DASHBOARD</a>
          </div>
          <div className="text-white/50 flex gap-3 content-center">
            <div className="content-center">ENTRAR</div>
            <div className="content-center">COMEÇAR AGORA</div>
          </div>
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
