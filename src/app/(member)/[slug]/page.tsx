/**
 * Contexto e regras: leia CLAUDE.md e docs/routes_slug.md antes de alterar.
 * Mudou o comportamento? Atualize o doc na mesma mudança.
 */

import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { buscarAlaPorSlug, buscarOcupados } from '@/lib/server/public-ward'
import { getDashboardRange } from '@/lib/date'
import WardBooking from './_components/WardBooking'

export async function generateMetadata(
    { params }: { params: Promise<{ slug: string }> }
): Promise<Metadata> {
    const { slug } = await params
    const ala = await buscarAlaPorSlug(slug)

    if (!ala) {
        return { title: 'Ala não encontrada', robots: { index: false, follow: false } }
    }

    const tituloCompartilhar = `Calendário de almoços da ${ala.nome}`
    const descricao = 'Agende seu almoço para nossos missionários ❤️'

    return {
        title: { absolute: ala.nome },
        description: descricao,
        openGraph: {
            type: 'website',
            locale: 'pt_BR',
            title: tituloCompartilhar,
            description: descricao,
        },
        twitter: {
            card: 'summary',
            title: tituloCompartilhar,
            description: descricao,
        },
    }
}

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params

    const ala = await buscarAlaPorSlug(slug)
    if (!ala) {
        notFound()
    }

    const ocupados = await buscarOcupados(ala)
    if (!ocupados) {
        throw new Error('Erro ao carregar agendamentos')
    }

    const { hoje, mesAtual } = getDashboardRange(ala.fuso_horario)

    return (
        <WardBooking
            slug={ala.slug}
            alaId={ala.id}
            nomeAla={ala.nome}
            ocupados={ocupados}
            hoje={hoje}
            mesAtual={mesAtual}
        />
    )
}
