import { createClient } from '@supabase/supabase-js';

// Provided Supabase credentials
const supabaseUrl = 'https://agdfgesflpzvuuwkczwa.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFnZGZnZXNmbHB6dnV1d2tjendhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU2Mzk2MDYsImV4cCI6MjA4MTIxNTYwNn0.5hFAKh5llOGg65IQjb5YyBlRpk-28BZEga76K_VdSyk';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);