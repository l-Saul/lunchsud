import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

// Renova a sessão do Supabase Auth nas rotas do líder (padrão @supabase/ssr; a
// lista está no `matcher` lá embaixo). No Next 16 a convenção do "middleware"
// passou a se chamar `proxy` (mesma função: roda antes da requisição). Lê os
// cookies da sessão, renova o token se preciso e devolve a resposta com os
// cookies novos.
export async function proxy(request: NextRequest) {
    let response = NextResponse.next({ request });

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return request.cookies.getAll();
                },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value }) =>
                        request.cookies.set(name, value)
                    );
                    response = NextResponse.next({ request });
                    cookiesToSet.forEach(({ name, value, options }) =>
                        response.cookies.set(name, value, options)
                    );
                },
            },
        }
    );

    // IMPORTANTE: chamar getUser() é o que dispara a renovação do token.
    await supabase.auth.getUser();

    return response;
}

export const config = {
    // Só onde a sessão do líder é lida. O caminho do membro (home, calendário da
    // ala, /api/agendar, /api/agendamentos/[slug], /api/alas) não tem login, então
    // vai direto para a rota, sem esse passo extra. Rota nova que use sessão
    // (getUsuario/getContexto) precisa entrar aqui.
    matcher: [
        '/dashboard/:path*',
        '/admin/:path*',
        '/acesso/:path*',
        '/redefinir-senha/:path*',
        '/auth/:path*',
        '/api/acesso/:path*',
        '/api/agendamentos/update',
        '/api/agendamentos/delete',
        '/api/ala-atual',
        '/api/alas/criar',
    ],
};
