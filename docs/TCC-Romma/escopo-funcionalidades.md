# 🚀 Escopo e Funcionalidades

# Escopo Core

Conjunto mínimo de funcionalidades para que o sistema seja considerado completo e aprovado na banca.

> **Status de implementação (atualizado em 08/04/2026 — F1-S7 parcialmente concluída):**
> `[feito]` = implementado e funcional | `[parcial]` = em andamento | `[planejado]` = ainda não iniciado

## Proprietário

- `[feito]` Login e autenticação
- `[feito]` Cadastro e gestão de Edifícios
- `[feito]` Cadastro e gestão de Unidades dentro de um Edifício (nome e descrição livres — ex: "Andar 3", "Sala 301")
- `[feito]` Cadastro e gestão de Locatários (com envio de convite por email via Supabase)
- `[feito]` Criação e gestão de Contratos (vinculando Locatário a uma Unidade)
- `[feito]` Acompanhamento e marcação de Parcelas como pagas (F1-S6)
- `[parcial]` Dashboard com visão geral: contagens de unidades disponíveis/alugadas, contratos ativos, parcelas pendentes e vencidas implementadas — valores em R$ e alerta de contratos vencendo nos próximos 7 dias ainda não implementados (F1-S6)

## Locatário

- `[planejado]` Login e autenticação (via convite por email enviado pelo Proprietário)
- `[planejado]` Visualização do Contrato ativo
- `[planejado]` Visualização do histórico de Parcelas (pagas, pendentes e vencidas — Parcelas futuras não são exibidas)

## Landing Page Pública

- `[planejado]` Página de apresentação do produto Romma (sem precificação de planos)
- `[planejado]` Listagem de Unidades disponíveis com valor mensal (ou "Consulte o Proprietário" quando o Proprietário optar por ocultar o valor)
- `[planejado]` Atualização em tempo real da listagem via Supabase Realtime — Unidades alugadas somem automaticamente
- `[planejado]` Formulário de contato para interesse em uma Unidade (o Proprietário cria o Contrato manualmente após o contato)

> 💡 O modelo híbrido foi escolhido para entregar o efeito visual de um marketplace (listagem pública com Realtime) sem a complexidade de um fluxo de aprovação completo, economizando ~2 semanas de desenvolvimento. Ver 📝 Decisões e Justificativas — ARCH-02.
> 

---

# Escopo Dream

Funcionalidades a serem implementadas somente após o Core estar sólido, em ordem de prioridade. Cada nível depende do anterior estar completo e estável.

## D1 — Usuário do Locatário

Terceiro tipo de usuário: funcionários da empresa Locatária (tipo distinto do Locatário, que representa a empresa em si).

- Cadastro e gestão de Usuários do Locatário pelo próprio Locatário
- Login e autenticação independente
- Visualização das Unidades que sua empresa tem acesso (somente leitura)
- Visualização de informações da Unidade alugada (contrato, vigência, espaços disponíveis)

## D2 — Reservas em Tempo Real

Espaços reserváveis são internos à Unidade alugada — não são Unidades alugáveis, apenas reserváveis por Usuários do Locatário.

- Cadastro de Salas de Reunião e Phone Booths pelo Proprietário dentro de uma Unidade
- Sistema de Reservas com data, horário de início e horário de fim
- Conflito de reservas tratado em tempo real via Supabase Realtime (dois Usuários não podem reservar o mesmo espaço no mesmo horário)
- Visualização de agenda de disponibilidade por espaço

## D3 — QR Code de Acesso

Extensão máxima do sistema no lado do software, sem componente físico.

- Geração de QR Code único pelo sistema para acesso à Unidade alugada
- QR Code vinculado ao Contrato ativo e ao Usuário do Locatário
- Tela de validação do QR Code (simula o que seria feito por uma catraca ou fechadura inteligente)
- QR Code com validade configurável (diário, semanal ou permanente enquanto o Contrato estiver ativo)

---

# Fora do Escopo

- Integração com gateways de pagamento (boleto, cartão, Pix)
- Cálculo automático de multas e reajustes
- Geração de PDF de contrato
- Múltiplos Proprietários por instância
- Perfil de Administrador
- Integração física com catracas ou fechaduras inteligentes
- Customização do prazo de alerta de contratos vencendo (fixo em 7 dias)