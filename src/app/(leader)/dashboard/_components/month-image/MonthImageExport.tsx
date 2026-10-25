/**
 * Contexto e regras: leia CLAUDE.md e docs/routes_dashboard.md antes de alterar.
 * Mudou o comportamento? Atualize o doc na mesma mudança.
 */
'use client';

import { toPng } from 'html-to-image';
import { useMemo, useState, useEffect } from 'react';
import MonthImage, { LADO_DA_IMAGEM } from './MonthImage';
import { MonthTabs } from '@/components/MonthTabs';
import { Spinner } from '@/components/Spinner';
import { ErrorMessage } from '@/components/ErrorMessage';
import { createPortal } from 'react-dom';
import { botao } from '@/components/button-classes';
import { nomeDoMes } from '@/lib/date';

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
    const [acao, setAcao] = useState<'baixar' | 'enviar' | null>(null);
    const [erro, setErro] = useState('');
    const [mounted, setMounted] = useState(false);
    const [podeEnviar, setPodeEnviar] = useState(false);

    useEffect(() => {
        setMounted(true);
        const teste = new File([''], 'teste.png', { type: 'image/png' });
        setPodeEnviar(typeof navigator.canShare === 'function' && navigator.canShare({ files: [teste] }));
    }, []);

    const diasDoMes = useMemo(
        () => gerarDiasDoMes(mes, agendamentos),
        [mes, agendamentos]
    );

    const nomeArquivo = `almocos-${nomeDoMes(mes).toLowerCase()}-${mes.slice(0, 4)}.png`;

    async function gerarArquivo() {
        await waitForRender();

        const node = document.getElementById('calendar-export');
        if (!node) throw new Error('sem calendário');

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

        const blob = await (await fetch(dataUrl)).blob();
        return { dataUrl, file: new File([blob], nomeArquivo, { type: 'image/png' }) };
    }

    async function executar(tipo: 'baixar' | 'enviar') {
        if (acao) return;
        setAcao(tipo);
        setErro('');
        try {
            const { dataUrl, file } = await gerarArquivo();
            if (tipo === 'enviar') {
                await navigator.share({ files: [file], title: `Almoços de ${nomeDoMes(mes).toLowerCase()}` });
            } else {
                const link = document.createElement('a');
                link.href = dataUrl;
                link.download = nomeArquivo;
                link.click();
            }
        } catch (e) {
            if (!(e instanceof DOMException && e.name === 'AbortError')) {
                setErro('Não foi possível gerar a imagem. Tente de novo.');
            }
        } finally {
            setAcao(null);
        }
    }

    return (
        <section className="flex flex-col gap-5 rounded-3xl bg-background p-4 shadow-md ring-1 ring-primary/10 sm:p-8">
            <div className="flex items-center gap-2">
                <span className="h-5 w-1.5 rounded-full bg-accent" />
                <h2 className="min-w-0 hyphens-auto wrap-break-word text-xl font-semibold text-text">Gerar imagem do calendário</h2>
            </div>

            <div className="grid items-center gap-5 sm:grid-cols-[auto_minmax(0,1fr)] sm:gap-8">
                <div
                    role="img"
                    aria-label={`Prévia da imagem de ${nomeDoMes(mes).toLowerCase()}`}
                    className="relative mx-auto size-[224px] shrink-0 overflow-hidden rounded-2xl shadow-md ring-1 ring-primary/10"
                >
                    <div
                        aria-hidden="true"
                        className="pointer-events-none absolute left-0 top-0 origin-top-left"
                        style={{ transform: `scale(${224 / LADO_DA_IMAGEM})` }}
                    >
                        <MonthImage diasDoMes={diasDoMes} />
                    </div>
                </div>

                <div className="flex min-w-0 flex-col gap-4">
                    <MonthTabs meses={meses} ativo={mes} onChange={setMes} label="Mês da imagem" />

                    {erro && <ErrorMessage key={erro}>{erro}</ErrorMessage>}

                    <div className="flex flex-wrap gap-3">
                        <button
                            type="button"
                            onClick={() => executar('baixar')}
                            disabled={acao !== null}
                            aria-busy={acao === 'baixar'}
                            className={`${podeEnviar ? botao('secundario') : botao('primario')} grow basis-48`}
                        >
                            {acao === 'baixar' ? (
                                <Spinner className="h-5 w-5" />
                            ) : (
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="shrink-0">
                                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                                    <path d="m7 10 5 5 5-5" />
                                    <path d="M12 15V3" />
                                </svg>
                            )}
                            {acao === 'baixar' ? 'Gerando…' : 'Baixar imagem'}
                        </button>

                        {podeEnviar && (
                            <button
                                type="button"
                                onClick={() => executar('enviar')}
                                disabled={acao !== null}
                                aria-busy={acao === 'enviar'}
                                className={`${botao('primario')} grow basis-48`}
                            >
                                {acao === 'enviar' ? (
                                    <Spinner className="h-5 w-5" />
                                ) : (
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="shrink-0">
                                        <path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z" />
                                    </svg>
                                )}
                                {acao === 'enviar' ? 'Gerando…' : 'Enviar no WhatsApp'}
                            </button>
                        )}
                    </div>
                </div>
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
                            width: LADO_DA_IMAGEM,
                            height: LADO_DA_IMAGEM,
                            backgroundColor: '#ffffff',
                        }}
                    >
                        <MonthImage diasDoMes={diasDoMes} />
                    </div>,
                    document.getElementById('export-root')!
                )
            }
        </section>
    );
}
