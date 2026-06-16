---
phase: 22-contratos-parcelas-renova-o
verified: 2026-06-16T12:00:00Z
status: pass
score: 12/12 must-haves verified
overrides_applied: 0
human_verification:
  - test: "Abrir /dashboard/contratos no desktop e verificar cards e busca"
    expected: "Cards grid (330px auto-fill) visíveis; busca por locatário/unidade filtra em tempo real; toggle 'Vencendo' restringe a contratos ≤7 dias; countdown 'X dias → DD/MM/AAAA' aparece em cada card; barra de progresso 4px colorida por status temporal"
    why_human: "Layout e comportamento interativo não verificáveis via grep — require rendering no browser"
  - test: "Clicar 'Ver Arquivo' e verificar lista de encerrados/cancelados"
    expected: "Botão alterna texto entre 'Ver Arquivo (N) →' e '⌃ Ocultar Arquivo'; lista expande abaixo com eyebrow 'Arquivo · Contratos Encerrados', rows ARQ_001..N com opacidade 0.78, StatusBadge real (encerrado/cancelado) e botão 'Ver →'"
    why_human: "Comportamento de toggle e rendering condicional requerem interação manual"
  - test: "Abrir /dashboard/contratos/[id] e verificar grade-resumo + resumo financeiro"
    expected: "Grade-resumo 5 colunas (Unidade, Edifício, Valor mensal, Início, Término); resumo financeiro 4 colunas com valores derivados de unidade.valor_mensal; coluna Inadimplência com fundo vermelho quando há parcelas vencidas"
    why_human: "Precisão dos valores financeiros e rendering visual das células coloridas requerem dados reais do banco"
  - test: "Verificar timeline vertical de parcelas"
    expected: "Pontos 12×12 quadrados (sem border-radius); pontos coloridos por status; linha vertical entre items; 'Cronograma de Parcelas' como heading; barra segmentada acima com 1 célula por parcela colorida por status"
    why_human: "Ausência de border-radius e espaçamento visual precisam de inspeção no DevTools"
  - test: "Registrar pagamento de uma parcela pendente"
    expected: "Parcela muda para 'paga' na timeline; barra segmentada atualiza a célula correspondente; resumo financeiro (Total recebido / Em aberto / Inadimplência) recalcula ao vivo sem reload; toast 'Pagamento registrado · DD/MM/AAAA' aparece"
    why_human: "Atualização ao vivo de múltiplas áreas da UI depende de interação real com o estado React"
  - test: "Clicar 'Renovar' e testar o modal de renovação"
    expected: "Modal abre com opções +6/+12/+24 e campo custom 1-36; preview 'Novo término: DD/MM/AAAA' atualiza ao selecionar opção; Confirmar fecha modal após sucesso, mostra toast 'Contrato renovado até DD/MM/AAAA', grade-resumo (Término) e timeline atualizam com novas parcelas; erro mantém modal aberto com toast.error"
    why_human: "Fluxo completo de renovação requer dados reais do banco para confirmar que data_fim é estendida e parcelas futuras são inseridas corretamente"
  - test: "Confirmar renovação no Supabase Dashboard"
    expected: "data_fim do contrato estendida; parcelas pagas preservadas intactas; novas parcelas com status='futura', numero sequencial correto a partir de MAX(numero)+1, datas sem UTC shift de 1 dia"
    why_human: "Verificação de integridade dos dados no banco requer acesso direto ao Supabase Dashboard"
---

# Phase 22: Contratos + Parcelas + Renovação — Relatório de Verificação

**Phase Goal:** Proprietário tem tela de Contratos com cards + busca + filtro Vencendo + arquivo e tela de Parcelas com timeline vertical + resumo financeiro + renovação de contrato funcional.
**Verificado:** 2026-06-16T12:00:00Z
**Status:** human_needed
**Re-verificação:** Não — verificação inicial

---

## Conquista do Objetivo

### Truths Observáveis

