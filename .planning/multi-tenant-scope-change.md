# Mudança de Escopo: Romma Multi-Tenant

**Decisão tomada em:** 2026-06-08  
**Contexto:** Durante execução da Phase 10 (signup Proprietário), ficou claro que o modelo original "único Proprietário por instância" não reflete a intenção real do sistema.

## Modelo Atual (single-tenant — INCORRETO)

- 1 Proprietário por deploy
- `/signup` bloqueia após primeiro cadastro
- `proprietarios` tem no máx 1 row
- RLS usa `is_proprietario()` — qualquer proprietário vê todos os dados

## Modelo Correto (multi-tenant)

- Vários usuários se cadastram como Proprietário
- Cada Proprietário gerencia seus próprios edifícios/unidades/contratos
- Locatários são convidados por um Proprietário específico
- Dados isolados por `proprietario_id`

## O que foi feito na Phase 10 (fix imediato)

- `/signup` aberto para qualquer usuário (sem bloqueio)
- `/auth/confirm` sempre cria row em `proprietarios` para o usuário confirmado
- Removida migration de single-row constraint

## O que AINDA FALTA para multi-tenant completo (Phase 11)

### Schema (Supabase migrations)

1. **`edificios`** — adicionar coluna `proprietario_id UUID REFERENCES auth.users(id) NOT NULL`
2. **`locatarios`** — adicionar coluna `proprietario_id UUID REFERENCES auth.users(id) NOT NULL`
3. **Migrar dados existentes** — setar `proprietario_id` nas rows existentes com o userId do proprietário de seed

### RLS (Row Level Security)

Todas as políticas atuais assumem "qualquer proprietário vê tudo". Precisam mudar para:

- `edificios`: `auth.uid() = proprietario_id`
- `unidades`: via JOIN com `edificios` onde `proprietario_id = auth.uid()`
- `locatarios`: `auth.uid() = proprietario_id`
- `contratos`: via JOIN com `unidades → edificios` onde `proprietario_id = auth.uid()`
- `parcelas`: via JOIN com `contratos → unidades → edificios`

### Queries (src/lib/)

- `queries-client.js` e `queries-server.js`: todas as funções que criam registros precisam incluir `proprietario_id`
- `getEdificios()` — já deve filtrar por RLS (sem mudança na query, mas RLS muda o resultado)
- `criarEdificio()` — passar `proprietario_id: userId`
- `criarLocatario()` — passar `proprietario_id: userId`

### Server Actions (src/actions/)

- `edificios.js`, `locatarios.js`, `contratos.js`: inserções precisam incluir `proprietario_id`
- Auth guard: já usa `supabase.rpc('is_proprietario')` — mas a função RPC precisa ser revisada

### Função RPC `is_proprietario`

Atualmente verifica se o usuário tem row em `proprietarios`. Isso continua correto — não muda.

### UI / Dashboard

- Dashboard mostra dados do Proprietário logado — com RLS correto, filtragem automática
- Nenhuma mudança de UI necessária se RLS estiver correto

## Impacto estimado

| Área | Esforço |
|---|---|
| Schema + migrations | Alto — cuidado com dados existentes |
| RLS policies | Alto — 5 tabelas, testar cada uma |
| Queries/Actions | Médio — inserções com proprietario_id |
| UI | Baixo — RLS filtra automaticamente |

**Total: 1 phase nova (~3-4 planos)**

## Atenção: dados existentes no banco de dev

O banco de dev tem dados de seed com o Proprietário atual. A migration deve:
1. Identificar o `usuario_id` do proprietário existente em `proprietarios`
2. Usar esse ID como `proprietario_id` em todas as rows de `edificios` e `locatarios`

## Como iniciar na próxima sessão

1. `/clear`
2. Compartilhar este documento com o contexto
3. `/gsd-discuss-phase 11` — para discutir a abordagem da phase
4. Ou diretamente `/gsd-plan-phase 11` referenciando este doc como input
