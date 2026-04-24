import 'server-only'
import { createClient } from '@supabase/supabase-js'


// Variáveis de ambiente definidas no .env.local
// NEXT_PUBLIC_ no prefixo significa que são acessíveis no browser (client-side)
// Sem esse prefixo, a variável só existiria no servidor
const supabaseLink = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_JWT

// Cria o cliente Supabase — é a conexão com o banco e os serviços (Auth, Storage, etc.)
// Exportado como singleton: um único cliente compartilhado por todo o projeto
const supabaseJWT = createClient(supabaseLink, supabaseKey)

export default supabaseJWT



