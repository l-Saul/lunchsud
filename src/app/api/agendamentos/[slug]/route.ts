import { supabaseServer } from '@/lib/supabase/server'
import { parseSlug, ValidationError } from '@/lib/validation'
import { rateLimit, clientIp, tooManyRequests } from '@/lib/rate-limit'
import { NextRequest, NextResponse } from 'next/server'

// Dias ocupados (data + nome) de uma ala pelo slug. data::text mantém 'YYYY-MM-DD' (sem timezone).
export async function GET(request: NextRequest, context: { params: Promise<{ slug: string }> }) {
    // Rate limit por IP: leitura é barata, mas trava scraping/DoS (30/min).
    const limite = rateLimit(`ocupados:${clientIp(request)}`, 30, 60_000)
    if (!limite.ok) return tooManyRequests(limite.retryAfter)

    const params = await context.params

    let slug: string
    try {
        slug = parseSlug(params.slug)
    } catch (e) {
        if (e instanceof ValidationError) {
            return NextResponse.json({ error: 'Ala não encontrada' }, { status: 404 })
        }
        throw e
    }

    const { data: ala, error: alaError } = await supabaseServer
        .from('ala')
        .select('id')
        .eq('slug', slug)
        .single()

    if (alaError || !ala) {
        return NextResponse.json({ error: 'Ala não encontrada' }, { status: 404 })
    }

    const { data: agendamentos, error } = await supabaseServer
        .from('agendamento')
        .select('data::text, nome')
        .eq('ala_id', ala.id)

    if (error) {
        return NextResponse.json({ error: 'Erro ao buscar agendamentos' }, { status: 500 })
    }

    return NextResponse.json(agendamentos)
}
