# ✨ Fase 3 — Refinamento Visual + Deploy

# Visão Geral

Fase final antes da apresentação para a banca. Não adiciona funcionalidades — foca em polimento visual, deploy e estabilidade para a demo ao vivo.

**Pré-requisitos:** Fases 1 e 2 concluídas. Sistema funcional com ciclo completo, LP, listagem Realtime e Dashboard.

**Objetivo da fase:** O sistema precisa estar deployed no Vercel, visualmente consistente com o design Obsidian Blueprint e estável o suficiente para uma demo ao vivo sem surpresas.

---

# Resumo das Sessões

| Sessão | Conteúdo | Conceitos Novos | Estimativa |
| --- | --- | --- | --- |
| F3-S1 | Deploy no Vercel + variáveis de ambiente | Vercel CLI ou UI, env vars de produção | ~1h |
| F3-S2 | Refinamento visual — páginas públicas (LP + /unidades) | Design system Obsidian Blueprint aplicado | ~2h |
| F3-S3 | Refinamento visual — dashboard administrativo (todas as telas da Fase 1) | Consistência visual entre telas | ~3h |
| F3-S4 | Polish final + preparação para demo | Nenhum | ~1h |

**Total: ~7h**

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
- [ ]  Commit de eventuais ajustes necessários para produção

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
- [ ]  Commit das alterações

> ⚠️ Esta é a sessão mais longa da Fase 3. Estimar 3h mas ajustar conforme o número de telas e o nível de detalhe desejado. Priorizar as telas que aparecerão na demo.
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
- [ ]  Atualizar Notion com o status final do projeto
- [ ]  Commit final

---

# Decisões Técnicas Registradas

**Deploy no Vercel:** Plataforma escolhida pela integração nativa com Next.js e deploy automático via GitHub. `SUPABASE_SERVICE_ROLE_KEY` configurada apenas como variável server-side (sem prefixo `NEXT_PUBLIC_`).

**Refinamento visual em fase separada:** Decisão intencional de separar construção funcional (Fases 1 e 2) de polimento visual (Fase 3) para manter o foco em cada etapa e reduzir retrabalho.

**Figma como referência:** O design Obsidian Blueprint está documentado no arquivo Figma `C16bXWN7RoGwA5oOCu8Qy1`. Usar como referência visual durante o refinamento, não como especificação pixel-perfect.

---

# Melhorias Futuras (Pós-TCC)

**Dívida técnica — `Contratos.js` (F1-S7):** Três itens identificados na revisão de código foram adiados para esta fase: (1) **Feedback de erros ausente** — operações de cancelamento e criação não exibem mensagem ao usuário quando falham; adicionar um `useState` de erro e renderização condicional na UI. (2) **`setContratos` fora do bloco de sucesso em `cancelarContrato`** — a UI atualiza mesmo quando uma das três operações falhou; mover para dentro do `if (!errorParcelas)`. (3) **Atomicidade de `cancelarContrato`** — as três operações (`contratos`, `unidades`, `parcelas`) são chamadas independentes sem rollback; migrar para uma Edge Function `cancelar-contrato` que execute tudo no servidor com service role key.

**Transição automática de status de Contrato para `encerrado`:** Atualmente, a distinção entre `ativo` e `encerrado` é calculada no frontend (`data_fim < hoje` → exibe como encerrado). O banco mantém o status `ativo` mesmo após o prazo. Para um sistema de produção real, essa transição deveria ser feita por um cron job — uma Edge Function agendada que roda diariamente, busca contratos com `status = 'ativo'` e `data_fim < hoje`, e os atualiza para `encerrado` no banco. Isso garante que relatórios, queries e RLS reflitam o estado real sem depender de lógica de exibição no frontend.