/* Romma — mock domain data (pt-BR). Shared across every screen via window. */
(function () {
  const fmtBRL = (n) =>
    n == null ? "—" : new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 }).format(n);
  const fmtBRLk = (n) => (n >= 1000 ? `R$${(n / 1000).toFixed(1).replace(".", ",")}k` : fmtBRL(n));
  const fmtData = (iso) => {
    if (!iso) return "—";
    const [y, m, d] = iso.split("-");
    return `${d}/${m}/${y}`;
  };
  const initials = (name) => (name || "?").split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();

  const edificios = [
    { id: "e1", nome: "Edifício Paulista", endereco: "Av. Paulista, 1842 — Bela Vista, São Paulo" },
    { id: "e2", nome: "Torre Faria Lima", endereco: "Av. Brigadeiro Faria Lima, 3600 — Itaim Bibi, São Paulo" },
    { id: "e3", nome: "Centro Empresarial Berrini", endereco: "Av. Eng. Luís Carlos Berrini, 1140 — Brooklin, São Paulo" },
  ];

  // status: disponivel | alugada
  const unidades = [
    { id: "u1",  edificio_id: "e1", nome: "Conjunto 1204", area_m2: 142, valor_mensal: 12400, valor_visivel: true,  status: "alugada",    descricao: "Laje corporativa, 11º andar, vista para a Av. Paulista." },
    { id: "u2",  edificio_id: "e1", nome: "Sala 305",      area_m2: 48,  valor_mensal: 6200,  valor_visivel: true,  status: "alugada",    descricao: "Sala comercial compacta, 3º andar." },
    { id: "u3",  edificio_id: "e1", nome: "Sala 308",      area_m2: 52,  valor_mensal: 6800,  valor_visivel: true,  status: "disponivel", descricao: "Sala de canto, dupla face de janela." },
    { id: "u4",  edificio_id: "e2", nome: "Sala 802",      area_m2: 76,  valor_mensal: 8900,  valor_visivel: true,  status: "alugada",    descricao: "Conjunto dividido em 3 ambientes, 8º andar." },
    { id: "u5",  edificio_id: "e2", nome: "Conjunto 1510", area_m2: 188, valor_mensal: 18600, valor_visivel: false, status: "disponivel", descricao: "Laje inteira, 15º andar, infraestrutura de TI pronta." },
    { id: "u6",  edificio_id: "e2", nome: "Sala 410",      area_m2: 60,  valor_mensal: 7400,  valor_visivel: true,  status: "disponivel", descricao: "Sala mobiliada, pé-direito alto." },
    { id: "u7",  edificio_id: "e3", nome: "Loja 04",       area_m2: 210, valor_mensal: 21000, valor_visivel: true,  status: "alugada",    descricao: "Loja térrea com vitrine para a Berrini." },
    { id: "u8",  edificio_id: "e3", nome: "Galpão B2",     area_m2: 320, valor_mensal: 15300, valor_visivel: true,  status: "alugada",    descricao: "Galpão logístico, doca de carga, pé-direito 8m." },
    { id: "u9",  edificio_id: "e3", nome: "Sala 1206",     area_m2: 94,  valor_mensal: 9800,  valor_visivel: true,  status: "disponivel", descricao: "Conjunto comercial, 12º andar, 2 vagas." },
    { id: "u10", edificio_id: "e3", nome: "Sala 1208",     area_m2: 88,  valor_mensal: 9400,  valor_visivel: false, status: "disponivel", descricao: "Conjunto comercial, 12º andar." },
    { id: "u11", edificio_id: "e1", nome: "Conjunto 1601", area_m2: 156, valor_mensal: 13900, valor_visivel: true,  status: "alugada",    descricao: "Laje corporativa, 16º andar, terraço privativo." },
  ];

  // status_convite: aceito | pendente   ·   tipo: pf | pj
  const locatarios = [
    { id: "l1", nome_razao_social: "Nexus Tecnologia LTDA", tipo: "pj", documento: "12345678000190", email: "contato@nexustec.com.br",   telefone: "(11) 3045-2200", status_convite: "aceito" },
    { id: "l2", nome_razao_social: "Vértice Consultoria",   tipo: "pj", documento: "98765432000155", email: "financeiro@vertice.com.br", telefone: "(11) 3322-8100", status_convite: "aceito" },
    { id: "l3", nome_razao_social: "Atlas Comércio S.A.",   tipo: "pj", documento: "45678912000133", email: "adm@atlascomercio.com.br",  telefone: "(11) 2155-9000", status_convite: "aceito" },
    { id: "l4", nome_razao_social: "Orion Logística",       tipo: "pj", documento: "32165498000177", email: "ops@orionlog.com.br",      telefone: "(11) 4002-7788", status_convite: "aceito" },
    { id: "l5", nome_razao_social: "Meridian Studio",       tipo: "pj", documento: "78912345000122", email: "ola@meridian.studio",      telefone: "(11) 3811-4545", status_convite: "aceito" },
    { id: "l6", nome_razao_social: "HelenaArruda",         tipo: "pf", documento: "12345678909",    email: "helena.arruda@gmail.com",  telefone: "(11) 99812-3344", status_convite: "pendente" },
    { id: "l7", nome_razao_social: "Cobalt Finance",        tipo: "pj", documento: "65498732000111", email: "contato@cobalt.fin",       telefone: "(11) 3090-1212", status_convite: "pendente" },
  ];

  // contratos — status: ativo | encerrado
  const contratos = [
    { id: "c1", locatario_id: "l1", unidade_id: "u1",  data_inicio: "2024-06-19", data_fim: "2026-06-19", status: "ativo", observacoes: "Reajuste anual pelo IGP-M." },
    { id: "c2", locatario_id: "l2", unidade_id: "u4",  data_inicio: "2024-12-01", data_fim: "2026-11-30", status: "ativo", observacoes: "" },
    { id: "c3", locatario_id: "l3", unidade_id: "u7",  data_inicio: "2025-03-03", data_fim: "2027-03-02", status: "ativo", observacoes: "Carência de 1 mês no início." },
    { id: "c4", locatario_id: "l4", unidade_id: "u8",  data_inicio: "2024-09-15", data_fim: "2026-09-14", status: "ativo", observacoes: "" },
    { id: "c5", locatario_id: "l5", unidade_id: "u2",  data_inicio: "2025-01-10", data_fim: "2026-07-10", status: "ativo", observacoes: "" },
    { id: "c6", locatario_id: "l1", unidade_id: "u11", data_inicio: "2025-02-01", data_fim: "2027-01-31", status: "ativo", observacoes: "Segundo contrato do mesmo grupo." },
    { id: "c7", locatario_id: "l3", unidade_id: "u3",  data_inicio: "2023-04-01", data_fim: "2025-03-31", status: "encerrado", observacoes: "Encerrado no fim do prazo." },
  ];

  // parcelas for the tenant portal (contrato c1 — Nexus / Conjunto 1204, R$12.400)
  // status: paga | pendente | vencida | futura
  const parcelasContrato = [
    { id: "p1",  numero: 1,  data_vencimento: "2025-07-19", data_pagamento: "2025-07-17", status: "paga" },
    { id: "p2",  numero: 2,  data_vencimento: "2025-08-19", data_pagamento: "2025-08-18", status: "paga" },
    { id: "p3",  numero: 3,  data_vencimento: "2025-09-19", data_pagamento: "2025-09-19", status: "paga" },
    { id: "p4",  numero: 4,  data_vencimento: "2025-10-19", data_pagamento: "2025-10-16", status: "paga" },
    { id: "p5",  numero: 5,  data_vencimento: "2025-11-19", data_pagamento: "2025-11-20", status: "paga" },
    { id: "p6",  numero: 6,  data_vencimento: "2025-12-19", data_pagamento: "2025-12-19", status: "paga" },
    { id: "p7",  numero: 7,  data_vencimento: "2026-01-19", data_pagamento: "2026-01-15", status: "paga" },
    { id: "p8",  numero: 8,  data_vencimento: "2026-02-19", data_pagamento: "2026-02-19", status: "paga" },
    { id: "p9",  numero: 9,  data_vencimento: "2026-03-19", data_pagamento: "2026-03-22", status: "paga" },
    { id: "p10", numero: 10, data_vencimento: "2026-04-19", data_pagamento: "2026-04-18", status: "paga" },
    { id: "p11", numero: 11, data_vencimento: "2026-05-19", data_pagamento: "2026-05-17", status: "paga" },
    { id: "p12", numero: 12, data_vencimento: "2026-06-19", data_pagamento: null,         status: "pendente" },
  ];

  // Parcelas for an arbitrary contract detail view (console) — mix of states
  const parcelasDetalhe = [
    { id: "d1", numero: 1, data_vencimento: "2025-07-19", data_pagamento: "2025-07-17", status: "paga" },
    { id: "d2", numero: 2, data_vencimento: "2025-08-19", data_pagamento: "2025-08-18", status: "paga" },
    { id: "d3", numero: 3, data_vencimento: "2025-09-19", data_pagamento: null,         status: "vencida" },
    { id: "d4", numero: 4, data_vencimento: "2026-06-19", data_pagamento: null,         status: "pendente" },
    { id: "d5", numero: 5, data_vencimento: "2026-07-19", data_pagamento: null,         status: "futura" },
    { id: "d6", numero: 6, data_vencimento: "2026-08-19", data_pagamento: null,         status: "futura" },
  ];

  // 6-month cash-flow forecast for the dashboard
  const fluxo = [
    { mes: "JAN", recebido: 78,  previsto: 92 },
    { mes: "FEV", recebido: 84,  previsto: 92 },
    { mes: "MAR", recebido: 88,  previsto: 95 },
    { mes: "ABR", recebido: 91,  previsto: 96 },
    { mes: "MAI", recebido: 86,  previsto: 96, peak: true },
    { mes: "JUN", recebido: 0,   previsto: 99 },
  ];

  const TODAY = "2026-06-13";

  window.RommaData = {
    fmtBRL, fmtBRLk, fmtData, initials, TODAY,
    edificios, unidades, locatarios, contratos, parcelasContrato, parcelasDetalhe, fluxo,
    operador: { nome: "Carlos Mendes", email: "carlos.mendes@romma.io" },
  };
})();
