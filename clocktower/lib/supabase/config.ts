const placeholderSupabaseUrl = 'http://127.0.0.1:54321'
const placeholderSupabaseAnonKey = 'local-placeholder-anon-key'

let warnedAboutPlaceholder = false

export function isSupabaseConfigured() {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  )
}

export function getSupabaseEnv() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (supabaseUrl && supabaseAnonKey) {
    return { supabaseUrl, supabaseAnonKey }
  }

  if (!warnedAboutPlaceholder) {
    warnedAboutPlaceholder = true
    console.warn(
      'Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY; using local placeholder Supabase settings.',
    )
  }

  return {
    supabaseUrl: placeholderSupabaseUrl,
    supabaseAnonKey: placeholderSupabaseAnonKey,
  }
}
