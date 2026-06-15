# Phase 20: Edifícios — Cards & Drill-in - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-06-15
**Phase:** 20-edif-cios-cards-drill-in
**Mode:** `--auto` (autonomous — recommended defaults selected without interactive prompt)
**Areas discussed:** Cálculo de stats, Barra de ocupação, Drill-in/expansão, Reuso do modal (lock edifício), Migração de apresentação

---

## Cálculo de Stats por Edifício

| Option | Description | Selected |
|--------|-------------|----------|
| Derivado client-side de getUnidades+getEdificios | Agrupa unidades por edificio_id na lista já carregada | ✓ |
| Query/RPC server-side dedicada | Agregação no Postgres | |

**User's choice (auto):** Client-side — consistente com Phase 19 D-04, dataset pequeno (TCC).

---

## Barra de Ocupação Contígua

| Option | Description | Selected |
|--------|-------------|----------|
| Flex proporcional, alugadas-first, 2 tokens de cor | Segmentos contíguos sem buracos + legenda | ✓ |
| Grid de células por unidade | Uma célula por unidade | |

**User's choice (auto):** Flex proporcional — ordem alugadas→disponíveis é literal em EDIF-02.

---

## Drill-in / Expansão

| Option | Description | Selected |
|--------|-------------|----------|
| Expansão inline (accordion) no card | Lista de unidades aparece dentro do card | ✓ |
| Navegação para rota separada | Página dedicada do edifício | |

**User's choice (auto):** Accordion inline — mantém stats/card visíveis; goal diz "expande a lista".

---

## Reuso do UnifiedUnidadeModal (Edifício Travado)

| Option | Description | Selected |
|--------|-------------|----------|
| Nova prop `lockEdificio` (boolean), default false | Desabilita o FSelect de edifício; não quebra call-sites | ✓ |
| Passar lista de 1 edifício | Filtrar `edificios` para o corrente | |

**User's choice (auto):** Prop `lockEdificio` — mínima mudança de API, retrocompatível com Unidades.js.

---

## Migração de Apresentação do GestaoEdificios

| Option | Description | Selected |
|--------|-------------|----------|
| Reestruturar lista→cards, preservar CRUD | Mesmas Server Actions, novo layout 2 colunas | ✓ |
| Reescrever do zero | Novo componente | |

**User's choice (auto):** Reestruturar preservando CRUD — requisitos de criar/editar/remover edifício inalterados.

---

## Claude's Discretion

- Layout exato dos cards e hierarquia visual dos stats.
- Tokens de cor exatos da barra (ocupado vs disponível) e hover das linhas.
- Posicionamento dos controles de CRUD de edifício no novo layout.
- Forma de agrupar unidades por edifício (memo client-side).

## Deferred Ideas

- Dashboard com agregados globais — Phase 21 (DASH-04..06).
- Foto de capa nas linhas do drill-in — polish futuro, fora de EDIF-01..03.
