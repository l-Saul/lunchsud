import { buscarAlaPorSlug, buscarOcupados } from '@/lib/ala-publica'
import { NextRequest, NextResponse } from 'next/server'

// Dias ocupados (data + nome) de uma ala pelo slug, só na janela agendável.
// Chamada pela página pública a cada evento do Realtime para recarregar o calendário.
export async function GET(_request: NextRequest, context: { params: Promise<{ slug: string }> }) {
    const { slug } = await context.params

    const ala = await buscarAlaPorSlug(slug)
    if (!ala) {
        return NextResponse.json({ error: 'Ala não encontrada' }, { status: 404 })
    }

    const ocupados = await buscarOcupados(ala.id)
    if (!ocupados) {
        return NextResponse.json({ error: 'Erro ao buscar agendamentos' }, { status: 500 })
    }

    return NextResponse.json(ocupados)
}
