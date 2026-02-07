'use client';

import { toPng } from 'html-to-image';
import { useMemo, useState } from 'react';
import CalendarMonthView from '@/app/imagem/calendarioImg';

type Agendamento = {
    id: number;
    data: string;
    nome: string;
    telefone: string;
};

type Props = {
    meses: string[];
    agendamentos: Agendamento[];
};

function gerarDiasDoMes(mes: string, agendamentos: Agendamento[]) {
    const [ano, mesNum] = mes.split('-').map(Number);
    const totalDias = new Date(ano, mesNum, 0).getDate();

    return Array.from({ length: totalDias }, (_, i) => {
        const dia = i + 1;
        const data = `${ano}-${String(mesNum).padStart(2, '0')}-${String(dia).padStart(2, '0')}`;

        return {
            data,
            numero: dia,
            agendamentos: agendamentos.filter(a => a.data.startsWith(data)),
        };
    });
}

export default function CalendarExportImage({ meses, agendamentos }: Props) {
    const [mes, setMes] = useState(meses[0]);
    const [loading, setLoading] = useState(false);
    const [exportando, setExportando] = useState(false);

    const diasDoMes = useMemo(
        () => gerarDiasDoMes(mes, agendamentos),
        [mes, agendamentos]
    );

    async function gerarImagem() {
        if (loading) return;
        setLoading(true);
        setExportando(true);

        try {
            await new Promise(resolve => setTimeout(resolve, 50));

            const node = document.getElementById('calendar-export');
            if (!node) return;

            if (document.fonts?.ready) {
                await document.fonts.ready;
            }

            const dataUrl = await toPng(node, {
                pixelRatio: 2,
                backgroundColor: '#ffffff',
            });

            const link = document.createElement('a');
            link.href = dataUrl;
            link.download = `calendario-${mes}.png`;
            link.click();
        } finally {
            setExportando(false);
            setLoading(false);
        }
    }

    return (
        <>
            <div className="flex gap-2">
                <select
                    value={mes}
                    onChange={e => setMes(e.target.value)}
                    className="px-3 py-2 rounded-md border"
                >
                    {meses.map(m => (
                        <option key={m} value={m}>
                            {m}
                        </option>
                    ))}
                </select>

                <button
                    onClick={gerarImagem}
                    disabled={loading}
                    className={`px-4 py-2 rounded-md text-white cursor-pointer
                    ${ loading ? 'bg-gray-400' : 'bg-primary hover:bg-secondary'
                    }`}
                >
                    {loading ? 'Gerando...' : 'Gerar imagem'}
                </button>
            </div>

            {exportando && (
                <div
                    className="fixed inset-0 bg-white z-50 flex justify-center items-start overflow-auto"
                >
                    <div id="calendar-export" style={{ width: 1200 }}>
                        <CalendarMonthView diasDoMes={diasDoMes} />
                    </div>
                </div>
            )}
        </>
    );
}
