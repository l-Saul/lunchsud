'use client'

import Link from 'next/link'
import Image from 'next/image'
import useSWR from 'swr'
import { motion, type Variants} from 'framer-motion'

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

    return (
        <section className="min-h-screen flex justify-center bg-primary text-white">
            <div
                className="w-full max-w-3xl px-4 py-12 space-y-8"
                aria-busy={isLoading}
            >
                <div className="flex justify-center">
                    <Image
                        src="/lds.jpg"
                        alt="Igreja de Jesus Cristo dos Santos dos Últimos Dias"
                        width={200}
                        height={200}
                        className="rounded-xl"
                        priority
                    />
                </div>

                <header className="text-center">
                    <h1 className="text-2xl font-semibold">
                        Selecione sua ala para continuar
                    </h1>
                </header>

                <div className="grid gap-4">
                    {isLoading && (
                        <p className="text-center text-white/70" role="status">
                            Carregando alas…
                        </p>
                    )}

                    {error && (
                        <p className="text-center text-red-300">
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
                            {alas.map((ala) => (
                                <motion.div
                                    key={ala.slug}
                                    variants={itemVariants}
                                    whileTap={{ scale: 0.97 }}
                                >
                                    <Link
                                        href={`/${ala.slug}`}
                                        className="block rounded-xl border border-white/20 bg-white/5 p-6 text-lg font-medium transition hover:bg-secondary active:bg-secondary/80"
                                    >
                                        {ala.nome}
                                    </Link>
                                </motion.div>
                            ))}
                        </motion.div>
                    )}
                </div>
            </div>
        </section>
    )
}
