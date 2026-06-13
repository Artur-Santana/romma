# Handoff: Refino de Telas + Novas Funcionalidades — Romma

## Overview
Este pacote documenta um **refino completo de UI/UX** do sistema Romma (gestão de aluguéis corporativos) somado a um conjunto de **novas funcionalidades** por tela. Foi construído como protótipo navegável em HTML/React e deve ser **recriado dentro do codebase real existente** da Romma.

O trabalho tem dois eixos:
1. **Refino visual global** — uma escala tipográfica única (acabar com tamanhos de fonte desalinhados) e um sistema de densidade (reduzir o excesso de espaço negativo).
2. **Novas funcionalidades** — busca/filtros, métricas-resumo, modais unificados, foto de capa, arquivo de contratos, renovação/expansão, fluxo PIX + comprovante, máscaras de formulário, etc.

## About the Design Files
Os arquivos `Romma — Protótipo Refinado.html` e a pasta `js/` + `styles/` neste bundle são **referências de design feitas em HTML/React (Babel inline)** — protótipos que mostram a aparência e o comportamento pretendidos. **Não são código de produção para copiar diretamente.**

## Screenshots — Representação visual de como deve ficar
A pasta `screenshots/` contém a **representação visual oficial de como cada tela deve ficar** após a implementação — é o alvo de fidelidade. Há uma imagem por tela em **desktop** (`screenshots/desktop/`) e **mobile** (`screenshots/mobile/`):

| # | Tela | Desktop | Mobile |
|---|---|---|---|
| 01 | Login | `desktop/01-login.png` | `mobile/01-login.png` |
| 02 | Cadastro | `desktop/02-cadastro.png` | `mobile/02-cadastro.png` |
| 03 | Redefinir senha | `desktop/03-redefinir.png` | `mobile/03-redefinir.png` |
| 04 | Visão Geral (Dashboard) | `desktop/04-visao-geral.png` | `mobile/04-visao-geral.png` |
| 05 | Unidades | `desktop/05-unidades.png` | `mobile/05-unidades.png` |
| 06 | Edifícios | `desktop/06-edificios.png` | `mobile/06-edificios.png` |
| 07 | Contratos | `desktop/07-contratos.png` | `mobile/07-contratos.png` |
| 08 | Contrato · Parcelas | `desktop/08-contrato-parcelas.png` | `mobile/08-contrato-parcelas.png` |
| 09 | Locatários | `desktop/09-locatarios.png` | `mobile/09-locatarios.png` |
| 10 | Unidades Públicas | `desktop/10-publico.png` | `mobile/10-publico.png` |
| 11 | Portal do Locatário | `desktop/11-portal.png` | `mobile/11-portal.png` |

As imagens mostram a **variante escolhida** de cada tela (ver tabela "Variantes escolhidas"), no destaque **gold** e densidade **regular**. Cada screenshot foi capturada sem o chrome do protótipo (barra superior/painel de Tweaks) — o que aparece é exatamente o conteúdo da tela a recriar. Onde o screenshot mostrar mais conteúdo do que cabe na dobra, role o protótipo HTML correspondente para ver o restante.

A tarefa é **recriar estes designs e funcionalidades no codebase Next.js existente da Romma**, usando seus padrões já estabelecidos:
- **Next.js (App Router)** · **Tailwind CSS v4** · **shadcn/ui** · **Supabase**
- Componentes em `src/components/` (ex.: `src/components/features/Unidades.js`, `GestaoEdificios.js`, `Contratos.js`, `LocatariosDesktop.js`, `features/portal/*`, `ui/DashboardShell.js`, etc.)
- Server actions em `src/actions/*` · rotas em `src/app/*`
- Tokens em `src/app/globals.css` (sistema "Obsidian Blueprint")

O protótipo usa **React inline com estilos inline**; ao portar, **converta para os componentes shadcn/Tailwind e os tokens CSS existentes**. Não traga estilos inline nem a estrutura de arquivos do protótipo.

