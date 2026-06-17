// Edge Function: enviar-email
// Dispara os 12 templates transacionais via Resend.
// POST { tipo, to, vars }
//   tipo: nome do arquivo sem .html (ex: "loc-03-nova-parcela")
//   to: string ou string[]
//   vars: { LocatarioNome: "João", Valor: "R$ 2.500,00", ... }

const SUBJECTS: Record<string, string> = {
  "loc-02-boas-vindas": "Tudo pronto — seu acesso ao Portal está ativo",
  "loc-03-nova-parcela": "Parcela disponível — vence em {{ .Vencimento }}",
  "loc-04-lembrete": "Lembrete: sua parcela vence em {{ .DiasRestantes }} dias",
  "loc-05-pagamento-confirmado": "Pagamento confirmado — comprovante da parcela",
  "loc-06-parcela-vencida": "Parcela em atraso — regularize seu pagamento",
  "loc-07-renovacao": "Seu contrato vence em {{ .DiasRestantes }} dias — vamos renovar?",
  "own-03-locatario-aceitou": "{{ .LocatarioRazao }} aceitou o convite",
  "own-04-pagamento-recebido": "Pagamento recebido — {{ .Valor }} · {{ .LocatarioRazao }}",
  "own-05-alerta-vencida": "Alerta: parcela vencida — {{ .LocatarioNome }}",
  "own-06-contrato-vencendo": "Alerta: contrato vence em {{ .DiasRestantes }} dias",
  "own-07-resumo-mensal": "Seu resumo de {{ .Mes }}",
  "own-08-novo-lead": "Novo interesse: {{ .Unidade }} · {{ .Edificio }}",
};

const TIPOS_VALIDOS = new Set(Object.keys(SUBJECTS));

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

function substituir(texto: string, vars: Record<string, string>): string {
  return texto.replace(
    /\{\{\s*\.(\w+)\s*\}\}/g,
    (_, chave) => vars[chave] ?? "",
  );
}

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: CORS_HEADERS });
  }

  if (req.method !== "POST") {
    return json({ error: "Método não permitido" }, 405);
  }

  let tipo: string, to: string | string[], vars: Record<string, string>;
  try {
    ({ tipo, to, vars = {} } = await req.json());
  } catch {
    return json({ error: "Body JSON inválido" }, 400);
  }

  if (!tipo || !to) return json({ error: "tipo e to são obrigatórios" }, 400);
  if (!TIPOS_VALIDOS.has(tipo)) return json({ error: `tipo inválido: ${tipo}` }, 400);

  const resendKey = Deno.env.get("RESEND_API_KEY");
  if (!resendKey) return json({ error: "RESEND_API_KEY não configurado" }, 500);

  const remetente = Deno.env.get("EMAIL_REMETENTE") ?? "Romma <noreply@romma.com.br>";

  let htmlRaw: string;
  try {
    htmlRaw = await Deno.readTextFile(
      new URL(`./emails/${tipo}.html`, import.meta.url),
    );
  } catch {
    return json({ error: `Template não encontrado: ${tipo}` }, 500);
  }

  const html = substituir(htmlRaw, vars);
  const subject = substituir(SUBJECTS[tipo], vars);
  const destinatarios = Array.isArray(to) ? to : [to];

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${resendKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: remetente,
      to: destinatarios,
      subject,
      html,
    }),
  });

  const data = await res.json();

  return json({ ok: res.ok, data }, res.ok ? 200 : 500);
});
