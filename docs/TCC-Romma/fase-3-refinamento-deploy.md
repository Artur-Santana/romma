# ✨ Fase 3 — Refinamento Visual + Deploy

# Visão Geral

Fase final antes da apresentação para a banca. Não adiciona funcionalidades — foca em polimento visual, deploy e estabilidade para a demo ao vivo.

**Pré-requisitos:** Fases 1 e 2 concluídas. Sistema funcional com ciclo completo, LP, listagem Realtime e Dashboard.

**Objetivo da fase:** O sistema precisa estar deployed no Vercel, visualmente consistente com o design Obsidian Blueprint e estável o suficiente para uma demo ao vivo sem surpresas.

---

# Resumo das Sessões

| Sessão | Conteúdo | Conceitos Novos | Estimativa |
| --- | --- | --- | --- |
| F3-S1 | Deploy no Vercel + CORS produção | Vercel CLI ou UI, env vars de produção, CORS allowlist | ~1.5h |
| F3-S2 | Refinamento visual — páginas públicas (LP + /unidades) | Design system Obsidian Blueprint aplicado | ~2h |
| F3-S3 | Refinamento visual + refatoração de estado — dashboard | Consolidação useState, loading states, consistência visual | ~4-5h |
| F3-S4 | Polish final + limpeza de código + preparação para demo | Nenhum | ~1.5h |

**Total: ~9-10h**

---

# Detalhamento das Sessões

## F3-S1 — Deploy no Vercel

**Objetivo:** Colocar o Romma em produção no Vercel com as variáveis de ambiente corretas e a conexão com o Supabase funcionando.

**Entregavel:** URL pública do Romma acessível pelo navegador, com login, CRUD e Realtime funcionando em produção.

**Tarefas:**

- [ ]  Criar conta no Vercel (se ainda não tiver) e conectar o repositório GitHub
- [ ]  Configurar variáveis de ambiente no Vercel: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` e `SUPABASE_SERVICE_ROLE_KEY` (necessária para a Edge Function de convite de Locatários)
- [ ]  Fazer o primeiro deploy e verificar que o build passou
- [ ]  Testar o fluxo de login em produção
- [ ]  Configurar a URL de redirect do Supabase Auth para incluir o domínio do Vercel
- [ ]  Testar o fluxo de convite de Locatário em produção (email mágico)
- [ ]  Restringir CORS na Edge Function `gerar-parcelas`: substituir `Access-Control-Allow-Origin: '*'` por allowlist com domínio de produção Vercel e `localhost` para dev
- [ ]  Verificar que `SUPABASE_JWT` (renomeado em F2-S3.5) está configurado no Vercel **sem** prefixo `NEXT_PUBLIC_`
- [ ]  Commit de eventuais ajustes necessários para produção

> ⚠️ **Pré-requisito:** F2-S3.5 (Correções Críticas de Segurança) deve estar concluída antes do deploy. Sem ela, chaves sensíveis ficam expostas no browser.

**Conceitos novos:**

- Deploy contínuo via Vercel: push na branch main = deploy automático
- Variáveis de ambiente em produção vs desenvolvimento
- Redirect URLs do Supabase Auth para ambientes múltiplos

> ⚠️ `SUPABASE_SERVICE_ROLE_KEY` é uma chave sensível — nunca deve ter o prefixo `NEXT_PUBLIC_`. Confirmar que está sendo usada apenas server-side.
> 

---

## F3-S2 — Refinamento Visual — Páginas Públicas

**Objetivo:** Aplicar o design system Obsidian Blueprint nas páginas públicas (LP e listagem de unidades).

**Entregavel:** LP e `/unidades` visualmente consistentes com a paleta Romma (roxo `#370085`, dourado `#C5A059`, fundo `#faf8fc`), tipografia Manrope/Noto Sans e estética do Obsidian Blueprint.

**Tarefas:**

- [ ]  Revisar o design Obsidian Blueprint no Figma (arquivo `C16bXWN7RoGwA5oOCu8Qy1`) como referência
- [ ]  Aplicar paleta de cores via variáveis CSS globais no `globals.css`
- [ ]  Configurar fontes Manrope (display) e Noto Sans (body) via `next/font`
- [ ]  Aplicar design na LP (`/app/page.js`)
- [ ]  Aplicar design na listagem pública (`/app/unidades/page.js`)
- [ ]  Commit das alterações

**Conceitos novos:**

- `next/font` para carregar Google Fonts de forma otimizada no Next.js
- Variáveis CSS globais com Tailwind v4

---

## F3-S3 — Refinamento Visual — Dashboard Administrativo

**Objetivo:** Aplicar consistência visual do Obsidian Blueprint em todas as telas do dashboard construídas na Fase 1 e Fase 2.

