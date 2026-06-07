---
status: complete
phase: 09-paginas-publicas
source: [09-01-SUMMARY.md, 09-02-SUMMARY.md, 09-03-SUMMARY.md, 09-04-SUMMARY.md]
started: 2026-06-06T23:00:00Z
updated: 2026-06-06T23:00:00Z
---

## Current Test

[testing complete]

## Tests

### 1. CTAs da landing page — ACESSAR DASHBOARD, VER UNIDADES, ACESSAR PAINEL
expected: |
  Na landing page (/), clique em cada um dos três botões principais:
  - "ACESSAR DASHBOARD" (CTA primário com gradiente) → navega para /login
  - "VER UNIDADES" (botão secundário) → navega para /unidades
  - "ACESSAR PAINEL" (seção inferior da página) → navega para /login
  Nenhum dos três retorna 404 ou fica na mesma página sem navegar.
result: pass

### 2. Header — "COMEÇAR AGORA" navega para /login
expected: |
  No Header da landing page (desktop e mobile):
  - Desktop: clicar "COMEÇAR AGORA" navega para /login
  - Mobile: o botão "COMEÇAR AGORA" aparece no menu e clicar navega para /login
  Nenhum dos dois fica na página ou retorna 404.
result: pass

### 3. Listagem /unidades — card com 5 campos e badge
expected: |
  Em /unidades, cada card de unidade disponível exibe:
  1. Nome da unidade
  2. Nome do edifício
  3. Área em m²
  4. Valor mensal (ou "Consulte o Proprietário" se valor não visível)
  5. Badge "Disponível"
  Cards com valor oculto mostram "Consulte o Proprietário" no lugar do preço.
result: pass

### 4. Empty state em /unidades
expected: |
  Se não houver nenhuma unidade disponível na listagem (ou ao filtrar por uma categoria sem resultados),
  a página exibe uma mensagem informativa tipo "Nenhuma unidade disponível" — sem tela em branco ou erro.
result: pass

### 5. Sheet de detalhe da unidade
expected: |
  Ao clicar em um card de unidade em /unidades:
  - Abre um painel/sheet com detalhes da unidade
  - Botão ✕ fecha o sheet
  - Botões de ação ("Tenho interesse →", "Fechar") estão visíveis e clicáveis
  - Sheet fecha corretamente ao clicar fora ou no ✕
result: pass

### 6. Mobile 375px — sem overflow horizontal e tap targets adequados
expected: |
  Com viewport em ~375px (ou DevTools mobile iPhone SE):
  - Página /unidades não tem scroll horizontal
  - Abas de filtro (tabs) têm pelo menos 44px de altura clicável
  - Link "← Voltar" tem pelo menos 44px de altura
  - Botão ✕ do sheet tem pelo menos 44×44px
  - Botões de ação do sheet ("Tenho interesse", "Fechar") têm pelo menos 44px de altura
result: pass

## Summary

total: 6
passed: 6
issues: 0
pending: 0
skipped: 0
blocked: 0

## Gaps

[none yet]
