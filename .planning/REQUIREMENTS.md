# Requirements: Romma — v1.5 System Improvement & Design Augmentation

**Defined:** 2026-06-13
**Core Value:** Proprietário gerencia edifícios, contratos e pagamentos em um único painel — Locatário acessa seu contrato e histórico via portal próprio — visitantes veem unidades disponíveis em tempo real.
**Source of truth:** Design handoff em `.planning/design/` (README + screenshots desktop/mobile). Variantes escolhidas, accent gold, Obsidian Blueprint mantido.

---

## v1.5 Requirements

### Refino Global (todas as telas)

- [x] **REFINO-01**: Escala tipográfica única aplicada em todo o sistema via tokens CSS (8 níveis: metric 40 / title 32→24 mobile / section 20 / subhead 16 / body 14 / data-mono 14 / label-mono-caps 11 / meta-mono 10) — fim dos tamanhos de fonte desalinhados
- [x] **REFINO-02**: Sistema de densidade aplicado via tokens CSS no nível "regular" como padrão (gutter, page-y, block, panel, cell, row-y etc.), reduzindo o excesso de espaço negativo
- [x] **REFINO-03**: Scroll mobile corrigido em todas as áreas roláveis (`min-height: 0` na cadeia de flex containers + altura definida em html/body/root) — containers não estouram mais
- [x] **REFINO-04**: Modais/overlays centralizam na viewport inteira no mobile (`position: fixed; inset: 0`)
- [x] **REFINO-05**: Animações de entrada partem do estado oculto sem deixar `opacity:0` como fill final (visíveis em render pausado/print/projetor), respeitando `prefers-reduced-motion`, com safeguard `@media print`

### Acesso (Login / Cadastro / Redefinir)

- [x] **ACESSO-01**: Tela de acesso usa layout split-panel (variante A): foto de prédio dessaturada + cantoneiras douradas à esquerda, formulário à direita; no mobile faz stack (só formulário)
- [x] **ACESSO-02**: Login tem campo de senha com alternância exibir/ocultar, checkbox "manter sessão", link "esqueci minha senha" e botão estilo bracket (`[>] ACESSAR SISTEMA` → `[···] AUTENTICANDO` → `[OK] 200`)
- [x] **ACESSO-03**: Proprietário se cadastra via tela de Cadastro completa (nome, sobrenome, e-mail, telefone com máscara, senha, confirmar senha) com validações (obrigatórios, e-mail válido, telefone ≥10 dígitos, senha ≥6, senhas coincidem) e banner de sucesso "Verifique seu e-mail"
- [x] **ACESSO-04**: Tela de Redefinir senha envia link por e-mail e mostra confirmação de sucesso

### Dashboard (Visão Geral — variante B)

- [ ] **DASH-04**: Dashboard exibe bloco de ocupação em destaque (numeral grande de % + barra de ocupação dividida por unidade) e métricas empilhadas (ocupação, MRR, receita esperada, contratos vencendo em 7 dias)
- [ ] **DASH-05**: Dashboard exibe gráfico de fluxo de caixa (barras: recebido sólido vs. previsto fantasma, com pico em dourado), alimentado por agregação mensal de parcelas
- [ ] **DASH-06**: Dashboard tem tabela de contratos recentes, painel de parcelas e atalhos rápidos que navegam para as seções correspondentes

### Unidades (variante B — grade de cards)

- [ ] **UNID-01**: Tela de Unidades exibe barra de métricas-resumo (área total m², MRR realizado, potencial em aberto em dourado, contagem de valores ocultos)
- [ ] **UNID-02**: Proprietário busca unidade por nome e filtra por status (todos/disponível/alugada) e por edifício
- [ ] **UNID-03**: Proprietário cria e edita unidade através de um único modal unificado (mesmo componente), com campos edifício, nome, área, valor mensal, status, descrição e checkbox "exibir valor publicamente"
- [ ] **UNID-04**: Proprietário adiciona foto de capa à unidade (arrastar/clicar → preview, opção "usar foto de exemplo", trocar/remover), com upload persistido no Supabase Storage e URL salva no registro da unidade
- [ ] **UNID-05**: Remover unidade exige modal de confirmação (ação destrutiva) e limpa a foto de capa órfã no Storage

