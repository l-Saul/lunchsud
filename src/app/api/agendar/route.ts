import { supabaseServer } from '@/lib/supabase/service-role'
import { isPday, getDashboardRange } from '@/lib/date'
import { lerJson, parseAgendar, ValidationError } from '@/lib/server/validation'
import { buscarAlaPorSlug } from '@/lib/server/public-ward'
import { NextResponse } from 'next/server'

// Cria um agendamento público (sem conta). É a fonte da verdade: validação
// estrita + regras de negócio (P-day, janela do mês, 1 por dia).
// As mensagens de erro aparecem direto na tela do membro — escreva para ele.
export async function POST(req: Request) {
    // 1) Validação estrita do corpo (tamanho, formato, charset).
    let entrada
    try {
        entrada = parseAgendar(await lerJson(req))
    } catch (e) {
        if (e instanceof ValidationError) {
            return NextResponse.json(
                { error: 'Confira o nome e o telefone e tente de novo.' },
                { status: 400 }
            )
        }
        return NextResponse.json({ error: 'Não foi possível agendar. Tente de novo.' }, { status: 400 })
    }

    const { slug, data, nome, telefone } = entrada

    // 2) Regra de negócio: segunda é P-day, bloqueia mesmo que a UI seja burlada.
    if (isPday(data)) {
        return NextResponse.json(
            { error: 'Segunda-feira é P-day. Escolha outro dia.' },
            { status: 400 }
        )
    }

    const ala = await buscarAlaPorSlug(slug)
    if (!ala) {
        return NextResponse.json({ error: 'Ala não encontrada.' }, { status: 404 })
    }

    // 3) Janela permitida: de hoje (no fuso da ala) até o fim do mês seguinte. Dia
    // que já passou não recebe almoço; o limite do fim impede encher anos de calendário.
    const { hoje, fim } = getDashboardRange(ala.fuso_horario)
    if (data < hoje) {
        return NextResponse.json(
            { error: 'Esse dia já passou. Escolha outro dia.' },
            { status: 400 }
        )
    }
    if (data >= fim) {
        return NextResponse.json(
            { error: 'Esse dia está fora do período de agendamento. Escolha outro dia.' },
            { status: 400 }
        )
    }


    // Devolve o id (RETURNING, sem consulta extra) para a tela casar com o evento
    // do WebSocket que chega em seguida.
    const { data: criado, error } = await supabaseServer
        .from('agendamento')
        .insert({
            ala_id: ala.id,
            data,
            nome,
            telefone
        })
        .select('id')
        .single()

    if (error || !criado) {
        // 23505 = violação de unique (ala_id, data): o dia foi ocupado nesse meio-tempo.
        if (error?.code === '23505') {
            return NextResponse.json({ error: 'Este dia acabou de ser ocupado. Escolha outro.' }, { status: 409 })
        }
        // 23514 = o banco recusou o dado (check de nome/telefone). Tentar de novo
        // não adianta; a pessoa precisa conferir o que digitou.
        if (error?.code === '23514') {
            return NextResponse.json({ error: 'Confira o nome e o telefone e tente de novo.' }, { status: 400 })
        }

        return NextResponse.json(
            { error: 'Não foi possível agendar agora. Tente de novo em instantes.' },
            { status: 500 }
        )
    }

    return NextResponse.json({ success: true, id: criado.id })
}
