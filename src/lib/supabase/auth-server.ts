import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

// Cliente do Supabase para o SERVIDOR ligado aos cookies da requisição — é como
// o servidor descobre QUEM está logado (Supabase Auth). Diferente do
// `supabase/server.ts` (service-role, sem usuário): este respeita a sessão e a RLS.
//
// Em Server Components o `setAll` pode falhar (não dá pra escrever cookie no
// meio do render); tudo bem, o middleware é quem renova a sessão.
export async function criarSupabaseServidor() {
    const cookieStore = await cookies();

    return createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return cookieStore.getAll();
                },
                setAll(cookiesToSet) {
                    try {
                        cookiesToSet.forEach(({ name, value, options }) =>
                            cookieStore.set(name, value, options)
                        );
                    } catch {
                        // Chamado de um Server Component — ignorar (middleware renova).
                    }
                },
            },
        }
    );
}
