/**
 * Contexto e regras: leia CLAUDE.md e docs/src_app.md antes de alterar.
 * Mudou o comportamento? Atualize o doc na mesma mudança.
 */

import { imagemDePrevia } from '@/lib/server/og-image'

export const alt = 'Almoço dos Missionários: calendário de almoços para alas e ramos'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default function Image() {
    return imagemDePrevia({ titulo: 'Almoço dos Missionários', abaixo: 'Calendário de almoços para alas e ramos' })
}
