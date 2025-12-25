import { createClient } from '@supabase/supabase-js';

// IMPORTANT: Ensure these environment variables are set in your .env file
// VITE_SUPABASE_URL=your_project_url
// VITE_SUPABASE_ANON_KEY=your_anon_key

const env = (import.meta as any).env || {};

// If keys are missing, the app will still initialize but API calls will fail with 401/403.
// This allows the UI to render and show helpful error messages to the developer.
const supabaseUrl = env.VITE_SUPABASE_URL || 'https://agdfgesflpzvuuwkczwa.supabase.co';
const supabaseAnonKey = env.VITE_SUPABASE_ANON_KEY || 'no-api-key-provided';

if (supabaseAnonKey === 'no-api-key-provided') {
  console.warn("Supabase API Key is missing. Please check your environment variables.");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);