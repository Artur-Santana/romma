# Tela 3 — Dashboard do Proprietário

> Node ID Figma: `1:4615` — Desktop 1280px
> 

[Dashboard do Proprietário](https://www.figma.com/design/C16bXWN7RoGwA5oOCu8Qy1/Design-TCC-ROMMA?node-id=1-4615)

Dashboard do Proprietário

---

# Estrutura Geral

Layout app de três camadas paralelas que coexistem na mesma tela:

- **Sidebar** — coluna fixa à esquerda, largura estreita (~1/5 da tela)
- **Header** — barra horizontal no topo da área de conteúdo, sobreposta ao Main
- **Main Content Canvas** — área principal de conteúdo, ocupa o restante da tela

A sidebar e o header são componentes "chrome" (estrutura da interface) — sempre visíveis independente do scroll.

---

# Sidebar

Coluna vertical fixa à esquerda. Organizada em três zonas de cima para baixo:

**Zona 1 — Identidade da Marca:**

Nome da aplicação em H1 + subtexto de categoria (ex: "Gestão Corporativa") em texto pequeno. Padding lateral esquerdo padrão.

**Zona 2 — Links de Navegação:**

Seis itens de menu empilhados. Cada item tem altura generosa para facilitar o toque. Estrutura de cada item: ícone à esquerda (com container de margem para centralização vertical) + label de texto ao lado. Ícones e labels têm gap pequeno entre eles. Os itens não têm separadores entre si.

**Zona 3 — Perfil do Usuário (base da sidebar):**

Avatar quadrado pequeno + nome + cargo/email empilhados. Fixo na parte inferior da sidebar.

---

# Header do Dashboard

Barra horizontal na parte superior da área de conteúdo (não da sidebar). Dividida em duas zonas:

**Zona esquerda:** Breadcrumb de dois níveis — dois grupos de ícone + texto separados por espaçamento, indicando a localização atual na hierarquia.

**Zona direita:** Dois botões de ícone pequenos (notificações e configurações) + um botão de ação textual primário, todos alinhados à direita.

---

# Conteúdo Principal

Padding superior interno para compensar a altura do header sobreposto. Padding lateral uniforme.

## Cabeçalho Técnico da Seção

Título H2 da página atual ("VISÃO GERAL") + uma barra horizontal fina de cor primária logo abaixo do título — padrão Obsidian Blueprint de indicador ativo. A barra tem largura menor que o título, alinhada à esquerda.

## Metric Cards (4 cards)

Quatro cards em linha horizontal com bordas compartilhadas (sem gap visual). O conjunto total ocupa 100% da largura do conteúdo.

**Anatomia de cada card:**

De cima para baixo:

1. Label técnico — texto pequeno uppercase, padding interno no topo
2. Valor principal — display grande e bold (número ou contagem)
3. Valor secundário — valor monetário em R$, menor que o principal
4. Barra indicadora — linha fina horizontal de cor primária, colada na base interna do card

## Seção de Contratos Recentes

Cabeçalho de seção: H3 à esquerda + link "Ver todos" à direita, na mesma linha.

Tabela abaixo, com borda ao redor. Estrutura da tabela:

**Header da tabela:** Uma linha com 5 colunas. Os labels das colunas são textos minúsculos uppercase com tracking largo. Sem linhas verticais.

**Linhas do body:** Três linhas. Cada linha tem separador horizontal sutil. A primeira coluna de cada linha contém um avatar circular pequeno + nome do locatário. As demais colunas contêm texto simples. A última coluna contém um badge de status (container retangular sem arredondamento).

## Seção de Parcelas Pendentes

Cabeçalho de seção: H3 à esquerda + link com ícone de exportação à direita.

Lista de três linhas com borda ao redor. Cada linha é dividida em duas zonas:

**Zona esquerda (~60%):**

- Calendar widget: container retangular com mês em uppercase pequeno + dia em display grande — funciona como um "mini calendário"
- Ao lado do calendar: nome do locatário em H4 + nome da unidade em texto menor

**Zona direita (~40%):**

- Valor monetário em display + label de data vencimento abaixo
- Botão de ação "Marcar como Pago" — sem bordas arredondadas, padding interno simétrico

---

# Rodapé Técnico

Faixa muito compacta na base do conteúdo. Dois grupos de texto técnico/metadata: um à esquerda e um à direita. Tipicamente em texto minúsculo uppercase com tracking — referência ao estilo de engenharia do Obsidian Blueprint.

---

# Padrões para Emulação

- Layout base imutável: sidebar fixa + área de conteúdo restante
- Header sobreposto: flutua sobre o topo da área de conteúdo
- Barra indicadora de 4px: sempre abaixo do título H2 da página, alinhada à esquerda, cor primária
- Metric Cards: sempre em linha de 4, bordas compartilhadas, barra de indicador na base
- Tabela: sem linhas verticais, header em uppercase minúsculo, avatar circular na primeira coluna
- Calendar widget nas parcelas: container retangular com mês + dia — padrão único desta tela
- Todos os botões: `border-radius: 0`

---

# Versão Mobile

> Node ID Figma: `2:147` — 390px
> 

## Estrutura de Camadas

TopAppBar → Main → FAB (flutuante) → BottomNavBar

A sidebar lateral desaparece completamente. Navegação migra para BottomNavBar.

## Header Mobile

Idêntico às outras telas mobile: hambúrguer + marca à esquerda, sino + avatar à direita.

## Welcome Section

Label de seção pequeno + H2 de saudação personalizada. Mais informal que o "VISÃO GERAL" do desktop.

## Metric Cards (Empilhados Verticalmente)

Os 4 cards que eram em linha horizontal no desktop viram lista vertical. Cada card ocupa largura total. Estrutura de cada card: label + valor principal + subtexto à esquerda + ícone decorativo em container à direita. Alturas ligeiramente diferentes entre os cards dependendo do conteúdo.

## Contratos Recentes (Lista)

No desktop era tabela. No mobile é lista de itens. Cabeçalho: H3 + link "Ver todos" à direita. Cada item: avatar quadrado + nome do locatário + nome da unidade abaixo à esquerda + valor + data à direita.

## Parcelas Pendentes (Lista com Ações)

Cabeçalho H3. Cada parcela tem duas linhas internas:

- Linha superior: nome do locatário + unidade à esquerda + valor à direita
- Linha inferior: dois botões dividindo a largura 50%/50% — "Marcar como Pago" + ação secundária

## FAB (Floating Action Button)

Botão circular com `border-radius` completo — única exceção ao sistema de zero-radius. Contém apenas ícone de `+`. Posicionado absolutamente no canto inferior direito, acima do BottomNavBar. Layer nomeado `Button - FAB for adding new property/contract (Contextual to Dash)`.

## BottomNavBar

4 itens com estrutura `Link:css-transform`.