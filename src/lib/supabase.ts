import { createClient } from '@supabase/supabase-js';

// Usamos um fallback genérico apenas para evitar que o "npm run build" do Vercel
// quebre caso as variáveis de ambiente ainda não tenham sido configuradas no painel.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder_key';

export const supabase = createClient(supabaseUrl, supabaseKey);
