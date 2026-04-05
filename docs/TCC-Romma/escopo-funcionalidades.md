# 🚀 Escopo e Funcionalidades

# Escopo Core

Conjunto mínimo de funcionalidades para que o sistema seja considerado completo e aprovado na banca.

## Proprietário

- Login e autenticação
- Cadastro e gestão de Edifícios
- Cadastro e gestão de Unidades dentro de um Edifício (nome e descrição livres — ex: "Andar 3", "Sala 301")
- Cadastro e gestão de Locatários (com envio de convite por email via Supabase)
- Criação e gestão de Contratos (vinculando Locatário a uma Unidade)
- Acompanhamento e marcação de Parcelas como pagas
- Dashboard com visão geral: unidades ocupadas vs. disponíveis (com valor R$), contratos ativos (com valor R$), parcelas pendentes do mês (com valor R$) e contratos vencendo nos próximos 7 dias (com valor R$)

## Locatário

- Login e autenticação (via convite por email enviado pelo Proprietário)
- Visualização do Contrato ativo
- Visualização do histórico de Parcelas (pagas, pendentes e vencidas — Parcelas futuras não são exibidas)

## Landing Page Pública

- Página de apresentação do produto Romma (sem precificação de planos)
- Listagem de Unidades disponíveis com valor mensal (ou "Consulte o Proprietário" quando o Proprietário optar por ocultar o valor)
- Atualização em tempo real da listagem via Supabase Realtime — Unidades alugadas somem automaticamente
- Formulário de contato para interesse em uma Unidade (o Proprietário cria o Contrato manualmente após o contato)

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