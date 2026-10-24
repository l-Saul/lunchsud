/**
 * Contexto e regras: leia CLAUDE.md e docs/routes_api.md antes de alterar.
 * Mudou o comportamento? Atualize o doc na mesma mudança.
 */

import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getContexto } from '@/lib/server/session';
import { supabaseServer } from '@/lib/supabase/service-role';
import { lerJson, parseAlaId } from '@/lib/server/validation';

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
        alaId = parseAlaId(await lerJson(req));
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
