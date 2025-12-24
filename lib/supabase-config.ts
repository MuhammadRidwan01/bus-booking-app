function requireEnv(value: string | undefined, name: string) {
  if (!value) throw new Error(`Missing environment variable ${name}`)
  return value
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    "Missing Supabase environment variables; please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY"
  )
}

// Client configuration (safe to import in the browser)
export const clientConfig = {
  supabaseUrl: supabaseUrl as string,
  supabaseAnonKey: supabaseAnonKey as string,
}

// Admin configuration (server-only; never import the service role key into the browser)
export function getAdminConfig() {
  if (typeof window !== "undefined") {
    throw new Error("Supabase service role key must only be used on the server")
  }

  return {
    supabaseUrl: clientConfig.supabaseUrl,
    supabaseServiceRoleKey: requireEnv(
      process.env.SUPABASE_SERVICE_ROLE_KEY,
      "SUPABASE_SERVICE_ROLE_KEY"
    ),
    options: {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    },
  }
}
