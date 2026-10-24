/**
 * Contexto e regras: leia CLAUDE.md e docs/routes_api.md antes de alterar.
 * Mudou o comportamento? Atualize o doc na mesma mudança.
 */

import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase/service-role';
import { getContexto } from '@/lib/server/session';
import { lerJson, parseEdicao, ValidationError } from '@/lib/server/validation';

export async function POST(req: Request) {
    const ctx = await getContexto();
    if (!ctx || ctx.alaId === null) {
        return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    let id: number, data: string, nome: string, telefone: string;
    try {
        ({ id, data, nome, telefone } = parseEdicao(await lerJson(req)));
    } catch (e) {
        if (e instanceof ValidationError) {
            return NextResponse.json({ error: 'Dados inválidos' }, { status: 400 });
        }
        return NextResponse.json({ error: 'Requisição inválida' }, { status: 400 });
    }

    const { data: result, error } = await supabaseServer
        .from('agendamento')
        .update({ data, nome, telefone })
        .eq('id', id)
        .eq('ala_id', ctx.alaId)
        .select();

    if (error) {
        return NextResponse.json({ error: 'Erro ao atualizar' }, { status: 400 });
    }

    if (!result || result.length === 0) {
        return NextResponse.json(
            { error: 'Nenhuma linha afetada' },
            { status: 404 }
        );
    }

    return NextResponse.json({ ok: true });
}
