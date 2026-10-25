/**
 * Contexto e regras: leia CLAUDE.md e docs/routes_api.md antes de alterar.
 * Mudou o comportamento? Atualize o doc na mesma mudança.
 */

import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase/service-role';
import { getContexto } from '@/lib/server/session';
import { ANOS_DE_EDICAO, limitesDaEdicao } from '@/lib/date';
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

    const { data: ala } = await supabaseServer
        .from('ala')
        .select('fuso_horario')
        .eq('id', ctx.alaId)
        .maybeSingle();
    const { min, max } = limitesDaEdicao(ala?.fuso_horario);
    if (data < min || data > max) {
        return NextResponse.json(
            { error: `Escolha uma data até ${ANOS_DE_EDICAO} anos antes ou depois de hoje.` },
            { status: 400 }
        );
    }

    const { data: result, error } = await supabaseServer
        .from('agendamento')
        .update({ data, nome, telefone })
        .eq('id', id)
        .eq('ala_id', ctx.alaId)
        .select();

    if (error) {
        if (error.code === '23505') {
            return NextResponse.json({ error: 'Já há um almoço nesse dia.' }, { status: 409 });
        }
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
