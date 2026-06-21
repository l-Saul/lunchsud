import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase/server';
import { requireAdminSession } from '@/lib/auth';
import { lerJson, parseId, ValidationError } from '@/lib/validation';

// Remove um agendamento por id. Restrito ao líder autenticado e à própria ala.
export async function POST(req: Request) {
    const session = await requireAdminSession();

    let id: number;
    try {
        id = parseId(await lerJson(req));
    } catch (e) {
        if (e instanceof ValidationError) {
            return NextResponse.json({ error: 'Dados inválidos' }, { status: 400 });
        }
        return NextResponse.json({ error: 'Requisição inválida' }, { status: 400 });
    }

    const { data: result, error } = await supabaseServer
        .from('agendamento')
        .delete()
        .eq('id', id)
        .eq('ala_id', session.alaId) // trava: só apaga agendamento da própria ala
        .select();

    if (error) {
        // Não ecoa o erro do banco (evita vazar detalhes internos).
        return NextResponse.json({ error: 'Erro ao remover' }, { status: 400 });
    }

    // Nenhuma linha = id inexistente ou de outra ala.
    if (!result || result.length === 0) {
        return NextResponse.json(
            { error: 'Nenhuma linha afetada' },
            { status: 404 }
        );
    }

    return NextResponse.json({ ok: true });
}
