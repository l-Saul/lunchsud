'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import Image from 'next/image'

type Ala = {
    nome: string
    slug: string
}

export default function IndexPage() {
    const [alas, setAlas] = useState<Ala[]>([])

    useEffect(() => {
        fetch('/api/alas')
        .then(r => r.json())
        .then(setAlas)
    }, [])

    return (
        <main className="min-h-screen px-4 py-8 flex justify-center text-(--letter)" style={{ background: 'var(--home-background)' }}>
            <div className="w-full max-w-3xl space-y-8">
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

                <div className="text-center space-y-2">
                    <h1 className="text-2xl font-bold">
                        Por gentileza, selecione sua ala para continuar.
                    </h1>
                </div>

                <div className="grid gap-4">
                {alas.map(ala => (
                    <Link key={ala.slug} href={`/${ala.slug}`} className="block rounded-xl border p-6 text-lg font-medium transition hover:bg-(--hover-selector) hover:text-(--hover-letter)">
                        {ala.nome}
                    </Link>
                ))}
                {alas.length === 0 && (
                    <p className="text-center text-gray-500">
                        Atualizando...
                    </p>
                )}
                </div>

                <div>
                    <p className="text-center text-sm opacity-70">
                        Este site não possui vínculo institucional com a Igreja.
                    </p>
                </div>
            </div>
        </main>
    )
}
