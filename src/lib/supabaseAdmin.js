import { createClient } from '@supabase/supabase-js'
import 'server-only'

const supabaseLink = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseRoleKey = process.env.SUPABASE_ROLE_KEY 

const supabaseAdmin = createClient(supabaseLink, supabaseRoleKey)


export default supabaseAdmin



