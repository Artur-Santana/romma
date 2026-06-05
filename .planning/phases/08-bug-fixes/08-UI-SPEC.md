---
phase: 8
slug: bug-fixes
status: draft
shadcn_initialized: true
preset: radix-lyra
created: 2026-06-05
---

# Phase 8 — UI Design Contract

> Visual and interaction contract para correções cirúrgicas de bugs. Nenhuma tela nova é construída. Todos os tokens e componentes são pré-existentes — este contrato documenta exatamente quais elementos são afetados e como devem se comportar após os fixes.

---

## Design System

| Property | Value |
|----------|-------|
| Tool | shadcn/ui |
| Preset | radix-lyra |
| Component library | radix-ui ^1.4.3 |
| Icon library | remixicon |
| Font | Space Grotesk (body/mono), Hanken Grotesk (headline) |

> Fonte: `components.json` + `globals.css` — não modificados nesta fase.

---

## Spacing Scale

Sistema de espaçamento existente no projeto (base 4px). Declarado aqui como referência; esta fase não adiciona nem modifica valores.

| Token | Value | Usage |
|-------|-------|-------|
| xs | 4px | Icon gaps, inline padding |
| sm | 8px | Compact element spacing |
| md | 16px | Default element spacing |
| lg | 24px | Section padding |
| xl | 32px | Layout gaps |
| 2xl | 48px | Major section breaks |
| 3xl | 64px | Page-level spacing (p-12 = 48px) |

Exceções: nenhuma nova exceção nesta fase.

---

## Typography

Escala real em uso no codebase — não modificada nesta fase. Executor deve usar os mesmos tokens dos componentes existentes ao inserir novos elementos.

| Role | Size | Weight | Line Height | Token |
|------|------|--------|-------------|-------|
| Eyebrow / Label mono | 10px | 700 | 1.2 | `font-mono text-[10px] tracking-[1px] uppercase` |
| Body small / status | 11px | 400–700 | 1.4 | `font-mono text-[11px]` |
| Body | 12–13px | 400–500 | 1.5 | `font-body text-[12px]` / `text-[13px]` |
| Heading card | 18px | 700 | 1.2 | `font-display font-bold text-[18px] tracking-[-0.6px]` |
| Display / h1 público | 32px | 700 | 1.0 | `font-body font-bold text-[32px] tracking-[-1.6px]` |

> Fonte: leitura direta de `Unidades.js`, `LocatariosDesktop.js`, `UnidadesPublicas.js`, `UnidadeCard.js`.

---

## Color

Paleta Obsidian Blueprint — pré-existente, não modificada nesta fase.

| Role | Token | Value (oklch) | Usage |
|------|-------|---------------|-------|
| Dominant (60%) | `--background` | `oklch(0.2393 0 0)` | Fundo de página |
| Secondary (30%) | `--surface` / `--surface-hi` | `oklch(0.182 0 0)` / `oklch(0.218 0 0)` | Cards, tabelas, sidebar |
| Accent (10%) | `--indigo` / `--primary` | `oklch(0.339 0.1793 301.68)` | CTAs primários, bordas de formulário ativo, badges de seleção |
| Destrutivo | `--danger-fg` | `oklch(0.826 0.073 22.5)` | Texto/ícone de ações destrutivas (Remover, Revogar) |
| Semântico — sucesso | `--success` | `oklch(0.696 0.17 162.5)` | Badge "Convite aceito", "Disponível", "Ativo" |
| Semântico — aviso | `--warning` | `oklch(0.769 0.165 70.08)` | Badge "Convite pendente", "Pendente" |
| Semântico — erro inline | `--danger-bg2` + `--danger-fg` | fundo `oklch(0.27 0.13 27.38)`, texto fg | Bloco de erro de formulário |

Accent reservado para: CTAs primários (bg-indigo), bordas de formulário de convite, tab/filtro ativo em `/unidades`, checkbox "Exibir valor publicamente" quando marcado.

---

## Contracts por Bug

### BUG-01 — Revogar Acesso (LocatariosDesktop.js)

**Problema:** `revogarConvite` server action falha com FK violation ou guard incorreto.
**Elemento UI afetado:** Botão "REVOGAR" na coluna Ações, visível apenas quando `isPendente === true`.

**Contrato de interação:**
- Botão: `variant="ghost"`, `font-mono text-[10px] text-danger-fg uppercase tracking-[0.5px] font-bold`
- Label: `REVOGAR` (sem alteração de copy)
- Estado de sucesso: locatário some da lista (re-fetch via `getLocatarios()`)
- Estado de erro: substituir `alert()` por `setErro(erroMessage)` renderizado na tabela. Exibir em `font-mono text-[11px] text-danger-fg` logo abaixo do header da tabela.

### BUG-02 — Erro de Editar × Deletar Unidade (Unidades.js + UnidadeCard.js)

**Problema:** Estado `erro` compartilhado faz erro de delete aparecer dentro do form de edição.
**Solução de estado:** Dois estados separados — `erroDelete` (nível da lista) e `erroEdit` (dentro do UnidadeCard em edição).

