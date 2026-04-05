# 🔄 Contexto de Sessão — Romma

Esta página substitui o antigo "Contexto — Sessões 2 a 6". Ela é a **fonte de verdade para abertura de novas conversas** com o Claude.

Estrutura em duas partes: **contexto fixo** (não muda entre sessões) e **estado dinâmico** (atualizado ao fim de cada sessão).

---

# PARTE 1 — Contexto Fixo

> Esta seção não muda. Não precisa ser atualizada entre sessões.
> 

## Sobre o projeto

Romma é um sistema de gerenciamento de aluguéis corporativos desenvolvido como TCC de Engenharia da Computação, por desenvolvedor solo. Conecta Proprietários de edifícios com Locatários (empresas/PF) que buscam espaços para suas operações.

**Stack:** Next.js App Router, React, Supabase (Auth + PostgreSQL + RLS + Edge Functions), Tailwind CSS v4, Vercel. JavaScript puro (sem TypeScript). Turbopack. IDE: Cursor.

**Repositório:** [https://github.com/Artur-Santana/romma](https://github.com/Artur-Santana/romma)

**Supabase project ID:** `vfymttcajeyhrmsyhrtj`

**Deadline conservadora:** 01/06/2026 | **Deadline ousada:** 20/06/2026

## Terminologia oficial do sistema

| Conceito | Nome no sistema |
| --- | --- |
| Dono do prédio | **Proprietário** |
| Empresa/pessoa que aluga | **Locatário** |
| Prédio | **Edifício** |
| Espaço alugável | **Unidade** |
| Aluguel ativo | **Contrato** |
| Pagamento mensal | **Parcela** |

## Perfil do estudante

**O que já demonstrou:**

- Identifica erros no próprio código com raciocínio próprio (ex: percebeu RLS UPDATE faltando sem ajuda)
- Quando entende o conceito, implementa rápido e com pouco retrabalho
- Dá feedback direto quando algo não funciona (metodologia, estimativas)
- Pensa estrategicamente sobre o projeto — superávit de horas, knowledge debt, planejamento de fases
- Alta produtividade uma vez que começa a sessão

**Limitações atuais:**

- Não produz código do zero sem consultar — reconhece padrões ao ler, mas não internalizou a sintaxe
- Base em JS ainda baixa para inferir implementação só com o objetivo
- Ternário e lógica de renderização condicional ainda confusos ao produzir
- Alta barreira de ativação para começar sessões, produtivo uma vez iniciado

**Decisão estratégica:** Knowledge debt intencional — priorizar entrega do TCC sobre consolidação. Fase de exercícios planejada após o TCC. **Não insistir em consolidação extra dentro do prazo.**

## Metodologia de ensino (resumo executivo)

Referência completa: [🧠 Metodologia de Ensino — Guia para o Claude](../%F0%9F%A7%A0%20Metodologia%20de%20Ensino%20%E2%80%94%20Guia%20para%20o%20Claude%203292b68481e1814abb98f81ddd98002a.md)

**Sequência obrigatória:** explicar conceito → mostrar exemplo simples → pedir que aplique no Romma.

**NÃO usar** hints progressivos puros — base técnica ainda baixa para inferir sem contexto.

**Escala de hints (só após o estudante tentar):**

1. Objetivo apenas
2. Direção conceitual
3. Pista técnica
4. Esqueleto de código
5. Solução comentada

**Abertura de sessão:** verificar se `npm run dev` está rodando, recuperar contexto, apresentar objetivo.

**Encerramento de sessão:** perguntar o que conseguiria reproduzir de cabeça e o que ficou nebuloso. Atualizar esta página com o estado dinâmico.

**Commits:** usar extensão `vivaxy.vscode-conventional-commits`. Fornecer sempre: tipo, escopo, gitmoji e descrição **separados** — nunca a string formatada completa.

## Conceitos que o estudante já domina

- `"use client"` — quando usar e por quê
- `useState` — sintaxe, inputs controlados, estado de erro, estado de lista
- `useEffect` com `[]` — executa uma vez ao montar
- Múltiplos `useEffect` no mesmo componente
- `useRouter` e `router.push()` para redirecionamento
- `onSubmit` + `e.preventDefault()` em formulários
- `onChange` em inputs controlados
- `e.target.checked` em checkboxes
- Renderização condicional com `{condição && <elemento />}`
- Ternário `condição ? (verdadeiro) : (falso)` para alternar modos
- `supabase.auth.signInWithPassword`, `getUser`, `signOut`
- `supabase.from().select()`, `.insert()`, `.update()`, `.delete().eq()`
- `?.` (optional chaining)
- `.map()` com `key` para listas
- Fragment `<>` para agrupar elementos
- `() =>` em event handlers para passar parâmetros
- RLS policies por operação no Supabase
- Server Components vs Client Components
- Componentes filhos com props — criar arquivo separado, desestruturar props
- Passar funções e setters como props do pai para o filho
- `<select>` controlado com `value`, `onChange`, `<option key value>`
- Centralização de queries em `src/lib/queries.js` — funções puras sem hooks
- Selects encadeados — buscar Edifícios para popular `<select>` e usar valor como filtro
- ENUMs no Supabase — `status` como ENUM, `valor_visivel` como BOOLEAN

## O que já foi construído

- `/src/app/login/page.js` — login funcional com Supabase Auth
- `/src/app/dashboard/page.js` — CRUD completo de Edifícios com `EdificioCard`
- `/src/components/EdificioCard.js` — componente extraído com edição inline
- `/src/app/dashboard/unidades/page.js` — CRUD completo de Unidades com select de Edifício
- `/src/lib/supabase.js` — cliente singleton
- `/src/lib/queries.js` — funções centralizadas: `getEdificios`, `getUnidades`, `insertUnidade`
- Tabelas no Supabase: `edificios`, `unidades` — ambas com RLS completo (SELECT/INSERT/UPDATE/DELETE)

---

# PARTE 2 — Estado Dinâmico

> Esta seção é atualizada ao fim de cada sessão. É o que o Claude lê para saber onde estamos.
> 

## Estado atual *(atualizado em 27/03/2026)*

**Fase/Sessão:** Fase 1 — F1-S3 (em andamento)

**F1-S1:** ✅ Concluída (endereco já existia no banco e no código)

**F1-S2:** ✅ Concluída — CRUD de Unidades completo

- Tabela `unidades` criada com todos os campos do modelo
- RLS policies configuradas
- Página `/dashboard/unidades` com select de Edifício, formulário de criação, listagem com `.map()`, edição inline
- `insertUnidade` em `queries.js`
- Conceitos trabalhados: selects encadeados, ENUMs, `e.target.checked` para checkbox

**F1-S3:** 🔄 Próxima sessão

- Criar tabela `locatarios` no Supabase
- Configurar RLS policies
- Criar rota `/dashboard/locatarios/page.js`
- Implementar formulário: `nome_razao_social`, `tipo` (PF/PJ), `documento`, `email`, `telefone`
- Integrar `supabase.auth.admin.inviteUserByEmail()`
- Implementar listagem e deleção
- Commit

## O que ficou sólido na última sessão

*Preencher ao fim da sessão — o que o estudante conseguiria reproduzir de cabeça*

## O que ainda está nebuloso

*Preencher ao fim da sessão — conceitos que precisam de atenção no início da próxima*

## Observações para a próxima sessão

*Preencher ao fim da sessão — qualquer ajuste de abordagem ou detalhe técnico pendente*