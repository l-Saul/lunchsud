/**
 * Contexto e regras: leia CLAUDE.md e docs/routes_dashboard.md antes de alterar.
 * Mudou o comportamento? Atualize o doc na mesma mudança.
 */
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { normalizarTelefone } from '@/lib/phone';
import { Spinner } from '@/components/Spinner';

type Props = {
    id: number;
    data: string;
    nome: string;
    telefone: string;
};

const campoBase =
    'w-full min-w-0 min-h-12 box-border appearance-none rounded-lg border px-3 py-3 text-base text-text ' +
    'focus:border-secondary focus:outline-none focus:ring-2 focus:ring-secondary';

export default function EditBookingModal({ id, data, nome, telefone }: Props) {
    const router = useRouter();
    const [erroNome, setErroNome] = useState(false);
    const [erroTelefone, setErroTelefone] = useState(false);

    const [open, setOpen] = useState(false);
    const [form, setForm] = useState({ data, nome, telefone });
    const [acao, setAcao] = useState<'salvar' | 'remover' | null>(null);
    const ocupado = acao !== null;
    const [confirmarRemocao, setConfirmarRemocao] = useState(false);

    function fechar() {
        setOpen(false);
        setConfirmarRemocao(false);
    }

    async function handleSave() {
        const nomeInvalido = form.nome.trim().length < 2;
        const telefoneInvalido = !normalizarTelefone(form.telefone);

        setErroNome(nomeInvalido);
        setErroTelefone(telefoneInvalido);

        if (nomeInvalido || telefoneInvalido) {
            return;
        }

        await enviar('salvar');
    }

    async function enviar(tipo: 'salvar' | 'remover') {
        if (ocupado) return;
        setAcao(tipo);
        try {
            const res = await fetch(
                tipo === 'salvar' ? '/api/agendamentos/update' : '/api/agendamentos/delete',
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(tipo === 'salvar' ? { id, ...form } : { id }),
                }
            );
            if (res.ok) {
                fechar();
                router.refresh();
            } else {
                alert(tipo === 'salvar' ? 'Erro ao atualizar' : 'Erro ao remover');
            }
        } catch {
            alert('Sem conexão com a internet. Verifique e tente de novo.');
        } finally {
            setAcao(null);
        }
    }

    useEffect(() => {
        if (!open) return;

        const scrollY = window.scrollY;
        const { style } = document.body;
        style.position = 'fixed';
        style.top = `-${scrollY}px`;
        style.left = '0';
        style.right = '0';
        style.width = '100%';

        const onKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') fechar();
        };
        window.addEventListener('keydown', onKey);

        return () => {
            style.position = '';
            style.top = '';
            style.left = '';
            style.right = '';
            style.width = '';
            window.scrollTo(0, scrollY);
            window.removeEventListener('keydown', onKey);
        };
    }, [open]);

    return (
        <>
            <button
                onClick={() => setOpen(true)}
                aria-label="Editar agendamento"
                className="flex min-h-11 min-w-11 items-center justify-center rounded-xl text-secondary transition hover:bg-secondary/10 hover:scale-110 active:scale-95 cursor-pointer"
            >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M12 20h9" />
                    <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z" />
                </svg>
            </button>

            {open && (
                <div className="fixed inset-0 z-50 animate-aparecer overflow-y-auto overscroll-contain bg-primary/40 backdrop-blur-sm">
                    <div
                        onClick={fechar}
                        className="flex min-h-full items-center justify-center p-4"
                    >
                    <div
                        onClick={e => e.stopPropagation()}
                        role="dialog"
                        aria-modal="true"
                        aria-label="Editar agendamento"
                        className="w-full max-w-md animate-surgir rounded-2xl bg-background p-6 shadow-2xl"
                    >
                        <div className="mb-5 flex items-center justify-between gap-3">
                            <h3 className="text-xl font-semibold text-text">
                                Editar agendamento
                            </h3>
                            <button
                                onClick={fechar}
                                aria-label="Fechar"
                                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-muted transition hover:bg-slate-100 cursor-pointer"
                            >
                                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                                    <path d="M18 6 6 18M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        <div className="flex flex-col gap-4">
                            <div className="flex flex-col gap-1.5">
                                <label htmlFor={`data-${id}`} className="text-sm font-medium text-muted">
                                    Data
                                </label>
                                <input
                                    id={`data-${id}`}
                                    type="date"
                                    value={form.data}
                                    onChange={e =>
                                        setForm({ ...form, data: e.target.value })
                                    }
                                    className={`${campoBase} border-slate-300`}
                                />
                            </div>

                            <div className="flex flex-col gap-1.5">
                                <label htmlFor={`nome-${id}`} className="text-sm font-medium text-muted">
                                    Nome
                                </label>
                                <input
                                    id={`nome-${id}`}
                                    autoComplete="off"
                                    value={form.nome}
                                    aria-invalid={erroNome}
                                    onChange={e => {
                                        setForm({ ...form, nome: e.target.value });
                                        if (erroNome) setErroNome(false);
                                    }}
                                    className={`${campoBase} ${erroNome ? 'border-accent' : 'border-slate-300'}`}
                                />
                                {erroNome && (
                                    <p className="mt-0.5 text-sm text-accent">
                                        Informe o nome.
                                    </p>
                                )}
                            </div>

                            <div className="flex flex-col gap-1.5">
                                <label htmlFor={`tel-${id}`} className="text-sm font-medium text-muted">
                                    Telefone
                                </label>
                                <input
                                    id={`tel-${id}`}
                                    autoComplete="off"
                                    type="tel"
                                    inputMode="tel"
                                    maxLength={25}
                                    value={form.telefone}
                                    aria-invalid={erroTelefone}
                                    onChange={e =>
                                        setForm({ ...form, telefone: e.target.value })
                                    }
                                    onBlur={() => {
                                        const lido = normalizarTelefone(form.telefone);
                                        if (lido) setForm({ ...form, telefone: lido.formatado });
                                    }}
                                    className={`${campoBase} ${erroTelefone ? 'border-accent' : 'border-slate-300'}`}
                                />
                                {erroTelefone && (
                                    <p className="mt-0.5 text-sm text-accent">
                                        Confira o telefone, com DDD (ou + e o código do país).
                                    </p>
                                )}
                            </div>
                        </div>

                        <div className="mt-6 flex flex-col gap-3">
                            <div className="flex flex-wrap gap-3">
                                <button
                                    onClick={fechar}
                                    className="min-h-12 grow basis-28 rounded-xl border border-slate-300 px-4 text-base font-medium text-text transition hover:bg-slate-100 cursor-pointer"
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={handleSave}
                                    disabled={ocupado}
                                    aria-busy={acao === 'salvar'}
                                    className="flex min-h-12 grow basis-28 items-center justify-center gap-2 rounded-xl bg-secondary px-5 text-base font-semibold text-white transition duration-100 hover:opacity-90 enabled:active:scale-[0.98] disabled:opacity-60 cursor-pointer"
                                >
                                    {acao === 'salvar' && <Spinner />}
                                    {acao === 'salvar' ? 'Salvando…' : 'Salvar'}
                                </button>
                            </div>

                            {confirmarRemocao ? (
                                <div className="flex flex-wrap gap-3">
                                    <button
                                        onClick={() => setConfirmarRemocao(false)}
                                        disabled={ocupado}
                                        className="min-h-12 grow basis-28 rounded-xl border border-slate-300 px-4 text-base font-medium text-text transition hover:bg-slate-100 disabled:opacity-50 cursor-pointer"
                                    >
                                        Manter
                                    </button>
                                    <button
                                        onClick={() => enviar('remover')}
                                        disabled={ocupado}
                                        aria-busy={acao === 'remover'}
                                        className="flex min-h-12 grow basis-28 items-center justify-center gap-2 rounded-xl bg-accent px-4 text-base font-semibold text-white transition duration-100 hover:opacity-90 enabled:active:scale-[0.98] disabled:opacity-60 cursor-pointer"
                                    >
                                        {acao === 'remover' && <Spinner />}
                                        {acao === 'remover' ? 'Removendo…' : 'Confirmar remoção'}
                                    </button>
                                </div>
                            ) : (
                                <button
                                    onClick={() => setConfirmarRemocao(true)}
                                    disabled={ocupado}
                                    className="min-h-12 w-full rounded-xl px-4 text-base font-medium text-accent transition hover:bg-accent/10 disabled:opacity-50 cursor-pointer"
                                >
                                    Remover agendamento
                                </button>
                            )}
                        </div>
                    </div>
                    </div>
                </div>
            )}
        </>
    );
}
