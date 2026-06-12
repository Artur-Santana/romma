# Phase 14: Animações & Feedback - Context

**Gathered:** 2026-06-12
**Status:** Ready for planning

<domain>
## Phase Boundary

Adicionar resposta visual imediata às ações principais do dashboard: itens removidos de listas saem com animação de fade-out (~200ms), e toasts Sonner confirmam sucesso após ações mutativas.

Entregáveis concretos:
1. Instalar `sonner` + montar `<Toaster>` em root layout
2. Exit animation (ANIM-01): cancelar/encerrar contrato → item some com fade-out da lista
3. Exit animation (ANIM-02): deletar unidade + revogar acesso → item some com animação de saída
4. Toast Sonner (ANIM-03): criar contrato, encerrar, cancelar, revogar, pagar parcela → toast de sucesso

O que NÃO é escopo: animações de entrada, skeleton loaders, loading spinners, animações de página, animações no Portal do Locatário.

</domain>

<decisions>
## Implementation Decisions

### D-01: Biblioteca de toast
- Instalar `sonner` (`npm install sonner`) — REQUIREMENTS.md especifica "Toast Sonner" explicitamente
- Montar `<Toaster>` em `src/app/layout.js` (root layout, Server Component) — cobre todas as páginas
- Usar `toast.success("mensagem")` nos handlers após ação confirmada com sucesso

### D-02: Técnica de animação de saída (ANIM-01, ANIM-02)
- Pattern: `removingIds` como `Set` em `useState` (ou `removingId` simples se só 1 item por vez)
- Ao confirmar ação destrutiva: adicionar o ID ao Set → CSS inline `opacity: 0, transform: "scale(0.97)", transition: "all 200ms ease"` → `setTimeout(200, () => remover do array local + limpar ID do Set)`
- **Não** usar framer-motion, tw-animate-css, ou lib de animação adicional — CSS inline é consistente com os componentes existentes e não requer nova dependência
- Os componentes já gerenciam lista local em estado — o optimistic removal continua essa pattern

### D-03: Toast content — mensagens
- Criar contrato → `toast.success("Contrato criado")`
- Encerrar contrato → `toast.success("Contrato encerrado")`
- Cancelar contrato → `toast.success("Contrato cancelado")`
- Revogar acesso → `toast.success("Acesso revogado")`
- Pagar parcela → `toast.success("Parcela marcada como paga")`

### D-04: Comportamento em parcelas
- ANIM-01/02 não se aplicam a parcelas — marcar como paga muda status, não remove o item
- Só toast (ANIM-03): `toast.success("Parcela marcada como paga")` após `marcarParcelaComoPaga` retornar `status: 200`
- Nenhuma animação de saída em `Parcelas.js`

### D-05: Componentes a modificar
| Componente | Ação | Exit anim | Toast |
|---|---|---|---|
| `src/components/features/Contratos.js` | cancelarContrato | ✅ | ✅ |
| `src/components/features/Contratos.js` | encerrarContrato | ✅ | ✅ |
| `src/components/features/Contratos.js` | criarContrato | — | ✅ |
| `src/components/features/Unidades.js` | deletarUnidade | ✅ | ✅ |
| `src/components/features/LocatariosDesktop.js` | revogarConvite | ✅ | ✅ |
| `src/components/features/Locatarios.js` | deletarLocatario | ✅ | ✅ |
| `src/components/features/Parcelas.js` | marcarParcelaComoPaga | — | ✅ |

### D-06: Timing da animação
- 200ms duration — conforme especificado em ANIM-01 ("~200ms")
- Toast aparece imediatamente após ação bem-sucedida, não espera a animação terminar

### D-07: Lista de contratos pós-encerrar/cancelar (resolve Q3 do RESEARCH)
- `cancelarContrato`/`encerrarContrato` usam `.update()` — a row persiste no DB e `getContratos()` não filtra por status, então sem mudança o contrato reaparece no reload
- **Decisão:** item some permanente. Após a animação de fade-out (200ms), remover do estado local E garantir que a listagem de contratos exiba apenas `status = 'ativo'`
- Implementação: filtrar por `status === 'ativo'` na listagem (via query `getContratos` ou filtro client-side no componente que renderiza os cards) — o planner escolhe o ponto mais limpo, mas o resultado deve ser: contrato encerrado/cancelado NÃO reaparece no reload
- Aplica-se apenas à listagem principal de Contratos; não remove dados do banco

### D-08: Toast de deletar Unidade (resolve Q1 do RESEARCH)
- `deletarUnidade` dispara `toast.success("Unidade removida")` após `status === 200`
- Resolve a inconsistência D-03/D-05 a favor de exibir toast (consistente com as demais ações destrutivas)
- Mensagens completas (consolidando D-03):
  - Criar contrato → "Contrato criado"
  - Encerrar contrato → "Contrato encerrado"
  - Cancelar contrato → "Contrato cancelado"
  - Deletar unidade → "Unidade removida"
  - Revogar acesso → "Acesso revogado"
  - Pagar parcela → "Parcela marcada como paga"

