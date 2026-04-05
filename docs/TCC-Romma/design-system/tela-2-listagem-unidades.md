# Tela 2 — Listagem de Unidades (Pública)

> Node ID Figma: `1:4274` — Desktop 1280px
> 

> Existe uma segunda versão com fotos nos cards (`1:4442`) — estruturalmente idêntica, diferindo apenas pela presença de imagem no topo de cada card.
> 

[Listagem de Unidades Desktop](https://www.figma.com/design/C16bXWN7RoGwA5oOCu8Qy1/Design-TCC-ROMMA?node-id=1-4274)

Listagem de Unidades Desktop

---

# Estrutura Geral

Três blocos verticais: NavBar no topo, corpo principal (Main) e Footer compacto. O Main contém o hero header, o grid de cards e a seção de formulário de contato.

---

# NavBar Superior

Barra horizontal fixa no topo.

**Esquerda:** Nome da marca envolvido por um `VerticalBorder` — uma linha vertical de 1px à esquerda do texto, padrão Obsidian Blueprint para demarcar elementos de identidade.

**Centro:** Quatro links de navegação. Os três últimos possuem uma seta `→` como prefixo no nome do layer, indicando que há um elemento visual de seta antes do texto do link.

**Direita:** Um único botão de CTA primário, sem bordas arredondadas.

---

# Hero Header

Área de alta hierarquia visual logo abaixo da navbar.

**Headline:** Texto display ultra bold em caixa alta, ocupa quase toda a largura e altura do bloco hero. Proporciona impacto imediato.

**Linha de status abaixo do headline:** Duas zonas horizontais:

- Esquerda: subtexto descritivo da página
- Direita: indicador de tempo real — dot colorido pequeno (círculo/quadrado de ~8px) + texto de status indicando atualização automática

---

# Grid de Unidades

Layout em grade de 3 colunas com bordas compartilhadas entre cards. Duas linhas.

## Anatomia de um Card Padrão (sem foto)

De cima para baixo dentro do card:

1. **Label de status** — texto pequeno uppercase com ícone à direita (posicionado no canto oposto ao texto)
2. **Nome da unidade** — H3 bold, duas linhas máximo
3. **Descrição** — corpo de texto regular
4. **Bloco de preço + CTA:**
    - Valor em display bold + unidade "/mês" em texto menor, alinhados horizontalmente
    - Botão de ação fullwidth — ocupa 100% da largura interna do card, sem bordas arredondadas
5. **Variação de preço oculto:** quando o proprietário oculta o valor, o bloco de preço é substituído por texto "Consulte o Proprietário" sem o display de número

Todos os cards têm padding interno uniforme em todos os lados.

## Anatomia de um Card com Foto

A foto aparece no topo do card, acima do label de status, preenchendo a largura interna. Todos os outros elementos seguem a mesma ordem, deslocados para baixo.

## Card Especial Horizontal (Card 5 — 2 colunas)

Posicionado na segunda linha, ocupa o espaço de dois cards. É dividido internamente por um `VerticalBorder` (linha vertical de 1px):

- **Lado esquerdo (~60%):** tag + H3 + body
- **Lado direito (~40%):** preço + botão de ação — os dois empilhados verticalmente com padding lateral interno

---

# Seção de Formulário de Contato

Dois painéis lado a lado, mesma largura, borda compartilhada entre eles.

**Painel esquerdo — Informações:**

- H2 de título da seção
- Texto descritivo
- Duas linhas de informação de contato: cada uma tem um ícone pequeno à esquerda + texto

**Painel direito — Formulário:**

Quatro campos empilhados verticalmente + botão de envio fullwidth:

1. Nome Completo — input simples
2. E-mail Corporativo — input simples
3. Unidade de Interesse — select/dropdown com ícone de seta no canto direito interno
4. Mensagem — textarea de maior altura
5. Botão de envio — fullwidth, sem bordas arredondadas

Cada campo segue a estrutura: `Label` (texto pequeno uppercase) → `Input` (caixa com padding interno), sem gap exagerado entre label e campo.

---

# Footer Compacto

Barra horizontal compacta — bem mais simples que o footer da Landing Page.

- **Esquerda:** Nome da marca com `VerticalBorder` + tagline em texto pequeno abaixo
- **Centro:** Quatro links inline horizontais com espaçamento entre eles
- **Direita:** Dois ícones sociais em containers quadrados iguais, com gap entre eles

---

# Padrões para Emulação

- NavBar com `VerticalBorder` no brand: linha vertical de 1px à esquerda do logo
- Indicador de tempo real: dot pequeno + texto, sempre posicionado à direita do hero
- Cards: sempre 3 colunas no desktop com bordas compartilhadas
- Card horizontal especial: sempre na segunda linha, sempre com `VerticalBorder` interno separando conteúdo de CTA
- Formulário: sempre em layout 2 colunas — informações à esquerda, campos à direita
- Footer desta página: versão compacta com apenas 3 zonas (brand, nav inline, social icons)

---

# Versão Mobile

> Node ID Figma: `2:302` — 390px
> 

## Estrutura de Camadas

TopAppBar → Main → BottomNavBar

A página é notavelmente mais longa que as demais telas mobile, pela quantidade de cards de unidades.

## Header Mobile

Esquerda: hambúrguer + nome da marca. Direita: dois ícones de ação (busca/mapa + usuário).

## Seção de Cabeçalho

H2 compacto + subtexto descritivo abaixo. Mais simples que o hero gigante do desktop.

## Lista de Unidades (Cards Fullwidth)

O grid de 3 colunas do desktop vira lista vertical. Cada card ocupa 100% da largura. Estrutura de cima para baixo:

1. Foto da unidade — cobre toda a largura, altura fixa
2. Badge de categoria — sobreposto no canto superior esquerdo da foto (container escuro + texto pequeno)
3. H3 com nome da unidade
4. Descrição em corpo
5. Linha de metadados — dois grupos de ícone + texto (área + tipo da unidade)
6. Bloco de preço: valor bold à esquerda + unidade de medida à direita em linha
7. Botão CTA fullwidth — `border-radius: 0`

## Formulário de Contato Mobile

Coluna única (diferente do layout 2 colunas do desktop). Título + subtexto + quatro campos empilhados: Nome, E-mail, Telefone/WhatsApp (campo adicional exclusivo do mobile), Mensagem. Botão de envio fullwidth com sombra decorativa (`Button:shadow` no layer).

## BottomNavBar

4 itens com estrutura `Link:css-transform`.