## Fidelity
**Alta fidelidade (hifi).** Cores, tipografia, espaçamento e interações são finais e seguem o design system Obsidian Blueprint já presente em `globals.css`. Recrie a UI com fidelidade, reaproveitando os componentes (`Button`, `Input`, `StatusBadge`, `Panel`, `Eyebrow`, `MetricCell`, etc.) e tokens já existentes no codebase. Onde o protótipo usa um valor cru (px/hex), prefira o **token equivalente** do `globals.css`.

> Observação: o protótipo inclui duas variantes (A/B) por tela apenas como exploração de design. **Para a implementação, use a variante escolhida** (ver "Variantes escolhidas" abaixo). Não é necessário implementar as duas.

---

## Refino Global (aplicar em todas as telas)

### 1. Escala tipográfica única
Problema corrigido: tamanhos de fonte inconsistentes (ex.: dado de tabela a 18px ao lado de label a 10px). Padronize para esta escala e aplique via classes utilitárias/tokens:

| Token | px | Uso |
|---|---|---|
| metric | 40 | numeral grande do dashboard |
| title | 32 (24 no mobile) | H1 de página ("Visão Geral.") |
| section | 20 | título de painel/seção |
| subhead | 16 | título de card / nome principal de linha |
| body | 14 | corpo padrão + dado de tabela |
| data (mono) | 14 | números mono em tabelas (era 18 → alinhado) |
| label (mono caps) | 11 | rótulos de campo / cabeçalho de coluna |
| meta (mono) | 10 | subcaptions, refs, eyebrow |

Fontes: **Space Grotesk** (produto/display/mono) e **Hanken Grotesk** (headlines de marketing) — já no codebase. Títulos em Title Case com ponto final ("Unidades."). Labels/eyebrows em UPPERCASE com letter-spacing.

### 2. Sistema de densidade (reduzir espaço negativo)
Reduza o espaço negativo geral. Valores do nível "regular" (padrão), com variantes compact/comfy opcionais:

| Token | regular | compact | comfy | Uso |
|---|---|---|---|---|
| gutter | 32px | 24 | 44 | padding horizontal da página (desktop) |
| gutter-m | 20px | — | — | padding horizontal (mobile) |
| page-y | 28px | 20 | 40 | padding topo da página |
| block | 24px | 18 | 36 | gap entre blocos maiores |
| block-sm | 16px | 12 | 24 | gap entre blocos menores |
| panel | 20px | 16 | 26 | padding interno de painel |
| cell | 20px | 16 | 26 | padding de célula de métrica |
| row-y | 12px | 9 | 16 | padding vertical de linha de tabela |
| row-x | 16px | 14 | 20 | padding horizontal de linha de tabela |

(No protótipo isto é alternável; no produto, **adote o nível "regular" como padrão**. As variantes são opcionais.)

### 3. Correção de scroll no mobile (BUG real)
No layout mobile, containers flex com `flex: 1; overflow-y: auto` **precisam de `min-height: 0`** para rolar (senão crescem e estouram). Garanta também altura definida na cadeia (`html, body, #root { height: 100% }` no equivalente do app). Aplica-se a: casca do console, portal, listagem pública e qualquer área rolável.

### 4. Modais centralizados no mobile
Modais/overlays devem usar `position: fixed; inset: 0` e centralizar na viewport inteira (não dentro de um container relativo), para ficarem centralizados na tela do usuário no mobile.

---

## Telas e Funcionalidades a implementar

> Foco: **deltas** sobre o app atual. Cada item abaixo é uma funcionalidade ou refino concreto.

### Acesso — Login / Cadastro / Redefinir
- **Layout (variante escolhida: A)** — painel dividido: lado esquerdo com foto de prédio (filtro `grayscale(0.3) contrast(1.1) brightness(0.62)` + gradiente preto + cantoneiras douradas), lado direito com o formulário. No mobile, stack (só o formulário).
- **Login**: e-mail, senha com **exibir/ocultar**, checkbox "manter sessão", link "esqueci minha senha", estados loading → sucesso, então redireciona ao dashboard. Botão no estilo bracket: `[>] ACESSAR SISTEMA`, `[···] AUTENTICANDO`, `[OK] 200`.
- **Cadastro**: campos **nome, sobrenome, e-mail, telefone (máscara), senha, confirmar senha**. Validações: obrigatórios, e-mail válido, telefone ≥ 10 dígitos, senha ≥ 6, senhas coincidem. Banner de sucesso ("Verifique seu e-mail").
- **Redefinir**: e-mail + envio de link + confirmação de sucesso.

