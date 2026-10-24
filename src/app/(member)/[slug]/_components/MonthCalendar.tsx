/**
 * Contexto e regras: leia CLAUDE.md e docs/routes_slug.md antes de alterar.
 * Mudou o comportamento? Atualize o doc na mesma mudança.
 */
'use client'

import { useState } from 'react'
import { isPday, formatMonthLabel, nomeDoMes } from '@/lib/date'

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
    meses: string[]
    onSelectMonth: (ym: string) => void
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
    meses,
    onSelectMonth,
}: Props) {
    const anoNum = baseDate.getFullYear()
    const mesNum = baseDate.getMonth()
    const mesAtivo = `${anoNum}-${String(mesNum + 1).padStart(2, '0')}`

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
            <h2 className="sr-only">{formatMonthLabel(mesAtivo)}</h2>

            <div role="group" aria-label="Mês do calendário" className="grid grid-cols-2 gap-2 @max-[15rem]:grid-cols-1">
                {meses.map(ym => {
                    const ativo = ym === mesAtivo
                    return (
                        <button
                            key={ym}
                            type="button"
                            aria-pressed={ativo}
                            onClick={() => {
                                if (ativo) return
                                setTrocouDeMes(true)
                                onSelectMonth(ym)
                            }}
                            className={`flex min-h-13 items-center justify-center gap-2 rounded-xl border-2 border-secondary px-3 py-2 text-lg font-semibold transition duration-100 active:scale-[0.98] ${
                                ativo
                                    ? 'bg-secondary text-white shadow-md cursor-default'
                                    : 'bg-white text-secondary hover:bg-secondary/10 cursor-pointer'
                            }`}
                        >
                            {ativo && (
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="shrink-0">
                                    <path d="M20 6 9 17l-5-5" />
                                </svg>
                            )}
                            {nomeDoMes(ym)}
                        </button>
                    )
                })}
            </div>

            <div className="grid grid-cols-7 gap-1 sm:gap-2 text-center text-base font-semibold text-muted">
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
                                aspect-square w-full rounded-lg text-lg font-medium
                                flex items-center justify-center
                                cursor-pointer transition duration-100 active:scale-95
                                ${passado
                                    ? 'text-faded'
                                    : pday
                                    ? 'bg-pday text-muted border border-slate-300'
                                    : ocupado
                                        ? 'bg-accent text-white'
                                        : selecionado
                                            ? 'bg-secondary text-white shadow-md'
                                            : 'bg-white text-primary border border-slate-200 hover:border-secondary hover:bg-secondary/10 hover:shadow-md'}
                            `}
                        >
                            {dia}
                        </div>
                    )
                })}
            </div>

            <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 pt-1 text-base text-text">
                <span className="flex items-center gap-2">
                    <span className="h-5 w-5 rounded border border-slate-300 bg-white" />
                    Disponível
                </span>
                <span className="flex items-center gap-2">
                    <span className="h-5 w-5 rounded bg-accent" />
                    Ocupado
                </span>
                <span className="flex items-center gap-2">
                    <span className="h-5 w-5 rounded border border-slate-300 bg-pday" />
                    P-day
                </span>
            </div>
        </div>
    )
}
