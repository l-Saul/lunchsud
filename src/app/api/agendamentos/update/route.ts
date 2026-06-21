import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase/server';
import { requireAdminSession } from '@/lib/auth';
import { lerJson, parseEdicao, ValidationError } from '@/lib/validation';

// Atualiza um agendamento (data/nome/telefone). Restrito ao líder autenticado.
export async function POST(req: Request) {
    // Exige sessão admin; o filtro por ala_id abaixo garante que só edite a própria ala.
    const session = await requireAdminSession();

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
        .eq('ala_id', session.alaId)
        .select();

    if (error) {
        // Não ecoa o erro do banco (evita vazar detalhes internos).
        return NextResponse.json({ error: 'Erro ao atualizar' }, { status: 400 });
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