### Console (casca)
- Faixa de telemetria no topo; **sidebar** no desktop (nav com contadores por seção, link "Ver Página Pública", e-mail do operador, "Encerrar Sessão"); **barra inferior** no mobile com 5 itens (Visão / Edifícios / Unidades / Contratos / Locatários). Garanta que a barra inferior fique acessível (ver correção de scroll).

### Visão Geral (Dashboard) — variante escolhida: **B**
- **Métricas**: ocupação (%), MRR, receita esperada, contratos vencendo em 7 dias.
- **Layout B (editorial)**: bloco de ocupação em destaque (numeral grande + barra de ocupação dividida por unidade) + **gráfico de fluxo de caixa** (barras: recebido sólido vs. previsto fantasma, com pico em dourado) + métricas empilhadas à direita.
- Banner de "contratos a vencer", tabela de **contratos recentes**, painel de **parcelas**, **atalhos rápidos** que navegam.

### Unidades — variante escolhida: **B** (grade de cards)
- **Barra de métricas-resumo**: área total (m²), MRR realizado, potencial em aberto (dourado), valores ocultos.
- **Busca** (por nome) + **filtro de status** (todos/disponível/alugada) + **filtro por edifício**.
- **Modal unificado criar/editar** (mesmo componente para ambos): campos edifício, nome, área, valor mensal, status, descrição, checkbox "exibir valor publicamente", e **foto de capa**.
  - **Foto de capa**: zona de upload (arrastar/clicar → preview via leitura do arquivo), opção "usar foto de exemplo", e ações trocar/remover quando já há imagem. No produto, integrar com upload real (ex.: Supabase Storage) e persistir a URL no registro da unidade.
- **Remover unidade** → modal de **confirmação** (ação destrutiva).

### Edifícios — variante escolhida: **B** (cards 2 colunas)
- Criar / editar / remover edifício.
- **Stats por edifício**: ocupação (%), MRR, área total, nº de unidades.
- **Barra de ocupação contígua**: renderize as unidades **alugadas primeiro**, depois as disponíveis (sem "buracos" intercalados), com legenda ("X alugada(s) · Y disponível(is)").
- **Drill-in**: botão "Ver N unidade(s)" expande a lista de unidades do edifício. Cada unidade é **clicável → abre o modal de edição de unidade** (o mesmo componente unificado). Hover mostra a descrição da unidade.

### Contratos — variante escolhida: **B** (board de cards)
- **Busca** (locatário/unidade) + filtro **"Vencendo"** (≤ 7 dias).
- **Contagem regressiva** de dias restantes em cada contrato (card e tabela).
- Cards com barra de progresso do contrato (proporção decorrida início→término).
- Formulário de **novo contrato** (mostra o valor da unidade selecionada).
- **Cancelar contrato** → confirmação → status vira "encerrado" (não deleta).
- **Arquivo de encerrados**: seção alternável que lista contratos arquivados (com contagem), preservados como histórico.

### Contrato · Parcelas (detalhe) — variante escolhida: **B** (timeline)
- Grade-resumo: unidade, edifício, valor mensal, início, término.
- **Resumo financeiro**: valor total do contrato, total recebido, em aberto, inadimplência (destaque vermelho se houver vencidas).
- Barra de progresso das parcelas + **timeline vertical** das parcelas.
- **Registrar pagamento** em parcela pendente/vencida → marca como paga (data = hoje), **atualiza os números do resumo financeiro** e mostra toast.
- **Renovar contrato**: modal com opções +6 / +12 / +24 meses → estende o término (e o cronograma de parcelas).
- **Expandir contrato**: modal que lista unidades disponíveis → adicionar uma ao contrato, **somando o valor mensal**.
- (Removido a pedido: a linha de reajuste IGP-M não deve existir.)

