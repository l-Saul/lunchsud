// Trava: se um componente do navegador importar este arquivo, o build falha em
// vez de mandar a chave service-role para o celular de quem acessa.
import 'server-only'
import { createClient } from '@supabase/supabase-js'

// Cliente Supabase com service role — uso EXCLUSIVO no servidor (rotas/Server Components).
// Ignora RLS; nunca importar em código que vai pro navegador.
export const supabaseServer = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
)
