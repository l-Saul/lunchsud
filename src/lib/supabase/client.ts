import { createClient } from '@supabase/supabase-js'

// Cliente público (chave anon, respeita RLS) para uso no navegador.
// Usado pelo Realtime (WebSocket) em use-ocupados-realtime.ts.
export const supabaseClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)
