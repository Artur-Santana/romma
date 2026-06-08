"use server"

import supabaseAdmin from "@/lib/supabaseAdmin"

export async function checkProprietarioExiste() {
  const { count, error } = await supabaseAdmin
    .from("proprietarios")
    .select("*", { count: "exact", head: true })

  if (error) {
    return { status: 500, erroMessage: error.message }
  }

  return { status: 200, existe: count > 0 }
}
