# 🗄️ Modelo de Dados

# Visão Geral

O banco de dados do Romma é relacional (PostgreSQL via Supabase) e organizado em torno do ciclo de vida de um aluguel corporativo: **Edifício → Unidade → Contrato → Parcela**. As tabelas do escopo Dream estão documentadas aqui mas implementadas separadamente.

> 💡 Este documento é a fonte de verdade para o modelo de dados. Qualquer alteração de schema deve ser registrada aqui antes de implementada.
> 

---

# Relacionamentos

```
edifficios
  └── unidades (1:N)
        └── contratos (1:N, apenas 1 ativo por vez)
              └── parcelas (1:N)
        └── espacos_reservaveis (1:N) [Dream D2]
              └── reservas (1:N) [Dream D2]

usuarios (Supabase Auth)
  └── locatarios (1:1)
  └── reservas (1:N) [Dream D2]
  └── qrcodes (1:N) [Dream D3]
```

---

# Tabelas — Escopo Core

## `usuarios`

Gerenciada pelo Supabase Auth. Não é criada manualmente — o Supabase popula automaticamente ao criar ou convidar um usuário.

| Campo | Tipo | Descrição |
| --- | --- | --- |
| id | UUID | PK, gerado pelo Supabase Auth |
| email | TEXT | Login do usuário |
| role | ENUM | `proprietario`, `locatario`, `usuario_locatario` |
| created_at | TIMESTAMP |  |

> ⚙️ **Fluxo de convite:** O Proprietário cadastra o email do Locatário no sistema. O Supabase envia automaticamente um email com link mágico para o Locatário definir sua senha e ativar o acesso. Nativo no Supabase, sem configuração de servidor de email adicional.
> 

---

## `edificios`

| Campo | Tipo | Descrição |
| --- | --- | --- |
| id | UUID | PK |
| nome | TEXT | Nome do edifício |
| endereco | TEXT | Endereço completo |
| created_at | TIMESTAMP |  |

---

## `unidades`

Representa qualquer espaço alugável — seja um andar inteiro ou uma sala dentro de um andar. O Proprietário define o que cada Unidade representa via nome e descrição.

| Campo | Tipo | Descrição |
| --- | --- | --- |
| id | UUID | PK |
| edificio_id | UUID | FK → edificios |
| nome | TEXT | Ex: "Andar 3", "Sala 301" |
| descricao | TEXT | Descrição livre exibida na Landing Page |
| area_m2 | NUMERIC | Área em m² |
| valor_mensal | NUMERIC | Valor em R$ (usado no Contrato e na LP) |
| valor_visivel | BOOLEAN | Se falso, exibe "Consulte o Proprietário" na LP |
| status | ENUM | `disponivel`, `alugada` |
| created_at | TIMESTAMP |  |

> 📌 **Regra de negócio:** Quando um Contrato ativo é criado para uma Unidade, seu status muda para `alugada` e ela desaparece da listagem pública em tempo real via Supabase Realtime. O inverso ocorre quando o Contrato é encerrado ou cancelado.
> 

---

## `locatarios`

Representa a empresa ou pessoa física que aluga uma Unidade. Sempre vinculado a um usuário do sistema.

| Campo | Tipo | Descrição |
| --- | --- | --- |
| id | UUID | PK |
| usuario_id | UUID | FK → usuarios |
| nome_razao_social | TEXT | Nome (PF) ou Razão Social (PJ) |
| tipo | ENUM | `pf`, `pj` |
| documento | TEXT | CPF ou CNPJ (apenas números) |
| email | TEXT | Email de contato (pode diferir do login) |
| telefone | TEXT | Contato secundário |
| created_at | TIMESTAMP |  |

---

## `contratos`

Vínculo formal entre um Locatário e uma Unidade. Apenas um Contrato pode estar `ativo` por Unidade simultaneamente.

| Campo | Tipo | Descrição |
| --- | --- | --- |
| id | UUID | PK |
| unidade_id | UUID | FK → unidades |
| locatario_id | UUID | FK → locatarios |
| data_inicio | DATE | Data de início do contrato |
| data_fim | DATE | Data de encerramento prevista |
| status | ENUM | `ativo`, `encerrado`, `cancelado` |
| observacoes | TEXT | Notas livres do Proprietário |
| created_at | TIMESTAMP |  |

> 📌 O `valor_mensal` do Contrato é sempre o mesmo da Unidade (1:1). Não há campo separado de valor no Contrato.
> 

