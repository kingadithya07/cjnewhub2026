
import { createClient } from '@supabase/supabase-js';

// Updated Supabase credentials provided by user
export const supabaseUrl = 'https://wpfzfozfxtwdaejramfz.supabase.co';
export const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndwZnpmb3pmeHR3ZGFlanJhbWZ6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY2NjExNzMsImV4cCI6MjA4MjIzNzE3M30.Bd6IbBcd_KgcgkfYGPvGUbqsfnlNuhJP5q-6p8BHQVk';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
