# Phase 25: Portal do Locatário — PIX & Recibo - Context

**Gathered:** 2026-06-17
**Status:** Ready for planning

<domain>
## Phase Boundary

Primeiro caminho de **escrita do Locatário**. O portal do Locatário ganha quatro capacidades sobre o contrato ativo já exibido:

1. **Destaque de próximo vencimento** — valor, parcela X/N, dias restantes + progresso do contrato (pagas/total, % adimplente) + grade-resumo + histórico (PORT-04).
2. **Modal PIX** — "Pagar Agora" abre modal com QR estático único, código copia-e-cola (botão copiar), nota explícita de que o pagamento real **não** é processado; confirmar marca a parcela como paga (PORT-05).
3. **Sync da baixa** — pagamento confirmado no portal reflete como "Paga" no painel do Proprietário (Visão Geral + detalhe do contrato) via persistência na mesma tabela `parcelas`, com guard de propriedade fresco no lado do Locatário (parcela → contrato → locatário → usuário autenticado); cross-tenant → 404 (PORT-06).
4. **Recibo PDF** — parcelas pagas têm "Baixar comprovante" gerando recibo PDF no browser (valor, parcela, locatário, unidade, datas, forma PIX, código de autenticação) via import dinâmico, sem crash SSR em produção (PORT-07).

**Fora de escopo (cortado a pedido):** geração de QR PIX real (BR Code) — usa QR estático único; processamento real de pagamento (gateway) — só marca como pago.

</domain>

<decisions>
## Implementation Decisions

### Fonte do QR / código PIX (PORT-05)
- **D-01:** QR estático **único** — um asset de imagem fixo bundlado no app + uma string de código copia-e-cola constante. Não há geração de BR Code nem QR por-proprietário (ROADMAP: "QR estático único"; REQUIREMENTS PIX-F1 deferido). Modal exibe nota explícita de que o pagamento real não é processado.

### Caminho de escrita da confirmação de pagamento (PORT-06)
- **D-02:** **Nova Server Action** dedicada ao Locatário (em `src/actions/parcelas.js`), separada de `marcarParcelaComoPaga` (essa é do Proprietário e valida `proprietario_id`). A action do Locatário usa cadeia de propriedade própria: parcela → contrato → locatário → `usuario_id` = usuário autenticado. Tentativa cross-tenant retorna **404** (mesmo padrão de mascaramento das actions existentes).
- **D-03:** Guard escrito **test-first** (premissa do ROADMAP: "guard de IDOR fresco, test-first"). Cobrir: dono legítimo paga (200), parcela de outro locatário (404), parcela inexistente (404), não autenticado (401), parcela já paga / não pagável (no-op via `.in('status', ['pendente','vencida'])`).
- **D-04:** Update define `status='paga'` + `data_pagamento` (hoje) na **mesma tabela `parcelas`** — nenhuma tabela nova. Persistência é a fonte única de verdade para os dois lados.

### Modelo de dados do recibo (PORT-07)
- **D-05:** **Sem migração de schema.** Os campos do recibo que não existem em `parcelas` são derivados na geração:
  - **forma PIX** → constante (`"PIX"`).
  - **código de autenticação** → derivado deterministicamente do `parcela.id` (+ `data_pagamento`), p.ex. hash curto/uppercase — mesma parcela sempre gera o mesmo código no recibo, sem coluna nova.
  - valor, parcela X/N, locatário, unidade, datas → já disponíveis via join contrato → unidade / locatário.

### Biblioteca de PDF (PORT-07)
- **D-06:** **jsPDF** via **import dinâmico** (`await import('jspdf')`) dentro do handler de clique, client-side only. Escolhido por ser leve, gerar PDF no browser sem servidor, e o import dinâmico evita crash SSR em produção. Adicionar a `package.json`.

### Sync com o painel do Proprietário (PORT-06)
- **D-07:** Sync é **refresh-based**, não realtime. A baixa persiste em `parcelas`; o painel do Proprietário (Visão Geral + detalhe do contrato) reflete "Paga" no próximo carregamento/refetch. Não adicionar subscription realtime nova — a limitação conhecida de RLS em eventos UPDATE (CLAUDE.md) torna realtime não confiável aqui e o ROADMAP exige só "via persistência".

### Cálculo de destaque e progresso (PORT-04)
- **D-08:** Para progresso (pagas/total, % adimplente) é preciso o total de parcelas do contrato — `getParcelasPortal` atual exclui `futura`. Buscar **todas** as parcelas do contrato (incluindo `futura`) para os contadores de progresso; o **próximo vencimento em destaque** = parcela não-paga mais próxima (menor `data_vencimento` entre `pendente`/`vencida`/`futura` fechada). "Pagar Agora" aparece para parcelas pagáveis (`pendente`/`vencida`).