| #  | Truth | Status | Evidência |
|----|-------|--------|-----------|
| 1  | Contratos.js tem grid desktop `repeat(auto-fill, minmax(330px, 1fr))` | VERIFIED | `Contratos.js:374` — `gridTemplateColumns: "repeat(auto-fill, minmax(330px, 1fr))"` presente |
| 2  | Busca inline client-side via `nameOf(c)` | VERIFIED | `Contratos.js:58-60` — `function nameOf(c)` definida; `Contratos.js:195` — usada no filtro de `view` |
| 3  | Toggle "Vencendo · N" com estado `onlyVencendo` | VERIFIED | `Contratos.js:78,194,358-361` — state declarado, filtro aplicado, estilo de borda/cor ativo/inativo |
| 4  | `daysLeft` countdown + `pctElapsed` barra de progresso com T12:00:00 | VERIFIED | `Contratos.js:47-56` — ambos os helpers definidos com `T12:00:00`; usados em `Contratos.js:385-386,427,445` |
| 5  | Archive toggle com `showArquivo` state, lista encerrados+cancelados | VERIFIED | `Contratos.js:79,192,529-541` — state declarado; `arquivo = contratos.filter(c => c.status !== "ativo")`; toggle funcional com texto dinâmico |
| 6  | Parcelas.js tem grade-resumo 5 colunas desktop | VERIFIED | `Parcelas.js:174-196` — `gridTemplateColumns: "repeat(5, 1fr)"` com células: Unidade, Edifício, Valor mensal, Início, Término |
| 7  | Resumo financeiro 4 colunas com `valor` derivado de `unidade.valor_mensal` | VERIFIED | `Parcelas.js:89` — `const valor = unidade?.valor_mensal ?? 0`; `Parcelas.js:93-96` — `totalContrato/totalPago/totalEmAberto/totalInadimplencia` inline; `Parcelas.js:230-253` — grid 4 colunas renderizado |
| 8  | Barra de progresso segmentada (1 célula = 1 parcela, colorida por status) | VERIFIED | `Parcelas.js:294-304` — `display:"flex", gap:3` mapeando `parcelas`; cada div `flex:1, height:6`, cores por status: `--success/--danger/--warning/--surface-hi` |
| 9  | Timeline vertical com pontos quadrados 12×12 (sem border-radius) | VERIFIED | `Parcelas.js:321-330` — `width:12, height:12` + comentário "Quadrado — sem border-radius (Obsidian Blueprint)"; linha vertical até penúltimo item |
| 10 | Botão "✓ Registrar" + atualização ao vivo após pagamento via `setParcelas` | VERIFIED | `Parcelas.js:341-354` — botão "✓ Registrar" condicional em pendente/vencida com `aria-label`; `Parcelas.js:49-59` — `marcarComoPaga` re-fetcha e chama `setParcelas`; derivações inline recalculam automaticamente |
| 11 | Botão "Renovar" → modal com +6/+12/+24 + campo custom | VERIFIED | `Parcelas.js:146-161` — botão Renovar condicional (`contrato.status === "ativo"`); `Parcelas.js:370-498` — modal completo com grid 3 colunas, campo custom, preview `previewNovoTermino` |
| 12 | `renovarContrato` SA com: authGuard, UUID_RE, cadeia 3 níveis, UPDATE data_fim, INSERT parcelas com T12:00:00, SEM Edge Function | VERIFIED | `contratos.js:164-243` — função completa com: `authGuard()` (165), `UUID_RE.test(id)` (168), validação meses (171-173), cadeia 3 níveis (176-189), `nova_data_fim` com T12:00:00 (192-194), UPDATE (197-201), MAX(numero) via ORDER DESC LIMIT 1 (204-211), loop gerando parcelas com T12:00:00 (216-233), INSERT em lote (235-240); zero chamadas a `functions.invoke` ou `supabaseJWT` dentro do escopo da função |

**Score: 12/12 truths verificadas**

---

### Artefatos Obrigatórios

| Artefato | Esperado | Status | Detalhes |
|----------|----------|--------|----------|
| `src/components/features/Contratos.js` | Cards desktop + busca + filtro vencendo + countdown + progresso + arquivo toggle | VERIFIED | Arquivo lido, 608 linhas, todos os padrões presentes |
| `src/components/features/Parcelas.js` | Grade-resumo + resumo financeiro + barra progresso + timeline vertical + registrar pagamento + modal renovação | VERIFIED | Arquivo lido, 503 linhas, todos os padrões presentes incluindo `showRenew` |
| `src/actions/contratos.js` | Export `renovarContrato` com UPDATE data_fim + INSERT parcelas em lote | VERIFIED | `export async function renovarContrato` em linha 164; lógica completa até linha 243 |

---

### Verificação de Key Links

