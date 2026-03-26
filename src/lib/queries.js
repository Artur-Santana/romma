import supabase from "@/lib/supabase"

export async function getUnidades() {
    const { data } = await supabase.from('unidades').select('*')
    return data
}

export async function getEdificios() {
    const { data } = await supabase.from('edificios').select('*')
    return data
}