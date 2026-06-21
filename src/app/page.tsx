'use client'

// Home: lista as alas (via SWR em /api/alas) como botões que levam ao agendamento.

import Image from 'next/image'
import useSWR from 'swr'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion, type Variants} from 'framer-motion'
import { Flor } from '@/components/Flor'
import { escrituraAleatoria } from '@/lib/escrituras'

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

const containerVariants: Variants = {
    hidden: {},
    visible: {
        transition: {
            staggerChildren: 0.06,
        },
    },
}

const itemVariants: Variants = {
    hidden: { opacity: 0, y: 8 },
    visible: {
        opacity: 1,
        y: 0,
        transition: {
            duration: 0.25,
            ease: 'easeOut',
        },
    },
}

export default function IndexPage() {
    const { data: alas, error, isLoading } = useSWR<Ala[]>('/api/alas', fetcher)
    const [loadingSlug, setLoadingSlug] = useState<string | null>(null)
    const router = useRouter()

    // Escritura sorteada a cada refresh. A home é estática (prerender no build),
    // então o sorteio precisa rodar no client, na montagem — só assim varia a cada
    // carregamento sem dar mismatch de hidratação. É uma inicialização única e
    // intencional, daí a exceção pontual à regra set-state-in-effect.
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
                    {/* Logo flutuando de leve (respeita prefers-reduced-motion via MotionConfig). */}
                    <motion.div
                        animate={{ y: [0, -8, 0] }}
                        transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
                    >
                        <Image
                            src="/lds.jpg"
                            alt="Igreja de Jesus Cristo dos Santos dos Últimos Dias"
                            width={180}
                            height={180}
                            className="rounded-2xl shadow-xl ring-2 ring-white/15"
                            priority
                        />
                    </motion.div>

                    <header className="flex flex-col items-center space-y-4">
                        <h1 className="text-3xl font-semibold">
                            Almoço dos Missionários
                        </h1>
                        {/* Divisória com florzinha — toque sereno e cohesão com a página da ala */}
                        <div className="flex items-center gap-3" aria-hidden="true">
                            <span className="h-px w-10 bg-linear-to-r from-transparent to-secondary/70" />
                            <Flor size={22} />
                            <span className="h-px w-10 bg-linear-to-l from-transparent to-secondary/70" />
                        </div>
                        <p className="text-lg text-white/80">
                            Toque na sua ala para agendar.
                        </p>

                        {/* Escritura do Livro de Mórmon, sorteada a cada refresh (referência positiva). */}
                        {escritura && (
                            <motion.p
                                key={escritura}
                                initial={{ opacity: 0, y: 6 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.6, ease: 'easeOut' }}
                                className="max-w-sm text-balance text-base italic leading-relaxed text-white/70"
                            >
                                {verso}
                                {referencia && (
                                    <span className="mt-1 block text-sm not-italic text-secondary">
                                        {referencia}
                                    </span>
                                )}
                            </motion.p>
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
                        <motion.div
                            className="grid gap-4"
                            variants={containerVariants}
                            initial="hidden"
                            animate="visible"
                        >
                        {alas.map((ala) => {
                            const isLoading = loadingSlug === ala.slug

                            return (
                                <motion.div
                                    key={ala.slug}
                                    variants={itemVariants}
                                    whileHover={{ y: -3 }}
                                    whileTap={{ scale: 0.97, rotateX: 10 }}
                                    style={{ transformPerspective: 700 }}
                                >
                                    <button
                                        type="button"
                                        disabled={!!loadingSlug}
                                        onClick={() => {
                                            setLoadingSlug(ala.slug)
                                            router.push(`/${ala.slug}`)
                                        }}
                                        className={`group flex w-full items-center justify-between gap-4 rounded-2xl border-l-4 border-secondary px-6 py-5 text-left text-xl font-medium shadow-lg transition cursor-pointer disabled:cursor-default
                                            ${isLoading
                                                ? 'bg-secondary text-white'
                                                : 'bg-white text-primary hover:bg-secondary hover:text-white'}
                                        `}
                                    >
                                        <span>{isLoading ? 'Abrindo…' : ala.nome}</span>
                                        <span aria-hidden className="text-2xl leading-none text-secondary transition group-hover:text-white">
                                            ›
                                        </span>
                                    </button>
                                </motion.div>
                            )
                        })}
                        </motion.div>
                    )}
                </div>
            </div>
        </section>
    )
}
