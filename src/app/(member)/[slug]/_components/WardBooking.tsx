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
import { HeaderBand } from '@/components/HeaderBand'
import { NoticeBar, type Aviso } from '@/components/NoticeBar'

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
    const [diasOcupados, setDiasOcupados] = useState<DiaOcupado[]>(ocupados)
    const [aviso, setAviso] = useState<Aviso | null>(null)

    const [anoBase, mesBase] = mesAtual.split('-').map(Number)
    const inicioMesAtual = new Date(anoBase, mesBase - 1, 1)
    const inicioMesSeguinte = new Date(anoBase, mesBase, 1)

    const [baseDate, setBaseDate] = useState(inicioMesAtual)

    const mesSeguinte = `${inicioMesSeguinte.getFullYear()}-${pad(inicioMesSeguinte.getMonth() + 1)}`

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
    }, [])

    const aoAgendar = useCallback((agendado: Agendado) => {
        setDiasOcupados(prev => [...prev.filter(o => o.data !== agendado.data), agendado])
        setNome('')
        setTelefone('')
    }, [])

    const aoConflito = useCallback(() => {
        setAviso({ tipo: 'erro', conteudo: 'Este dia acabou de ser ocupado. Escolha outro dia.' })
        setDiaSelecionado(null)
        atualizarOcupados()
    }, [atualizarOcupados])

    const dataSelecionada = diaSelecionado
        ? `${baseDate.getFullYear()}-${pad(baseDate.getMonth() + 1)}-${pad(diaSelecionado)}`
        : ''

    return (
        <>
            <HeaderBand>
                <span aria-hidden="true" className="pointer-events-none absolute left-4 top-5 opacity-25 sm:left-10">
                    <Flower size={32} />
                </span>
                <span aria-hidden="true" className="pointer-events-none absolute right-5 top-12 opacity-20 sm:right-12">
                    <Flower size={22} />
                </span>

                <div className="relative mx-auto flex max-w-2xl flex-col items-center gap-4 pt-9 pb-7">
                    <h1 className="wrap-anywhere text-3xl font-bold drop-shadow-sm">
                        {nomeAla}
                    </h1>

                    <div className="flex items-center gap-3" aria-hidden="true">
                        <span className="h-px w-10 bg-linear-to-r from-transparent to-gold/70 sm:w-16" />
                        <Flower size={26} />
                        <span className="h-px w-10 bg-linear-to-l from-transparent to-gold/70 sm:w-16" />
                    </div>
                </div>
            </HeaderBand>

            <main className="flex justify-center text-text">
                <div className="w-full max-w-2xl">
                    <div className="px-2 sm:px-6 py-6 space-y-6">
                        <p className="px-2 text-center text-lg leading-relaxed text-text">
                            Toque em um dia livre para agendar o almoço.
                        </p>

                        <div className="relative overflow-hidden bg-background text-secondary rounded-2xl p-1.5 pt-4 sm:p-4 sm:pt-6 shadow-md ring-1 ring-primary/10">
                            <span aria-hidden="true" className="absolute inset-x-0 top-0 h-1.5 bg-linear-to-r from-accent via-gold to-accent" />
                            <MonthCalendar
                                ocupados={diasOcupados}
                                baseDate={baseDate}
                                hoje={hoje}
                                selectedDay={diaSelecionado}
                                meses={[mesAtual, mesSeguinte]}
                                onSelectMonth={ym => {
                                    setBaseDate(ym === mesAtual ? inicioMesAtual : inicioMesSeguinte)
                                    setDiaSelecionado(null)
                                    setAviso(null)
                                }}
                                onSelectDay={day => {
                                    setDiaSelecionado(day)
                                    setAviso(null)
                                }}
                                onSelectOcupado={nome => {
                                    setAviso({ tipo: 'info', conteudo: <>Este dia já foi agendado por <strong>{nome}</strong>.</> })
                                    setDiaSelecionado(null)
                                }}
                                onSelectPday={() => {
                                    setAviso({ tipo: 'info', conteudo: <>Segunda-feira é <strong>P-day</strong>, o dia de descanso dos missionários. Escolha outro dia.</> })
                                    setDiaSelecionado(null)
                                }}
                                onSelectPassado={() => {
                                    setAviso({ tipo: 'info', conteudo: <>Esse dia <strong>já passou</strong>. Escolha outro dia.</> })
                                    setDiaSelecionado(null)
                                }}
                            />
                        </div>

                        {diaSelecionado && (
                            <BookingModal
                                key={dataSelecionada}
                                slug={slug}
                                nomeAla={nomeAla}
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

                    </div>

                    <NoticeBar aviso={aviso} onClose={() => setAviso(null)} />
                </div>
            </main>
        </>
    )
}
