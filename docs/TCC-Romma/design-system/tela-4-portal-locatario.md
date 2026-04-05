# Tela 4 — Portal do Locatário

> Node ID Figma: `1:4872` — Desktop 1280px
> 

[Portal do Locatário e outras telas](https://www.figma.com/design/C16bXWN7RoGwA5oOCu8Qy1/Design-TCC-ROMMA?node-id=1-4872)

Portal do Locatário e outras telas

---

# Estrutura Geral

Mesma estrutura de app de três camadas do Dashboard, com diferenças importantes:

- **Header:** ocupa a largura total da tela (1280px) — diferente do Dashboard, onde o header ficava apenas sobre a área de conteúdo
- **Sidebar:** mesma posição, mas com identidade visual e itens de navegação específicos do locatário
- **CTA Flutuante:** elemento posicionado absolutamente sobre o conteúdo, canto inferior direito

---

# Header Global

Barra horizontal de largura total. Três zonas:

**Esquerda:** Logo/nome da marca com padding lateral.

**Centro:** Quatro links de navegação centralizados.

**Direita:** Dois ícones apenas (notificação + perfil/avatar) — sem botão textual. Esta é a principal diferença do header em relação ao Dashboard.

---

# Sidebar do Locatário

Diferente da sidebar do Proprietário, esta tem identidade própria.

**Topo:** Título "PORTAL DO LOCATÁRIO" em H2 uppercase + versão do sistema abaixo ("SAAS ROMMA V.1.0") em texto técnico pequeno.

**Navegação:** Cinco itens, estrutura igual à do Proprietário (ícone + label). Os itens representam áreas de acesso do locatário.

**Base da Sidebar:** Zona de destaque com fundo diferenciado contendo dois elementos:

- Botão de ação primária fullwidth (ex: "Entrar em Contato")
- Link secundário com ícone à esquerda abaixo do botão

---

# Conteúdo Principal

## Cabeçalho de Contexto do Usuário

Zona no topo do conteúdo com dois grupos lado a lado:

**Grupo esquerdo (~40% da largura):**

- Breadcrumb/label acima
- Nome do locatário em H1 display — é o maior texto desta tela, identifica quem está logado
- Linha de localização: ícone + nome do edifício + dot separador circular pequeno + nome da unidade

**Grupo direito (~30% da largura):**

- Card pequeno com fundo diferenciado
- Label de status acima
- Dot colorido + texto de status abaixo

## Contract Grid

Layout de duas colunas com gap entre elas.

### Coluna Esquerda — Contrato Ativo + Card Decorativo

**Card do Contrato (`~30%` da largura total do conteúdo):**

Estrutura de cima para baixo:

1. Título "Contrato Vigente" em H3 pequeno, com padding
2. Badge de status no canto superior direito do card (sobreposto sobre a borda do card)
3. Bloco de dados do contrato — cada dado segue a estrutura: label técnico em uppercase → valor em display abaixo:
    - Unidade
    - Valor Mensal
    - Datas (Início + Término lado a lado em duas sub-colunas iguais)
4. Botão de ação fullwidth na base — com ícone de seta no canto direito interno

**Card Decorativo (logo abaixo do card de contrato):**

Preenche o restante da altura da coluna esquerda. Imagem abstrata/gráfica de fundo cobrindo 100% do espaço. Overlay centralizado com ícone grande + texto pequeno centralizado abaixo.

### Coluna Direita — Parcelas (`~65%` da largura)

Três seções empilhadas verticalmente. Cada seção segue o mesmo padrão de header:

- **Header de seção:** H3 à esquerda + linha horizontal de 1px se estendendo até o fim da largura da coluna (ocupando o espaço restante após o título)

**Seção Vencidas:**

Uma parcela em destaque com fundo diferenciado. Estrutura: ícone de alerta em container → nome/período em display grande → valor monetário em display grande → botão de ação (o maior botão desta coluna, em destaque).

**Seção Pendentes:**

Uma parcela. Estrutura mais compacta: ícone de calendário em container quadrado → período + data de vencimento → valor monetário → botão menor que o de vencidas.

**Seção Pagas:**

Duas parcelas. Sem botão de ação — apenas leitura. Cada parcela: ícone de check → nome do mês + data de pagamento → valor monetário + ícone de recibo/download alinhado à extrema direita.

---

# CTA Flutuante

Card posicionado de forma absoluta/fixa sobre o conteúdo, no canto inferior direito. Tem uma `border-radius` leve no container externo — exceção única à regra de zero-radius do sistema. Estrutura interna: ícone decorativo grande + texto descritivo + botão de ação (`border-radius: 0`).

---

# Padrões para Emulação

- Header full-width: ocupa 1280px completos, diferente do Dashboard
- Nome do usuário como H1: o maior texto da tela é o nome do locatário
- Sidebar com identidade própria: título "PORTAL DO LOCATÁRIO" em destaque, não apenas a marca
- Linha divisora 1px após H3: padrão desta tela — o título de cada grupo de parcelas é seguido de uma linha que preenche o espaço restante da linha
- Hierarquia visual das parcelas: Vencidas (maior destaque, botão maior) → Pendentes (destaque médio) → Pagas (sem botão, apenas leitura)
- Card decorativo: preenche a altura restante da coluna esquerda com imagem abstrata + overlay
- CTA flutuante: posicionado absolutamente, é o único elemento com border-radius no container externo
- Todos os botões internos: `border-radius: 0`

---

# Versão Mobile

> Node ID Figma: `2:2` — 390px
> 

## Estrutura de Camadas

TopAppBar → Main → BottomNavBar

A sidebar lateral desaparece completamente. A navegação migra para BottomNavBar com 4 itens.

## Header Mobile

Esquerda: ícone hambúrguer + nome da marca. Direita: sino de notificação + container quadrado com avatar/dot de estado.

## Cabeçalho de Contexto

H2 "Portal do Locatário" + nome do locatário em H1 abaixo + linha de localização (edifício • unidade).

## Card de Contrato Ativo

Layout assimétrico mais compacto que o desktop:

- Linha superior: nome da unidade à esquerda + badge de status no canto direito
- Linha de datas: Início e Término lado a lado em duas sub-colunas iguais
- `HorizontalBorder` na base com link "Ver contrato" + ícone de seta à direita

## Seções de Parcelas

Cada seção usa dot colorido + H3 como header (diferente do desktop que usa linha divisória de 1px).

**Vencidas:** Card com `Overlay+Border`. Internamente: `VerticalBorder` separando calendar widget (mês uppercase + dia bold) de informações (data + valor). Ícone de alerta em container no canto direito.

**Pendentes:** Lista "bento style" — dois cards com bordas compartilhadas. Cada card: calendar widget + informações + ícone de estado no canto direito.

**Pagas:** Card simples. Ícone de check em container quadrado + mês + data + valor alinhado à direita. Sem botão de ação.

## BottomNavBar

4 itens com estrutura `Link:css-transform`. Cada item: ícone centralizado + label abaixo.