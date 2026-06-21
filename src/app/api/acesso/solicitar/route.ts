import { NextResponse } from 'next/server';
import { getUsuario } from '@/lib/session';
import { supabaseServer } from '@/lib/supabase/server';

// Usuário logado pede acesso a UMA ala (cria vínculo pendente). Member = 1 ala,
// então bloqueia se já houver qualquer vínculo.
export async function POST(req: Request) {
    const user = await getUsuario();
    if (!user) {
        return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    let alaId: number;
    try {
        const body = await req.json();
        alaId = Number(body?.alaId);
        if (!Number.isInteger(alaId) || alaId <= 0) throw new Error();
    } catch {
        return NextResponse.json({ error: 'Dados inválidos' }, { status: 400 });
    }

    // Já tem vínculo (pendente ou aprovado)? Member só pode ter um.
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
