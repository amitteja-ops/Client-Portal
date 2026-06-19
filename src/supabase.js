import { createClient } from '@supabase/supabase-js';

// Same Supabase project as CRM — read-only access via RLS
const SUPABASE_URL = 'https://utctflrqhjzxhzyuhsnn.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV0Y3RmbHJxaGp6eGh6eXVoc25uIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDkxMjYyMjksImV4cCI6MjA2NDcwMjIyOX0.ygGZSExoRuRxkxpHe-zyRBmjXp39UXkZ3ioNDmRCxGU';

export const sb = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Fetch client record matching the logged-in user's email
export async function fetchClientByEmail(email) {
  const { data, error } = await sb
    .from('customers')
    .select('*')
    .ilike('email', email)
    .limit(1)
    .single();
  if (error) return null;
  return data;
}
