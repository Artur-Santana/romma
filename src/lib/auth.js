export async function isProprietario(supabase) {
  const { data } = await supabase.rpc('is_proprietario')
  return data === true
}
