# 📝 Decisões e Justificativas

Este documento registra todas as decisões de design e arquitetura tomadas durante o planejamento, incluindo as alternativas consideradas e o motivo da escolha final. Útil para a monografia e para justificar escolhas perante o orientador e a banca.

---

## ARCH-01 — Uso do Supabase como backend completo

**Decisão:** Usar Supabase (Auth + PostgreSQL + PostgREST + Realtime) como backend, sem servidor separado.

**Alternativa considerada:** Next.js API Routes com Prisma ORM.

**Motivo:** Reduz drasticamente o volume de código para um projeto solo. O Supabase expõe API REST e Realtime automaticamente sobre o schema do banco, eliminando a necessidade de escrever endpoints manualmente.

---

## ARCH-02 — Modelo híbrido para o fluxo de Contratos

**Decisão:** Landing page pública com listagem de Unidades disponíveis + formulário de contato. O Proprietário cria o Contrato manualmente após o contato.

**Alternativas consideradas:**

- **Opção A (Gestão interna):** Sem listagem pública, Proprietário cria tudo manualmente. Mais simples, menos impacto visual.
- **Opção B (Self-service completo):** Locatário se cadastra, faz solicitação, Proprietário aprova. +3 a 4 semanas de desenvolvimento.

**Motivo:** O modelo híbrido entrega o efeito visual da Opção B (listagem pública com Realtime) com a complexidade interna da Opção A, economizando ~2 semanas.

---

## PROD-01 — Um único Proprietário por instância

**Decisão:** No Core, o sistema suporta apenas um Proprietário por instância.

**Mundo ideal:** Múltiplos Proprietários ou perfil de Administrador (representante com privilégios limitados).

**Motivo:** Simplificação consciente para viabilizar o desenvolvimento solo dentro do prazo.

---

## PROD-02 — Remoção do "Andar" como entidade — substituído por Unidade com nome livre

**Decisão:** A entidade "Andar" foi removida do modelo de dados. O conceito de espaço alugável é representado exclusivamente pela **Unidade**, que possui nome e descrição livres definidos pelo Proprietário (ex: "Andar 3", "Sala 301").

**Modelo original considerado:** Edifício → Andar → Unidade, onde um Andar poderia ser alugado inteiro (virando uma Unidade) ou dividido em Salas (cada Sala virando uma Unidade).

**Mundo ideal:** Suporte a configurações mistas dentro de um mesmo Andar (parte alugada inteira, parte dividida em salas).

**Motivo:** A camada intermediária de Andar criava redundância — quando um andar era alugado inteiro, Andar e Unidade representavam o mesmo espaço. A Unidade com identificação livre elimina essa redundância sem perda de expressividade para o usuário, e reduz a complexidade do modelo de dados e das regras de negócio.

---

## PROD-03 — Parcelas sem cálculo de multa ou reajuste

**Decisão:** O sistema apenas registra se uma Parcela foi paga ou não, sem cálculos financeiros automáticos.

**Mundo ideal:** Cálculo de multa por atraso, reajuste por índice (IGPM, IPCA), geração de boleto.

**Motivo:** Integração com gateways de pagamento e lógica financeira complexa estão fora do escopo de um TCC solo.

---

## PROD-04 — Sem geração de PDF de contrato

**Decisão:** O sistema armazena os dados do Contrato digitalmente, mas não gera documentos PDF.

**Motivo:** Feature de valor baixo para a avaliação técnica do TCC e custo de implementação desproporcional ao benefício dentro do prazo.

---

## PLAN-01 — Planejamento em 3 cenários (Ideal, Realista, Pessimista)

**Decisão:** O desenvolvimento foi planejado em 3 cenários paralelos com estimativas distintas, em vez de um único cronograma linear.

**Motivo:** Projeto solo com prazo fixo, curva de aprendizado em tecnologias novas (Next.js, React, Supabase) e variáveis externas (outras disciplinas, orientador, monografia). Os 3 cenários servem como balizadores: o Ideal define o teto do possível, o Realista guia a execução do dia a dia, e o Pessimista garante que o mínimo aprovável seja entregue mesmo com série de imprevistos.

**Referência:** Ver página 📅 Planejamento e Cronograma para detalhamento completo.

---

## PROD-05 — Escopo Dream em ordem de prioridade (D1 → D2 → D3)

**Decisão:** O escopo Dream foi dividido em 3 níveis com dependência sequencial: D1 (Usuário do Locatário) → D2 (Reservas em tempo real) → D3 (QR Code de acesso).

**Motivo:** Cada nível agrega valor incremental e depende do anterior estar estável. Isso permite parar em qualquer ponto do Dream com o sistema coerente, sem funcionalidades pela metade.

**D3 foi explicitamente limitado ao lado do software:** sem integração física com catracas ou fechaduras inteligentes. A tela de validação do QR Code simula o que seria feito pelo hardware, documentando a extensibilidade do sistema para a monografia.