/**
 * Contexto e regras: leia CLAUDE.md e docs/routes_api.md antes de alterar.
 * Mudou o comportamento? Atualize o doc na mesma mudança.
 */

import { NextResponse, after } from 'next/server';
import { getContexto, podeEditarAla } from '@/lib/server/session';
import { supabaseServer } from '@/lib/supabase/service-role';
import { lerJson, parseMembroId } from '@/lib/server/validation';
import { avisarAcessoAprovado } from '@/lib/server/notifications';

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
        .select('id, ala_id, user_id, status')
        .eq('id', membroId)
        .maybeSingle();

    if (!membro) {
        return NextResponse.json({ error: 'Vínculo não encontrado' }, { status: 404 });
    }

    if (!(await podeEditarAla(ctx.userId, ctx.isOwner, membro.ala_id))) {
        return NextResponse.json({ error: 'Sem permissão' }, { status: 403 });
    }

    const { data: ala } = await supabaseServer
        .from('ala')
        .select('status')
        .eq('id', membro.ala_id)
        .maybeSingle();
    if (ala?.status !== 'ativa') {
        return NextResponse.json({ error: 'Aprove a ala antes de aprovar o líder.' }, { status: 409 });
    }

    const { error } = await supabaseServer
        .from('ala_membro')
        .update({ status: 'aprovado', aprovado_por: ctx.userId })
        .eq('id', membroId);

    if (error) {
        return NextResponse.json({ error: 'Erro ao aprovar' }, { status: 500 });
    }

    if (membro.status === 'pendente') {
        after(() => avisarAcessoAprovado(membro.ala_id, membro.user_id));
    }
    return NextResponse.json({ ok: true });
}