### Locatários — variante escolhida: **B** (grade de cards)
- **Busca** por nome, e-mail ou documento.
- **Convidar locatário** (modal): e-mail, nome/razão social, **tipo PF/PJ** (segmented), documento com **máscara CPF/CNPJ** (re-formata ao trocar o tipo), telefone com **máscara**.
- **Editar locatário** (modal): nome, e-mail, telefone (máscara).
- **Reenviar convite** para pendentes (feedback "✓ Reenviado").
- **Revogar acesso** → modal de **confirmação** (ação destrutiva).
- No **mobile**, os cards/linhas devem expor as ações (Reenviar / Revogar / Editar) — não apenas nome + status.
- (Removido a pedido: medidor de adimplência por locatário não deve existir.)

### Público — Unidades Disponíveis — variante escolhida: **A** (cards com imagem)
- Abas por edifício (com contadores) + aba "Todos".
- **Ordenação**: relevância / menor valor / maior valor / maior área.
- Cards com imagem de capa, área, valor (ou "Consulte o proprietário" quando oculto), status "Disponível".
- Ficha da unidade (bottom sheet): imagem, descrição, área, valor mensal, **valor/m²**, refs.
- **Simular aluguel** → remove a unidade da lista com animação (no produto, isto representa a unidade saindo de "disponível" em tempo real via Supabase realtime, que já existe no app).
- (Removido a pedido: NÃO incluir "favoritar/lista de interesse" nem indicador de "X pessoas vendo agora".)

### Portal do Locatário — variante escolhida: **B** (foco em pagamento)
- **Próximo vencimento** em destaque (valor, parcela X/12, dias restantes) + **progresso do contrato** (parcelas pagas/total, % adimplente) + grade-resumo + **histórico de parcelas**.
- **Pagar Agora** → modal **PIX**: QR Code, código copia-e-cola (botão copiar), e **nota documentando** que ao confirmar o painel do proprietário passa a exibir a parcela como **Paga**. (Pagamento real ainda não será processado nesta versão — deixar isso explícito na UI e no código.) Ao confirmar, marca a parcela como paga.
- **Baixar comprovante** em parcelas pagas → **recibo** (modal) com valor, parcela, locatário, unidade, datas, forma (PIX), código de autenticação e botão "Baixar PDF".
- (Removido a pedido: NÃO incluir "Falar com o proprietário".)
- **Importante (sincronização)**: quando o locatário confirma o pagamento no portal, o **painel do proprietário** (Visão Geral / detalhe do contrato) deve refletir a parcela como **Paga**. No protótipo isto está apenas documentado (estados locais separados); **no produto, implementar via Supabase** para que a baixa apareça nas duas pontas.

---

## Interactions & Behavior
- **Navegação**: as rotas do app já existem (`/dashboard`, `/dashboard/unidades`, `/dashboard/edificios`, `/dashboard/contratos`, `/dashboard/contratos/[id]`, `/dashboard/locatarios`, `/unidades`, `/portal/dashboard`, `/login`, `/signup`, `/auth/reset-password`). Mapear cada tela do protótipo à rota correspondente.
- **Animações** (curva única `cubic-bezier(0.22, 1, 0.36, 1)`, sem bounce): fade de entrada com leve translate; crescimento de barras do gráfico; ejeção de unidade na lista pública (blur + slide); bottom sheet subindo; ponto "realtime" pulsando. Respeitar `prefers-reduced-motion`. **Importante**: o estado visível deve ser o base — anime *a partir de* oculto, nunca deixe `opacity:0` como fill final (senão some em render pausado/print).
- **Estados**: loading e sucesso em formulários; **toasts** de confirmação; **modais de confirmação** para toda ação destrutiva (remover unidade, cancelar contrato, revogar locatário).
- **Máscaras**: CPF (`000.000.000-00`), CNPJ (`00.000.000/0000-00`), telefone (`(11) 99999-9999`).
- **Responsivo**: desktop e mobile; corrigir scroll (min-height:0) e centralizar modais (position fixed) no mobile.

## State Management
No protótipo o estado é local (useState). No produto, conectar ao Supabase:
- Listas (unidades, edifícios, contratos, locatários, parcelas) via queries/server actions já existentes.
- Mutações: criar/editar/remover unidade; criar/editar edifício; criar/cancelar(→encerrar) contrato; renovar/expandir contrato; registrar pagamento de parcela; convidar/editar/revogar/reenviar locatário; marcar parcela paga no portal.
- Filtros/busca/ordenação podem ser client-side (sobre os dados já carregados) ou via query — seguir o padrão atual do codebase.
- "Encerrar" contrato deve **preservar histórico** (status, não delete).

