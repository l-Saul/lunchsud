/**
 * Contexto e regras: leia CLAUDE.md e docs/routes_auth-confirmar.md antes de alterar.
 * Mudou o comportamento? Atualize o doc na mesma mudança.
 */

import { type EmailOtpType } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { criarSupabaseServidor } from '@/lib/supabase/server-session';

export async function GET(request: Request) {
    const { searchParams, origin } = new URL(request.url);
    const tokenHash = searchParams.get('token_hash');
    const type = searchParams.get('type') as EmailOtpType | null;
    const code = searchParams.get('code');
    const next = searchParams.get('next') ?? '/dashboard';

    const destino = next.startsWith('/') ? next : '/dashboard';

    const supabase = await criarSupabaseServidor();

    if (tokenHash && type) {
        const { error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash });
        if (!error) return NextResponse.redirect(`${origin}${destino}`);
    } else if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        if (!error) return NextResponse.redirect(`${origin}${destino}`);
    }

    return NextResponse.redirect(`${origin}/admin?erro=link`);
}
