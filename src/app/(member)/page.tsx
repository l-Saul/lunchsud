/**
 * Contexto e regras: leia CLAUDE.md e docs/routes_home.md antes de alterar.
 * Mudou o comportamento? Atualize o doc na mesma mudança.
 */

import type { Metadata } from 'next'
import { Home } from './_components/Home'

export const metadata: Metadata = {
    alternates: { canonical: '/' },
}

export default function IndexPage() {
    return <Home />
}