**Entregavel:** Todas as telas do dashboard (Edifícios, Unidades, Locatários, Contratos, Parcelas, Dashboard overview) visualmente consistentes — mesma paleta, tipografia, espaçamento e padrão de componentes.

**Tarefas:**

- [ ]  Auditar todas as telas existentes e listar inconsistências visuais
- [ ]  Definir e aplicar padrões reutilizáveis: cards, botões, badges de status, formulários
- [ ]  Refinar navegação entre telas (sidebar ou menu de navegação consistente)
- [ ]  Aplicar refinamento em cada tela do dashboard

**Refatoração de estado — convenção single-object do CLAUDE.md (identificado na revisão de código):**
- [ ]  Consolidar 18 `useState` em `src/components/features/Unidades.js` em objetos `form` e `editForm`
- [ ]  Consolidar 6 `useState` em `src/components/features/GestaoEdificios.js` em objetos `form` e `editForm`
- [ ]  Consolidar 5 `useState` de inserção em `src/components/features/Locatarios.js` em objeto `form`
- [ ]  Atualizar `src/components/ui/UnidadeCard.js` para receber `editForm`/`setEditForm` em vez de 18 props individuais
- [ ]  Atualizar `src/components/ui/EdificioCard.js` para receber `editForm`/`setEditForm` em vez de 9 props individuais

**Estados de loading, correções de hooks e queries:**
- [ ]  Adicionar estado `loading` + indicador visual em `Contratos.js`, `Unidades.js`, `GestaoEdificios.js` e `Parcelas.js`
- [ ]  Corrigir `handleEditarUnidade` em `Unidades.js` para popular `statusEdit` a partir dos dados existentes
- [ ]  Corrigir `cancelarContrato` em `Contratos.js` para só atualizar estado (`setContratos`) no branch de sucesso
- [ ]  Adicionar `router` ao array de dependências do `useEffect` em 5 páginas: `dashboard/page.js`, `unidades/page.js`, `locatarios/page.js`, `contratos/page.js`, `contratos/[id]/page.js`
- [ ]  Remover `getEdificios()` local de `GestaoEdificios.js` e importar de `@/lib/queries`

- [ ]  Commit das alterações

> ⚠️ Esta é a sessão mais longa da Fase 3. Estimar 4-5h considerando refinamento visual + refatoração de estado. Priorizar as telas que aparecerão na demo.
> 

---

## F3-S4 — Polish Final + Preparação para Demo

**Objetivo:** Garantir que o sistema está estável, sem erros visíveis e pronto para uma demo ao vivo sem surpresas.

**Entregavel:** Sistema em produção com dados de demo cadastrados, fluxo validado ponta a ponta e roteiro de apresentação definido.

**Tarefas:**

- [ ]  Cadastrar dados de demo realistas no Supabase de produção (edifícios, unidades, locatários, contratos com parcelas)
- [ ]  Executar o fluxo completo de demo: LP → listagem → login como Proprietário → dashboard → criar contrato → observar unidade sumir da listagem pública
- [ ]  Identificar e corrigir qualquer erro ou inconsistência visual restante
- [ ]  Definir o roteiro de demonstração para a banca (ordem das ações, o que mostrar primeiro)

**Limpeza final de código — itens de baixa prioridade (revisão de código):**
- [ ]  Remover import não utilizado `Public_Sans` de `src/app/layout.js`
- [ ]  Remover estado `usuario` não utilizado das 5 páginas do dashboard (`dashboard/page.js`, `unidades/page.js`, `locatarios/page.js`, `contratos/page.js`, `contratos/[id]/page.js`)
- [ ]  Remover ou conectar `handleLogout` em `src/app/dashboard/page.js` a um botão de logout
- [ ]  Renomear `grabMetricas` → `carregarMetricas` em `src/app/dashboard/page.js`
- [ ]  Corrigir casing inconsistente: `setlocatarios` → `setLocatarios` e `handleDeletarlocatario` → `handleDeletarLocatario` em `Locatarios.js`
- [ ]  Remover `defaultValue` redundante do `<select>` controlado em `Locatarios.js`
- [ ]  Corrigir operador vírgula em `Contratos.js` — usar ponto-e-vírgula: `{ setEditandoId(null); resetEdit(); }`
- [ ]  Remover `async` desnecessário de `pushLogin` em `src/app/page.js`
- [ ]  Padronizar import path em `GestaoEdificios.js`: trocar `'../ui/EdificioCard'` por `'@/components/ui/EdificioCard'`
- [ ]  Remover `key` do `<div>` raiz em `EdificioCard.js` (manter apenas no `.map()` do pai)
- [ ]  Remover `export` de `countRegistros` em `queries.js` (manter como helper interno)

- [ ]  Atualizar Notion com o status final do projeto
- [ ]  Commit final

---

# Decisões Técnicas Registradas

