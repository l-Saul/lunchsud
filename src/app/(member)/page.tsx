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
        <section className="min-h-screen flex justify-center text-white">
            <div
                className="w-full max-w-xl px-5 py-12 space-y-10"
                aria-busy={isLoading}
            >
                <div className="flex flex-col items-center gap-6 text-center">
                    <Image
                        src="/lds.jpg"
                        alt="Igreja de Jesus Cristo dos Santos dos Últimos Dias"
                        width={180}
                        height={180}
                        className="rounded-2xl shadow-xl ring-2 ring-white/15"
                        priority
                    />

                    <header className="flex flex-col items-center space-y-4">
                        <h1 className="text-3xl font-semibold">
                            Almoço dos Missionários
                        </h1>
                        <div className="flex items-center gap-3" aria-hidden="true">
                            <span className="h-px w-10 bg-linear-to-r from-transparent to-gold/70" />
                            <Flower size={22} />
                            <span className="h-px w-10 bg-linear-to-l from-transparent to-gold/70" />
                        </div>
                        <p className="text-lg text-white/80">
                            Toque na sua ala para agendar.
                        </p>

                        {escritura && (
                            <p className="max-w-sm animate-aparecer text-balance text-base italic leading-relaxed text-white/70">
                                {verso}
                                {referencia && (
                                    <span className="mt-1 block text-sm not-italic text-gold">
                                        {referencia}
                                    </span>
                                )}
                            </p>
                        )}
                    </header>
                </div>

                <div className="grid gap-4">
                    {isLoading && (
                        <p className="text-center text-lg text-white/70" role="status">
                            Carregando alas…
                        </p>
                    )}

                    {error && (
                        <p className="text-center text-lg text-red-300">
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
                                    className={`group flex w-full items-center justify-between gap-4 rounded-2xl border-l-4 border-secondary px-6 py-5 text-left text-xl font-medium shadow-lg transition duration-100 enabled:active:scale-[0.98] cursor-pointer disabled:cursor-default
                                        ${isLoading
                                            ? 'bg-secondary text-white'
                                            : 'bg-white text-primary hover:bg-secondary hover:text-white hover:shadow-xl'}
                                    `}
                                >
                                    <span className="min-w-0">{ala.nome}</span>
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
        </section>
    )
}