### Edifícios (variante B — cards 2 colunas)

- [ ] **EDIF-01**: Edifícios são exibidos em cards de 2 colunas com stats por edifício (ocupação %, MRR, área total, nº de unidades)
- [ ] **EDIF-02**: Cada edifício mostra barra de ocupação contígua (unidades alugadas renderizadas primeiro, depois disponíveis, sem buracos) com legenda "X alugada(s) · Y disponível(is)"
- [ ] **EDIF-03**: Botão "Ver N unidade(s)" expande a lista de unidades do edifício; cada unidade é clicável e abre o modal unificado de edição de unidade

### Contratos (variante B — board de cards)

- [ ] **CONTR-01**: Proprietário busca contratos por locatário/unidade e filtra por "vencendo" (≤7 dias)
- [ ] **CONTR-02**: Cada contrato exibe contagem regressiva de dias restantes (card e tabela) e barra de progresso do contrato (proporção decorrida início→término)
- [ ] **CONTR-03**: Formulário de novo contrato mostra o valor da unidade selecionada
- [ ] **CONTR-04**: Cancelar contrato exige confirmação e muda status para "encerrado" preservando o histórico (não deleta)
- [ ] **CONTR-05**: Seção alternável de "arquivo de encerrados" lista contratos arquivados com contagem, preservados como histórico

### Contrato · Parcelas (detalhe — variante B timeline)

- [ ] **PARC-01**: Detalhe do contrato exibe grade-resumo (unidade, edifício, valor mensal, início, término) e resumo financeiro (valor total do contrato, total recebido, em aberto, inadimplência com destaque vermelho se houver vencidas)
- [ ] **PARC-02**: Parcelas são exibidas em timeline vertical com barra de progresso (pagas/total)
- [ ] **PARC-03**: Registrar pagamento em parcela pendente/vencida marca como paga (data = hoje), atualiza os números do resumo financeiro ao vivo e mostra toast
- [ ] **PARC-04**: Renovar contrato via modal com botões rápidos (+6 / +12 / +24 meses) e campo personalizado de meses, estendendo data_fim e o cronograma de parcelas (append de novas parcelas futuras, sem sobrescrever parcelas pagas)

### Locatários (variante B — grade de cards)

- [ ] **LOC-01**: Proprietário busca locatário por nome, e-mail ou documento
- [ ] **LOC-02**: Convidar locatário via modal com tipo PF/PJ (segmented), documento com máscara CPF/CNPJ que re-formata ao trocar o tipo, e telefone com máscara — valor armazenado só com dígitos
- [ ] **LOC-03**: Editar locatário via modal (nome, e-mail, telefone com máscara)
- [ ] **LOC-04**: Reenviar convite para locatários pendentes com feedback ("✓ Reenviado")
- [ ] **LOC-05**: Revogar acesso exige modal de confirmação (ação destrutiva)
- [ ] **LOC-06**: No mobile, cards/linhas de locatário expõem as ações (Reenviar / Revogar / Editar)

### Público — Unidades Disponíveis (variante A — cards com imagem)

- [ ] **PUB-01**: Listagem pública tem abas por edifício (com contadores) + aba "Todos"
- [ ] **PUB-02**: Listagem pública permite ordenação (relevância / menor valor / maior valor / maior área)
- [ ] **PUB-03**: Cards públicos exibem imagem de capa, área, valor (ou "Consulte o proprietário" quando oculto) e status "Disponível"
- [ ] **PUB-04**: Ficha da unidade abre em bottom sheet com imagem, descrição, área, valor mensal, valor/m² e refs
- [ ] **PUB-05**: "Simular aluguel" remove a unidade da lista com animação (representa a saída de "disponível" via Supabase realtime existente)

### Portal do Locatário (variante B — foco em pagamento)

