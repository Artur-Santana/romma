# Phase 19 — Discussion Log

**Mode:** `--auto` (autonomous, recommended defaults; no interactive prompts)
**Date:** 2026-06-14

> Human-reference only. Não consumido por agentes downstream (researcher/planner/executor).

## Gray Areas (auto-selected: all)

### Arquitetura do Modal
- **Opções:** novo componente reutilizável `UnifiedUnidadeModal` / estender form inline atual.
- **Selecionado:** novo `UnifiedUnidadeModal` (recommended). **Razão:** Phase 20 depende de reuso no drill-in.

### Métricas-resumo & Busca/Filtros
- **Opções:** derivar/filtrar client-side / query server-side dedicada.
- **Selecionado:** client-side (recommended). **Razão:** dataset pequeno, atualização ao vivo.

### Upload de Foto & Preview
- **Opções:** upload imediato no select / upload no submit com preview local.
- **Selecionado:** preview por object URL + upload no submit via `supabase-browser`; Server Action grava só o path (recommended). **Razão:** evita órfãos; binário não passa pela Action.

### Foto de Exemplo
- **Opções:** asset estático `/public` direto em `foto_url` / upload de um sample ao Storage.
- **Selecionado:** asset estático `/public` (recommended). **Razão:** simplicidade de demo.

### Valor de `foto_url` & Exibição
- **Opções:** path do objeto + signed URL on-read / URL pública.
- **Selecionado:** path + signed URL on-read (recommended). **Razão:** bucket é privado (Phase 17).

## Decisões locked pelo goal/SC (não discutidas)
- Modal único criar/editar (SC3); validação MIME `image/*` + `<2MB` e cadeia `edificio.proprietario_id` (SC4); confirmação de remoção + cleanup de foto órfã antes do delete, sem bloquear o delete (SC5).

## Deferred
- Edifícios cards/drill-in → Phase 20.
- Foto de capa nas páginas públicas → Phase 24.

## Todos
- Nenhum todo correspondente à fase (todo_count = 0).
