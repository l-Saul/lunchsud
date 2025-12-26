'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'

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
    <main className="min-h-screen bg-white px-4 py-8 flex justify-center">
      <div className="w-full max-w-3xl space-y-8">

        <div className="text-center space-y-2">
          <h1 className="text-2xl font-bold">
            Agendamento de Almoço
          </h1>
          <p className="text-gray-700 text-lg">
            Selecione sua ala
          </p>
        </div>

        <div className="grid gap-4">
          {alas.map(ala => (
            <Link
              key={ala.slug}
              href={`/${ala.slug}`}
              className="block rounded-xl border p-6 text-lg font-medium hover:bg-gray-50 transition"
            >
              {ala.nome}
            </Link>
          ))}

          {alas.length === 0 && (
            <p className="text-center text-gray-500">
              Nenhuma ala disponível.
            </p>
          )}
        </div>

      </div>
    </main>
  )
}
