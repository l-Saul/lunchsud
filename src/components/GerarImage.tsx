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

    const totalDias = new Date(Date.UTC(ano, mesNum, 0)).getUTCDate();

    return Array.from({ length: totalDias }, (_, i) => {
        const dia = i + 1;

        const dataUTC = new Date(Date.UTC(ano, mesNum - 1, dia));
        const dataISO = dataUTC.toISOString().slice(0, 10);

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

    async function gerarImagem() {
        const node = document.getElementById('calendar-export');
        if (!node) return;

        const dataUrl = await toPng(node, {
            pixelRatio: 2,
            backgroundColor: '#ffffff',
        });

        const link = document.createElement('a');
        link.href = dataUrl;
        link.download = `calendario-${mes}.png`;
        link.click();
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
                    className="px-4 py-2 rounded-md bg-primary text-white"
                >
                    Gerar imagem
                </button>
            </div>

            <div className="absolute -left-[9999px] top-0">
                <CalendarMonthView diasDoMes={diasDoMes} />
            </div>
        </>
    );
}