> 📌 **Constraint:** índice único parcial — `UNIQUE (unidade_id) WHERE status = 'ativo'`. Garante que nunca exista mais de um Contrato `ativo` para a mesma Unidade ao mesmo tempo. Implementado no banco via SQL Editor do Supabase.
> 

---

## `parcelas`

Geradas automaticamente no momento da criação do Contrato para toda a vigência. A visibilidade é controlada pelo status.

| Campo | Tipo | Descrição |
| --- | --- | --- |
| id | UUID | PK |
| contrato_id | UUID | FK → contratos |
| numero | INTEGER | Número sequencial da parcela (1, 2, 3...) |
| data_fechamento | DATE | Dia em que a parcela se torna visível |
| data_vencimento | DATE | 7 dias após data_fechamento |
| data_pagamento | DATE | Preenchida quando marcada como paga (nullable) |
| status | ENUM | `futura`, `pendente`, `paga`, `vencida` |
| created_at | TIMESTAMP |  |

> ⚙️ **Regras de geração:**
> 

> - **Parcela 1:** Se `data_inicio + 7 dias` cair no mesmo mês que `data_inicio`, então `data_fechamento` = `data_inicio` e `data_vencimento` = `data_inicio + 7 dias`. Se cair em um mês diferente, `data_fechamento` é empurrado para o dia 1 do mês seguinte e `data_vencimento` = `data_fechamento + 7 dias`.
> 

> - **Parcelas 2+:** `data_fechamento` = primeiro dia de cada mês subsequente ao `data_fechamento` da parcela 1, `data_vencimento` = `data_fechamento + 7 dias`
> 

> - Todas criadas com status `futura`. A transição de status é feita por regra de data — uma parcela se torna `pendente` quando `data_fechamento <= hoje`, `vencida` quando `data_vencimento < hoje` e ainda não paga.
> 

---

# Tabelas — Escopo Dream

## `espacos_reservaveis` *(D2)*

Espaços internos de uma Unidade que podem ser reservados pelos Usuários do Locatário. Diferente das Unidades, não possuem Contrato — apenas Reservas.

| Campo | Tipo | Descrição |
| --- | --- | --- |
| id | UUID | PK |
| unidade_id | UUID | FK → unidades |
| nome | TEXT | Ex: "Sala de Reunião A", "Phone Booth 1" |
| tipo | ENUM | `sala_reuniao`, `phone_booth` |
| capacidade | INTEGER | Número máximo de pessoas |
| created_at | TIMESTAMP |  |

---

## `reservas` *(D2)*

| Campo | Tipo | Descrição |
| --- | --- | --- |
| id | UUID | PK |
| espaco_id | UUID | FK → espacos_reservaveis |
| usuario_id | UUID | FK → usuarios |
| data_inicio | TIMESTAMP | Início da reserva (data + hora) |
| data_fim | TIMESTAMP | Fim da reserva (data + hora) |
| status | ENUM | `ativa`, `cancelada` |
| created_at | TIMESTAMP |  |

> 📌 Conflito de reservas tratado em tempo real via Supabase Realtime — dois usuários não podem reservar o mesmo espaço no mesmo intervalo de tempo.
> 

---

## `qrcodes` *(D3)*

| Campo | Tipo | Descrição |
| --- | --- | --- |
| id | UUID | PK |
| contrato_id | UUID | FK → contratos |
| usuario_id | UUID | FK → usuarios |
| codigo | TEXT | Hash único gerado pelo sistema |
| validade | ENUM | `diario`, `semanal`, `permanente` |
| data_expiracao | DATE | Nulo se validade = `permanente` |
| created_at | TIMESTAMP |  |

---

# Decisões de Modelagem

**Por que `valor_mensal` fica só em `unidades` e não em `contratos`?**

Simplificação consciente para o TCC — o valor do Contrato é sempre 1:1 com o valor cadastrado na Unidade, sem negociação ou diferenciação. Isso elimina redundância e reduz a complexidade do código.

**Por que `Andar` foi removido do modelo?**

Originalmente o modelo tinha Edifício → Andar → Unidade. Como um Andar alugado inteiro seria ele próprio a Unidade, a camada intermediária ficava redundante nesse caso. A Unidade absorveu o conceito de Andar, usando nome e descrição livres para identificação.

**Por que todas as Parcelas são geradas na criação do Contrato?**

Evita a necessidade de um job agendado (cron) para criação mensal, reduzindo infraestrutura. A visibilidade é controlada por status e regras de data, dando a mesma experiência ao usuário sem a complexidade operacional.