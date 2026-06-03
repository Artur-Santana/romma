# Phase 6: Deploy Final e Demo - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-06-01
**Phase:** 6-deploy-final-e-demo
**Areas discussed:** Deploy atual, Invite prod, Demo data, Demo script, Fallback Realtime, Env vars

---

## Deploy atual

| Option | Description | Selected |
|--------|-------------|----------|
| Já deployado e rodando | romma-alpha.vercel.app está no ar, env vars podem precisar ajuste | ✓ |
| Nunca foi deployado | Projeto existe na Vercel mas sem deploy | |
| Deploy existe mas quebrado | No ar mas com erros | |

**User's choice:** Já deployado e rodando
**Notes:** Trabalho é validação e ajustes, não deploy from scratch.

---

## Invite prod (DEPL-01 + DEPL-02)

| Option | Description | Selected |
|--------|-------------|----------|
| Não testei ainda | Não sei se SITE_URL correto, Supabase aceita domínio, email chega | ✓ |
| Testei e funciona | Email chega, link redireciona para /dashboard em prod | |
| Testei mas está quebrado | Sei onde falha | |

**User's choice:** Não testei ainda
**Notes:** Validação completa necessária em produção.

---

## Demo data

| Option | Description | Selected |
|--------|-------------|----------|
| Dados mínimos ao vivo | Criar dados na hora da demo — mais autêntico | |
| Dados pré-carregados realistas | Seed script para prod, sistema "em operação" | |
| Mix: base pré-carregada + demo ao vivo | Dados de fundo + criar contrato ao vivo | ✓ |

**User's choice:** Mix — base pré-carregada + ação ao vivo
**Notes:** Base mostra sistema operando; ação ao vivo demonstra fluxo completo com unidade sumindo de /unidades.

---

## Demo script (DEMO-01)

| Option | Description | Selected |
|--------|-------------|----------|
| Markdown no repo | DEMO.md com sequência, falas, fallbacks | |
| Cheat sheet impresso | PDF/HTML compacto para ter em mãos | |
| Ambos | DEMO.md no repo (gitignored) + cheat sheet imprimível | ✓ |

**User's choice:** Ambos — DEMO.md no repo adicionado ao .gitignore + versão imprimível
**Notes:** DEMO.md deve ficar fora do git (dado sensível de banca).

---

## Fallback Realtime

| Option | Description | Selected |
|--------|-------------|----------|
| Refresh manual + explicação verbal | F5 e explicar limitação RLS conhecida | ✓ |
| 2 abas lado a lado | Dashboard + /unidades — refresh manual na segunda | |
| Você decide | Planner escolhe | |

**User's choice:** Refresh manual + explicação verbal
**Notes:** Roteiro deve incluir nota explícita sobre a limitação RLS.

---

## Env vars

| Option | Description | Selected |
|--------|-------------|----------|
| Todas configuradas | NEXT_PUBLIC_*, SUPABASE_JWT, ROLE_KEY, SITE_URL, APP_URL todas no Vercel | |
| Só as públicas | NEXT_PUBLIC_* OK, server-only podem faltar | |
| Não sei ao certo | Preciso verificar o painel da Vercel | ✓ |

**User's choice:** Não sei ao certo
**Notes:** Planner deve incluir passo de verificação/configuração de todas as env vars obrigatórias.

---

## Deferred Ideas

- DEMO-02: Dados realistas mais elaborados — v2 requirements
- DEMO-03: Validação ponta a ponta documentada — v2 requirements
