import { createServerClient } from "@supabase/ssr";
import { cookies } from 'next/headers'


export async function createServer() {
    const cookiesNavegador = await cookies()
    return createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        {
            cookies: {
              async getAll() {
                return cookiesNavegador.getAll()
              },
              async setAll(cookiesToSet) {
                cookiesToSet.forEach(cookie => {
                    cookiesNavegador.set(cookie.name,cookie.value,cookie.options)
                });
              }
            }
          }
    )
}