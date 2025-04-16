import { createClient } from "@supabase/supabase-js";

const supabaseUrl    = import.meta.env.VITE_SUPABASE_URL  as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

export const supabase = createClient(
  supabaseUrl,
  supabaseAnonKey,
  {
    auth: {
      // Store session in localStorage so it survives tab switches
      persistSession: true,
      // Automatically refresh access tokens before they expire
      autoRefreshToken: true,
      // (optional) detect OAuth redirect in URL and store session
      detectSessionInUrl: true,
    },
  }
);