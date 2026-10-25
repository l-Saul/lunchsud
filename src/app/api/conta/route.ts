/**
 * Contexto e regras: leia CLAUDE.md e docs/routes_api.md antes de alterar.
 * Mudou o comportamento? Atualize o doc na mesma mudança.
 */

import { NextResponse } from 'next/server';
import { getUsuario } from '@/lib/server/session';
import { supabaseServer } from '@/lib/supabase/service-role';

export const dynamic = 'force-dynamic';

export async function GET() {
    const user = await getUsuario();
    if (!user) {
        return NextResponse.json({ logado: false });
    }

    const [{ data: perfil }, { data: vinculo }] = await Promise.all([
        supabaseServer.from('perfil').select('nome, email').eq('id', user.id).maybeSingle(),
        supabaseServer.from('ala_membro').select('ala_id').eq('user_id', user.id).limit(1).maybeSingle(),
    ]);
    const { data: ala } = vinculo
        ? await supabaseServer.from('ala').select('nome').eq('id', vinculo.ala_id).maybeSingle()
        : { data: null };

    return NextResponse.json({
        logado: true,
        nome: perfil?.nome ?? '',
        email: perfil?.email ?? user.email ?? '',
        ala: ala?.nome ?? null,
    });
}
