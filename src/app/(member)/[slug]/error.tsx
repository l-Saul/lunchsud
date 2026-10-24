/**
 * Contexto e regras: leia CLAUDE.md e docs/routes_slug.md antes de alterar.
 * Mudou o comportamento? Atualize o doc na mesma mudança.
 */
'use client'

import { Flower } from '@/components/Flower'

export default function ErroCalendario({ retry }: { error: unknown; retry: () => void }) {
    return (
        <main className="flex min-h-screen items-center justify-center px-4 py-12">
            <section className="relative flex w-full max-w-md flex-col items-center gap-6 overflow-hidden rounded-3xl bg-background px-6 py-10 text-center shadow-2xl ring-1 ring-white/40 sm:px-10">
                <span aria-hidden="true" className="absolute inset-x-0 top-0 h-1.5 bg-linear-to-r from-accent via-gold to-accent" />
                <Flower size={26} />

                <h1 className="text-2xl font-semibold text-text">
                    Não foi possível abrir o calendário
                </h1>
                <p className="text-lg text-muted">
                    Verifique a internet e toque no botão abaixo para tentar de novo.
                </p>

                <button
                    onClick={retry}
                    className="min-h-13 w-full rounded-xl bg-secondary px-4 text-lg font-semibold text-white shadow-md transition duration-200 hover:-translate-y-0.5 hover:opacity-95 hover:shadow-lg cursor-pointer"
                >
                    Tentar de novo
                </button>
            </section>
        </main>
    )
}
