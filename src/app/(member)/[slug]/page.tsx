/**
 * Contexto e regras: leia CLAUDE.md e docs/routes_slug.md antes de alterar.
 * Mudou o comportamento? Atualize o doc na mesma mudança.
 */

import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { buscarAlaPorSlug, buscarOcupados } from '@/lib/server/public-ward'
import { getDashboardRange } from '@/lib/date'
import { DESCRICAO_DA_ALA, tituloDaAla } from '@/lib/share-texts'
import WardBooking from './_components/WardBooking'

export async function generateMetadata(
    { params }: { params: Promise<{ slug: string }> }
): Promise<Metadata> {
    const { slug } = await params
    const ala = await buscarAlaPorSlug(slug)

    if (!ala) {
        return { title: 'Página não encontrada', robots: { index: false, follow: false } }
    }

    const titulo = tituloDaAla(ala.nome)

    return {
        title: ala.nome,
        description: DESCRICAO_DA_ALA,
        robots: { index: false, follow: false },
        openGraph: {
            type: 'website',
            locale: 'pt_BR',
            siteName: 'Almoço dos Missionários',
            title: titulo,
            description: DESCRICAO_DA_ALA,
            url: `/${ala.slug}`,
        },
        twitter: {
            card: 'summary_large_image',
            title: titulo,
            description: DESCRICAO_DA_ALA,
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
