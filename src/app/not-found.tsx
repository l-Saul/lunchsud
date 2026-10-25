/**
 * Contexto e regras: leia CLAUDE.md e docs/src_app.md antes de alterar.
 * Mudou o comportamento? Atualize o doc na mesma mudança.
 */

import type { Metadata } from 'next'
import Link from 'next/link'
import { HeaderBand } from '@/components/HeaderBand'
import { botao } from '@/components/button-classes'

export const metadata: Metadata = {
    title: 'Página não encontrada',
    robots: { index: false, follow: false },
}

export default function NaoEncontrada() {
    return (
        <>
            <HeaderBand title="Página não encontrada" />
            <main className="flex justify-center px-4 py-10">
                <section className="relative flex w-full max-w-md flex-col items-center gap-6 overflow-hidden rounded-3xl bg-background px-6 py-10 text-center shadow-lg ring-1 ring-primary/10 sm:px-10">
                    <span aria-hidden="true" className="absolute inset-x-0 top-0 h-1.5 bg-linear-to-r from-accent via-gold to-accent" />
                    <p className="text-lg text-muted">
                        Confira o link que você recebeu ou procure a sua ala na página inicial.
                    </p>

                    <Link
                        href="/"
                        className={`${botao('primario', 'grande')} w-full`}
                    >
                        Procurar a ala
                    </Link>
                </section>
            </main>
        </>
    )
}