**Slot de erro de delete (nível de lista — Unidades.js):**
```
bg-[var(--danger-bg2)] border-l-2 border-l-danger-fg px-4 py-3 font-mono text-[12px] text-danger-fg mb-4
```
Posição: imediatamente acima da lista de UnidadeCards (`div.flex.flex-col.gap-0.border`).
Copy: texto da mensagem retornada por `result.erroMessage`.

**Slot de erro de edição (dentro de UnidadeCard.js, estado isEditing):**
```
font-mono text-[11px] text-danger-fg block mb-3
```
Posição: entre os campos do form e os botões Salvar/Cancelar (já implementado — manter como está).
Prop: `erro` passa apenas erros de edição — nunca erros de delete.

### BUG-03 — Status de Convite do Locatário (LocatariosDesktop.js)

**Problema:** `status_convite` não está sendo lido corretamente da query, fazendo o badge exibir estado incorreto.
**Solução de dados:** `getLocatarios()` deve retornar a coluna `status_convite` populada com `"pendente"` ou `"aceito"`.

**Contrato de badge — StatusBadge existente, sem alteração:**

| Estado real | Valor passado para StatusBadge | Label exibido | Cor fg | Cor bg |
|-------------|-------------------------------|---------------|--------|--------|
| Convite enviado, não aceito | `"pendente_convite"` | `"Convite pendente"` | `var(--warning)` | `oklch(from var(--warning) l c h / 0.12)` |
| Convite aceito / usuário ativo | `"aceito"` | `"Convite aceito"` | `var(--success)` | `oklch(from var(--success) l c h / 0.12)` |

> As strings de badge estão corretas em `StatusBadge.js`. O bug é de dados, não de apresentação. O executor deve corrigir a query, não o componente de badge.

**Avatar diferenciado por estado (já implementado — manter):**
- `isPendente`: `bg-transparent border-border-2 text-fg-4`
- Ativo: `bg-surface border-border-2 text-fg-1`

### BUG-04 — Link de Voltar em /unidades (UnidadesPublicas.js)

**Problema:** Página `/unidades` não tem link de navegação de volta para a home.
**Elemento novo:** Link "← Voltar" no bloco de header existente (linhas 79–89 do componente).

**Especificação completa:**
- `href="/"` (home pública, não `/dashboard`)
- Posição: header block (`div.px-5.pt-5.pb-6.border-b.border-border-3`), linha nova **acima** do `h1`, ao lado esquerdo do `flex justify-between`
- Implementar como `<Link href="/">` (Next.js `<Link>`)
- Tratamento visual — consistente com o estilo mono do header:
  ```
  font-mono text-[11px] text-fg-4 tracking-[1px] uppercase
  ```
- Copy exato: `← Voltar`
- Sem sublinhado, sem hover especial além do padrão `text-fg-2` no hover (transition-colors)
- Não usar `.eyebrow` (class com display:block — quebraria o layout inline)

---

## Copywriting Contract

| Elemento | Copy |
|----------|------|
| CTA primário desta fase | N/A — fase de bug fixes, sem novos CTAs |
| Link de retorno (BUG-04) | `← Voltar` |
| Erro de delete unidade (BUG-02) | Texto retornado por `result.erroMessage` (dinâmico — sem override de copy) |
| Erro de revogar acesso (BUG-01) | Texto retornado por `erroMessage` (dinâmico — sem override de copy) |
| Badge convite pendente (BUG-03) | `Convite pendente` (já em StatusBadge — não alterar) |
| Badge convite aceito (BUG-03) | `Convite aceito` (já em StatusBadge — não alterar) |
| Empty state lista locatários | `Nenhum locatário cadastrado.` (já existente — não alterar) |

---

## Registry Safety

| Registry | Blocks Used | Safety Gate |
|----------|-------------|-------------|
| shadcn official | Button, Input, Select, Skeleton (pré-existentes) | Não requerido |
| Third-party | Nenhum | N/A |

> Esta fase não adiciona nenhum componente novo via shadcn CLI. Todos os componentes UI já estão no codebase.

---

## Notas de Implementação para o Executor

1. **BUG-01:** A correção é na Server Action `revogarConvite` (`src/actions/locatarios.js`) e possivelmente na query de locatários. Não alterar o componente de UI além de substituir `alert()` por erro inline.

2. **BUG-02:** Criar dois estados: `erroDelete` e `erroEdit` em `Unidades.js`. Passar `erroEdit` para `UnidadeCard` via prop `erro`. Renderizar `erroDelete` no container da lista, fora de qualquer card.

3. **BUG-03:** Investigar `getLocatarios()` em `src/lib/queries-client.js` — verificar se `status_convite` está sendo selecionado. Pode envolver join com `auth.users` ou view customizada. Não alterar `StatusBadge.js`.

4. **BUG-04:** Único elemento visual novo. Inserir `<Link>` no JSX de `UnidadesPublicas.js` dentro do bloco de header existente. Nenhum novo arquivo CSS necessário.

---

## Checker Sign-Off

- [ ] Dimension 1 Copywriting: PASS
- [ ] Dimension 2 Visuals: PASS
- [ ] Dimension 3 Color: PASS
- [ ] Dimension 4 Typography: PASS
- [ ] Dimension 5 Spacing: PASS
- [ ] Dimension 6 Registry Safety: PASS

**Approval:** pending
