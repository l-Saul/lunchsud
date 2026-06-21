import { createClient } from '@supabase/supabase-js';

// Mesmo papel do supabaseServer (service role, só no servidor), mas usa a URL pública.
// Usado nas rotas de admin/login. Mantido separado para não alterar a conexão em produção.
export const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL as string,
    process.env.SUPABASE_SERVICE_ROLE_KEY as string
);
