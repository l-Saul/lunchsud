/**
 * Contexto e regras: leia CLAUDE.md e docs/routes_api.md antes de alterar.
 * Mudou o comportamento? Atualize o doc na mesma mudança.
 */

import { NextRequest, NextResponse } from 'next/server'
import { buscarAlaPorSlug } from '@/lib/server/public-ward'
import { parseData, ValidationError } from '@/lib/server/validation'
import { arquivoIcs } from '@/lib/calendar-event'

export async function GET(request: NextRequest, context: { params: Promise<{ slug: string }> }) {
    const { slug } = await context.params

    let data: string
    try {
        data = parseData(request.nextUrl.searchParams.get('data'))
    } catch (e) {
        if (e instanceof ValidationError) {
            return NextResponse.json({ error: 'Data inválida' }, { status: 400 })
        }
        throw e
    }

    const ala = await buscarAlaPorSlug(slug)
    if (!ala) {
        return NextResponse.json({ error: 'Ala não encontrada' }, { status: 404 })
    }

    const ics = arquivoIcs({ dateISO: data, nomeAla: ala.nome, slug: ala.slug, agora: new Date() })
    return new NextResponse(ics, {
        headers: {
            'Content-Type': 'text/calendar; charset=utf-8',
            'Content-Disposition': 'attachment; filename="almoco-dos-missionarios.ics"',
            'Cache-Control': 'no-store',
        },
    })
}
