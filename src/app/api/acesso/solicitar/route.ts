/**
 * Contexto e regras: leia CLAUDE.md e docs/routes_api.md antes de alterar.
 * Mudou o comportamento? Atualize o doc na mesma mudança.
 */

import { NextResponse } from 'next/server';
import { getUsuario } from '@/lib/server/session';
import { supabaseServer } from '@/lib/supabase/service-role';
import { lerJson, parseAlaId } from '@/lib/server/validation';

export async function POST(req: Request) {
    const user = await getUsuario();
    if (!user) {
        return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    let alaId: number;
    try {
        alaId = parseAlaId(await lerJson(req));
    } catch {
        return NextResponse.json({ error: 'Dados inválidos' }, { status: 400 });
    }

    const { data: existente } = await supabaseServer
        .from('ala_membro')
        .select('id')
        .eq('user_id', user.id)
        .limit(1)
        .maybeSingle();

    if (existente) {
        return NextResponse.json({ error: 'Você já tem um vínculo de ala.' }, { status: 409 });
    }

    const { data: ala } = await supabaseServer
        .from('ala')
        .select('id')
        .eq('id', alaId)
        .maybeSingle();

    if (!ala) {
        return NextResponse.json({ error: 'Ala não encontrada' }, { status: 404 });
    }

    const { error } = await supabaseServer
        .from('ala_membro')
        .insert({ user_id: user.id, ala_id: alaId, status: 'pendente' });

    if (error) {
        if (error.code === '23505') {
            return NextResponse.json({ error: 'Acesso já solicitado.' }, { status: 409 });
        }
        return NextResponse.json({ error: 'Erro ao solicitar acesso' }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
}
