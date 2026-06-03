# Phase 7: Ajustes Finais Pré-Banca — Discussion Log

**Date:** 2026-06-01
**Method:** Interactive (discuss-phase)

---

## Areas Discussed

### 1. Escopo da Fase 7
**Question:** Quais itens entram na Fase 7?
**Options:** /auth/confirm + /auth/reset-password | WR-01 seed errors | WR-02 race condition | Extras
**Selected:** `/auth/confirm + /auth/reset-password` + 3 extras do usuário
**Notes:** Usuário adicionou 3 itens além dos gaps da Fase 6: logout proprietário, skeleton loading, remover "Acessar como Locatário"

### 2. Logout proprietário
**Question:** Botão Logout no sidebar — onde e o que acontece?
**Options:** Footer sidebar → /login | Footer sidebar → / | Header do dashboard
**Selected:** Footer do sidebar, redireciona para /login
**Notes:** Consistente com LogoutButton.js existente no portal

### 3. Botão "Acessar como Locatário"
**Question:** O que fazer com o botão?
**Options:** Remover silenciosamente | Substituir por /unidades
**Selected:** Remover silenciosamente
**Notes:** Link já é inútil — proxy.js bloqueia proprietário de acessar /portal

### 4. Skeleton loading
**Question:** Quais telas e qual granularidade?
**Options:** 4 abas + portal | Só Contratos+Parcelas | Só 4 abas
**Selected:** Todas as 4 abas do dashboard + portal do Locatário

### 5. /auth/confirm — destino após troca de token
**Question:** Para onde redirecionar após exchange?
**Options:** /portal (proxy decide) | /portal/dashboard
**Selected:** /portal — proxy decide o destino final com base no role

---

## Claude's Discretion Items
- Estrutura visual dos skeletons (proporções, número de linhas)
- Tratamento de token inválido/expirado no /auth/confirm → redirect para /portal/login com erro

## Deferred Ideas
- WR-01: Error handling no seed-prod-demo.mjs
- WR-02: Race condition no seed
- Botão "Mudar senha" no portal (pós-banca)
