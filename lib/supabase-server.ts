'use server'

import { createClient } from "@supabase/supabase-js"
import { adminConfig } from "./supabase-config"

// Server-side admin client function
export async function getSupabaseAdmin() {
  return createClient(
    adminConfig.supabaseUrl,
    adminConfig.supabaseServiceRoleKey,
    adminConfig.options
  )
} 