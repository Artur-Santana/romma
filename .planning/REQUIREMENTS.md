# Requirements: Romma

**Defined:** 2026-05-21
**Core Value:** Proprietário gerencia edifícios, contratos e pagamentos em um único painel — Locatário acessa seu contrato e histórico via portal próprio — visitantes veem unidades disponíveis em tempo real.

---

## v1 Requirements

Requisitos restantes para o TCC — tudo que não está no Validated do PROJECT.md.

### Dashboard

- [ ] **DASH-01**: Proprietário visualiza MRR em R$ (soma de valor_mensal dos contratos ativos) no dashboard
- [ ] **DASH-02**: Proprietário visualiza receita esperada em R$ (soma de parcelas com status pendente + vencida) no dashboard
- [ ] **DASH-03**: Dashboard exibe alerta com lista de contratos vencendo nos próximos 7 dias

### Portal do Locatário

- [ ] **PORT-01**: Locatário faz login com email/senha do convite enviado pelo Proprietário
- [ ] **PORT-02**: Locatário visualiza o contrato ativo (unidade, valor mensal, data início/fim, status)
- [ ] **PORT-03**: Locatário visualiza histórico de parcelas (pagas, pendentes, vencidas — parcelas futuras não exibidas)

### Deploy

- [ ] **DEPL-01**: Supabase Auth Redirect URL configurada para aceitar o domínio Vercel (romma-alpha.vercel.app)
- [ ] **DEPL-02**: Fluxo completo de convite Locatário testado e funcional no ambiente de produção Vercel
- [ ] **DEPL-03**: Build limpo — `npm run lint`, `npm run build`, `npm audit --omit=dev` sem erros antes do push para main

### Visual

- [ ] **VIS-01**: `/unidades` redesenhada com design Obsidian Blueprint (paleta Romma: roxo `#370085`, dourado `#C5A059`; fontes Manrope/Noto Sans via next/font; `<img>` migrados para next/image)
- [ ] **VIS-02**: Dashboard com consistência visual Obsidian Blueprint em todas as telas (cards, botões, badges de status, formulários, navegação)
- [ ] **VIS-03**: Portal do Locatário com design Obsidian Blueprint consistente com o restante do sistema

### Refatoração

- [ ] **REF-01**: Limpeza de código morto: remover `useEffect` de guard duplicado e `useState(null)` de `usuario` não consumido das páginas dashboard (M2.1, M2.2 do code review)
- [ ] **REF-02**: Migrar `supabase.js` para `supabase-browser.js` em Client Components que restam: `dashboard/page.js`, `Parcelas.js`, `Contratos.js` (B1.1)
- [ ] **REF-03**: Padronizar `erroMessage` em todos os Server Actions — `contratos.js` usa `errorMessage` (typo); consumidores recebem `undefined` silencioso (M1.2)
- [ ] **REF-04**: Consolidar `useState` individuais em objetos `form`/`editForm`: `Unidades.js` (18→2 objetos), `GestaoEdificios.js` (6→2), `Locatarios.js` (5→1)

### Testes

- [ ] **TEST-01**: Testes E2E Playwright cobrindo CRUD completo do Proprietário: Edifícios (criar/editar/deletar), Unidades (criar/editar/deletar), Locatários (convidar/editar), Contratos (criar/encerrar/cancelar)
- [ ] **TEST-02**: Testes E2E cobrindo ciclo de Parcelas: gerar parcelas via Edge Function, marcar como paga, verificar mudança de status
- [ ] **TEST-03**: Testes E2E cobrindo Portal do Locatário: login via email de convite, visualizar contrato ativo, visualizar histórico de parcelas
- [ ] **TEST-04**: Teste E2E cobrindo fluxo Realtime: unidade visível na listagem pública desaparece após Proprietário criar contrato

### Demo

- [ ] **DEMO-01**: Roteiro de demonstração definido para a banca (sequência de ações, pontos de destaque, fallback se Realtime falhar)

---

## v2 Requirements

Deferred — pós-banca ou pós-TCC.

### Visual

- **VIS-04**: Landing Page (`/`) redesenhada com design Obsidian Blueprint completo (F3-S2 do TCC doc) — LP atual é funcional; polish adiado por deadline

### Demo Infrastructure

- **DEMO-02**: Dados de demo realistas cadastrados no Supabase de produção (edifícios, unidades, locatários, contratos, parcelas)
- **DEMO-03**: Validação ponta a ponta documentada: LP → listagem → login → dashboard → criar contrato → unidade some da listagem

---

## Out of Scope

| Feature | Reason |
|---------|--------|
| Escopo Dream D1 (Usuário do Locatário / funcionários) | Pós-TCC, complexidade alta |
| Escopo Dream D2 (Reservas de salas em Realtime) | Pós-TCC, depende de D1 |
| Escopo Dream D3 (QR Code de acesso) | Pós-TCC, depende de D1+D2 |
| Gateway de pagamento (boleto, cartão, Pix) | Explicitamente excluído no TCC |
| Geração de PDF de contrato | Explicitamente excluído no TCC |
| Múltiplos Proprietários por instância | Explicitamente excluído no TCC |
| Cálculo automático de multas/reajustes | Explicitamente excluído no TCC |
| Integração física com catracas/fechaduras | Explicitamente excluído no TCC |
| Customização do prazo de alerta (fixo em 7 dias) | Explicitamente excluído no TCC |

---

## Traceability

Preenchido durante a criação do roadmap.

| Requirement | Phase | Status |
|-------------|-------|--------|
| DASH-01 | — | Pending |
| DASH-02 | — | Pending |
| DASH-03 | — | Pending |
| PORT-01 | — | Pending |
| PORT-02 | — | Pending |
| PORT-03 | — | Pending |
| DEPL-01 | — | Pending |
| DEPL-02 | — | Pending |
| DEPL-03 | — | Pending |
| VIS-01 | — | Pending |
| VIS-02 | — | Pending |
| VIS-03 | — | Pending |
| REF-01 | — | Pending |
| REF-02 | — | Pending |
| REF-03 | — | Pending |
| REF-04 | — | Pending |
| TEST-01 | — | Pending |
| TEST-02 | — | Pending |
| TEST-03 | — | Pending |
| TEST-04 | — | Pending |
| DEMO-01 | — | Pending |

**Coverage:**
- v1 requirements: 21 total
- Mapped to phases: 0 (pending roadmap)
- Unmapped: 21 ⚠️

---
*Requirements defined: 2026-05-21*
*Last updated: 2026-05-21 after initial definition*
