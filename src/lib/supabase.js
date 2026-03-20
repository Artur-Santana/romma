import { createClient } from '@supabase/supabase-js'

const supabaseLink = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

const supabase = createClient(supabaseLink, supabaseKey)

export default supabase