import { createClient } from '@supabase/supabase-js'

// Cliente Supabase com service role — uso EXCLUSIVO no servidor (rotas/Server Components).
// Ignora RLS; nunca importar em código que vai pro navegador.
export const supabaseServer = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
)
