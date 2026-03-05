import { createClient } from '@supabase/supabase-js'

const getEnv = (key: string) => {
  const val = process.env[key] || '';
  return (val === 'undefined' || val === 'null') ? '' : val.trim();
}

const supabaseUrl = getEnv('NEXT_PUBLIC_SUPABASE_URL')
const supabaseAnonKey = getEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY')

// Initialize only if both values are present and valid
export const supabase = (supabaseUrl && supabaseAnonKey) 
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null
