# 📅 Planejamento e Cronograma

# Deadlines

| Tipo | Data |
| --- | --- |
| Início | 01/03/2026 |
| Deadline Conservadora | 01/06/2026 |
| Deadline Ousada | 20/06/2026 |

---

# Base de Cálculo

- Dias úteis: 5 dias × 2h (média do intervalo 1–3h) = 10h
- Final de semana: 2 dias × 2h (média do intervalo 30min–4h) = 4h
- **Total estimado: ~14h/semana em um dia comum**
- Outras matérias cursadas em paralelo: 2 disciplinas além do TCC
- Monografia escrita obrigatória (volume de páginas a confirmar com orientador)

---

# 🟢 Planejamento Ideal

> Mundo ideal: absorção rápida do conteúdo, poucas interrupções externas, orientador tranquilo, monografia escrita em paralelo sem grandes bloqueios. Serve como referência do máximo possível dentro do prazo.
> 

| Fase | Conteúdo | Duração | Entrega Estimada |
| --- | --- | --- | --- |
| 0 | Aprendizado: Next.js, React, Supabase, Auth | 1,5 semanas | ~10/03 |
| 1 | Core: Auth, Edifícios, Andares, Unidades, Locatários, Contratos, Parcelas | 4 semanas | ~07/04 |
| 2 | Landing page + Listagem pública com Realtime | 1 semana | ~14/04 |
| 3 | Dashboard do Proprietário | 1 semana | ~21/04 |
| D1 | Usuário do Locatário + painel de acesso | 1,5 semanas | ~02/05 |
| D2 | Reservas em tempo real | 2 semanas | ~16/05 |
| D3 | QR Code de acesso | 1 semana | ~23/05 |
| 4 | Monografia + polimento + apresentação | 2 semanas | ~06/06 |
| **Total** |  | **~14 semanas** |  |

**✅ Entrega: ~final de maio / início de junho** — antes da deadline conservadora com o Dream quase completo (D1 + D2 + D3).

---

# 🟡 Planejamento Realista

> Semanas mais fracas, curva de React/JS desacelera no início, orientador pede ajustes pontuais, monografia compete com o desenvolvimento nas semanas finais. O cenário mais provável.
> 

| Fase | Conteúdo | Duração | Entrega Estimada |
| --- | --- | --- | --- |
| 0 | Aprendizado + mini projeto descartável para fixar conceitos | 2,5 semanas | ~17/03 |
| 1 | Core completo (com bugs e retrabalho esperados) | 6 semanas | ~28/04 |
| 2 | Landing page + Listagem pública com Realtime | 1,5 semanas | ~12/05 |
| 3 | Dashboard do Proprietário | 1,5 semanas | ~26/05 |
| D1 | Usuário do Locatário + painel de acesso | 2 semanas | ~09/06 |
| 4 | Monografia + polimento + apresentação | 3 semanas | ~30/06 |
| **Total** |  | **~17 semanas** |  |

**✅ Entrega: ~meados de junho** — dentro da deadline ousada. Core sólido + Landing page + Dashboard + D1. D2 e D3 ficam de fora.

---

# 🔴 Planejamento Pessimista

> React/JS dão trabalho grande no início, 2–3 semanas perdidas por imprevistos pessoais ou acadêmicos, orientador pede reformulações, monografia toma mais tempo do que o esperado. Objetivo: garantir que o mínimo para aprovação seja entregue mesmo no pior cenário.
> 

| Fase | Conteúdo | Duração | Entrega Estimada |
| --- | --- | --- | --- |
| 0 | Aprendizado com dificuldade em React/JS assíncrono | 4 semanas | ~29/03 |
| 1 | Core mínimo: Auth, Unidades, Contratos, Parcelas | 6 semanas | ~10/05 |
| 2 | Landing page estática simples (sem Realtime) | 1 semana | ~17/05 |
| — | Buffer para imprevistos pessoais/acadêmicos | 2 semanas | ~31/05 |
| 4 | Monografia + apresentação | 3 semanas | ~21/06 |
| **Total** |  | **~16 semanas** |  |

**✅ Entrega: ~meados de junho** — deadline ousada com Core mínimo funcional e landing page estática. Sistema aprovável na banca, sem Dashboard nem Dream.

---

# Resumo Comparativo

| Cenário | Semanas | Entrega | O que é entregue |
| --- | --- | --- | --- |
| 🟢 Ideal | 14 sem | Final de maio | Core + Landing + Dashboard + D1 + D2 + D3 |
| 🟡 Realista | 17 sem | Meados de junho | Core + Landing + Dashboard + D1 |
| 🔴 Pessimista | 16 sem | Meados de junho | Core mínimo + Landing estática |

---

# ⚠️ Ponto de Atenção Crítico

A **Fase 0** é o maior risco nos três cenários. A experiência com HTML/CSS ajuda muito na parte visual, mas a **lógica reativa do React** (states, effects, re-renders, async) costuma ser o maior choque para quem vem de HTML estático. Passar bem pela Fase 0 é o fator que mais aproxima o resultado do cenário Ideal.

**Recomendação:** Dedicar a Fase 0 a um mini projeto descartável (ex: um CRUD simples de tarefas com Supabase) antes de tocar no código do Romma. Isso evita aprender e construir ao mesmo tempo, que é a principal causa de retrabalho.