import { NextResponse } from 'next/server';
import { getContexto, podeEditarAla } from '@/lib/session';
import { supabaseServer } from '@/lib/supabase/server';

// Aprova um vínculo pendente. Quem pode: owner (qualquer ala) ou member já
// aprovado da MESMA ala do pedido.
export async function POST(req: Request) {
    const ctx = await getContexto();
    if (!ctx) {
        return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    let membroId: number;
    try {
        const body = await req.json();
        membroId = Number(body?.membroId);
        if (!Number.isInteger(membroId) || membroId <= 0) throw new Error();
    } catch {
        return NextResponse.json({ error: 'Dados inválidos' }, { status: 400 });
    }

    const { data: membro } = await supabaseServer
        .from('ala_membro')
        .select('id, ala_id')
        .eq('id', membroId)
        .maybeSingle();

    if (!membro) {
        return NextResponse.json({ error: 'Vínculo não encontrado' }, { status: 404 });
    }

    if (!(await podeEditarAla(ctx.userId, ctx.isOwner, membro.ala_id))) {
        return NextResponse.json({ error: 'Sem permissão' }, { status: 403 });
    }

    const { error } = await supabaseServer
        .from('ala_membro')
        .update({ status: 'aprovado', aprovado_por: ctx.userId })
        .eq('id', membroId);

    if (error) {
        return NextResponse.json({ error: 'Erro ao aprovar' }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
}
