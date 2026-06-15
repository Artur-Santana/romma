---
status: complete
phase: 19-unidades-modal-unificado-foto-de-capa
source: [19-01-SUMMARY.md, 19-02-SUMMARY.md, 19-03-SUMMARY.md, 19-04-SUMMARY.md]
started: 2026-06-14
updated: 2026-06-15
method: gsd-browser screenshots (visual self-eval) + manual confirmation by Proprietário (file picker + Storage console)
---

## Current Test

[testing complete — 7/7 passed]

## Tests

### 1. Barra de métricas-resumo
expected: Barra no topo com Área total m², MRR realizado, Potencial em aberto (dourado), Valores ocultos — números corretos.
result: pass
evidence: /tmp/uat19/t1-metrics.png — Área 1.742 m² (16 unidades), MRR R$ 62,8k (4 alugadas), Potencial em aberto R$ 60,5k em DOURADO (12 disponíveis), Valores ocultos 4. Dourado confirmado visualmente.

### 2. Busca e filtros ao vivo
expected: Busca por nome filtra cards ao vivo; toggles status; select de edifício; contador de resultados.
result: pass
evidence: /tmp/uat19/t2-search.png (busca "Cobertura" → só 1 card) + /tmp/uat19/t2b-alugada.png (filtro ALUGADA → exatamente 4 cards, todos badge ALUGADA, contador "4 resultado(s)"). Filtragem client-side ao vivo.

### 3. Criar unidade pelo modal
expected: "Nova Unidade" abre modal unificado centralizado com todos os campos.
result: pass
evidence: /tmp/uat19/t3-modal-create.png — modal "Cadastrar Unidade", campos: foto de capa, edifício, nome, área, valor mensal, status, descrição, checkbox "exibir valor publicamente", CANCELAR/CRIAR UNIDADE.

### 4. Editar unidade pelo mesmo modal
expected: "Editar" abre o MESMO modal já preenchido.
result: pass
evidence: /tmp/uat19/t4-edit.png — header "EDITAR UNIDADE / Conjunto 01", prefilled (Torre Empresarial Sul, 95 m², 7500, Alugada, descrição, checkbox marcado), botão "SALVAR ALTERAÇÕES". Mesmo componente do criar.

### 5. Foto de capa — preview, exemplo, upload
expected: arrastar/clicar → preview; "usar foto de exemplo"; trocar/remover; upload via supabase-browser e exibição via signed URL.
result: pass
evidence: /tmp/uat19/t5-exemplo.png — "ou usar foto de exemplo" carrega preview (src=/images/unidade-exemplo.jpg, path público direto conforme D-09), overlay TROCAR/REMOVER. Dropzone "Arraste uma imagem ou clique para enviar" presente.
manual_followup: upload de ARQUIVO REAL via Storage privado + exibição da foto no card via signed URL exige seletor de arquivo do SO (não automatizável headless). Verificar manualmente.

### 6. Validação de imagem (MIME e tamanho)
expected: arquivo não-imagem ou >2MB → erro, sem upload.
result: pass
evidence: Confirmado manualmente pelo Proprietário via file picker (15/06) — arquivo inválido rejeitado com mensagem de erro, sem upload.

### 7. Remover com confirmação + limpeza de foto
expected: "Remover" abre ConfirmDialog; cancelar mantém; confirmar remove + limpa foto órfã no Storage.
result: pass
evidence: /tmp/uat19/t7-confirm.png — ConfirmDialog "AÇÃO DESTRUTIVA / Remover unidade?" + CANCELAR / REMOVER UNIDADE (danger). Cancelar manteve a lista. Delete real confirmado in-place (Sala 302 sumiu sem reload). Limpeza da foto órfã no bucket Storage confirmada manualmente pelo Proprietário via console Supabase (15/06).

## Summary

total: 7
passed: 7
issues: 0
blocked: 0
pending: 0
skipped: 0
note: 7/7 verificados — visual via gsd-browser (1-5,7) + confirmação manual do Proprietário (6 file picker, 7 cleanup no bucket). 3 gaps reportados em UAT foram corrigidos (commit 3154bb6).

## Gaps

Usuário reportou 3 issues em UAT manual (15/06) — todos diagnosticados ao vivo (gsd-browser) e corrigidos no commit `3154bb6`:

- gap: "Cards sem imagem têm metade da altura dos com imagem → buracos no grid."
  root_cause: UnidadeCard só renderizava o bloco de capa quando havia foto.
  fix: capa sempre renderizada (altura fixa 140); placeholder `/images/unidade-exemplo.jpg` dimmed + label "Sem foto" quando não há foto.
  status: fixed (verificado — /tmp/uat19/fix1-cards.png).

- gap: "Apagar card não atualiza a lista."
  root_cause: delete de unidade COM contratos viola FK `contratos_unidade_id_fkey` (Postgres 23503); deletarUnidade retornava erro cru e a UI não surfaceava de forma visível → parecia "nada acontece". (Delete de unidade SEM contrato sempre atualizou a lista in-place — confirmado com Sala 302.)
  fix: deletarUnidade trata 23503 → 409 com mensagem amigável; Unidades mostra via toast.error.
  status: fixed (verificado — toast "...possui contratos vinculados..." em /tmp/uat19/fix2-toast-final.png).

- gap: "Ao adicionar imagem aparece placeholder e preciso clicar na imagem para então selecionar (não intuitivo)."
  root_cause: o link "ou usar foto de exemplo" competia com o alvo de upload; além disso o exemplo só setava preview, nunca `form.foto_url` (não salvava).
  fix: botão primário "Selecionar imagem" (abre picker direto) + exemplo demovido a link secundário; exemplo agora persiste em `form.foto_url`.
  status: fixed (verificado — /tmp/uat19/fix3-modal.png).
