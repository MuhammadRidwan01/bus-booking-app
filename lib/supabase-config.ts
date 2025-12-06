const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEYY

if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceRoleKey) {
  throw new Error("Missing Supabase environment variables; please set NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, and SUPABASE_SERVICE_ROLE_KEY")
}

// Client configuration
export const clientConfig = {
  supabaseUrl,
  supabaseAnonKey
}

// Admin configuration
export const adminConfig = {
  supabaseUrl,
  supabaseServiceRoleKey,
  options: {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
} 
