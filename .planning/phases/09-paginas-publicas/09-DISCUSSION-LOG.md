# Phase 9: Páginas Públicas - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-06-06
**Phase:** 09-paginas-publicas
**Areas discussed:** CTAs do hero, Botão "ACESSE ANALITYCS", Card de unidade em /unidades

---

## CTAs do hero

**Questão 1: Hierarquia visual dos CTAs**

| Option | Description | Selected |
|--------|-------------|----------|
| Acessar Dashboard (primário) | Dashboard como CTA principal — mostra o produto para o avaliador diretamente. "Ver Unidades" fica secundário. | ✓ |
| Ver Unidades (primário) | Unidades públicas como CTA principal — contemporâneo para visitante que ainda não tem acesso. | |
| Mantém a hierarquia atual | Botão 1 (gradiente) = "Acessar Dashboard", Botão 2 (fundo escuro) = "Ver Unidades" — mantendo a ordem e estilos do HTML atual. | |

**User's choice:** Acessar Dashboard (primário)
**Notes:** Avaliador deve ir direto ao produto.

---

**Questão 2: Texto exato dos botões**

| Option | Description | Selected |
|--------|-------------|----------|
| ACESSAR DASHBOARD + VER UNIDADES | Direto e descritivo. Alinha com os termos do sistema. | ✓ |
| ACESSAR DASHBOARD + VER PROJETOS | Mantém "VER PROJETOS" como estava (já funciona tecnicamente). | |

**User's choice:** ACESSAR DASHBOARD + VER UNIDADES
**Notes:** Consistência com terminologia do sistema.

---

## Botão "ACESSE ANALITYCS"

| Option | Description | Selected |
|--------|-------------|----------|
| /login (label "ACESSAR PAINEL") | Botão vira link para /login. Label corrigido para "ACESSAR PAINEL" (typo + clareza). | ✓ |
| /login (label "ACESSAR ANALYTICS") | Botão vira link para /login. Label corrige typo mas mantém conceito analytics. | |
| Remover o botão | Remove o botão da seção. A seção fica somente descritiva. | |

**User's choice:** /login com label "ACESSAR PAINEL"
**Notes:** A seção SISTEMA.04 descreve o Painel do Proprietário — "ACESSAR PAINEL" é mais preciso.

---

## Card de unidade em /unidades

**Questão 1: Texto de preço oculto**

| Option | Description | Selected |
|--------|-------------|----------|
| Trocar para "Consulte o Proprietário" | Alinha com requisito PUB-01 e terminologia CLAUDE.md. | ✓ |
| Manter "Valor sob consulta" | Texto atual está bom, não precisa alterar. | |

**User's choice:** Sim, trocar para "Consulte o Proprietário"

---

**Questão 2: Mobile tap targets (PUB-03)**

| Option | Description | Selected |
|--------|-------------|----------|
| Aumentar padding dos tabs (py-3) | Simples: aumenta py-2 → py-3 nos tab buttons. Vai para ~48px. | ✓ |
| min-h-[44px] + flex items-center | Adiciona min-h-[44px] sem forçar altura maior que o necessário. | |

**User's choice:** Aumentar padding dos tabs (py-2.5 ou py-3)

---

## Claude's Discretion

- Implementação técnica: `<button>` → `<Link>` (Next.js) para CTAs de navegação
- Verificação de overflow horizontal em /unidades (PUB-03)
- Verificação do tamanho dos card buttons (py-5 ≈ 44px)

## Deferred Ideas

None — discussion stayed within phase scope.
