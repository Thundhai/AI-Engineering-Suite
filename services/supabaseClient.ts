import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Missing Supabase configuration. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env.local (see .env.example).'
  );
}

// The anon key is safe to ship to the client by design — it only grants
// access that the database's Row Level Security policies allow. The Gemini
// API key is never here; it lives only in the gemini-proxy Edge Function.
export const supabase = createClient(supabaseUrl, supabaseAnonKey);
