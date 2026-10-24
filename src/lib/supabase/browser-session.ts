'use client';

import { createBrowserClient } from '@supabase/ssr';

// Cliente do Supabase para o NAVEGADOR (componentes client). Usa a chave anon e
// guarda a sessão do Supabase Auth em cookies (lidos no servidor via middleware).
// Login/cadastro/logout do líder passam por aqui.
export function criarSupabaseBrowser() {
    return createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
}
