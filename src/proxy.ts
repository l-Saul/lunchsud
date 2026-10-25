/**
 * Contexto e regras: leia CLAUDE.md e docs/src_app.md antes de alterar.
 * Mudou o comportamento? Atualize o doc na mesma mudança.
 */

import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

const METODOS_SEGUROS = new Set(['GET', 'HEAD', 'OPTIONS']);

function vemDeOutroSite(request: NextRequest) {
    if (METODOS_SEGUROS.has(request.method) || !request.nextUrl.pathname.startsWith('/api/')) return false;

    const site = request.headers.get('sec-fetch-site');
    if (site && site !== 'same-origin' && site !== 'none') return true;

    const origem = request.headers.get('origin');
    if (!origem) return false;
    const hosts = [request.headers.get('host'), request.headers.get('x-forwarded-host')];
    try {
        return !hosts.includes(new URL(origem).host);
    } catch {
        return true;
    }
}

export async function proxy(request: NextRequest) {
    if (vemDeOutroSite(request)) {
        return NextResponse.json({ error: 'Pedido recusado.' }, { status: 403 });
    }

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

    await supabase.auth.getUser();

    return response;
}

export const config = {
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
        '/api/alas/pedir',
        '/api/conta',
        '/api/alas/aprovar',
        '/api/alas/recusar',
        '/api/avisos/:path*',
    ],
};
