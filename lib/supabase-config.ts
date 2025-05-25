import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEYY!

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