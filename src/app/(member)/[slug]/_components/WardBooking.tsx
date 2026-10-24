/**
 * Contexto e regras: leia CLAUDE.md e docs/routes_slug.md antes de alterar.
 * Mudou o comportamento? Atualize o doc na mesma mudança.
 */
'use client'

import { useState, useCallback } from 'react'
import { MonthCalendar } from './MonthCalendar'
import { BookingModal, type Agendado } from './BookingModal'
import { useBookingsRealtime, type MudancaAgendamento } from '@/hooks/use-bookings-realtime'
import { Flower } from '@/components/Flower'

type DiaOcupado = {
    id: number
    data: string
    nome: string
}

const pad = (n: number) => String(n).padStart(2, '0')

type Props = {
    slug: string
    alaId: number
    nomeAla: string
    ocupados: DiaOcupado[]
    hoje: string
    mesAtual: string
}

export default function WardBooking({ slug, alaId, nomeAla, ocupados, hoje, mesAtual }: Props) {
    const [diaSelecionado, setDiaSelecionado] = useState<number | null>(null)
    const [nome, setNome] = useState('')
    const [telefone, setTelefone] = useState('')
    const [mensagem, setMensagem] = useState('')
    const [tipoMensagem, setTipoMensagem] = useState<'sucesso' | 'erro' | null>(null)
    const [diasOcupados, setDiasOcupados] = useState<DiaOcupado[]>(ocupados)
    const [ocupadoPor, setOcupadoPor] = useState<string | null>(null)
    const [aviso, setAviso] = useState<'pday' | 'passado' | null>(null)

    const [anoBase, mesBase] = mesAtual.split('-').map(Number)
    const inicioMesAtual = new Date(anoBase, mesBase - 1, 1)
    const inicioMesSeguinte = new Date(anoBase, mesBase, 1)

    const [baseDate, setBaseDate] = useState(inicioMesAtual)

    const canPrev = baseDate.getTime() !== inicioMesAtual.getTime()
    const canNext = baseDate.getTime() !== inicioMesSeguinte.getTime()

    const mesNomeBase = baseDate.toLocaleDateString('pt-BR', { month: 'long' })

    const inicioJanela = hoje
    const aposJanela = new Date(anoBase, mesBase + 1, 1)
    const fimJanela = `${aposJanela.getFullYear()}-${pad(aposJanela.getMonth() + 1)}-01`

    const atualizarOcupados = useCallback(() => {
        fetch(`/api/agendamentos/${slug}`, { cache: 'no-store' })
            .then(res => (res.ok ? res.json() : null))
            .then((dados: DiaOcupado[] | null) => {
                if (dados) setDiasOcupados(dados)
            })
            .catch(() => {})
    }, [slug])

    const aplicarMudanca = useCallback((mudanca: MudancaAgendamento) => {
        if (!mudanca) {
            atualizarOcupados()
            return
        }
        setDiasOcupados(prev => {
            if (mudanca.tipo === 'DELETE') return prev.filter(o => o.id !== mudanca.id)
            const novo = mudanca.agendamento
            const resto = prev.filter(o => o.id !== novo.id && o.data !== novo.data)
            return novo.data >= inicioJanela && novo.data < fimJanela ? [...resto, novo] : resto
        })
    }, [atualizarOcupados, inicioJanela, fimJanela])

    useBookingsRealtime(alaId, aplicarMudanca)

    const fecharModal = useCallback(() => {
        setDiaSelecionado(null)
        setMensagem('')
        setTipoMensagem(null)
    }, [])

    const aoAgendar = useCallback((agendado: Agendado) => {
        setDiasOcupados(prev => [...prev.filter(o => o.data !== agendado.data), agendado])
        setTipoMensagem('sucesso')
        setMensagem('Almoço agendado com sucesso. Muito obrigado!')
        setNome('')
        setTelefone('')
        setDiaSelecionado(null)
        setOcupadoPor(null)
    }, [])

    const aoConflito = useCallback(() => {
        setTipoMensagem('erro')
        setMensagem('Este dia acabou de ser ocupado. Escolha outro.')
        setDiaSelecionado(null)
        atualizarOcupados()
    }, [atualizarOcupados])

    const dataSelecionada = diaSelecionado
        ? `${baseDate.getFullYear()}-${pad(baseDate.getMonth() + 1)}-${pad(diaSelecionado)}`
        : ''

    return (
        <main className="min-h-screen flex justify-center text-text">
            <div className="w-full max-w-2xl">

                <div className="relative overflow-hidden px-3 pt-12 pb-7 text-center sm:px-6">
                    <span aria-hidden="true" className="pointer-events-none absolute left-4 top-6 opacity-25 sm:left-10">
                        <Flower size={32} />
                    </span>
                    <span aria-hidden="true" className="pointer-events-none absolute right-5 top-14 opacity-20 sm:right-12">
                        <Flower size={22} />
                    </span>

                    <div className="relative z-10 flex flex-col items-center gap-4">
                        <h1 className="text-4xl font-bold text-white drop-shadow-sm">
                            {nomeAla}
                        </h1>

                        <div className="flex items-center gap-3" aria-hidden="true">
                            <span className="h-px w-10 bg-linear-to-r from-transparent to-accent/70 sm:w-16" />
                            <Flower size={26} />
                            <span className="h-px w-10 bg-linear-to-l from-transparent to-accent/70 sm:w-16" />
                        </div>

                        <p className="text-xl leading-relaxed text-white/90">
                            Toque em um dia livre para agendar o almoço.
                        </p>
                    </div>
                </div>

                <div className="px-2 sm:px-6 py-6 space-y-6">

                    <div className="relative overflow-hidden bg-background text-secondary rounded-2xl p-1.5 sm:p-4 shadow-xl ring-1 ring-white/40 border border-muted/10">
                        <span aria-hidden="true" className="absolute inset-x-0 top-0 h-1.5 bg-linear-to-r from-secondary via-accent to-secondary" />
                        <MonthCalendar
                            ocupados={diasOcupados}
                            baseDate={baseDate}
                            hoje={hoje}
                            selectedDay={diaSelecionado}
                            canPrev={canPrev}
                            canNext={canNext}
                            onPrev={() => {
                                setBaseDate(inicioMesAtual)
                                setDiaSelecionado(null)
                                setOcupadoPor(null)
                                setAviso(null)
                            }}
                            onNext={() => {
                                setBaseDate(inicioMesSeguinte)
                                setDiaSelecionado(null)
                                setOcupadoPor(null)
                                setAviso(null)
                            }}
                            onSelectDay={day => {
                                setDiaSelecionado(day)
                                setOcupadoPor(null)
                                setAviso(null)
                            }}
                            onSelectOcupado={nome => {
                                setOcupadoPor(nome)
                                setDiaSelecionado(null)
                                setAviso(null)
                            }}
                            onSelectPday={() => {
                                setAviso('pday')
                                setDiaSelecionado(null)
                                setOcupadoPor(null)
                            }}
                            onSelectPassado={() => {
                                setAviso('passado')
                                setDiaSelecionado(null)
                                setOcupadoPor(null)
                            }}
                        />
                    </div>

                    {ocupadoPor && (
                        <p key={ocupadoPor} className="animate-aparecer wrap-anywhere text-center text-lg font-medium text-white">
                            Este dia já foi agendado por <strong>{ocupadoPor}</strong>.
                        </p>
                    )}

                    {aviso === 'pday' && (
                        <p className="animate-aparecer text-center text-lg font-medium text-white">
                            Segunda-feira é dia de <strong>P-day</strong>. Escolha outro dia.
                        </p>
                    )}

                    {aviso === 'passado' && (
                        <p className="animate-aparecer text-center text-lg font-medium text-white">
                            Esse dia <strong>já passou</strong>. Escolha outro dia.
                        </p>
                    )}

                    {diaSelecionado && (
                        <BookingModal
                            key={dataSelecionada}
                            slug={slug}
                            dia={diaSelecionado}
                            nomeMes={mesNomeBase}
                            data={dataSelecionada}
                            nome={nome}
                            telefone={telefone}
                            onNomeChange={setNome}
                            onTelefoneChange={setTelefone}
                            onClose={fecharModal}
                            onBooked={aoAgendar}
                            onConflict={aoConflito}
                        />
                    )}

                    {mensagem && !diaSelecionado && (
                        <p
                            key={mensagem}
                            role="status"
                            aria-live="polite"
                            className={`animate-aparecer text-center text-lg font-medium ${
                                tipoMensagem === 'erro' ? 'text-accent' : 'text-secondary'
                            }`}
                        >
                            {mensagem}
                        </p>
                    )}

                </div>
            </div>
        </main>
    )
}
