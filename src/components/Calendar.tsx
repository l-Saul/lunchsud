'use client'

type DiaOcupado = {
    data: string
    nome: string
}

type Props = {
    ocupados: DiaOcupado[]
    selectedDay: number | null
    onSelectDay: (day: number) => void
    onSelectOcupado: (nome: string) => void
}

export function Calendar({
    ocupados,
    selectedDay,
    onSelectDay,
    onSelectOcupado
}: Props) {
    const referencia = ocupados[0]?.data ?? new Date().toISOString().slice(0, 10)
    const [ano, mesStr] = referencia.split('-')
    const anoNum = Number(ano)
    const mesNum = Number(mesStr) - 1

    const primeiroDiaSemana = new Date(anoNum, mesNum, 1).getDay()
    const diasNoMes = new Date(anoNum, mesNum + 1, 0).getDate()

    function getOcupacao(dia: number) {
        const mm = String(mesNum + 1).padStart(2, '0')
        const dd = String(dia).padStart(2, '0')
        const dataCalendario = `${anoNum}-${mm}-${dd}`
        return ocupados.find(o => o.data === dataCalendario)
    }

    const dias = [
        ...Array(primeiroDiaSemana).fill(null),
        ...Array.from({ length: diasNoMes }, (_, i) => i + 1),
    ]

    return (
        <div className="space-y-4">
            <h2 className="text-center text-xl font-semibold capitalize text-text">
                {new Date(anoNum, mesNum).toLocaleDateString(
                    'pt-BR',
                    { month: 'long', year: 'numeric' }
                )}
            </h2>

            <div className="grid grid-cols-7 text-center font-medium text-text">
                {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(d => (
                    <div key={d}>{d}</div>
                ))}
            </div>

            <div className="grid grid-cols-7 gap-2">
                {dias.map((dia, index) => {
                    if (!dia) return <div key={`empty-${index}`} />

                    const ocupacao = getOcupacao(dia)
                    const ocupado = Boolean(ocupacao)
                    const selecionado = dia === selectedDay

                    return (
                        <div
                            key={`day-${index}`}
                            role="button"
                            onClick={() => {
                                if (ocupado && ocupacao) {
                                    onSelectOcupado(ocupacao.nome)
                                } else {
                                    onSelectDay(dia)
                                }
                            }}
                            className={`
                                h-14 w-full rounded-lg text-lg font-medium
                                flex items-center justify-center
                                cursor-pointer transition
                                ${ocupado && 'bg-zinc-500 text-text'}
                                ${selecionado && 'bg-secondary text-white '}
                                ${!ocupado && !selecionado && 'bg-background text-text hover:bg-secondary/10 border border-zinc-300'}
                            `}
                        >
                            {dia}
                        </div>
                    )
                })}
            </div>
        </div>
    )
}
