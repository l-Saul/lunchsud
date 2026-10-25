/**
 * Contexto e regras: leia CLAUDE.md e docs/routes_slug.md antes de alterar.
 * Mudou o comportamento? Atualize o doc na mesma mudança.
 */
'use client'

import { useState } from 'react'
import { isPday, formatMonthLabel, rotuloDoDia } from '@/lib/date'
import { MonthTabs } from '@/components/MonthTabs'
import { Flower } from '@/components/Flower'

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

            <MonthTabs
                meses={meses}
                ativo={mesAtivo}
                label="Mês do calendário"
                onChange={ym => {
                    setTrocouDeMes(true)
                    onSelectMonth(ym)
                }}
            />

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

                    const rotulo = rotuloDoDia(dataDoDia(dia))
                    const ariaLabel = passado
                        ? `${rotulo}, já passou`
                        : pday
                            ? `${rotulo}, P-day`
                            : ocupado && ocupacao
                                ? `${rotulo}, ocupado por ${ocupacao.nome}`
                                : selecionado
                                    ? `${rotulo}, escolhido`
                                    : `${rotulo}, livre`

                    return (
                        <button
                            key={`day-${index}`}
                            type="button"
                            aria-label={ariaLabel}
                            onClick={ativar}
                            className={`
                                relative aspect-square w-full rounded-lg text-lg
                                flex items-center justify-center
                                cursor-pointer transition duration-100 active:scale-95
                                ${passado
                                    ? 'font-medium text-faded'
                                    : pday
                                    ? 'bg-pday font-medium text-muted border border-slate-300'
                                    : ocupado
                                        ? 'bg-accent-soft font-semibold text-accent border border-accent/30'
                                        : selecionado
                                            ? 'bg-secondary font-bold text-white shadow-md'
                                            : 'bg-white font-bold text-primary border-2 border-secondary/60 hover:bg-secondary/10 hover:shadow-md'}
                            `}
                        >
                            {dia}
                            {ocupado && !passado && !pday && (
                                <span aria-hidden="true" className="absolute right-0.5 top-0.5 leading-none">
                                    <Flower size={11} />
                                </span>
                            )}
                        </button>
                    )
                })}
            </div>

            <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 pt-1 text-base text-text">
                <span className="flex items-center gap-2">
                    <span className="h-5 w-5 rounded border-2 border-secondary/60 bg-white" />
                    Livre
                </span>
                <span className="flex items-center gap-2">
                    <span className="relative h-5 w-5 rounded border border-accent/30 bg-accent-soft">
                        <span className="absolute right-px top-px leading-none"><Flower size={9} /></span>
                    </span>
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
