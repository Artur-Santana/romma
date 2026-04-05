# 📋 Visão Geral do Produto

# O que é o Romma?

Romma é um sistema de gerenciamento de aluguéis corporativos que conecta Proprietários de edifícios com Locatários (empresas ou pessoas físicas) que buscam espaços para suas operações. O sistema permite o gerenciamento completo do ciclo de vida de um aluguel corporativo: desde a listagem pública de Unidades disponíveis até o controle de Contratos e Parcelas.

---

# Nomenclatura Oficial

Esta é a nomenclatura padronizada a ser usada em todo o sistema — código, interface e documentação.

| Conceito | Nome no Sistema | Descrição |
| --- | --- | --- |
| Dono do prédio | **Proprietário** | Usuário com controle total da instância |
| Empresa ou pessoa que aluga | **Locatário** | Quem fecha contrato de aluguel (PF ou PJ) |
| Prédio | **Edifício** | Estrutura física principal |
| Espaço alugável | **Unidade** | Qualquer espaço oferecido para aluguel dentro de um Edifício (ex: "Andar 3", "Sala 301"). O Proprietário define nome e descrição livremente. |
| Aluguel ativo | **Contrato** | Vínculo formal entre Proprietário e Locatário sobre uma Unidade |
| Pagamento mensal | **Parcela** | Registro de cada pagamento dentro de um Contrato |

> 💡 **Por que não existe "Andar" como entidade?** A camada Andar foi removida do modelo pois criava redundância — um andar alugado inteiro seria ele próprio a Unidade. A Unidade absorveu esse conceito usando nome e descrição livres para identificação. Ver 📝 Decisões e Justificativas — PROD-02.
> 

---

# Tipos de Usuário

## Escopo Core

**Proprietário**

Usuário único por instância no Core. Tem controle total sobre o sistema: cadastra Edifícios, Unidades e Locatários, cria e gerencia Contratos e acompanha Parcelas.

**Locatário**

Empresa ou pessoa física que aluga uma Unidade. No Core, é cadastrado pelo Proprietário via convite por email. Acessa o sistema para visualizar seu Contrato ativo e o histórico de Parcelas.

## Escopo Dream (futuro)

**Usuário do Locatário**

Funcionário da empresa Locatária (tipo de usuário distinto do Locatário). Visualiza as Unidades que sua empresa tem acesso e pode fazer Reservas de espaços internos como salas de reunião e phone booths.

> 💡 Em um mundo ideal, existiria também um perfil de **Administrador** — representante do Proprietário com privilégios limitados — e suporte a **múltiplos Proprietários** por instância. Esses perfis foram simplificados para o Core do TCC.
> 

---

# Regras de Negócio Principais

- Um Edifício possui uma ou mais Unidades
- Uma Unidade só pode ter um Contrato ativo por vez
- Quando uma Unidade recebe um Contrato ativo, seu status muda para `alugada` e ela desaparece da listagem pública em tempo real via Supabase Realtime
- O valor mensal do Contrato é sempre o mesmo cadastrado na Unidade (relação 1:1, sem negociação separada)
- Parcelas são geradas automaticamente para toda a vigência do Contrato no momento de sua criação
- Parcelas registram apenas se o pagamento foi realizado ou não — sem cálculos de multa ou reajuste no Core
- Uma Parcela só se torna visível quando sua `data_fechamento` chega (status muda de `futura` para `pendente` ou `vencida`)