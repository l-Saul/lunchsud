import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getContexto } from '@/lib/session';
import { supabaseServer } from '@/lib/supabase/server';

// Owner troca a ala em foco no painel (grava o cookie `ala_atual`, lido pelo
// getContexto). Só owner — member tem uma ala só.
export async function POST(req: Request) {
    const ctx = await getContexto();
    if (!ctx) {
        return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }
    if (!ctx.isOwner) {
        return NextResponse.json({ error: 'Sem permissão' }, { status: 403 });
    }

    let alaId: number;
    try {
        const body = await req.json();
        alaId = Number(body?.alaId);
        if (!Number.isInteger(alaId) || alaId <= 0) throw new Error();
    } catch {
        return NextResponse.json({ error: 'Dados inválidos' }, { status: 400 });
    }

    const { data: ala } = await supabaseServer
        .from('ala')
        .select('id')
        .eq('id', alaId)
        .maybeSingle();

    if (!ala) {
        return NextResponse.json({ error: 'Ala não encontrada' }, { status: 404 });
    }

    const cookieStore = await cookies();
    cookieStore.set('ala_atual', String(alaId), {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        maxAge: 60 * 60 * 24 * 365,
    });

    return NextResponse.json({ ok: true });
}
