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
import { alaLembrada } from '@/lib/last-ward'

type Ala = {
    nome: string
    slug: string
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

    const lembrada = alas?.find(ala => ala.slug === slugLembrado)
    const outras = alas?.filter(ala => ala !== lembrada) ?? []

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
                    <p className="text-center text-lg text-text">
                        Toque na sua ala para agendar.
                    </p>

                    <div className="grid gap-4">
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
                            <div className="grid animate-aparecer gap-4">
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

                                {lembrada && outras.length > 0 && (
                                    <p className="mt-4 text-center text-lg text-text">
                                        Ou toque em outra ala:
                                    </p>
                                )}

                                {outras.map((ala) => {
                                    const isLoading = loadingSlug === ala.slug

                                    return (
                                        <button
                                            key={ala.slug}
                                            type="button"
                                            disabled={!!loadingSlug}
                                            aria-busy={isLoading}
                                            onClick={() => abrir(ala.slug)}
                                            className={`group relative flex w-full items-center justify-between gap-4 overflow-hidden rounded-2xl px-6 py-5 text-left text-xl font-medium shadow-md ring-1 ring-primary/10 transition duration-100 enabled:active:scale-[0.98] cursor-pointer disabled:cursor-default
                                                ${isLoading
                                                    ? 'bg-secondary text-white'
                                                    : 'bg-white text-primary hover:bg-secondary hover:text-white hover:shadow-xl'}
                                            `}
                                        >
                                            <span aria-hidden="true" className="absolute inset-y-0 left-0 w-1.5 bg-linear-to-b from-accent via-gold to-accent" />
                                            <span className="min-w-0 hyphens-auto wrap-break-word">{ala.nome}</span>
                                            {isLoading ? (
                                                <span className="flex shrink-0 items-center gap-2 text-base">
                                                    Abrindo…
                                                    <Spinner />
                                                </span>
                                            ) : (
                                                <span aria-hidden className="text-2xl leading-none text-secondary transition group-hover:text-white">
                                                    ›
                                                </span>
                                            )}
                                        </button>
                                    )
                                })}
                            </div>
                        )}
                    </div>
                </div>
            </main>
        </>
    )
}
