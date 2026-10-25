/**
 * Contexto e regras: leia CLAUDE.md e docs/src_app.md antes de alterar.
 * Mudou o comportamento? Atualize o doc na mesma mudança.
 */

import type { Metadata } from 'next'
import Link from 'next/link'
import { Flower } from '@/components/Flower'
import { HeaderBand } from '@/components/HeaderBand'

export const metadata: Metadata = {
    title: 'Página não encontrada',
    robots: { index: false, follow: false },
}

export default function NaoEncontrada() {
    return (
        <>
            <HeaderBand />
            <main className="flex justify-center px-4 py-10">
                <section className="relative flex w-full max-w-md flex-col items-center gap-6 overflow-hidden rounded-3xl bg-background px-6 py-10 text-center shadow-lg ring-1 ring-primary/10 sm:px-10">
                    <span aria-hidden="true" className="absolute inset-x-0 top-0 h-1.5 bg-linear-to-r from-accent via-gold to-accent" />
                    <Flower size={26} />

                    <h1 className="text-2xl font-semibold text-text">
                        Não encontramos essa página
                    </h1>
                    <p className="text-lg text-muted">
                        Confira o link que você recebeu ou escolha a sua ala na lista.
                    </p>

                    <Link
                        href="/"
                        className="flex min-h-13 w-full items-center justify-center rounded-xl bg-secondary px-4 text-lg font-semibold text-white shadow-md transition duration-200 hover:-translate-y-0.5 hover:opacity-95 hover:shadow-lg"
                    >
                        Ver as alas
                    </Link>
                </section>
            </main>
        </>
    )
}
