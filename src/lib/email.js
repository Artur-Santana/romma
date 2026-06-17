import 'server-only'
import supabaseJWT from './supabaseJWT.js'

/**
 * Dispara um email transacional via Edge Function enviar-email.
 * Apenas para os 12 templates não-auth.
 *
 * @param {string} tipo   - ex: 'loc-03-nova-parcela'
 * @param {string} to     - email do destinatário
 * @param {Object} vars   - variáveis do template ex: { LocatarioNome: 'João', Valor: 'R$ 2.500,00' }
 */
export async function enviarEmail(tipo, to, vars = {}) {
  const { data, error } = await supabaseJWT.functions.invoke('enviar-email', {
    body: { tipo, to, vars },
  })

  if (error) throw new Error(`enviar-email falhou: ${error.message}`)
  if (!data?.ok) throw new Error(`Resend rejeitou o envio: ${JSON.stringify(data)}`)

  return data
}
