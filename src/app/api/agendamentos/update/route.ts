import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase-server';
import { requireAdminSession } from '@/lib/auth';

export async function POST(req: Request) {
    console.log('API HIT');

    const session = await requireAdminSession();
    console.log('session', session);

    const body = await req.json();
    console.log('body', body);

    const { id, data, nome, telefone } = body;

    const { data: result, error } = await supabaseServer
        .from('agendamento')
        .update({ data, nome, telefone })
        .eq('id', id)
        .eq('ala_id', session.alaId)
        .select();

    console.log('result', result);
    console.log('error', error);

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 400 });
    }

    if (!result || result.length === 0) {
        return NextResponse.json(
            { error: 'Nenhuma linha afetada' },
            { status: 404 }
        );
    }

    return NextResponse.json({ ok: true });
}
