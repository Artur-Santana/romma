# Tela 1 — Landing Page Pública

> Node ID Figma: `1:4089` — Desktop 1280px
> 

[Landing Page Desktop](https://www.figma.com/design/C16bXWN7RoGwA5oOCu8Qy1/Design-TCC-ROMMA?node-id=1-4089)

Landing Page Desktop

---

# Estrutura Geral

A página é organizada em 4 blocos verticais empilhados: um ticker de texto no topo, o header de navegação, o corpo principal da página (Main) e o footer. O corpo concentra quase toda a altura da página e contém 4 seções internas.

---

# Ticker Superior

Faixa horizontal finíssima colada ao topo, acima do header. Contém múltiplas instâncias do mesmo texto distribuídas horizontalmente — padrão de marquee/loop. O conteúdo repete a cada ~1/4 da largura da tela.

---

# Header (Navegação)

Barra fixa no topo da viewport. Dividida em três zonas horizontais:

**Zona esquerda:** Logo/nome da marca em texto, alinhado à esquerda com padding da borda.

**Zona central:** Quatro links de navegação distribuídos horizontalmente, centralizados na viewport.

**Zona direita:** Dois elementos — um link textual ("Entrar") seguido de um botão primário com padding interno e sem bordas arredondadas.

---

# Seção Hero

Layout de duas colunas sem grid rígido.

**Coluna esquerda (~55% da largura):**

A hierarquia de cima para baixo segue este fluxo:

1. Badge/tag de status — pequeno, com dot colorido à esquerda
2. Headline principal — ocupa enorme área vertical, texto display ultra bold em caixa alta
3. Subtexto descritivo — corpo regular em peso menor
4. Grupo de dois botões lado a lado — primário (preenchido, cor de destaque) e secundário (outline), ambos sem bordas arredondadas e com padding horizontal generoso

**Coluna direita (~38% da largura):**

Frame quadrado com imagem arquitetônica e overlay escuro. No canto inferior direito da imagem há um mini-card flutuante com fundo semitransparente contendo: label pequeno, valor em destaque e subtexto.

---

# Seção de Social Proof (Logos)

Faixa horizontal de altura compacta com 5 logos de empresas distribuídas em linha. Separação irregular entre os itens — não é um grid fixo. Funciona como carrossel ou linha estática.

---

# Seção de Features (Grid)

Seção com título H2 precedido de um label técnico com linha decorativa à esquerda.

O grid de cards abaixo do título tem duas linhas:

**Linha 1:** Três cards verticais de largura igual, com bordas compartilhadas entre si (sem gap visual). Cada card contém: tag com ícone, título H3 em bold, corpo de texto.

**Linha 2:** Um card vertical estreito (mesma estrutura) + um card horizontal que ocupa duas colunas. O card horizontal é dividido internamente por uma borda vertical: à esquerda fica o conteúdo textual (tag + H3 + body), à direita fica o preço e o botão CTA.

Todos os botões são retangulares, sem arredondamento, e ocupam 100% da largura disponível no card.

---

# Seção de Depoimento

Dois painéis lado a lado de mesma largura, com borda compartilhada entre eles.

**Painel esquerdo:** Imagem arquitetônica preenchendo 100% do espaço, sem margens.

**Painel direito:**

- Tag de categoria no canto superior direito
- Bloco de blockquote em uppercase, texto display, ocupa a maior parte da altura
- Linha de perfil do autor: avatar pequeno (quadrado com possível borda) + nome + cargo alinhados horizontalmente

---

# Footer

Quatro colunas de largura igual com padding lateral padrão:

- **Col 1:** Nome da marca em display + tagline em corpo pequeno
- **Col 2:** Título de seção ("Plataforma") + lista de 3 links
- **Col 3:** Título de seção ("Suporte") + lista de 3 links
- **Col 4:** Título de seção ("Transmissão") + campo de input de email + botão de ação empilhados verticalmente

Rodapé final com borda separadora: copyright à esquerda + 3 ícones sociais à direita.

---

# Padrões para Emulação

- Margem horizontal global de todos os containers: valor fixo de cada borda
- Padding interno padrão dos cards: valor uniforme em todos os lados
- Todos os botões: `border-radius: 0` sem exceção
- Bordas entre cards: compartilhadas, nunca há gap visual entre cards do mesmo grid
- Separação entre seções: apenas mudança de nível de background (tonal stacking), sem dividers visuais explícitos
- Hierarquia tipográfica: Badge → H3 → H2 → H1 (display gigante que domina a viewport)
- O ticker repete o mesmo texto com separadores, duplicado horizontalmente para criar o efeito de loop infinito

---

# Versão Mobile

> Node ID Figma: `2:458` — 390px
> 

## Estrutura de Camadas

Ticker (32px) → TopAppBar → Main → Footer → BottomNavBar

## Mudanças em relação ao Desktop

**Hero:** Layout de coluna única. Badge → H1 display (menor que desktop, mas ainda dominante) → subtexto → dois botões empilhados verticalmente (no desktop eram lado a lado, aqui são fullwidth empilhados). Abaixo dos botões, imagem/gráfico quadrado centralizado. Elementos de fundo decorativos com gradientes sobrepostos.

**Social Proof:** Grade de logos em duas linhas irregulares — não é carrossel linear como no desktop.

**Stats Section:** Grade 2x2 exclusiva do mobile — quatro números grandes com labels. Seção não existe no desktop.

**Features Bento Grid:** H2 + barra indicadora de 4px. Grid misto de três tipos de cards:

- Large Feature Card (fullwidth): ícone decorativo no canto superior direito + ícone funcional + H3 + body + link de ação no rodapé
- Small Feature Cards (dois lado a lado): ícone SVG + H4 + body
- Medium Feature Card (fullwidth, horizontal): ícone em container quadrado bordado à esquerda + H3 + body à direita

**CTA Section:** Bloco de conversão final com overlay sobre fundo. H2 centralizado + subtexto + botão centralizado fullwidth.

**Footer Mobile:** Duas colunas de links (Soluções e Empresa, 4 itens cada) + linha de copyright na base.

## Header Mobile

Esquerda: ícone hambúrguer + nome da marca em H1. Direita: botão textual de login (sem ícone).

## BottomNavBar

4 itens com estrutura `Link` simples — diferente das outras telas mobile que usam `Link:css-transform`. Cada item: ícone centralizado + label abaixo.