**Deploy no Vercel:** Plataforma escolhida pela integração nativa com Next.js e deploy automático via GitHub. `SUPABASE_SERVICE_ROLE_KEY` configurada apenas como variável server-side (sem prefixo `NEXT_PUBLIC_`).

**Refinamento visual em fase separada:** Decisão intencional de separar construção funcional (Fases 1 e 2) de polimento visual (Fase 3) para manter o foco em cada etapa e reduzir retrabalho.

**Figma como referência:** O design Obsidian Blueprint está documentado no arquivo Figma `C16bXWN7RoGwA5oOCu8Qy1`. Usar como referência visual durante o refinamento, não como especificação pixel-perfect.

**Sessões expandidas após revisão de código:** F3-S1 recebeu tarefas de CORS para produção. F3-S3 incorporou refatoração de estado (consolidação de `useState`, redução de prop drilling, loading states) — itens de severidade média/alta que se encaixam naturalmente no refinamento do dashboard. F3-S4 recebeu itens de baixa prioridade (cleanup de casing, imports, código morto pontual). Melhorias Futuras recebeu 6 novos itens não-bloqueantes.

---

# Melhorias Futuras (Pós-TCC)

**Dívida técnica — `Contratos.js` (F1-S7):** Três itens identificados na revisão de código foram adiados para esta fase: (1) **Feedback de erros ausente** — operações de cancelamento e criação não exibem mensagem ao usuário quando falham; adicionar um `useState` de erro e renderização condicional na UI. (2) **`setContratos` fora do bloco de sucesso em `cancelarContrato`** — a UI atualiza mesmo quando uma das três operações falhou; mover para dentro do `if (!errorParcelas)`. (3) **Atomicidade de `cancelarContrato`** — as três operações (`contratos`, `unidades`, `parcelas`) são chamadas independentes sem rollback; migrar para uma Edge Function `cancelar-contrato` que execute tudo no servidor com service role key.

**Transição automática de status de Contrato para `encerrado`:** O status `encerrado` não é uma ação manual do Proprietário — é uma transição natural quando `data_fim` passa. Portanto, o botão "Encerrar" foi removido do frontend. A única ação manual destrutiva é "Cancelar" (status `cancelado`). A transição `ativo` → `encerrado` será feita por um cron job: uma Edge Function agendada que roda diariamente, busca contratos com `status = 'ativo'` e `data_fim < hoje`, atualiza o status para `encerrado` e reverte a Unidade para `disponivel`. Isso garante que o banco reflita o estado real sem depender de lógica de exibição no frontend.

**Transição automática de status de Parcelas (`futura` → `pendente` → `vencida`):** As parcelas são criadas com status `futura` e armazenadas estático no banco. A transição de status é date-driven (`data_fechamento <= hoje` → `pendente`; `data_vencimento < hoje` e não paga → `vencida`), mas atualmente não há mecanismo que execute essa transição — o frontend exibe o status armazenado sem recomputar. Implementar junto ao cron job de contratos: a mesma Edge Function agendada diária busca parcelas com status desatualizado e os corrige em lote.

**Validação de input nas Server Actions e Edge Functions:** As Server Actions (`locatarios.js`) e a Edge Function (`gerar-parcelas`) não validam os dados recebidos. Implementar: validação de formato de email, `tipo` ∈ `['pf','pj']`, tamanho de documento (11 para CPF, 14 para CNPJ), e formato UUID para `contrato_id`. Retornar 400 para inputs inválidos.

**Tratamento de erros em `queries.js`:** Todas as funções de query ignoram o `error` retornado pelo Supabase. Se uma query falha (rede, RLS), `data` é `null` e `.map()` quebra no caller. Implementar destructuring de `error`, throw ou retorno explícito, e fallback defensivo (`data ?? []`). Permitir que a UI exiba estados de erro diferenciados ("sem dados" vs "falha na busca").

**Otimização da Landing Page como Server Component:** A página `/app/page.js` está inteira como `"use client"` apenas por usar `useRouter` para um clique de botão. Extrair apenas o botão interativo em um Client Component separado e manter a página como Server Component para reduzir o bundle JavaScript enviado ao browser.

**Padronização de nomenclatura de arquivos em `src/lib/`:** Convenção inconsistente entre `supabase.js` (plain), `supabase-browser.js` (kebab-case) e `supabaseAdmin.js` (camelCase). Definir e aplicar uma convenção única para todos os arquivos utilitários.

**Imagem arquitetônica em `public/`:** `public/Detalhe Arquitetônico.png` é servida sem autenticação a qualquer pessoa com a URL. Se contiver informações proprietárias do edifício, mover para Supabase Storage com RLS.

**Hook de pre-commit para segredos:** `.gitignore` cobre arquivos `.env*` mas não há guard ativo que impeça commits acidentais de segredos. Considerar adicionar `husky` + `lint-staged` com verificação de padrões sensíveis (`eyJ`, `sk-`, `service_role`).