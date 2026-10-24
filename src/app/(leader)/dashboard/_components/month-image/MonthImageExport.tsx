/**
 * Contexto e regras: leia CLAUDE.md e docs/routes_dashboard.md antes de alterar.
 * Mudou o comportamento? Atualize o doc na mesma mudança.
 */
'use client';

import { toPng } from 'html-to-image';
import { useMemo, useState, useEffect } from 'react';
import MonthImage from './MonthImage';
import { MonthSelect } from './MonthSelect';
import { Spinner } from '@/components/Spinner';
import { createPortal } from 'react-dom';

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

function isMobile() {
    return (
        typeof window !== 'undefined' &&
        window.matchMedia('(pointer: coarse)').matches
    );
}

function waitForRender() {
    return new Promise<void>(resolve => {
        requestAnimationFrame(() => {
            requestAnimationFrame(() => resolve());
        });
    });
}

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

export default function MonthImageExport({ meses, agendamentos }: Props) {
    const [mes, setMes] = useState(meses[0]);
    const [loading, setLoading] = useState(false);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    const diasDoMes = useMemo(
        () => gerarDiasDoMes(mes, agendamentos),
        [mes, agendamentos]
    );

    async function gerarImagem() {
        if (loading) return;

        setLoading(true);

        try {
            await waitForRender();

            const node = document.getElementById('calendar-export');
            if (!node) return;

            const rect = node.getBoundingClientRect();

            const dataUrl = await toPng(node, {
                pixelRatio: 2,
                backgroundColor: '#ffffff',
                width: rect.width,
                height: rect.height,
                style: {
                    transform: 'scale(1)',
                    transformOrigin: 'top left',
                },
            });

            const res = await fetch(dataUrl);
            const blob = await res.blob();

            const file = new File([blob], `calendario-${mes}.png`, {
                type: 'image/png',
            });

            if (isMobile() && navigator.canShare && navigator.canShare({ files: [file] })) {
                await navigator.share({
                    files: [file],
                    title: `Calendário ${mes}`,
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
            <div className="flex w-full gap-2 sm:w-auto">
                <MonthSelect meses={meses} value={mes} onChange={setMes} />

                <button
                    onClick={gerarImagem}
                    disabled={loading}
                    aria-busy={loading}
                    className={`
                        flex flex-1 items-center justify-center gap-2 sm:flex-none
                        rounded-lg px-4 py-2.5 text-sm font-semibold text-white cursor-pointer
                        transition duration-100 enabled:active:scale-[0.98]
                        ${loading
                            ? 'bg-gray-400 cursor-not-allowed'
                            : 'bg-primary hover:bg-secondary'}
                    `}
                >
                    {loading && <Spinner className="h-4 w-4" />}
                    {loading ? 'Gerando…' : 'Gerar imagem'}
                </button>
            </div>

            <div
                id="export-root"
                style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    width: 0,
                    height: 0,
                    overflow: 'hidden',
                    pointerEvents: 'none',
                    zIndex: -1,
                }}
            />
            {mounted &&
                createPortal(
                    <div
                        id="calendar-export"
                        style={{
                            width: '1024px',
                            backgroundColor: '#ffffff',
                        }}
                    >
                        <MonthImage diasDoMes={diasDoMes} />
                    </div>,
                    document.getElementById('export-root')!
                )
            }
        </>
    );
}
