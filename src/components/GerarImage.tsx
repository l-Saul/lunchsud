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

        const dataLocal = new Date(ano, mesNum - 1, dia);
        const dataISO = dataLocal.toISOString().slice(0, 10);

        return {
            data: dataISO,
            numero: dia,
            agendamentos: agendamentos.filter(a =>
                a.data.startsWith(dataISO)
            ),
        };
    });
}

export default function CalendarExportImage({ meses, agendamentos }: Props) {
    const [mes, setMes] = useState(meses[0]);

    const diasDoMes = useMemo(
        () => gerarDiasDoMes(mes, agendamentos),
        [mes, agendamentos]
    );

    const [loading, setLoading] = useState(false);

    async function gerarImagem() {
        if (loading) return;

        setLoading(true);

        try {
            const node = document.getElementById('calendar-export');
            if (!node) return;

            const dataUrl = await toPng(node, {
                pixelRatio: 2,
                backgroundColor: '#ffffff',
            });

            const res = await fetch(dataUrl);
            const blob = await res.blob();

            const file = new File([blob], `calendario-${mes}.png`, {
                type: 'image/png',
            });

            if (navigator.canShare && navigator.canShare({ files: [file] })) {
                await navigator.share({
                    files: [file],
                    title: 'Calendário',
                });
            } else {
                const link = document.createElement('a');
                link.href = dataUrl;
                link.download = `calendario-${mes}.png`;
                link.click();
            }
        } finally {
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
                        className={`
                            px-4 py-2 rounded-md text-white cursor-pointer
                            transition-all duration-200
                            ${loading
                                ? 'bg-gray-400 cursor-not-allowed'
                                : 'bg-primary hover:bg-secondary'}
                        `}
                >
                    <span
                        className={`
                            inline-block transition-opacity duration-200
                            ${loading ? 'opacity-70' : 'opacity-100'}
                        `}
                    >
                        {loading ? 'Gerando...' : 'Gerar imagem'}
                    </span>
                </button>
            </div>

            <div
                id="calendar-export"
                className="fixed -left-2499.75 top-0 opacity-0 pointer-events-none"
            >
                <CalendarMonthView diasDoMes={diasDoMes} />
            </div>
        </>
    );
}
