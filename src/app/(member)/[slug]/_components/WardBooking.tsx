/**
 * Contexto e regras: leia CLAUDE.md e docs/routes_slug.md antes de alterar.
 * Mudou o comportamento? Atualize o doc na mesma mudança.
 */
'use client'

import { useState, useCallback, useEffect } from 'react'
import Link from 'next/link'
import { MonthCalendar } from './MonthCalendar'
import { BookingModal, type Agendado } from './BookingModal'
import { useBookingsRealtime, type MudancaAgendamento } from '@/hooks/use-bookings-realtime'
import { HeaderBand } from '@/components/HeaderBand'
import { NoticeBar, type Aviso } from '@/components/NoticeBar'
import { botao } from '@/components/button-classes'
import { lembrarAla } from '@/lib/last-ward'

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

    useEffect(() => lembrarAla(slug), [slug])

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
            <HeaderBand title={nomeAla} />

            <main className="flex justify-center text-text">
                <div className="w-full max-w-2xl">
                    <div className="px-2 sm:px-6 py-6 space-y-6">
                        <h2 className="px-2 text-center text-xl font-semibold text-balance text-text">
                            Toque em um dia livre para agendar o almoço.
                        </h2>

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

                        <figure className="mx-auto max-w-md px-4 pt-2 text-center">
                            <span aria-hidden="true" className="block h-8 font-serif text-6xl leading-none text-accent/70">“</span>
                            <blockquote className="font-serif text-xl font-semibold text-primary">
                                <p>A caridade nunca falha</p>
                            </blockquote>
                            <figcaption className="mt-1 text-base text-muted">Lema da Sociedade de Socorro</figcaption>
                        </figure>

                        <div className="mt-12 border-t border-primary/10 pt-12 sm:mt-16 sm:pt-14">
                            <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-3 rounded-2xl bg-background px-4 py-4 ring-1 ring-primary/10 sm:px-5">
                                <div className="min-w-0 grow basis-56">
                                    <h2 className="text-xl font-semibold text-text">Faz parte da presidência?</h2>
                                    <p className="mt-1 text-base text-muted">
                                        Entre no painel da ala para ver quem agendou e organizar os almoços.
                                    </p>
                                </div>
                                <Link
                                    href="/admin"
                                    className={`${botao('primario', 'normal')} shrink-0`}
                                >
                                    Entrar
                                </Link>
                            </div>
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
