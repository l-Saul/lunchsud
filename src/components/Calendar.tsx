type Props = {
  ocupados: string[]
  onSelectDay: (day: number) => void
}

export function Calendar({ ocupados, onSelectDay }: Props) {
  const hoje = new Date()
  const ano = hoje.getFullYear()
  const mes = hoje.getMonth()

  const primeiroDiaSemana = new Date(ano, mes, 1).getDay() // 0 = domingo
  const diasNoMes = new Date(ano, mes + 1, 0).getDate()

  function diaOcupado(dia: number) {
    const data = new Date(ano, mes, dia)
      .toISOString()
      .split('T')[0]

    return ocupados.includes(data)
  }

  const dias = [
    ...Array(primeiroDiaSemana).fill(null),
    ...Array.from({ length: diasNoMes }, (_, i) => i + 1),
  ]

  return (
    <div className="space-y-4">
      {/* Cabeçalho */}
      <h2 className="text-center text-xl font-semibold">
        {hoje.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
      </h2>

      {/* Dias da semana */}
      <div className="grid grid-cols-7 text-center font-medium text-gray-600">
        {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(d => (
          <div key={d}>{d}</div>
        ))}
      </div>

      {/* Grade do calendário */}
      <div className="grid grid-cols-7 gap-2">
        {dias.map((dia, i) => {
          if (!dia) return <div key={i} />

          const ocupado = diaOcupado(dia)

          return (
            <button
              key={dia}
              disabled={ocupado}
              onClick={() => onSelectDay(dia)}
              className={`
                h-14 rounded-lg text-lg font-medium
                ${ocupado
                  ? 'bg-gray-200 text-gray-400'
                  : 'bg-green-100 text-green-900 hover:bg-green-200'}
              `}
            >
              {dia}
            </button>
          )
        })}
      </div>

      <p className="text-sm text-gray-600 text-center">
        Dias em cinza já estão ocupados
      </p>
    </div>
  )
}
