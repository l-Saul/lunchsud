'use client';

type Props = {
    diasDoMes: {
        data: string;
        numero: number;
        agendamentos: {
            id: number;
            nome: string;
            telefone: string;
        }[];
    }[];
};

export default function CalendarMonthView({ diasDoMes }: Props) {
    if (diasDoMes.length === 0) return null;

    const [y, m, d] = diasDoMes[0].data.split('-').map(Number);
    const firstDay = new Date(y, m - 1, d).getDay();

    return (
        <div id="calendar-export" className="bg-white p-6 text-black">
            <div className="grid grid-cols-7 gap-2 mb-2">
                {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(dia => (
                    <div
                        key={dia}
                        className="font-semibold text-center"
                    >
                        {dia}
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-7 gap-2">
                {Array.from({ length: firstDay }).map((_, i) => (
                    <div key={`empty-${i}`} />
                ))}

                {diasDoMes.map(dia => (
                    <div
                        key={dia.data}
                        className="border rounded-lg p-2 min-h-30"
                    >
                        <div className="font-bold text-sm mb-1">
                            {dia.numero}
                        </div>

                        {dia.agendamentos.map(a => (
                            <div
                                key={a.id}
                                className="text-xs mt-1 leading-tight"
                            >
                                {a.nome}
                                <br />
                                {a.telefone}
                            </div>
                        ))}
                    </div>
                ))}
            </div>
        </div>
    );
}
