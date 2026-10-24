/**
 * Contexto e regras: leia CLAUDE.md e docs/routes_slug.md antes de alterar.
 * Mudou o comportamento? Atualize o doc na mesma mudança.
 */
'use client'

import { useState } from 'react'
import { isPday, formatMonthLabel } from '@/lib/date'

type DiaOcupado = {
    data: string
    nome: string
}

const SEMANA = [
    ['Dom', 'D'], ['Seg', 'S'], ['Ter', 'T'], ['Qua', 'Q'], ['Qui', 'Q'], ['Sex', 'S'], ['Sáb', 'S'],
] as const

type Props = {
    ocupados: DiaOcupado[]
    baseDate: Date
    hoje: string
    selectedDay: number | null
    onSelectDay: (day: number) => void
    onSelectOcupado: (nome: string) => void
    onSelectPday?: () => void
    onSelectPassado?: () => void
    onNext?: () => void
    onPrev?: () => void
    canNext?: boolean
    canPrev?: boolean
}

export function MonthCalendar({
    ocupados,
    baseDate,
    hoje,
    selectedDay,
    onSelectDay,
    onSelectOcupado,
    onSelectPday,
    onSelectPassado,
    onNext,
    onPrev,
    canNext,
    canPrev
}: Props) {
    const anoNum = baseDate.getFullYear()
    const mesNum = baseDate.getMonth()

    const [trocouDeMes, setTrocouDeMes] = useState(false)

    const primeiroDiaSemana = new Date(anoNum, mesNum, 1).getDay()
    const diasNoMes = new Date(anoNum, mesNum + 1, 0).getDate()

    function dataDoDia(dia: number) {
        const mm = String(mesNum + 1).padStart(2, '0')
        const dd = String(dia).padStart(2, '0')
        return `${anoNum}-${mm}-${dd}`
    }

    function getOcupacao(dia: number) {
        return ocupados.find(o => o.data === dataDoDia(dia))
    }

    const dias = [
        ...Array(primeiroDiaSemana).fill(null),
        ...Array.from({ length: diasNoMes }, (_, i) => i + 1),
    ]

    return (
        <div className="@container space-y-4">
            <div className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-2 @max-[15rem]:grid-cols-2">
                <button
                    onClick={() => {
                        setTrocouDeMes(true)
                        onPrev?.()
                    }}
                    disabled={!canPrev}
                    aria-label="Mês anterior"
                    className="flex flex-col items-center gap-0.5 rounded-xl bg-secondary px-2.5 py-2 text-white shadow-sm transition duration-200 hover:opacity-90 enabled:active:scale-95 disabled:opacity-30 disabled:cursor-default cursor-pointer @max-[15rem]:order-2"
                >
                    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <path d="M15 18l-6-6 6-6" />
                    </svg>
                    <span className="text-xs font-semibold uppercase tracking-wide">Voltar</span>
                </button>

                <h2 className="text-center text-base sm:text-xl font-semibold text-text @max-[15rem]:order-1 @max-[15rem]:col-span-2">
                    {formatMonthLabel(`${anoNum}-${String(mesNum + 1).padStart(2, '0')}`)}
                </h2>

                <button
                    onClick={() => {
                        setTrocouDeMes(true)
                        onNext?.()
                    }}
                    disabled={!canNext}
                    aria-label="Próximo mês"
                    className="flex flex-col items-center gap-0.5 rounded-xl bg-secondary px-2.5 py-2 text-white shadow-sm transition duration-200 hover:opacity-90 enabled:active:scale-95 disabled:opacity-30 disabled:cursor-default cursor-pointer @max-[15rem]:order-3"
                >
                    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <path d="M9 18l6-6-6-6" />
                    </svg>
                    <span className="text-xs font-semibold uppercase tracking-wide">Avançar</span>
                </button>
            </div>

            <div className="grid grid-cols-7 gap-1 sm:gap-2 text-center text-sm font-semibold uppercase tracking-wide text-muted">
                {SEMANA.map(([abrev, inicial]) => (
                    <div key={abrev}>
                        <span className="@max-[15rem]:hidden">{abrev}</span>
                        <span className="hidden @max-[15rem]:inline">{inicial}</span>
                    </div>
                ))}
            </div>

            <div
                key={`${anoNum}-${mesNum}`}
                className={`grid grid-cols-7 gap-1 sm:gap-2 ${trocouDeMes ? 'animate-aparecer' : ''}`}
            >
                {dias.map((dia, index) => {
                    if (!dia) return <div key={`empty-${index}`} />

                    const passado = dataDoDia(dia) < hoje
                    const pday = isPday(dataDoDia(dia))
                    const ocupacao = getOcupacao(dia)
                    const ocupado = Boolean(ocupacao)
                    const selecionado = dia === selectedDay

                    const ativar = () => {
                        if (passado) {
                            onSelectPassado?.()
                        } else if (pday) {
                            onSelectPday?.()
                        } else if (ocupado && ocupacao) {
                            onSelectOcupado(ocupacao.nome)
                        } else {
                            onSelectDay(dia)
                        }
                    }

                    const ariaLabel = passado
                        ? `Dia ${dia}, já passou, indisponível`
                        : pday
                            ? `Dia ${dia}, P-day, indisponível`
                            : ocupado && ocupacao
                                ? `Dia ${dia}, ocupado por ${ocupacao.nome}`
                                : selecionado
                                    ? `Dia ${dia}, selecionado`
                                    : `Dia ${dia}, disponível`

                    return (
                        <div
                            key={`day-${index}`}
                            role="button"
                            tabIndex={0}
                            aria-label={ariaLabel}
                            aria-pressed={selecionado}
                            onClick={ativar}
                            onKeyDown={e => {
                                if (e.key === 'Enter' || e.key === ' ') {
                                    e.preventDefault()
                                    ativar()
                                }
                            }}
                            className={`
                                aspect-square w-full rounded-lg text-base sm:text-lg font-medium
                                flex items-center justify-center
                                cursor-pointer transition duration-100 active:scale-95
                                ${passado
                                    ? 'text-primary/30'
                                    : pday
                                    ? 'bg-primary/5 text-primary/40 border border-primary/10'
                                    : ocupado
                                        ? 'bg-accent text-white'
                                        : selecionado
                                            ? 'bg-secondary text-white shadow-md'
                                            : 'bg-white text-primary border border-slate-200 hover:border-secondary hover:bg-secondary/10 hover:shadow-md'}
                            `}
                        >
                            {pday && !passado ? (
                                <div className="flex flex-col items-center leading-none">
                                    <span className="text-sm">{dia}</span>
                                    <span className="text-[9px] sm:text-[10px] font-semibold uppercase">
                                        P-day
                                    </span>
                                </div>
                            ) : (
                                dia
                            )}
                        </div>
                    )
                })}
            </div>

            <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 pt-1 text-sm text-text">
                <span className="flex items-center gap-2">
                    <span className="h-4 w-4 rounded border border-slate-300 bg-white" />
                    Disponível
                </span>
                <span className="flex items-center gap-2">
                    <span className="h-4 w-4 rounded bg-accent" />
                    Ocupado
                </span>
                <span className="flex items-center gap-2">
                    <span className="h-4 w-4 rounded border border-primary/10 bg-primary/5" />
                    P-day
                </span>
            </div>
        </div>
    )
}