### Claude's Discretion
- Estilo/layout exato do destaque, do modal PIX e do recibo PDF → definido em `/gsd-ui-phase 25` (UI hint: yes). O portal usa **Tailwind classes** (exceção documentada ao padrão inline+CSS-vars do resto do app — ver `PortalDashboard.js`).
- Naming exato da nova Server Action e da função de derivação do código de autenticação.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Requisitos & escopo
- `.planning/ROADMAP.md` §"Phase 25: Portal do Locatário — PIX & Recibo" — goal + 4 success criteria + dependência (Phase 17 tokens; primeiro write path do Locatário).
- `.planning/REQUIREMENTS.md` PORT-04, PORT-05, PORT-06, PORT-07 — texto canônico dos requisitos; PORT-F1/PIX-F1 deferidos.
- `.planning/PROJECT.md` §"Portal (B)" + tabela "Fora de escopo" — corte de QR PIX real e gateway.

### Padrões de segurança a espelhar
- `src/actions/parcelas.js` `marcarParcelaComoPaga` — padrão de guard 4-hop do Proprietário e mascaramento 404; a action do Locatário espelha a estrutura mas troca a cadeia para `locatarios.usuario_id`.
- `CLAUDE.md` §"Regras de Negócio" / "Realtime — limitação conhecida" — IDOR guard frontend, limitação de realtime UPDATE.

### Código do portal existente (reuso/extensão)
- `src/components/features/portal/PortalDashboard.js` — casca client, fetch chain (user → locatário → contrato ativo → parcelas).
- `src/components/features/portal/ContratoCard.js`, `ParcelsTable.js` — componentes a estender com destaque + ações.
- `src/lib/queries-client.js` `getLocatarioByUserId`, `getContratoAtivoByLocatario`, `getParcelasPortal` (linha ~141, `.neq('status','futura')` — ajustar para progresso).

### Maps de codebase
- `.planning/codebase/ARCHITECTURE.md`, `CONVENTIONS.md`, `CONCERNS.md` — split server/client, Server Action contract (`{status}`/`erroMessage`), padrões de auth guard.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `PortalDashboard.js`: cadeia de fetch já resolve locatário → contrato ativo → parcelas; estender estado para "todas as parcelas" e próximo vencimento.
- `ContratoCard.js` / `ParcelsTable.js`: base para grade-resumo, histórico e botões "Pagar Agora" / "Baixar comprovante".
- `marcarParcelaComoPaga` (parcelas.js): template exato do guard test-first (autGuard → UUID_RE → cadeia de ownership → update com `.in(status)`), porém com cadeia do Proprietário — a nova action inverte para o lado do Locatário.
- `getParcelasPortal`: query base; precisa variante incluindo `futura` para progresso.

### Established Patterns
- Server Actions retornam `{ status: 200 }` ou `{ status: 4xx|5xx, erroMessage }`; mascaramento cross-tenant via 404; UUID validado com regex por arquivo.
- Mutations usam `supabaseAdmin` (server-only) + checagem de ownership manual (RLS não confiável p/ portal do Locatário).
- Portal é a exceção Tailwind do projeto (resto usa inline + CSS vars).
- Import dinâmico para libs client-only que quebram SSR (padrão a aplicar no jsPDF).

### Integration Points
- Nova Server Action em `src/actions/parcelas.js`.
- Nova/ajustada query em `src/lib/queries-client.js` (parcelas incluindo `futura`).
- jsPDF nova dependência em `package.json`.
- Asset estático do QR PIX (ex.: `public/` ou `src/`).

</code_context>

<specifics>
## Specific Ideas

- Modal PIX deve ter nota **explícita** de que o pagamento real não é processado (requisito literal de PORT-05) — é demo de TCC, não gateway.
- Recibo PDF deve conter exatamente: valor, parcela, locatário, unidade, datas, forma PIX, código de autenticação (lista literal de PORT-07).
- Cross-tenant deve retornar 404 (não 403) — alinhado ao mascaramento das actions existentes.

</specifics>

<deferred>
## Deferred Ideas

- **PORT-F1:** processamento real de pagamento PIX (gateway) — pós-v1.5.
- **PIX-F1:** geração de QR Code PIX real (BR Code) — v1.5 usa QR estático único.
- **Dream D3:** QR Code de acesso — pós-TCC.

None outras — discussão dentro do escopo da fase.

</deferred>

---

*Phase: 25-portal-do-locat-rio-pix-recibo*
*Context gathered: 2026-06-17*
