type Props = {
  ocupados: string[]
  onSelectDay: (day: number) => void
}

export function Calendar({ ocupados, onSelectDay }: Props) {
  const hoje = new Date()
  const ano = hoje.getFullYear()
  const mes = hoje.getMonth() // mês atual
  const diasNoMes = new Date(ano, mes + 1, 0).getDate()

  function diaOcupado(dia: number) {
    const data = new Date(ano, mes, dia)
      .toISOString()
      .split('T')[0]

    return ocupados.includes(data)
  }

  return (
    <div className="space-y-3">
      {Array.from({ length: diasNoMes }, (_, i) => {
        const dia = i + 1
        const ocupado = diaOcupado(dia)

        return (
          <button
            key={dia}
            disabled={ocupado}
            onClick={() => onSelectDay(dia)}
            className={`w-full py-4 rounded-lg text-lg font-medium
              ${ocupado
                ? 'bg-gray-200 text-gray-500'
                : 'bg-green-100 text-green-900 hover:bg-green-200'}
            `}
          >
            Dia {dia} {ocupado && '(ocupado)'}
          </button>
        )
      })}
    </div>
  )
}
