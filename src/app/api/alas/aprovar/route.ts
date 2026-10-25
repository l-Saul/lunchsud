/**
 * Contexto e regras: leia CLAUDE.md e docs/routes_api.md antes de alterar.
 * Mudou o comportamento? Atualize o doc na mesma mudança.
 */

import { NextResponse } from 'next/server';
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

    const { data, error } = await supabaseServer
        .from('ala')
        .update({ status: 'ativa' })
        .eq('id', alaId)
        .eq('status', 'pendente')
        .select('id')
        .maybeSingle();

    if (error) {
        return NextResponse.json({ error: 'Não foi possível aprovar. Tente de novo.' }, { status: 500 });
    }
    if (!data) {
        return NextResponse.json({ error: 'Pedido não encontrado' }, { status: 404 });
    }
    return NextResponse.json({ ok: true });
}
