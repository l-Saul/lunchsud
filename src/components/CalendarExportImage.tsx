'use client';

// Gera a imagem do calendário do mês (PNG) a partir de um DOM oculto e:
// - no desktop, baixa o arquivo;
// - no mobile, abre o menu de compartilhar (ex.: enviar no grupo do WhatsApp).

import { toPng } from 'html-to-image';
import { useMemo, useState, useEffect } from 'react';
import CalendarMonthView from '@/components/CalendarMonthView';
import { MonthSelect } from '@/components/MonthSelect';
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

// Heurística de "é toque" (celular/tablet) para decidir baixar vs compartilhar.
function isMobile() {
    return (
        typeof window !== 'undefined' &&
        window.matchMedia('(pointer: coarse)').matches
    );
}

// Espera 2 frames para garantir que o DOM oculto já pintou antes de capturar.
function waitForRender() {
    return new Promise<void>(resolve => {
        requestAnimationFrame(() => {
            requestAnimationFrame(() => resolve());
        });
    });
}

// Monta os dias do mês com seus agendamentos (formato que o CalendarMonthView espera).
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
    const [loading, setLoading] = useState(false);
    const [mounted, setMounted] = useState(false);

    // createPortal só pode rodar após montar no client.
    useEffect(() => {
        setMounted(true);
    }, []);

    // Dias do mês selecionado (com seus agendamentos) que alimentam o calendário da imagem.
    const diasDoMes = useMemo(
        () => gerarDiasDoMes(mes, agendamentos),
        [mes, agendamentos]
    );

    async function gerarImagem() {
        if (loading) return;

        setLoading(true);

        try {
            await waitForRender();

            // Captura o calendário renderizado no container oculto (#calendar-export).
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

            // Mobile com suporte a compartilhar arquivo -> abre o menu nativo (WhatsApp etc.).
            if (isMobile() && navigator.canShare && navigator.canShare({ files: [file] })) {
                await navigator.share({
                    files: [file],
                    title: `Calendário ${mes}`,
                });
            } else {
                // Desktop (ou sem share) -> baixa o PNG.
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
                    className={`
                        flex-1 sm:flex-none
                        rounded-lg px-4 py-2.5 text-sm font-semibold text-white cursor-pointer
                        transition
                        ${loading
                            ? 'bg-gray-400 cursor-not-allowed'
                            : 'bg-primary hover:bg-secondary'}
                    `}
                >
                    {loading ? 'Gerando…' : 'Gerar imagem'}
                </button>
            </div>

            {/* Container 0x0 e oculto: hospeda o calendário em 1024px só para virar imagem. */}
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
                        <CalendarMonthView diasDoMes={diasDoMes} />
                    </div>,
                    document.getElementById('export-root')!
                )
            }
        </>
    );
}
