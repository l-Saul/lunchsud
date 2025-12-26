<<<<<<< HEAD
import Link from 'next/link'

type Ala = {
  nome: string
  slug: string
}

async function getAlas(): Promise<Ala[]> {
  const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/alas`, {
    cache: 'no-store'
  })

  if (!res.ok) return []
  return res.json()
}

export default async function Home() {
  const alas = await getAlas()

  return (
    <main className="min-h-screen bg-white px-4 py-8 flex justify-center">
      <div className="w-full max-w-xl space-y-8">

        <div className="text-center space-y-2">
          <h1 className="text-2xl font-bold">
            Almoço dos Missionários
          </h1>
          <p className="text-lg text-gray-700">
            Selecione sua ala
          </p>
        </div>

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

        {alas.length === 0 && (
          <p className="text-center text-gray-600">
            Nenhuma ala disponível no momento.
          </p>
        )}
      </div>
=======
export default function Home() {
  return (
    <main>
      <h1>Almoço dos Missionários</h1>
      <p>
        Utilize o link fornecido pela sua ala para realizar o agendamento.
      </p>
>>>>>>> parent of a3c82d2 (1.010)
    </main>
  )
}
