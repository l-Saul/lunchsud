/**
 * Contexto e regras: leia CLAUDE.md e docs/routes_home.md antes de alterar.
 * Mudou o comportamento? Atualize o doc na mesma mudança.
 */
'use client'

import Image from 'next/image'
import useSWR from 'swr'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Flower } from '@/components/Flower'
import { HeaderBand } from '@/components/HeaderBand'
import { Spinner } from '@/components/Spinner'
import { escrituraAleatoria } from '@/lib/scriptures'

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

export default function IndexPage() {
    const { data: alas, error, isLoading } = useSWR<Ala[]>('/api/alas', fetcher)
    const [loadingSlug, setLoadingSlug] = useState<string | null>(null)
    const router = useRouter()

    const [escritura, setEscritura] = useState<string | null>(null)
    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setEscritura(escrituraAleatoria())
    }, [])
    const [verso, referencia] = (escritura ?? '').split(' — ')

    return (
        <>
            <HeaderBand>
                <div className="flex flex-col items-center gap-5 pt-10 pb-8">
                    <Image
                        src="/lds.jpg"
                        alt="Igreja de Jesus Cristo dos Santos dos Últimos Dias"
                        width={160}
                        height={160}
                        className="rounded-2xl shadow-xl ring-2 ring-white/15"
                        priority
                    />
                    <h1 className="hyphens-auto wrap-break-word text-3xl font-semibold">
                        Almoço dos Missionários
                    </h1>
                    <div className="flex items-center gap-3" aria-hidden="true">
                        <span className="h-px w-10 bg-linear-to-r from-transparent to-gold/70" />
                        <Flower size={22} />
                        <span className="h-px w-10 bg-linear-to-l from-transparent to-gold/70" />
                    </div>
                </div>
            </HeaderBand>

            <main className="flex justify-center">
                <div
                    className="w-full max-w-xl px-5 py-10 space-y-8"
                    aria-busy={isLoading}
                >
                    <div className="flex flex-col items-center gap-5 text-center">
                        <p className="text-xl text-text">
                            Toque na sua ala para agendar.
                        </p>

                        {escritura && (
                            <p className="max-w-sm animate-aparecer text-balance text-base leading-relaxed text-text">
                                {verso}
                                {referencia && (
                                    <span className="mt-1 block text-sm text-secondary">
                                        {referencia}
                                    </span>
                                )}
                            </p>
                        )}
                    </div>

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
                            {alas.map((ala) => {
                                const isLoading = loadingSlug === ala.slug

                                return (
                                    <button
                                        key={ala.slug}
                                        type="button"
                                        disabled={!!loadingSlug}
                                        aria-busy={isLoading}
                                        onClick={() => {
                                            setLoadingSlug(ala.slug)
                                            router.push(`/${ala.slug}`)
                                        }}
                                        className={`group flex w-full items-center justify-between gap-4 rounded-2xl border-l-4 border-secondary px-6 py-5 text-left text-xl font-medium shadow-md ring-1 ring-primary/10 transition duration-100 enabled:active:scale-[0.98] cursor-pointer disabled:cursor-default
                                            ${isLoading
                                                ? 'bg-secondary text-white'
                                                : 'bg-white text-primary hover:bg-secondary hover:text-white hover:shadow-xl'}
                                        `}
                                    >
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
