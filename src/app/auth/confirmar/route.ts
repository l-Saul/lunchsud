import { type EmailOtpType } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { criarSupabaseServidor } from '@/lib/supabase/auth-server';

// Destino do link enviado por e-mail (redefinição de senha). Cria a sessão a
// partir do link e segue para a página indicada em `next` (por padrão,
// /redefinir-senha). Suporta os dois formatos de link do Supabase:
//
//  - token_hash + type (verifyOtp): formato do template de e-mail. Funciona mesmo
//    se o link for aberto em OUTRO aparelho/navegador (não depende de cookie PKCE).
//  - code (exchangeCodeForSession): fallback do fluxo PKCE (mesmo navegador).
//
// Link inválido/expirado volta ao login com aviso.
export async function GET(request: Request) {
    const { searchParams, origin } = new URL(request.url);
    const tokenHash = searchParams.get('token_hash');
    const type = searchParams.get('type') as EmailOtpType | null;
    const code = searchParams.get('code');
    const next = searchParams.get('next') ?? '/dashboard';

    // `next` precisa ser um caminho interno (evita open redirect).
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
