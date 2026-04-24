import { createServerClient } from '@supabase/ssr'
import type { CookieOptions } from '@supabase/ssr'
import type { SupabaseClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import type { Database } from '@/types/supabase'
import { getSupabaseEnv } from './config'

export async function createClient(): Promise<SupabaseClient<Database>> {
  const cookieStore = await cookies()
  const { supabaseUrl, supabaseAnonKey } = getSupabaseEnv()

  return createServerClient<Database>(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll()
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(
          ({
            name,
            value,
            options,
          }: {
            name: string
            value: string
            options: CookieOptions
          }) => {
            try {
              cookieStore.set(name, value, options)
            } catch {
              // Server Components cannot set cookies. The proxy refresh path
              // handles auth-cookie writes for normal requests.
            }
          },
        )
      },
    },
  })
}
