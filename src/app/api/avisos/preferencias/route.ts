/**
 * Contexto e regras: leia CLAUDE.md e docs/routes_api.md antes de alterar.
 * Mudou o comportamento? Atualize o doc na mesma mudança.
 */

import { NextResponse } from 'next/server';
import { getContexto } from '@/lib/server/session';
import { supabaseServer } from '@/lib/supabase/service-role';
import { lerJson, parseAlaId, parsePreferencias } from '@/lib/server/validation';
import type { PreferenciasEmail } from '@/lib/email-preferences';

export async function POST(req: Request) {
    const ctx = await getContexto();
    if (!ctx) {
        return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }
    if (ctx.alaId === null) {
        return NextResponse.json({ error: 'Sem permissão' }, { status: 403 });
    }

    let alaId: number;
    let preferencias: PreferenciasEmail;
    try {
        const corpo = await lerJson(req);
        alaId = parseAlaId(corpo);
        preferencias = parsePreferencias(corpo);
    } catch {
        return NextResponse.json({ error: 'Dados inválidos' }, { status: 400 });
    }

    if (alaId !== ctx.alaId) {
        return NextResponse.json({ error: 'A página está desatualizada. Atualize a página.' }, { status: 409 });
    }

    const { error } = await supabaseServer
        .from('email_preferencia')
        .upsert(
            { user_id: ctx.userId, ala_id: alaId, ...preferencias, atualizado_em: new Date().toISOString() },
            { onConflict: 'user_id,ala_id' }
        );
    if (error) {
        return NextResponse.json({ error: 'Erro ao salvar' }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
}
