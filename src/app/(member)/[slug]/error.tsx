/**
 * Contexto e regras: leia CLAUDE.md e docs/routes_slug.md antes de alterar.
 * Mudou o comportamento? Atualize o doc na mesma mudança.
 */
'use client'

import { HeaderBand } from '@/components/HeaderBand'
import { botao } from '@/components/button-classes'

export default function ErroCalendario({ retry }: { error: unknown; retry: () => void }) {
    return (
        <>
            <HeaderBand title="Não foi possível abrir o calendário" />
            <main className="flex justify-center px-4 py-10">
                <section className="relative flex w-full max-w-md flex-col items-center gap-6 overflow-hidden rounded-3xl bg-background px-6 py-10 text-center shadow-lg ring-1 ring-primary/10 sm:px-10">
                    <span aria-hidden="true" className="absolute inset-x-0 top-0 h-1.5 bg-linear-to-r from-accent via-gold to-accent" />
                    <p className="text-lg text-muted">
                        Verifique a internet e toque no botão abaixo para tentar de novo.
                    </p>

                    <button
                        onClick={retry}
                        className={`${botao('primario', 'grande')} w-full`}
                    >
                        Tentar de novo
                    </button>
                </section>
            </main>
        </>
    )
}