- [ ] **PORT-04**: Portal exibe próximo vencimento em destaque (valor, parcela X/N, dias restantes) + progresso do contrato (parcelas pagas/total, % adimplente) + grade-resumo + histórico de parcelas
- [ ] **PORT-05**: "Pagar Agora" abre modal PIX com QR estático único, código copia-e-cola (botão copiar) e nota explícita de que o pagamento real não é processado; ao confirmar, marca a parcela como paga
- [ ] **PORT-06**: Baixa de pagamento confirmada no portal reflete como "Paga" no painel do Proprietário (Visão Geral e detalhe do contrato), via persistência Supabase na mesma tabela de parcelas, com guard de propriedade (parcela → contrato → locatário → usuário autenticado)
- [ ] **PORT-07**: Parcelas pagas têm "Baixar comprovante" que gera recibo em PDF (valor, parcela, locatário, unidade, datas, forma PIX, código de autenticação)

---

## v2 / Future Requirements

Deferido para pós-v1.5:

- **REFINO-F1**: Variantes de densidade compact/comfy alternáveis pelo usuário (apenas "regular" no v1.5)
- **PORT-F1**: Processamento real de pagamento PIX (gateway) — atualmente só marca como pago
- **PIX-F1**: Geração de QR Code PIX real (BR Code) — v1.5 usa QR estático único

---

## Out of Scope

Explicitamente excluído (cortado a pedido ou fora do TCC):

| Feature | Razão |
|---------|-------|
| Geração de QR PIX real (BR Code) | Cortado a pedido — usa QR estático único |
| Expandir contrato (somar unidade) | Cortado a pedido do cliente |
| Processamento real de pagamento PIX | Apenas marca como pago + documenta sincronização |
| Favoritar / lista de interesse na pública | Cortado a pedido do cliente |
| "X pessoas vendo agora" na pública | Cortado a pedido do cliente |
| Medidor de adimplência por locatário | Cortado a pedido do cliente |
| "Falar com o proprietário" no portal | Cortado a pedido do cliente |
| Linha de reajuste IGP-M no detalhe do contrato | Cortado a pedido do cliente |
| Migração de stack | Next.js 16 + Supabase — sem migração |

---

## Traceability

Mapeamento de cada requirement → fase. Cobertura: **42/42 mapeados** (sem órfãos, sem duplicatas).

| Requirement | Phase | Status |
|-------------|-------|--------|
| REFINO-01 | Phase 17 | Complete |
| REFINO-02 | Phase 17 | Complete |
| REFINO-03 | Phase 17 | Complete |
| REFINO-04 | Phase 17 | Complete |
| REFINO-05 | Phase 17 | Complete |
| ACESSO-01 | Phase 18 | Complete |
| ACESSO-02 | Phase 18 | Complete |
| ACESSO-03 | Phase 18 | Complete |
| ACESSO-04 | Phase 18 | Complete |
| UNID-01 | Phase 19 | Pending |
| UNID-02 | Phase 19 | Pending |
| UNID-03 | Phase 19 | Pending |
| UNID-04 | Phase 19 | Pending |
| UNID-05 | Phase 19 | Pending |
| EDIF-01 | Phase 20 | Pending |
| EDIF-02 | Phase 20 | Pending |
| EDIF-03 | Phase 20 | Pending |
| DASH-04 | Phase 21 | Pending |
| DASH-05 | Phase 21 | Pending |
| DASH-06 | Phase 21 | Pending |
| CONTR-01 | Phase 22 | Pending |
| CONTR-02 | Phase 22 | Pending |
| CONTR-03 | Phase 22 | Pending |
| CONTR-04 | Phase 22 | Pending |
| CONTR-05 | Phase 22 | Pending |
| PARC-01 | Phase 22 | Pending |
| PARC-02 | Phase 22 | Pending |
| PARC-03 | Phase 22 | Pending |
| PARC-04 | Phase 22 | Pending |
| LOC-01 | Phase 23 | Pending |
| LOC-02 | Phase 23 | Pending |
| LOC-03 | Phase 23 | Pending |
| LOC-04 | Phase 23 | Pending |
| LOC-05 | Phase 23 | Pending |
| LOC-06 | Phase 23 | Pending |
| PUB-01 | Phase 24 | Pending |
| PUB-02 | Phase 24 | Pending |
| PUB-03 | Phase 24 | Pending |
| PUB-04 | Phase 24 | Pending |
| PUB-05 | Phase 24 | Pending |
| PORT-04 | Phase 25 | Pending |
| PORT-05 | Phase 25 | Pending |
| PORT-06 | Phase 25 | Pending |
| PORT-07 | Phase 25 | Pending |
