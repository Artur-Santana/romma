# Romma

Sistema de gerenciamento de aluguéis corporativos desenvolvido como TCC de Engenharia da Computação. Conecta Proprietários de edifícios com Locatários (empresas ou pessoas físicas) que buscam espaços para suas operações, gerenciando o ciclo completo de um aluguel corporativo.

## Funcionalidades

### Proprietário

- Cadastro e gestão de Edifícios e Unidades (com área, valor mensal e controle de visibilidade do preço)
- Convite de Locatários por email — o Locatário recebe um link mágico para ativar seu acesso
- Criação e gestão de Contratos vinculando Locatários a Unidades
- Acompanhamento de Parcelas mensais com marcação de pagamento
- Dashboard com métricas: unidades disponíveis e alugadas, contratos ativos, parcelas pendentes e vencidas

### Locatário

- Visualização do Contrato ativo
- Histórico de Parcelas (pagas, pendentes e vencidas)

### Landing Page Pública

- Listagem de Unidades disponíveis com atualização em tempo real via Supabase Realtime — Unidades alugadas somem automaticamente da listagem
- Valor mensal exibido ou substituído por "Consulte o Proprietário" conforme configuração do Proprietário
- Formulário de contato para interesse em uma Unidade

## Stack

| Camada | Tecnologia |
|---|---|
| Framework | Next.js 16 (App Router) |
| Linguagem | JavaScript |
| Estilização | Tailwind CSS v4 |
| Banco de Dados | Supabase (PostgreSQL) |
| Autenticação | Supabase Auth |
| Segurança | Row-Level Security (RLS) por operação |
| Tempo Real | Supabase Realtime |
| Edge Functions | Supabase Edge Functions (Deno) |
| Dev server | Turbopack (`next dev --turbopack`) |
| Deploy | Vercel |

## Modelo de dados

```
edificios
  └── unidades (1:N)
        └── contratos (1:N, apenas 1 ativo por vez)
              └── parcelas (1:N, geradas atomicamente na criação)

auth.users
  └── locatarios (1:1)
```

### Terminologia

| Conceito | Nome no sistema |
|---|---|
| Dono do prédio | Proprietário |
| Empresa/pessoa que aluga | Locatário |
| Prédio | Edifício |
| Espaço alugável | Unidade |
| Aluguel ativo | Contrato |
| Pagamento mensal | Parcela |

## Regras de negócio principais

- Uma Unidade só pode ter um Contrato `ativo` por vez — garantido por índice único parcial no banco
- Ao criar um Contrato, a Unidade muda para `alugada`; ao encerrar ou cancelar, volta para `disponivel`
- Todas as Parcelas de um Contrato são geradas atomicamente no momento da criação via Edge Function
- Parcelas ficam com status `futura` até a `data_fechamento` chegar; tornam-se `pendente` ou `vencida` por regra de data
- O `valor_mensal` do Contrato é sempre o mesmo cadastrado na Unidade

## Configuração

### Pré-requisitos

- Node.js 18+
- Conta no [Supabase](https://supabase.com)

### Variáveis de ambiente

Crie um arquivo `.env.local` na raiz do projeto:

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_JWT=
SUPABASE_ROLE_KEY=
```

`SUPABASE_JWT` é o JWT legado necessário para autenticar chamadas às Edge Functions. `SUPABASE_ROLE_KEY` é server-only — nunca exposto ao client.

### Instalação

```bash
npm install
npm run dev
```

Acesse [http://localhost:3000](http://localhost:3000).

## Licença

Projeto acadêmico — TCC de Engenharia da Computação.
