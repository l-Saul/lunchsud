/**
 * Contexto e regras: leia CLAUDE.md e docs/routes_slug.md antes de alterar.
 * Mudou o comportamento? Atualize o doc na mesma mudança.
 */

import { buscarAlaPorSlug } from '@/lib/server/public-ward'
import { imagemDePrevia } from '@/lib/server/og-image'

export const alt = 'Calendário de almoços dos missionários da ala'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params
    const ala = await buscarAlaPorSlug(slug)

    return ala
        ? imagemDePrevia({ acima: 'Almoço dos Missionários', titulo: ala.nome })
        : imagemDePrevia({ titulo: 'Almoço dos Missionários' })
}