## Design Tokens
Use os tokens já definidos em `src/app/globals.css` (Obsidian Blueprint). Referência dos principais:
- **Cores**: `--primary` `oklch(0.339 0.179 301.68)` (indigo); `--primary-hover` (+0.25 L, ≈ `#8B5CF6`, ícones/acento); `--highlight` `oklch(0.724 0.099 82.35)` (dourado, usado com parcimônia — destaque "gold"); superfícies `--neutral`/`--surface`/`--background`/`--surface-hi`; foreground `--fg-1`→`--fg-5`; semânticas `--success`/`--warning`/`--danger` (fundos a ~12% de alpha).
- **Raio**: `--radius: 0` (tudo com cantos retos — regra de marca).
- **Bordas**: `--border-1` (5%), `--border-2` (10%), `--border-3` (linha de grade estrutural).
- **Elevação**: sem sombras suaves; apenas glow no CTA primário.
- **Escala tipográfica e densidade**: ver tabelas no "Refino Global" acima.
- **Status dot**: quadrado 6×6 (nunca círculo).

## Assets
- `assets/hero-building.png` e `assets/Detalhe_Arquitetonico.png` — fotografia arquitetônica (dessaturada/escurecida). Já existem no repo (`public/`).
- Ícones blueprint (`icon_qr_01`, `icon_doc_02`, `icon_conect_03`, `icon_graph_04`) — já no repo.
- **QR Code do PIX**: no protótipo é um QR fake gerado por grid determinístico. No produto, gerar QR real a partir do payload PIX (lib de QR + payload BR Code).
- Glyphs Unicode usados como iconografia: `→ ← ✓ ✕ ⏻ ◼ ·` e tokens `[>] [OK] [···]`. Sem emoji.

## Files (referências de design neste bundle)
- `Romma — Protótipo Refinado.html` — entrada; carrega tokens do DS + scripts
- `styles/app.css` — camada de refino (escala tipográfica `--rt-*` + densidade `--rd-*` + animações)
- `js/data.js` — dados mock (estrutura espelha o domínio: edifícios, unidades, locatários, contratos, parcelas)
- `js/shared.jsx` — primitivos + casca do console (sidebar/bottom-nav)
- `js/auth.jsx` — Login / Cadastro / Redefinir
- `js/overview.jsx` — Visão Geral (variantes A/B)
- `js/console2.jsx` — Unidades, Edifícios e o **modal unificado de unidade + foto de capa**
- `js/console3.jsx` — Contratos, Parcelas (resumo financeiro, registrar pagamento, renovar/expandir, arquivo), Locatários (busca, máscaras, confirmação de revogar)
- `js/public.jsx` — listagem pública (ordenação, ficha, simular)
- `js/portal.jsx` — portal (PIX + QR, comprovante/recibo)
- `js/app.jsx` — roteador + chrome + Tweaks (referência das variantes escolhidas)

## Variantes escolhidas (resumo p/ implementação)
| Tela | Variante |
|---|---|
| Login / Cadastro / Redefinir | **A** |
| Unidades Públicas | **A** |
| Visão Geral | **B** |
| Unidades | **B** |
| Edifícios | **B** |
| Contratos | **B** |
| Contrato · Parcelas | **B** |
| Locatários | **B** |
| Portal | **B** |

Destaque (accent) **gold** em todo o sistema.

## Não implementar (removidos a pedido do cliente)
- Favoritar / lista de interesse na página pública
- "X pessoas vendo agora" na página pública
- Medidor de adimplência por locatário
- "Falar com o proprietário" no portal
- Linha de reajuste IGP-M no detalhe do contrato

## Fora de escopo / pendências para o produto real
- Processamento real de pagamento PIX (apenas marca como pago + documenta a sincronização).
- Persistência de upload da foto de capa (integrar Supabase Storage).
- Sincronização proprietário ↔ locatário da baixa de pagamento (via Supabase).
- Os dados do protótipo são fictícios e não persistem.
