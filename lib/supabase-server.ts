"use server"

import { createClient } from "@supabase/supabase-js"
import { getAdminConfig } from "./supabase-config"

// Server-side admin client function
export async function getSupabaseAdmin() {
  const adminConfig = getAdminConfig()

  return createClient(
    adminConfig.supabaseUrl,
    adminConfig.supabaseServiceRoleKey,
    adminConfig.options
  )
}
