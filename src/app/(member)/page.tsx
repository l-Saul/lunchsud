/**
 * Contexto e regras: leia CLAUDE.md e docs/routes_home.md antes de alterar.
 * Mudou o comportamento? Atualize o doc na mesma mudança.
 */
'use client'

import useSWR from 'swr'
import { useState, useSyncExternalStore } from 'react'
import { useRouter } from 'next/navigation'
import { HeaderBand } from '@/components/HeaderBand'
import { Spinner } from '@/components/Spinner'
import { WardFilter } from '@/components/WardFilter'
import { alaLembrada } from '@/lib/last-ward'
import { RequestWard } from './_components/RequestWard'

type Ala = {
    nome: string
    slug: string
    estado: string
    cidade: string
}

const fetcher = async (url: string): Promise<Ala[]> => {
    const res = await fetch(url)
    if (!res.ok) {
        throw new Error('Erro ao carregar alas')
    }

    const data = await res.json()
    if (!Array.isArray(data)) {
        throw new Error('Payload inválido')
    }

    return data
}

const semInscricao = () => () => {}

export default function IndexPage() {
    const { data: alas, error, isLoading } = useSWR<Ala[]>('/api/alas', fetcher)
    const [loadingSlug, setLoadingSlug] = useState<string | null>(null)
    const router = useRouter()
    const slugLembrado = useSyncExternalStore(semInscricao, alaLembrada, () => null)

    const lista = alas ?? []
    const lembrada = lista.find(ala => ala.slug === slugLembrado)

    function abrir(slug: string) {
        setLoadingSlug(slug)
        router.push(`/${slug}`)
    }

    return (
        <>
            <HeaderBand title="Almoço dos Missionários" />

            <main className="flex justify-center">
                <div
                    className="w-full max-w-xl px-5 py-10 space-y-8"
                    aria-busy={isLoading}
                >
                    {isLoading && (
                        <p className="text-center text-lg text-muted" role="status">
                            Carregando alas…
                        </p>
                    )}

                    {error && (
                        <p className="text-center text-lg text-accent">
                            Não foi possível carregar as alas.
                        </p>
                    )}

                    {alas && (
                        <div className="flex animate-aparecer flex-col">
                            {lembrada && (
                                <button
                                    type="button"
                                    disabled={!!loadingSlug}
                                    aria-busy={loadingSlug === lembrada.slug}
                                    onClick={() => abrir(lembrada.slug)}
                                    className="relative flex w-full items-center justify-between gap-4 overflow-hidden rounded-2xl bg-secondary px-6 py-5 text-left text-white shadow-md transition duration-100 hover:opacity-90 hover:shadow-xl enabled:active:scale-[0.98] cursor-pointer disabled:cursor-default"
                                >
                                    <span aria-hidden="true" className="absolute inset-y-0 left-0 w-1.5 bg-linear-to-b from-accent via-gold to-accent" />
                                    <span className="flex min-w-0 flex-col">
                                        <span className="text-base text-white/85">Continuar na sua ala</span>
                                        <span className="hyphens-auto wrap-break-word text-xl font-semibold">{lembrada.nome}</span>
                                    </span>
                                    {loadingSlug === lembrada.slug ? (
                                        <span className="flex shrink-0 items-center gap-2 text-base">
                                            Abrindo…
                                            <Spinner />
                                        </span>
                                    ) : (
                                        <span aria-hidden className="text-2xl leading-none">
                                            ›
                                        </span>
                                    )}
                                </button>
                            )}

                            <div className={lembrada ? 'mt-12 sm:mt-14' : ''}>
                                <RequestWard />
                            </div>

                            {lista.length > 0 && (
                                <div className="mt-12 border-t border-primary/10 pt-12 sm:mt-16 sm:pt-14">
                                    <section aria-labelledby="buscar-titulo" className="flex flex-col gap-5 rounded-2xl bg-background p-5 shadow-md ring-1 ring-primary/10 sm:p-6">
                                        <div>
                                            <h2 id="buscar-titulo" className="text-xl font-semibold text-text">
                                                {lembrada ? 'Procure outra ala' : 'Procure a sua ala'}
                                            </h2>
                                            <p className="mt-2 text-base text-muted">Escolha o estado e depois a cidade.</p>
                                        </div>
                                        <WardFilter
                                            alas={lista.map(ala => ({ ...ala, chave: ala.slug }))}
                                            instrucao="Toque na sua ala para abrir o calendário."
                                            ocupada={loadingSlug}
                                            onEscolher={ala => abrir(ala.chave)}
                                        />
                                    </section>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </main>
        </>
    )
}
