# Design System — Obsidian Blueprint

> Sistema de design do Romma — documentação completa para referência, emulação e continuidade por agentes ou desenvolvedores.
> 

---

## 1. Overview & Creative North Star

**Creative North Star: The Sovereign Monolith**

Obsidian Blueprint é um design system que rejeita a suavidade das tendências modernas da web em favor de uma autoridade rígida e arquitetônica. Inspirado em estruturas brutalistas e blueprints técnicos. Por meio de uma filosofia de zero-radius (cantos retos) e uma fundação de preto puro (#000000), o sistema cria um ambiente profissional de alto impacto. Quebra o visual de "template" através de contraste tipográfico extremo — headlines massivas ao lado de metadados técnicos microscópicos — e através de uma abordagem de profundidade por "layered void".

---

## 2. Cores

A paleta é enraizada em pretos profundos e variações de carvão, pontuada por um único "Deep Indigo" (#4B0082).

**Cor Primária (Deep Indigo):** Usada para ações críticas, estados ativos e assinaturas da marca. Significa poder e precisão.

**Paleta Neutra:** Fundos preto puro fornecem o "void" sobre o qual as camadas são construídas.

**A Regra do Sem-Linha:** Seccionamento é feito por mudanças de fundo (ex: transição de `#000000` para `#0A0A0A`). Se um limite for estritamente necessário, usar borda de 1px com `#444444` a 20% de opacidade.

**Hierarquia de Superfícies:**

| Nível | Hex | Uso |
| --- | --- | --- |
| Level 0 (Base) | `#000000` | Fundo principal |
| Level 1 | `#0A0A0A` | Regiões secundárias |
| Level 2 | `#121212` | Cards e itens de navegação |
| Level 3 | `#1A1A1A` | Hover states e containers ativos |

**Texturas Assinatura:** Evitar gradientes. Usar blocos sólidos de cor para enfatizar o visual Monolítico.

---

## 3. Tipografia

O sistema usa **Space Grotesk** em todos os papéis para manter uma personalidade técnica e geométrica consistente.

| Papel | Tamanho | Estilo |
| --- | --- | --- |
| Display / Large Titles | 36px ou 30px | Extra-bold, uppercase, tracking -0.05em |
| Technical Labels | 9px–10px | Uppercase, bold, tracking 0.2em–0.3em |
| Body & Data | 14px–18px | Regular, para leitura padrão |

**Princípio de Contraste:** O ritmo é criado pela tensão entre o texto display muito grande e os labels técnicos muito pequenos e espaçados.

---

## 4. Elevação & Profundidade

Obsidian Blueprint descarta sombras em favor de **Tonal Stacking**.

- **Princípio de Camadas:** Profundidade é transmitida aumentando o brilho do hex do fundo. Um card em `#121212` fica "acima" de um fundo `#000000`.
- **Sombras Ambiente:** Não usadas. Para modais flutuantes, preferir borda de 1px em `#444444` em vez de drop shadow.
- **Estados de Interação:** Hover em um elemento Layer-2 deve transicionar o fundo para Layer-3 (`#1A1A1A`), criando efeito de "lit from within".

---

## 5. Componentes

- **Botões:** Retangulares com `border-radius: 0px`. Primários usam Deep Indigo com texto branco. Secundários usam fundo transparente com borda de 1px branca ou neutra e texto com wide tracking.
- **Data Tables:** Sem linhas verticais. Headers usam texto 10px bold uppercase. Separadores de linha usam outline-variant em baixa opacidade.
- **Metric Cards:** Agrupados em grid sem costuras. Bordas compartilhadas entre cards para criar aparência de "Technical Grid" em vez de unidades flutuantes isoladas.
- **Indicadores:** Barras horizontais de 1px (cor primária) para sublinhar headings ativos ou mostrar progresso dentro de cards.

---

## 6. Do's and Don'ts

| ✅ Fazer | ❌ Não Fazer |
| --- | --- |
| Usar zero arredondamento em todos os containers e botões | Usar cores vibrantes fora do Indigo Primário e Error Red |
| Usar letter spacing extremo (tracking) em labels uppercase pequenos | Usar sombras material padrão |
| Manter fundo preto como canvas principal | Usar gradientes |

---

## 7. Análise das Telas

> As análises individuais de cada tela do Figma estão nas subpáginas abaixo. Cada análise disseca a estrutura, hierarquia, componentes e padrões de cada tela para permitir emulação futura.
> 

[Tela 1 — Landing Page Pública](Design%20System%20%E2%80%94%20Obsidian%20Blueprint/Tela%201%20%E2%80%94%20Landing%20Page%20P%C3%BAblica%2032c2b68481e181249e34dd92df1b534f.md)

[Tela 2 — Listagem de Unidades (Pública)](Design%20System%20%E2%80%94%20Obsidian%20Blueprint/Tela%202%20%E2%80%94%20Listagem%20de%20Unidades%20(P%C3%BAblica)%2032c2b68481e18192acc3c1c27eed2320.md)

[Tela 3 — Dashboard do Proprietário](Design%20System%20%E2%80%94%20Obsidian%20Blueprint/Tela%203%20%E2%80%94%20Dashboard%20do%20Propriet%C3%A1rio%2032c2b68481e181238891db5da721c70b.md)

[Tela 4 — Portal do Locatário](Design%20System%20%E2%80%94%20Obsidian%20Blueprint/Tela%204%20%E2%80%94%20Portal%20do%20Locat%C3%A1rio%2032c2b68481e1812791f1c860a88120f6.md)