import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

// We export a function or handle the empty string case to prevent build-time crashes
// in environments where these variables aren't injected until runtime (or are missing during prerender).
export const supabase = (supabaseUrl && supabaseAnonKey) 
  ? createClient(supabaseUrl, supabaseAnonKey)
  : (null as any) // Type cast to prevent breaks, but we'll check for null in usage
