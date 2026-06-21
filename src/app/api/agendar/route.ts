import { supabaseServer } from '@/lib/supabase/server'
import { isPday, getDashboardRange } from '@/lib/date'
import { lerJson, parseAgendar, ValidationError } from '@/lib/validation'
import { rateLimit, clientIp, tooManyRequests } from '@/lib/rate-limit'
import { NextResponse } from 'next/server'

// Cria um agendamento público. É a fonte da verdade: rate limit + validação
// estrita + regras de negócio (P-day, janela do mês, 1 por dia).
export async function POST(req: Request) {
    // 1) Rate limit por IP: trava flood/robô antes de qualquer trabalho.
    const limite = rateLimit(`agendar:${clientIp(req)}`, 6, 60_000)
    if (!limite.ok) return tooManyRequests(limite.retryAfter)

    // 2) Validação estrita do corpo (tamanho, formato, charset).
    let entrada
    try {
        entrada = parseAgendar(await lerJson(req))
    } catch (e) {
        if (e instanceof ValidationError) {
            return NextResponse.json({ error: 'Dados inválidos' }, { status: 400 })
        }
        return NextResponse.json({ error: 'Requisição inválida' }, { status: 400 })
    }

    const { slug, data, nome, telefone } = entrada

    // 3) Regra de negócio: segunda é P-day, bloqueia mesmo que a UI seja burlada.
    if (isPday(data)) {
        return NextResponse.json(
            { error: 'Segunda-feira é P-day e não pode ser agendada.' },
            { status: 400 }
        )
    }

    // 4) Janela permitida: só mês atual + seguinte (impede encher anos de calendário).
    const { inicio, fim } = getDashboardRange()
    if (data < inicio || data >= fim) {
        return NextResponse.json(
            { error: 'Data fora do período de agendamento.' },
            { status: 400 }
        )
    }

    const { data: ala, error: alaError } = await supabaseServer
        .from('ala')
        .select('id')
        .eq('slug', slug)
        .single()

    if (alaError || !ala) {
        return NextResponse.json({ error: 'Ala não encontrada' }, { status: 404 })
    }

    const { error } = await supabaseServer
        .from('agendamento')
        .insert({
            ala_id: ala.id,
            data,
            nome,
            telefone
        })

    if (error) {
        // 23505 = violação de unique (ala_id, data): o dia foi ocupado nesse meio-tempo.
        if (error.code === '23505') {
            return NextResponse.json({ error: 'Este dia acabou de ser ocupado. Escolha outro.' }, { status: 409 })
        }

        return NextResponse.json({ error: 'Erro ao salvar agendamento' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
}