### D-09: Rollback de removingIds em erro (do RESEARCH — pitfall)
- Handlers que iniciam a animação ANTES do `await` da Server Action (unidades, locatários) devem remover o ID de `removingIds` se a action retornar erro (`status !== 200`) — senão o item fica invisível mas presente
- Alternativa mais segura: só adicionar a `removingIds` APÓS confirmar `status === 200`, então animar, então remover do array no setTimeout. O planner escolhe, mas o estado de erro NÃO pode deixar item invisível-mas-presente

### Claude's Discretion
- Se `ConfirmDialog` é usado antes da ação, o toast deve aparecer após a confirmação E o sucesso da Server Action (não antes)
- Verificar se `Locatarios.js` (mobile) e `LocatariosDesktop.js` usam arrays distintos em estado — aplicar `removingIds` no componente que gerencia a lista visível
- Para `Unidades.js`, verificar se a lista é gerenciada por `UnidadesDesktop.js` internamente — aplicar animação no componente que renderiza os itens
- Se o componente re-fetches a lista após ação (via `useEffect` + query), garantir que o `setTimeout` de 200ms completa antes do re-fetch substituir o array (ou usar optimistic update sem re-fetch)

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Requirements
- `.planning/REQUIREMENTS.md` — ANIM-01, ANIM-02, ANIM-03 (requisitos alvo desta fase)

### Componentes a modificar
- `src/components/features/Contratos.js` — cancelar, encerrar, criar contrato
- `src/components/features/Unidades.js` — deletar unidade (gerencia lista ou delega para UnidadesDesktop)
- `src/components/features/LocatariosDesktop.js` — revogar acesso (handleRevogar)
- `src/components/features/Locatarios.js` — deletar locatário mobile (handleDeletarLocatario)
- `src/components/features/Parcelas.js` — marcar parcela como paga (marcarComoPaga)
- `src/app/layout.js` — montar `<Toaster>` de sonner

### Convenções e padrões
- `CLAUDE.md` — padrões de código (inline styles, form state, Server Actions return shape)
- `src/app/globals.css` — CSS vars disponíveis para animações
- `.planning/codebase/CONVENTIONS.md` — padrões de nomenclatura e estrutura

### Server Actions (para entender o return shape)
- `src/actions/contratos.js` — cancelarContrato, encerrarContrato, criarContrato
- `src/actions/unidades.js` — deletarUnidade
- `src/actions/locatarios.js` — revogarConvite, deletarLocatario
- `src/actions/parcelas.js` — marcarParcelaComoPaga

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/components/ui/ConfirmDialog.js` — já usado antes de ações destrutivas; toast deve ser disparado após confirmação + sucesso da action
- `src/app/globals.css` — CSS vars `--danger`, `--success`, `--warning` disponíveis para styling de toasts se necessário

### Established Patterns
- **Inline styles**: componentes de feature usam `style={{}}` + CSS vars — animação de saída segue o mesmo padrão (`style={{ opacity: 0, transition: "..." }}`)
- **Server Action return shape**: `{ status: 200 }` = sucesso, `{ status: 4xx/5xx, erroMessage: "..." }` = erro — toast só dispara em `status === 200`
- **State management**: componentes gerenciam lista local em `useState` + re-fetch em `useEffect` — `removingIds` é adicionado como estado auxiliar ao pattern existente
- **erroMessage** (não `errorMessage`): spelling estabelecido no projeto

### Integration Points
- `src/app/layout.js` recebe `<Toaster />` de sonner — único ponto de montagem
- Cada componente de feature importa `toast` de `sonner` e dispara `toast.success(...)` após ação bem-sucedida
- `removingIds` state controlado localmente em cada componente (não estado global)

</code_context>

<specifics>
## Specific Ideas

- REQUIREMENTS.md especifica explicitamente "Toast Sonner" — não usar React Hot Toast, shadcn Toast, ou similar
- Duração do fade-out especificada: ~200ms (ANIM-01)
- Toasts de sucesso apenas — não adicionar toasts de erro nesta fase (erros já têm tratamento via estado local `erro`)

</specifics>

<deferred>
## Deferred Ideas

- Toasts de erro (além do tratamento inline existente) — pós-fase 14 se necessário
- Animações de entrada de itens (skeleton → conteúdo)
- Animações de página (route transitions)
- Portal do Locatário — animações no portal são fora de escopo desta fase

</deferred>

---

*Phase: 14-Animações & Feedback*
*Context gathered: 2026-06-12*
