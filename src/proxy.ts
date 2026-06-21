import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

// Renova a sessão do Supabase Auth em toda requisição (padrão @supabase/ssr).
// No Next 16 a convenção do "middleware" passou a se chamar `proxy` (mesma função:
// roda antes da requisição). Lê os cookies da sessão, renova o token se preciso e
// devolve a resposta com os cookies novos. Sem login é um no-op.
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
    // Roda em tudo, menos arquivos estáticos e imagens.
    matcher: [
        '/((?!_next/static|_next/image|favicon.ico|.*\\.png$|robots.txt|manifest.webmanifest).*)',
    ],
};