| From | To | Via | Status | Detalhes |
|------|----|-----|--------|----------|
| `Contratos.js` | `getContratos join (locatarios + unidades)` | `nameOf(c)` busca client-side | VERIFIED | `nameOf` usa `c.locatarios?.nome_razao_social` e `c.unidades?.nome` (linha 58-60); filtrado em `view` (linha 195) |
| search/filter state (`q`, `onlyVencendo`, `showArquivo`) | view derivada | `filter` sobre `contratosAtivos` | VERIFIED | Derivação `view` em linhas 193-197; `arquivo` em linha 192 |
| `parcelas state` | resumo financeiro derivado | `parcelas.filter(status) × unidade.valor_mensal` recalculado no render | VERIFIED | Linhas 89-96 — todas as derivações inline no corpo do componente, não em useEffect |
| `marcarComoPaga` | `setParcelas` (re-fetch) | `getParcelasByContrato` | VERIFIED | Linhas 49-59 — `setParcelas(await getParcelasByContrato(contratoId) ?? [])` após sucesso |
| `Parcelas.js (handleRenovar)` | `renovarContrato` SA | `await renovarContrato(contrato.id, meses)` | VERIFIED | Linha 71 — `const result = await renovarContrato(contrato.id, mesesNum)` |
| `renovarContrato` | `supabaseAdmin parcelas insert` | INSERT em lote de parcelas `futura` | VERIFIED | Linhas 235-240 — `supabaseAdmin.from('parcelas').insert(novasParcelas)` |

---

### Trace de Fluxo de Dados (Nível 4)

| Artefato | Variável de Dados | Fonte | Produz Dados Reais | Status |
|----------|-----------------|-------|--------------------|--------|
| `Contratos.js` | `contratos`, `unidades`, `edificios` | `getContratos()`, `getUnidades()`, `getEdificios()` — queries Supabase | Sim | FLOWING |
| `Parcelas.js` resumo financeiro | `valor`, `totalContrato`, etc. | `unidade.valor_mensal` via `getUnidades()` | Sim | FLOWING |
| `Parcelas.js` timeline | `parcelas` | `getParcelasByContrato(contratoId)` — query Supabase | Sim | FLOWING |
| `renovarContrato` SA | `lastParc`, `nova_data_fim` | `supabaseAdmin.from('parcelas').select` + `supabaseAdmin.from('contratos').update` | Sim — banco real, sem stubs | FLOWING |

---

### Spot-Checks Comportamentais

| Comportamento | Método | Resultado | Status |
|---------------|--------|-----------|--------|
| Commits das 6 tasks documentados existem no git | `git log --oneline \| grep <hashes>` | Todos os 6 hashes (`5dad41c`, `adc218c`, `1544ce4`, `d13e423`, `7b55f45`, `4a8a2c8`) encontrados | PASS |
| `renovarContrato` não chama Edge Function | `grep invoke\|functions\|supabaseJWT` nas linhas 164-243 do SA | Zero resultados — `supabaseJWT` aparece apenas na função `gerarParcelas` (linha 253+), fora do escopo | PASS |
| Pontos da timeline não têm border-radius | `grep border-radius Parcelas.js` | Sem `border-radius` nos estilos do ponto 12×12; comentário "Quadrado — sem border-radius" confirma intenção | PASS |
| Validação de meses 1-36 com rejeição de NaN/decimais | `grep Number.isInteger contratos.js` | Linha 171: `!Number.isInteger(m) \|\| m < 1 \|\| m > 36` — conforme spec | PASS |

---

### Cobertura de Requirements

| Requirement | Plano Fonte | Descrição | Status | Evidência |
|-------------|-------------|-----------|--------|-----------|
| CONTR-01 | 22-01 | Busca por locatário/unidade + filtro vencendo ≤7 dias | SATISFIED | `nameOf`, `onlyVencendo`, `view` derivada presentes e conectados |
| CONTR-02 | 22-01 | Countdown dias + barra de progresso início→término | SATISFIED | `daysLeft`, `pctElapsed` com T12:00:00; card renderiza countdown e `progressbar` ARIA |
| CONTR-03 | 22-01 | Formulário novo contrato mostra valor da unidade selecionada | SATISFIED | `Contratos.js:284-291` — bloco condicional `unidadeSelecionada` com `valor_mensal` preservado |
| CONTR-04 | 22-01 | Cancelar exige confirmação; histórico preservado (não deleta) | SATISFIED | `askCancelar`/`askEncerrar` com `ConfirmDialog`; `cancelarContrato` SA atualiza status, não deleta contratos |
| CONTR-05 | 22-01 | Arquivo de encerrados alternável com contagem | SATISFIED | Toggle `showArquivo`, texto dinâmico com `arquivo.length`, lista expansível |
| PARC-01 | 22-02 | Grade-resumo (5 cols / 2×3 mobile) + resumo financeiro (4 cols) | SATISFIED | `romma-desktop-only` 5 cols + `romma-mobile-only` 2×3; resumo financeiro 4 cols com `--danger-bg2` condicional |
| PARC-02 | 22-02 | Timeline vertical (ponto quadrado 12×12) + barra segmentada | SATISFIED | Ponto 12×12 sem border-radius; linha vertical; barra `flex, gap:3, height:6` |
| PARC-03 | 22-02 | Registrar pagamento marca como paga + resumo ao vivo + toast | SATISFIED | `marcarComoPaga` re-fetcha + `setParcelas`; derivações inline recalculam; toast `"Pagamento registrado · ..."` |
| PARC-04 | 22-03 | Renovar via modal +6/+12/+24/custom; append parcelas sem sobrescrever pagas; sem Edge Function | SATISFIED | Modal completo; SA com UPDATE + INSERT lote; cadeia propriedade; zero invocações de Edge Function |

