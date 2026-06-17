---
status: partial
phase: 22-contratos-parcelas-renova-o
source: [22-VERIFICATION.md]
started: 2026-06-16T12:00:00Z
updated: 2026-06-16T12:00:00Z
---

## Current Test

[awaiting human testing]

## Tests

### 1. Cards desktop e busca/filtro em Contratos
expected: Grid de cards 330px auto-fill visível; busca filtra por locatário/unidade em tempo real; toggle "Vencendo" restringe cards; countdown e barra de progresso presentes em cada card
result: [pending]

### 2. Archive toggle
expected: Botão alterna texto entre "Ver Arquivo (N) →" e "⌃ Ocultar Arquivo"; lista expande com eyebrow "Arquivo · Contratos Encerrados", rows com opacidade 0.78, IDs ARQ_NNN, StatusBadge real e botão "Ver →"
result: [pending]

### 3. Grade-resumo + resumo financeiro em Parcelas
expected: Grade-resumo 5 colunas com dados reais; coluna Inadimplência com fundo --danger-bg2 vermelho e valor correto quando há parcelas vencidas
result: [pending]

### 4. Timeline vertical — pontos quadrados
expected: Pontos 12×12 sem border-radius visualmente quadrados; cor varia por status; linha vertical conectando items; barra segmentada 1 célula por parcela
result: [pending]

### 5. Registrar pagamento ao vivo
expected: Parcela muda para "paga" na timeline; barra segmentada atualiza; resumo financeiro recalcula sem reload; toast "Pagamento registrado · DD/MM/AAAA" aparece
result: [pending]

### 6. Modal de renovação — fluxo completo
expected: Modal fecha após sucesso; toast "Contrato renovado até DD/MM/AAAA"; campo Término na grade-resumo atualiza; novas parcelas aparecem na timeline
result: [pending]

### 7. Validação no banco — Supabase Dashboard
expected: data_fim do contrato estendida; parcelas pagas preservadas; novas parcelas status='futura', numero sequencial MAX+1, datas sem UTC shift
result: [pending]

## Summary

total: 7
passed: 0
issues: 0
pending: 7
skipped: 0
blocked: 0

## Gaps
