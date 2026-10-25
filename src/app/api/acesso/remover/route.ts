/**
 * Contexto e regras: leia CLAUDE.md e docs/routes_api.md antes de alterar.
 * Mudou o comportamento? Atualize o doc na mesma mudança.
 */

import { NextResponse } from 'next/server';
import { getContexto, podeEditarAla } from '@/lib/server/session';
import { supabaseServer } from '@/lib/supabase/service-role';
import { lerJson, parseMembroId } from '@/lib/server/validation';

export async function POST(req: Request) {
    const ctx = await getContexto();
    if (!ctx) {
        return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    let membroId: number;
    try {
        membroId = parseMembroId(await lerJson(req));
    } catch {
        return NextResponse.json({ error: 'Dados inválidos' }, { status: 400 });
    }

    const { data: membro } = await supabaseServer
        .from('ala_membro')
        .select('id, ala_id, user_id')
        .eq('id', membroId)
        .maybeSingle();

    if (!membro) {
        return NextResponse.json({ error: 'Vínculo não encontrado' }, { status: 404 });
    }

    if (!(await podeEditarAla(ctx.userId, ctx.isOwner, membro.ala_id))) {
        return NextResponse.json({ error: 'Sem permissão' }, { status: 403 });
    }

    if (membro.user_id === ctx.userId) {
        return NextResponse.json({ error: 'Você não pode tirar o seu próprio acesso.' }, { status: 409 });
    }

    const { error } = await supabaseServer
        .from('ala_membro')
        .delete()
        .eq('id', membroId);

    if (error) {
        return NextResponse.json({ error: 'Erro ao remover' }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
}
