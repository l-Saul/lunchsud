/**
 * Contexto e regras: leia CLAUDE.md e docs/routes_api.md antes de alterar.
 * Mudou o comportamento? Atualize o doc na mesma mudança.
 */

import { buscarAlaPorSlug, buscarOcupados } from '@/lib/server/public-ward'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(_request: NextRequest, context: { params: Promise<{ slug: string }> }) {
    const { slug } = await context.params

    const ala = await buscarAlaPorSlug(slug)
    if (!ala) {
        return NextResponse.json({ error: 'Ala não encontrada' }, { status: 404 })
    }

    const ocupados = await buscarOcupados(ala)
    if (!ocupados) {
        return NextResponse.json({ error: 'Erro ao buscar agendamentos' }, { status: 500 })
    }

    return NextResponse.json(ocupados)
}
