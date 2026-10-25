/**
 * Contexto e regras: leia CLAUDE.md e docs/routes_api.md antes de alterar.
 * Mudou o comportamento? Atualize o doc na mesma mudança.
 */

import { NextResponse } from 'next/server';
import { getContexto } from '@/lib/server/session';
import { supabaseServer } from '@/lib/supabase/service-role';
import { lerJson, parseNovaAla, ValidationError, type NovaAlaInput } from '@/lib/server/validation';
import { buscarAlaIgual, jaPedida, jaUsa } from '@/lib/server/ward-request';

export async function POST(req: Request) {
    const ctx = await getContexto();
    if (!ctx) {
        return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }
    if (!ctx.isOwner) {
        return NextResponse.json({ error: 'Sem permissão' }, { status: 403 });
    }

    let entrada: NovaAlaInput;
    try {
        entrada = parseNovaAla(await lerJson(req));
    } catch (e) {
        if (e instanceof ValidationError) {
            return NextResponse.json({ error: e.message }, { status: 400 });
        }
        return NextResponse.json({ error: 'Requisição inválida' }, { status: 400 });
    }
    const { nome, slug, estado, cidade, fuso } = entrada;

    const existente = await buscarAlaIgual(entrada);
    if (existente) {
        return NextResponse.json(
            { error: existente.status === 'ativa' ? jaUsa(entrada) : jaPedida(entrada) },
            { status: 409 }
        );
    }

    const { data: nova, error } = await supabaseServer
        .from('ala')
        .insert({ nome, slug, estado, cidade, fuso_horario: fuso, status: 'ativa' })
        .select('id, nome, slug')
        .single();

    if (error || !nova) {
        if (error?.code === '23505') {
            return NextResponse.json(
                { error: jaPedida(entrada) },
                { status: 409 }
            );
        }
        return NextResponse.json({ error: 'Erro ao criar ala' }, { status: 500 });
    }

    return NextResponse.json({ ok: true, ala: nova });
}
