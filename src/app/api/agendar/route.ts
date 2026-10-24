/**
 * Contexto e regras: leia CLAUDE.md e docs/routes_api.md antes de alterar.
 * Mudou o comportamento? Atualize o doc na mesma mudança.
 */

import { supabaseServer } from '@/lib/supabase/service-role'
import { isPday, getDashboardRange } from '@/lib/date'
import { lerJson, parseAgendar, ValidationError } from '@/lib/server/validation'
import { buscarAlaPorSlug } from '@/lib/server/public-ward'
import { NextResponse, after } from 'next/server'
import { avisarNovoAlmoco } from '@/lib/server/notifications'

export async function POST(req: Request) {
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
        if (error?.code === '23505') {
            return NextResponse.json({ error: 'Este dia acabou de ser ocupado. Escolha outro.' }, { status: 409 })
        }
        if (error?.code === '23514') {
            return NextResponse.json({ error: 'Confira o nome e o telefone e tente de novo.' }, { status: 400 })
        }

        return NextResponse.json(
            { error: 'Não foi possível agendar agora. Tente de novo em instantes.' },
            { status: 500 }
        )
    }

    after(() => avisarNovoAlmoco(ala.id, { data, nome, telefone }))
    return NextResponse.json({ success: true, id: criado.id })
}
