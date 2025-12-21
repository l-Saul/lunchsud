'use client'

import { useEffect, useState } from 'react'

type Props = {
  params: Promise<{
    slug: string
  }>
}

export default function AlaPage({ params }: Props) {
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

  function carregarAgendamentos(s: string) {
    fetch(`/api/agendamentos/${s}`)
      .then(res => res.json())
      .then(data => {
        const datas = data.map((item: { data: string }) => item.data)
        setOcupados(datas)
      })
  }

  useEffect(() => {
    if (slug) {
      carregarAgendamentos(slug)
    }
  }, [slug])

  function estaOcupado(dia: number) {
    const data = new Date(ano, mes, dia).toISOString().split('T')[0]
    return ocupados.includes(data)
  }

  async function enviarAgendamento() {
    if (!diaSelecionado) return

    const data = new Date(ano, mes, diaSelecionado)
      .toISOString()
      .split('T')[0]

    const res = await fetch('/api/agendar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        slug,
        data,
        nome,
        telefone
      })
    })

    const json = await res.json()

    if (!res.ok) {
      setMensagem(json.error || 'Erro')
      return
    }

    setMensagem('Agendamento realizado com sucesso')
    setNome('')
    setTelefone('')
    setDiaSelecionado(null)
    carregarAgendamentos(slug)
  }

  if (!slug) return <p>Carregando…</p>

  return (
    <main>
      <h1>Ala {slug}</h1>
      <h2>
        {hoje.toLocaleString('pt-BR', { month: 'long' })} / {ano}
      </h2>

      <ul>
        {Array.from({ length: diasNoMes }, (_, i) => {
          const dia = i + 1
          const ocupado = estaOcupado(dia)

          return (
            <li key={dia}>
              <button
                disabled={ocupado}
                onClick={() => setDiaSelecionado(dia)}
              >
                Dia {dia} {ocupado ? '(ocupado)' : '(livre)'}
              </button>
            </li>
          )
        })}
      </ul>

      {diaSelecionado && (
        <div>
          <h3>Agendar dia {diaSelecionado}</h3>

          <input
            placeholder="Nome"
            value={nome}
            onChange={e => setNome(e.target.value)}
          />

          <input
            placeholder="Telefone"
            value={telefone}
            onChange={e => setTelefone(e.target.value)}
          />

          <button onClick={enviarAgendamento}>Confirmar</button>
        </div>
      )}

      {mensagem && <p>{mensagem}</p>}
    </main>
  )
}
