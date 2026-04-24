'use client'

import { createBrowserClient } from '@supabase/ssr'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/supabase'
import { getSupabaseEnv } from './config'

let browserClient: SupabaseClient<Database> | undefined

export function createClient(): SupabaseClient<Database> {
  if (browserClient) return browserClient

  const { supabaseUrl, supabaseAnonKey } = getSupabaseEnv()
  browserClient = createBrowserClient<Database>(supabaseUrl, supabaseAnonKey)
  return browserClient
}
