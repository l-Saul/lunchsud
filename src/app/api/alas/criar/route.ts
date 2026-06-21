import { NextResponse } from 'next/server';
import { getContexto } from '@/lib/session';
import { supabaseServer } from '@/lib/supabase/server';
import { lerJson, parseNovaAla, ValidationError } from '@/lib/validation';

// Cria uma nova ala na tabela `ala` (nome + slug gerado do nome). Só owner.
// Pensado para o owner cadastrar alas rapidamente direto do painel.
export async function POST(req: Request) {
    const ctx = await getContexto();
    if (!ctx) {
        return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }
    if (!ctx.isOwner) {
        return NextResponse.json({ error: 'Sem permissão' }, { status: 403 });
    }

    let nome: string, slug: string, endereco: string | null;
    try {
        ({ nome, slug, endereco } = parseNovaAla(await lerJson(req)));
    } catch (e) {
        if (e instanceof ValidationError) {
            return NextResponse.json({ error: e.message }, { status: 400 });
        }
        return NextResponse.json({ error: 'Requisição inválida' }, { status: 400 });
    }

    // Slug já usado? (o endereço público precisa ser único)
    const { data: existente } = await supabaseServer
        .from('ala')
        .select('id')
        .eq('slug', slug)
        .maybeSingle();

    if (existente) {
        return NextResponse.json(
            { error: `Já existe uma ala no endereço "${slug}".` },
            { status: 409 }
        );
    }

    const { data: nova, error } = await supabaseServer
        .from('ala')
        .insert({ nome, slug, endereco })
        .select('id, nome, slug')
        .single();

    if (error || !nova) {
        // 23505 = violação de unicidade (corrida entre a checagem e o insert).
        if (error?.code === '23505') {
            return NextResponse.json(
                { error: `Já existe uma ala no endereço "${slug}".` },
                { status: 409 }
            );
        }
        // Não ecoa o erro do banco (evita vazar detalhes internos).
        return NextResponse.json({ error: 'Erro ao criar ala' }, { status: 500 });
    }

    return NextResponse.json({ ok: true, ala: nova });
}
