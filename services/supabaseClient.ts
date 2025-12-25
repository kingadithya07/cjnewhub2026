
import { createClient } from '@supabase/supabase-js';

// Access environment variables safely.
// Cast import.meta to any to avoid TS errors, and fallback to empty object if env is undefined.
const env = (import.meta as any).env || {};

const supabaseUrl = env.VITE_SUPABASE_URL || 'https://agdfgesflpzvuuwkczwa.supabase.co';
const supabaseAnonKey = env.VITE_SUPABASE_ANON_KEY || 'placeholder-key';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
