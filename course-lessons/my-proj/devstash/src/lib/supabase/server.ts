import { createClient } from '@supabase/supabase-js'

export const SUPABASE_BUCKET = 'my-files'

export function createSupabaseServer() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SECRET_KEY!,
  )
}
