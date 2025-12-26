'use client'

type Props = {
  ocupados: string[]
  selectedDay: number | null
  onSelectDay: (day: number) => void
  ano: number
  mes: number // 0-based (0 = janeiro)
}

export function Calendar({
  ocupados,
  selectedDay,
  onSelectDay,
  ano,
  mes,
}: Props) {
  const primeiroDiaSemana = new Date(ano, mes, 1).getDay()
  const diasNoMes = new Date(ano, mes + 1, 0).getDate()

  function diaOcupado(dia: number) {
    const data = new Date(ano, mes, dia).toISOString().split('T')[0]
    return ocupados.includes(data)
  }

  const dias = [
    ...Array(primeiroDiaSemana).fill(null),
    ...Array.from({ length: diasNoMes }, (_, i) => i + 1),
  ]

  return (
    <div className="space-y-4">
      <h2 className="text-center text-xl font-semibold capitalize">
        {new Date(ano, mes).toLocaleDateString('pt-BR', {
          month: 'long',
          year: 'numeric',
        })}
      </h2>

      <div className="grid grid-cols-7 text-center font-medium text-gray-600">
        {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(d => (
          <div key={d}>{d}</div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-2">
        {dias.map((dia, i) => {
          if (!dia) return <div key={i} />

          const ocupado = diaOcupado(dia)
          const selecionado = dia === selectedDay

          return (
            <button
            key={dia}
            aria-disabled={ocupado}
            onClick={() => {
                if (!ocupado) onSelectDay(dia)
            }}
            className="h-14 rounded-lg text-lg font-medium transition hover:brightness-95"
            style={{
                backgroundColor: ocupado
                ? 'var(--cal-ocupado)'
                : selecionado
                ? 'var(--cal-selecionado)'
                : 'var(--cal-disponivel)',
                color: ocupado
                ? '#6b7280'
                : selecionado
                ? '#ffffff'
                : 'var(--cal-texto)',
                cursor: ocupado ? 'not-allowed' : 'pointer',
            }}
            >
            {dia}
            </button>
          )
        })}
      </div>
    </div>
  )
}
