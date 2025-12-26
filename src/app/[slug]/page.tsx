'use client'

import { useEffect, useState } from 'react'
import { Calendar } from '@/components/Calendar'

type Props = {
  params: Promise<{ slug: string }>
}

export default function Page({ params }: Props) {
  const [slug, setSlug] = useState('')
  const [ocupados, setOcupados] = useState<string[]>([])
  const [diaSelecionado, setDiaSelecionado] = useState<number | null>(null)
  const [nome, setNome] = useState('')
  const [telefone, setTelefone] = useState('')
  const [mensagem, setMensagem] = useState('')

  const hoje = new Date()
  const ano = hoje.getFullYear()
  const mes = hoje.getMonth()
  const diasNoMes = new Date(ano, mes + 1, 0).getDate()

  useEffect(() => {
    params.then(p => setSlug(p.slug))
  }, [params])

  function carregar() {
    fetch(`/api/agendamentos/${slug}`)
      .then(r => r.json())
      .then(d => setOcupados(d.map((i: any) => i.data)))
  }

  useEffect(() => {
    if (slug) carregar()
  }, [slug])

  function ocupado(dia: number) {
    const d = new Date(ano, mes, dia).toISOString().split('T')[0]
    return ocupados.includes(d)
  }

  async function agendar() {
    if (!diaSelecionado) return

    const data = new Date(ano, mes, diaSelecionado)
      .toISOString()
      .split('T')[0]

    const res = await fetch('/api/agendar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ slug, data, nome, telefone })
    })

    const j = await res.json()

    if (!res.ok) {
      setMensagem(j.error)
      return
    }

    setMensagem('Agendamento realizado com sucesso.')
    setNome('')
    setTelefone('')
    setDiaSelecionado(null)
    carregar()
  }

  if (!slug) return null

  return (
    <main className="min-h-screen bg-white px-4 py-8 flex justify-center">
      <div className="w-full max-w-xl space-y-8">

        {/* TÍTULO */}
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-bold">
            Agendar almoço para os missionários
          </h1>
          <p className="text-gray-700 text-lg">
            Escolha um dia disponível abaixo
          </p>
        </div>

        {/* CALENDÁRIO */}
        <Calendar
        ocupados={ocupados}
        onSelectDay={setDiaSelecionado}
        />

        {/* FORMULÁRIO */}
        {diaSelecionado && (
          <div className="space-y-4 border-t pt-6">
            <h2 className="text-xl font-semibold">
              Agendar para o dia {diaSelecionado}
            </h2>

            <input
              className="w-full border rounded-lg p-3 text-lg"
              placeholder="Seu nome"
              value={nome}
              onChange={e => setNome(e.target.value)}
            />

            <input
              className="w-full border rounded-lg p-3 text-lg"
              placeholder="Telefone"
              value={telefone}
              onChange={e => setTelefone(e.target.value)}
            />

            <button
              onClick={agendar}
              className="w-full bg-green-600 text-white text-lg py-4 rounded-lg hover:bg-green-700"
            >
              Confirmar agendamento
            </button>
          </div>
        )}

        {/* MENSAGEM */}
        {mensagem && (
          <p className="text-center text-lg font-medium text-green-700">
            {mensagem}
          </p>
        )}
      </div>
    </main>
  )
}
