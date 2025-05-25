import { createClient } from "@supabase/supabase-js"
import { clientConfig } from "./supabase-config"

// Client for public usage
export const supabase = createClient(
  clientConfig.supabaseUrl,
  clientConfig.supabaseAnonKey
) 