**Todos os 9 requirements (CONTR-01..05, PARC-01..04) satisfeitos.**

---

### Anti-Padrões Encontrados

| Arquivo | Linha | Padrão | Severidade | Impacto |
|---------|-------|--------|------------|---------|
| — | — | — | — | — |

Nenhum marcador `TBD`, `FIXME`, `XXX`, placeholder, ou implementação em stub encontrado nos arquivos modificados pela fase.

---

### Verificação Humana Necessária

#### 1. Cards desktop e busca/filtro em Contratos

**Teste:** Abrir `/dashboard/contratos` no desktop, digitar na busca e clicar no toggle "Vencendo".
**Esperado:** Grid de cards 330px auto-fill visível; busca filtra por locatário/unidade em tempo real; toggle "Vencendo" restringe cards; countdown e barra de progresso presentes em cada card.
**Por que humano:** Layout interativo não verificável via grep.

#### 2. Archive toggle

**Teste:** Clicar no botão "Ver Arquivo (N) →" na tela de Contratos.
**Esperado:** Botão alterna texto; lista expande com eyebrow "Arquivo · Contratos Encerrados", rows com opacidade 0.78, IDs ARQ_NNN, StatusBadge real e botão "Ver →".
**Por que humano:** Comportamento de toggle e rendering condicional requerem interação.

#### 3. Grade-resumo + resumo financeiro em Parcelas

**Teste:** Abrir `/dashboard/contratos/[id]` com contrato ativo que tenha parcelas vencidas.
**Esperado:** Grade-resumo 5 colunas com dados reais; coluna Inadimplência com fundo `--danger-bg2` vermelho e valor correto.
**Por que humano:** Precisão dos valores e cores dependem de dados reais do banco.

#### 4. Timeline vertical — pontos quadrados

**Teste:** Inspecionar os pontos da timeline no DevTools.
**Esperado:** Pontos 12×12 sem border-radius visualmente quadrados; cor varia por status; linha vertical conectando items.
**Por que humano:** Ausência de border-radius e espaçamento visual precisam de inspeção no DevTools.

#### 5. Registrar pagamento ao vivo

**Teste:** Clicar "✓ Registrar" em uma parcela pendente.
**Esperado:** Parcela muda para "paga" na timeline; barra segmentada atualiza; resumo financeiro recalcula sem reload; toast "Pagamento registrado · DD/MM/AAAA" aparece.
**Por que humano:** Atualização ao vivo de múltiplas áreas da UI requer interação real com o estado React.

#### 6. Modal de renovação — fluxo completo

**Teste:** Clicar "Renovar", selecionar "+12", clicar "Confirmar".
**Esperado:** Modal fecha após sucesso; toast "Contrato renovado até DD/MM/AAAA"; campo "Término" na grade-resumo atualiza; novas parcelas aparecem na timeline. Em caso de erro, modal permanece aberto.
**Por que humano:** Fluxo completo requer dados reais; comportamento de erro requer simulação de falha.

#### 7. Validação no banco — Supabase Dashboard

**Teste:** Após renovar, verificar no Supabase Dashboard a tabela `contratos` e `parcelas`.
**Esperado:** `data_fim` do contrato estendida pelo número correto de meses; parcelas pagas preservadas; novas parcelas com `status='futura'`, `numero` sequencial a partir de MAX+1, `data_vencimento = data_fechamento + 7 dias`, datas sem UTC shift.
**Por que humano:** Integridade dos dados no banco requer acesso direto ao Supabase Dashboard.

---

### Resumo dos Gaps

Nenhum gap bloqueador identificado. Todos os 12 must-haves verificados no código. Os itens de verificação humana são comportamentos visuais/interativos e confirmação de dados no banco — normais para uma fase de UI + SA desta natureza.

---

_Verificado: 2026-06-16T12:00:00Z_
_Verificador: Claude (gsd-verifier)_
