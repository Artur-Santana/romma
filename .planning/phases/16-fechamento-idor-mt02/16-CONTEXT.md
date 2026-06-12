# Phase 16: Fechamento IDOR MT-02 - Context

**Gathered:** 2026-06-12
**Status:** Ready for planning (decisões travadas pelo milestone audit v1.1 — sem discuss)

<domain>
## Phase Boundary

Closure de segurança: escopar por `proprietario_id` os 4 vetores IDOR de escrita que o milestone audit v1.1 encontrou ainda abertos. Usam `supabaseAdmin` (bypassa RLS) sem ownership pre-check, protegidos só por `authGuard` (auth+is_proprietario) mas não por tenant.

Alvos (de `src/actions/`):
- `criarUnidade` (unidades.js) — valida que `edificio_id` do form pertence ao user
- `criarContrato` (contratos.js) — valida ownership da `unidade_id` (unidade→edificio→proprietario_id)
- `editarContrato` (contratos.js) — pré-check ownership do contrato antes do update
- `marcarParcelaComoPaga` (parcelas.js) — authGuard retorna `{}` hoje → mudar p/ `{user}` + chain parcela→contrato→unidade→edificio→proprietario_id

Fora de escopo: AUTH-02 (separado, deferido), refactor além do necessário, novos vetores não-listados.

</domain>

<decisions>
## Implementation Decisions (travadas pelo audit + padrão 15-02/15-04)

### Padrão de fix
- **D-01:** Espelhar EXATAMENTE o padrão já aplicado em 15-02 (editarUnidade/deletarUnidade, cancelar/encerrarContrato). Ownership pre-check via fetch encadeado, retorno 404 em cross-tenant. NÃO inventar padrão novo.
- **D-02:** `marcarParcelaComoPaga`: authGuard em parcelas.js retorna `{}` hoje (mesmo bug do 15-02) → mudar p/ `return { user }` + atualizar caller com `const { err, user } = await authGuard()`.
- **D-03:** Contrato de retorno preservado: `{ status: 200 }` / `{ status: 4xx|5xx, erroMessage }` (erroMessage spelling). Cross-tenant → 404.

### Cobertura de testes
- **D-04:** Testes unitários espelham 15-04: cada Action ganha happy + erro validação + cross-tenant block. Mock total via factory compartilhada `test/helpers/supabaseMock.js` (vi.hoisted+require, mockImplementationOnce p/ chains sequenciais).
- **D-05:** Novos specs: `test/unit/actions/parcelas.test.js` (novo); estender `unidades.test.js` (criarUnidade) e `contratos.test.js` (criarContrato, editarContrato).
- **D-06:** Asserção D-08-style: provar `.eq('proprietario_id', user.id)` no mock da query de ownership.

### Verificação
- **D-07:** `npx vitest run` exit 0 (suite completa, incluindo novos casos); `npx playwright test --list` parseia. CI valida no PR.

### Claude's Discretion
- Forma exata dos fetches de ownership (1-hop unidade→edificio vs join), desde que escopados por user.id.
- Quantos planos/waves.

</decisions>

<canonical_refs>
## Canonical References

- `.planning/v1.1-MILESTONE-AUDIT.md` — origem do gap (MT-02 parcial), evidência exata
- `.planning/phases/15-testes/15-02-SUMMARY.md` — padrão de ownership pre-check JÁ aplicado (espelhar)
- `.planning/phases/15-testes/15-04-SUMMARY.md` — padrão de teste unit cross-tenant (espelhar)
- `src/actions/unidades.js` — criarUnidade (linha 18); authGuard já retorna {user} pós-15-02
- `src/actions/contratos.js` — criarContrato (19), editarContrato (46); authGuard já retorna {user} pós-15-02
- `src/actions/parcelas.js` — authGuard (9, retorna {}), marcarParcelaComoPaga (17)
- `test/helpers/supabaseMock.js`, `test/unit/actions/unidades.test.js`, `contratos.test.js` — reuso
- `CLAUDE.md` — schema (parcela→contrato→unidade→edificio), Server Action contract

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable
- authGuard em unidades.js + contratos.js JÁ retorna `{ user }` (15-02). Só parcelas.js ainda retorna `{}`.
- Factory mock + padrões de teste de 15-03/15-04 (vi.hoisted+require, mockImplementationOnce).
- Schema chain: parcela.contrato_id → contrato.unidade_id → unidade.edificio_id → edificio.proprietario_id.

### Integration Points
- `marcarParcelaComoPaga` é o mais profundo (4-hop até proprietario_id).
- criarUnidade/criarContrato são inserts — validar FK do form (edificio_id/unidade_id) ANTES do insert.

</code_context>

<deferred>
## Deferred Ideas
- AUTH-02 form-level guard — separado, deferido pós-banca (documentado em STATE.md).
- Nenhum outro gap perdido.

</deferred>

---

*Phase: 16-fechamento-idor-mt02*
*Context gathered: 2026-06-12 (locked from milestone audit, no discuss)*
