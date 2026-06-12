# Phase 14: Animações & Feedback - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-06-12
**Phase:** 14-animações-feedback
**Mode:** --auto (all gray areas auto-selected, recommended options chosen)
**Areas discussed:** Toast library, Técnica de animação de saída, Toaster placement, Comportamento de parcelas, Escopo de componentes

---

## Toast Library

| Option | Description | Selected |
|--------|-------------|----------|
| sonner | Biblioteca explicitamente nomeada em REQUIREMENTS.md (ANIM-03) | ✓ |
| shadcn/ui Toast | Já disponível via radix-ui, sem nova dep | |
| React Hot Toast | Popular, mas não especificado | |

**Auto-selected:** sonner
**Notes:** REQUIREMENTS.md especifica "Toast Sonner" — não há ambiguidade.

---

## Técnica de Animação de Saída

| Option | Description | Selected |
|--------|-------------|----------|
| CSS inline (`removingIds` + opacity/transform) | Consistente com padrão existente de inline styles, sem nova dep | ✓ |
| framer-motion | Mais expressivo, mas nova dep pesada | |
| tw-animate-css (já instalado) | Projetado para animações de entrada, não saída de lista | |

**Auto-selected:** CSS inline com `removingIds` Set state
**Notes:** Componentes de feature já usam inline `style={{}}` — manter consistência. Fade-out 200ms é simples o suficiente para CSS puro.

---

## Toaster Placement

| Option | Description | Selected |
|--------|-------------|----------|
| `src/app/layout.js` (root) | Cobre todas as páginas, ponto único | ✓ |
| `src/app/dashboard/layout.js` | Só dashboard, mas todas as ações são no dashboard | |

**Auto-selected:** root layout
**Notes:** Mais simples, e futuras fases podem adicionar toasts em outras partes do app.

---

## Comportamento em Parcelas

| Option | Description | Selected |
|--------|-------------|----------|
| Toast only (sem exit anim) | Pagar parcela não remove item — só muda status | ✓ |
| Exit anim + toast | Remover visualmente o item pago da lista | |

**Auto-selected:** Toast only
**Notes:** ANIM-01/02 são sobre itens que saem da lista. Parcela paga fica na lista com status "paga" — nenhuma remoção ocorre.

---

## Claude's Discretion

- Verificar se re-fetch pós-action conflita com o setTimeout de 200ms da animação — usar optimistic removal ou atrasar o re-fetch se necessário
- Para Unidades.js vs UnidadesDesktop.js: identificar qual componente renderiza os itens e aplicar `removingIds` lá
- ConfirmDialog: garantir que toast só aparece após confirmação + sucesso da Server Action

## Deferred Ideas

- Toasts de erro — erros já têm tratamento inline (`setErro`), não adicionar nesta fase
- Animações de entrada — fora de escopo
- Portal Locatário — animações não são escopo desta fase
