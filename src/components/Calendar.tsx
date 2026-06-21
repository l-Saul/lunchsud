'use client'

// Calendário público do agendamento. Mostra um mês por vez (atual ou seguinte),
// marca dias ocupados (rosa) e segundas como P-day (bloqueado). Só apresentação:
// quem busca os dados e controla o mês é a ClientPage.

import { motion } from 'framer-motion'
import { isPday, formatMonthLabel } from '@/lib/date'

type DiaOcupado = {
    data: string
    nome: string
}

type Props = {
    ocupados: DiaOcupado[]
    baseDate: Date
    selectedDay: number | null
    onSelectDay: (day: number) => void
    onSelectOcupado: (nome: string) => void
    onSelectPday?: () => void
    onNext?: () => void
    onPrev?: () => void
    canNext?: boolean
    canPrev?: boolean
}

export function Calendar({
    ocupados,
    baseDate,
    selectedDay,
    onSelectDay,
    onSelectOcupado,
    onSelectPday,
    onNext,
    onPrev,
    canNext,
    canPrev
}: Props) {
    const anoNum = baseDate.getFullYear()
    const mesNum = baseDate.getMonth()

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

    // Células vazias até o 1º dia cair na coluna certa, depois os dias do mês.
    const dias = [
        ...Array(primeiroDiaSemana).fill(null),
        ...Array.from({ length: diasNoMes }, (_, i) => i + 1),
    ]

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between gap-2">
                <motion.button
                    onClick={onPrev}
                    disabled={!canPrev}
                    aria-label="Mês anterior"
                    whileTap={{ scale: 0.94 }}
                    className="flex flex-col items-center gap-0.5 rounded-xl bg-secondary px-2.5 py-2 text-white shadow-sm transition hover:opacity-90 disabled:opacity-30 disabled:cursor-default cursor-pointer"
                >
                    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <path d="M15 18l-6-6 6-6" />
                    </svg>
                    <span className="text-xs font-semibold uppercase tracking-wide">Voltar</span>
                </motion.button>

                <h2 className="text-center text-base sm:text-xl font-semibold text-text">
                    {formatMonthLabel(`${anoNum}-${String(mesNum + 1).padStart(2, '0')}`)}
                </h2>

                <motion.button
                    onClick={onNext}
                    disabled={!canNext}
                    aria-label="Próximo mês"
                    whileTap={{ scale: 0.94 }}
                    className="flex flex-col items-center gap-0.5 rounded-xl bg-secondary px-2.5 py-2 text-white shadow-sm transition hover:opacity-90 disabled:opacity-30 disabled:cursor-default cursor-pointer"
                >
                    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <path d="M9 18l6-6-6-6" />
                    </svg>
                    <span className="text-xs font-semibold uppercase tracking-wide">Avançar</span>
                </motion.button>
            </div>

            <div className="grid grid-cols-7 gap-1 sm:gap-2 text-center text-sm font-semibold uppercase tracking-wide text-muted">
                {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(d => (
                    <div key={d}>{d}</div>
                ))}
            </div>

            <motion.div
                key={`${anoNum}-${mesNum}`}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25, ease: 'easeOut' }}
                className="grid grid-cols-7 gap-1 sm:gap-2"
            >
                {dias.map((dia, index) => {
                    if (!dia) return <div key={`empty-${index}`} />

                    // Estado do dia define cor e o que acontece ao tocar.
                    const pday = isPday(dataDoDia(dia))
                    const ocupacao = getOcupacao(dia)
                    const ocupado = Boolean(ocupacao)
                    const selecionado = dia === selectedDay

                    const ativar = () => {
                        if (pday) {
                            onSelectPday?.()
                        } else if (ocupado && ocupacao) {
                            onSelectOcupado(ocupacao.nome)
                        } else {
                            onSelectDay(dia)
                        }
                    }

                    const ariaLabel = pday
                        ? `Dia ${dia}, P-day, indisponível`
                        : ocupado && ocupacao
                            ? `Dia ${dia}, ocupado por ${ocupacao.nome}`
                            : selecionado
                                ? `Dia ${dia}, selecionado`
                                : `Dia ${dia}, disponível`

                    return (
                        <motion.div
                            key={`day-${index}`}
                            role="button"
                            tabIndex={0}
                            aria-label={ariaLabel}
                            aria-pressed={selecionado}
                            whileTap={{ scale: 0.92 }}
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
                                cursor-pointer transition
                                ${pday
                                    ? 'bg-primary/5 text-primary/40 border border-primary/10'
                                    : ocupado
                                        ? 'bg-accent text-white'
                                        : selecionado
                                            ? 'bg-secondary text-white shadow-md'
                                            : 'bg-white text-primary border border-slate-200 hover:border-secondary hover:bg-secondary/10'}
                            `}
                        >
                            {pday ? (
                                <div className="flex flex-col items-center leading-none">
                                    <span className="text-sm">{dia}</span>
                                    <span className="text-[9px] sm:text-[10px] font-semibold uppercase">
                                        P-day
                                    </span>
                                </div>
                            ) : (
                                dia
                            )}
                        </motion.div>
                    )
                })}
            </motion.div>

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
