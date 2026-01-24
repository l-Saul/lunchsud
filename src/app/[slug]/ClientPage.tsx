'use client'

import { useEffect, useState } from 'react'
import { Calendar } from '@/components/Calendar'

type DiaOcupado = {
    data: string
    nome: string
    }

    type Props = {
    slug: string
    ocupados: DiaOcupado[]
    }

    function formatarTelefone(valor: string) {
    const digits = valor.replace(/\D/g, '').slice(0, 11)

    if (digits.length <= 2) return digits
    if (digits.length <= 7) return `${digits.slice(0, 2)} ${digits.slice(2)}`
    return `${digits.slice(0, 2)} ${digits.slice(2, 7)} ${digits.slice(7)}`
    }

    function formatarNomeAla(slug: string) {
    return decodeURIComponent(slug)
        .replace(/-/g, ' ')
        .replace(/\b\w/g, l => l.toUpperCase())
    }

    function ocultarSobrenome(nome: string) {
    const partes = nome.trim().split(/\s+/)
    if (partes.length === 1) return partes[0]
    return `${partes[0]} ${partes[1][0]}.`
    }

    export default function ClientPage({ slug, ocupados }: Props) {
    const [diaSelecionado, setDiaSelecionado] = useState<number | null>(null)
    const [nome, setNome] = useState('')
    const [telefone, setTelefone] = useState('')
    const [mensagem, setMensagem] = useState('')
    const [diasOcupados, setDiasOcupados] = useState<DiaOcupado[]>(ocupados)
    const [ocupadoPor, setOcupadoPor] = useState<string | null>(null)

    // 🔒 imagem controlada
    const [imagemSrc, setImagemSrc] = useState<string | null>(null)

    const hoje = new Date()
    const ano = hoje.getFullYear()
    const mes = hoje.getMonth()

    const nomeAla = formatarNomeAla(slug)

    // ✅ PRÉ-CARREGA IMAGEM COM SEGURANÇA
    useEffect(() => {
        const img = new Image()
        img.src = `/alas/${slug}.jpg`

        img.onload = () => {
        setImagemSrc(`/alas/${slug}.jpg`)
        }

        img.onerror = () => {
        setImagemSrc('/alas/padrao.jpg')
        }
    }, [slug])

    async function agendar() {
        if (!slug || !diaSelecionado) return

        if (telefone.replace(/\D/g, '').length !== 11) {
        setMensagem('Informe um telefone celular válido.')
        return
        }

        const mm = String(mes + 1).padStart(2, '0')
        const dd = String(diaSelecionado).padStart(2, '0')
        const data = `${ano}-${mm}-${dd}`

        const res = await fetch('/api/agendar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug, data, nome, telefone })
        })

        if (!res.ok) {
        setMensagem('Este dia acabou de ser ocupado. Escolha outro.')
        setDiaSelecionado(null)
        return
        }

        setDiasOcupados(prev => [...prev, { data, nome }])

        setMensagem('Agendamento realizado com sucesso.')
        setNome('')
        setTelefone('')
        setDiaSelecionado(null)
        setOcupadoPor(null)
    }

    return (
        <main className="min-h-screen bg-white px-4 py-8 flex justify-center">
        <div className="w-full max-w-xl space-y-8">

            <div className="text-center space-y-3">
            <h1 className="text-4xl font-extrabold text-gray-900">
                Ala {nomeAla}
            </h1>

            <h2 className="text-2xl font-semibold text-gray-700">
                Agendar almoço para os missionários
            </h2>

            {imagemSrc && (
                <img
                src={imagemSrc}
                alt={`Missionários da ala ${nomeAla}`}
                className="mx-auto mt-4 rounded-lg max-h-64 object-cover"
                />
            )}

            <p className="text-gray-700 text-lg">
                Escolha um dia disponível abaixo
            </p>
            </div>

            <Calendar
            ocupados={diasOcupados}
            selectedDay={diaSelecionado}
            onSelectDay={day => {
                setDiaSelecionado(day)
                setOcupadoPor(null)
            }}
            onSelectOcupado={nome => {
                setOcupadoPor(nome)
                setDiaSelecionado(null)
            }}
            />

            {ocupadoPor && (
            <p className="text-center text-lg font-medium text-gray-600">
                Este dia já foi agendado por{' '}
                <strong>{ocultarSobrenome(ocupadoPor)}</strong>.
            </p>
            )}

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
                placeholder="41 99999 9999"
                inputMode="numeric"
                value={telefone}
                onChange={e => setTelefone(formatarTelefone(e.target.value))}
                />

                <button
                onClick={agendar}
                className="w-full bg-green-600 text-white text-lg py-4 rounded-lg hover:bg-green-700"
                >
                Confirmar agendamento
                </button>
            </div>
            )}

            {mensagem && (
            <p className="text-center text-lg font-medium text-green-700">
                {mensagem}
            </p>
            )}
        </div>
        </main>
    )
}
