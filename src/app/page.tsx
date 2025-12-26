'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

type Ala = {
  nome: string
  slug: string
}

export default function Home() {
  const [alas, setAlas] = useState<Ala[]>([])
  const [erro, setErro] = useState('')

  useEffect(() => {
    fetch('/api/alas')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setAlas(data)
        } else {
          setErro('Não foi possível carregar as alas')
        }
      })
      .catch(() => setErro('Erro ao carregar alas'))
  }, [])

  return (
    <main className="min-h-screen bg-white px-4 py-8 flex justify-center">
      <div className="w-full max-w-xl space-y-8">

        {/* TÍTULO */}
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-bold">
            Almoço dos Missionários
          </h1>
          <p className="text-lg text-gray-700">
            Selecione sua ala
          </p>
        </div>

        {/* LISTA DE ALAS */}
        {erro && (
          <p className="text-center text-red-600">{erro}</p>
        )}

        <div className="space-y-4">
          {alas.map(ala => (
            <Link
              key={ala.slug}
              href={`/${ala.slug}`}
              className="block w-full text-center bg-blue-100 text-blue-900
                         text-lg font-medium py-4 rounded-lg
                         hover:bg-blue-200"
            >
              {ala.nome}
            </Link>
          ))}
        </div>

        {/* CASO NÃO TENHA ALAS */}
        {alas.length === 0 && !erro && (
          <p className="text-center text-gray-600">
            Nenhuma ala disponível no momento.
          </p>
        )}
      </div>
    </main>
  )
}
