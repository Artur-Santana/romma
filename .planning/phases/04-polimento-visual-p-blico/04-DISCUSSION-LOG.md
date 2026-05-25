# Phase 4: Polimento Visual Público - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-05-25
**Phase:** 04-polimento-visual-p-blico
**Areas discussed:** Troca de fontes, Img da landing page, next/image em /unidades, Migração de inline styles, Implementação correta do /dashboard/unidades

---

## Troca de fontes

| Opção | Descrição | Selecionada |
|-------|-----------|-------------|
| Substituir globalmente | Manrope entra como --font-display-arch, Noto Sans como --font-body. Afeta dashboard + portal. | |
| Só nas páginas públicas | Carregar Manrope/Noto Sans com variables extras. Dashboard e portal ficam com fontes atuais. | |
| Manter fontes atuais | Space Grotesk já é o --font-display-arch. VIS-01 sobre fontes já está satisfeito. | ✓ |

**User's choice:** Manter fontes atuais
**Notes:** VIS-01 considerado satisfeito com Space Grotesk + JetBrains Mono já instalados.

---

## Img da landing page

| Opção | Descrição | Selecionada |
|-------|-----------|-------------|
| Corrigir nesta fase | Substituir 8 `<img>` por `<Image>` em src/app/page.js. Limpa lint warnings. | ✓ |
| Deferir para Fase 6 | LP fora do escopo VIS-01. Fixes de lint podem ir junto com build final. | |

**User's choice:** Corrigir nesta fase
**Notes:** Resolve DEPL-03 completamente; foram deferidos da Fase 3 explicitamente para cá.

---

## next/image em /unidades

| Opção | Descrição | Selecionada |
|-------|-----------|-------------|
| Critério auto-satisfeito | Sem `<img>` nativas = sem violação. Success criteria passa sem adicionar fotos. | |
| Adicionar fotos reais | Cada card receberia uma imagem placeholder via `<Image>`. | ✓ |

**User's choice:** Adicionar fotos reais de unidades

**Segunda pergunta — como obter assets:**

| Opção | Descrição | Selecionada |
|-------|-----------|-------------|
| Placeholder estático no /public | Uma imagem genérica via next/image no lugar do SVG placeholder. | ✓ |
| Unsplash ou similar em runtime | URL externa no `<Image>` com next.config domains. | |

**User's choice:** Placeholder estático no /public
**Notes:** Asset estático em /public/images/. Sem dependência externa de imagem.

---

## Migração de inline styles

| Opção | Descrição | Selecionada |
|-------|-----------|-------------|
| Reescrever tudo em Tailwind v4 | Mesma migração feita nas telas do dashboard. Consistente com D-01 da Fase 1. | ✓ |
| Só ajustar cores e fontes | Manter inline styles, apenas trocar valores de cor. Menos trabalho, inconsistente. | |

**User's choice:** Reescrever tudo em Tailwind v4

**Segunda pergunta — estrutura de arquivos:**

| Opção | Descrição | Selecionada |
|-------|-----------|-------------|
| Extrair subcomponentes | UnidadePublicaCard.js + UnidadeDetailSheet.js em /features/. | ✓ |
| Manter num único arquivo | page.js continua como arquivo único. | |

**User's choice:** Extrair subcomponentes

---

## Implementação correta do /dashboard/unidades

**Área adicionada pelo usuário via freeform.**

**Diagnóstico:** UnidadeCard.js é um skeleton sem design — inputs e buttons puros sem Tailwind. O plano 01-06 disse explicitamente "Se UnidadeCard.js tiver inline styles ao ler o arquivo, não migrar agora" — foi um adiamento intencional. Não aparece em nenhuma fase futura (5 e 6 são testes e deploy).

| Opção | Descrição | Selecionada |
|-------|-----------|-------------|
| Só o UnidadeCard | Redesenhar UnidadeCard.js para Tailwind v4 + design system. | ✓ |
| Mais coisas | Outros problemas além do card. | |

**Botão editar Locatário:**

| Opção | Descrição | Selecionada |
|-------|-----------|-------------|
| Sim, incluir na Fase 4 | Adicionar botão de editar em LocatariosDesktop.js. | ✓ |
| Não, só o UnidadeCard | Locatários fica como está. | |

**User's choice:** Incluir ambos (UnidadeCard redesign + botão editar locatário)
**Notes:** Usuário perguntou se estava se antecipando. Verificado que UnidadeCard foi deliberadamente adiado e não está coberto em nenhuma fase futura. Confirmado que ambos são gaps legítimos para Fase 4.

---

## Claude's Discretion

- Nome/formato do asset de imagem placeholder em `/public` (jpg vs webp)
- Estrutura exata de props de UnidadePublicaCard.js
- Se UnidadeCard.js permanece em /components/ui/ ou move para /components/features/
- Abordagem de interface de props do UnidadeCard (simplificar as ~14 props atuais ou manter)

## Deferred Ideas

- Redesign completo da LP `/` (VIS-04) — pós-banca
- Troca de fontes para Manrope/Noto Sans — considerado desnecessário nesta fase
- Versão desktop de /unidades com grid e sidebar de filtros — nova capacidade
