'use client';

// Botão de lápis + modal para o líder editar/remover um agendamento (usado no painel).

import { useState } from 'react';
import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { formatarTelefone } from '@/lib/phone';

type Props = {
    id: number;
    data: string;
    nome: string;
    telefone: string;
};

export default function EditModal({ id, data, nome, telefone }: Props) {
    const [erroNome, setErroNome] = useState(false);
    const [erroTelefone, setErroTelefone] = useState(false);

    const [open, setOpen] = useState(false);
    const [form, setForm] = useState({ data, nome, telefone }); // cópia editável da linha
    const [loading, setLoading] = useState(false);

    // Valida no client e envia o update; recarrega a página para refletir a mudança.
    async function handleSave() {
        const nomeInvalido = !form.nome.trim();

        const telefoneNumeros = form.telefone.replace(/\D/g, '');
        const telefoneInvalido = telefoneNumeros.length < 10;

        setErroNome(nomeInvalido);
        setErroTelefone(telefoneInvalido);

        if (nomeInvalido || telefoneInvalido) {
            return;
        }

        setLoading(true);

        const res = await fetch('/api/agendamentos/update', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id, ...form })
        });

        setLoading(false);

        if (res.ok) {
            setOpen(false);
            location.reload();
        } else {
            alert('Erro ao atualizar');
        }
    }

    // Remove o agendamento após confirmação e recarrega.
    async function handleDelete() {
        const confirm = window.confirm('Remover este agendamento?');

        if (!confirm) return;

        setLoading(true);

        const res = await fetch('/api/agendamentos/delete', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id })
        });

        setLoading(false);

        if (res.ok) {
            setOpen(false);
            location.reload();
        } else {
            alert('Erro ao remover');
        }
    }

    // Trava o scroll do fundo enquanto o modal está aberto.
    useEffect(() => {
        if (open) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }

        return () => {
            document.body.style.overflow = '';
        };
    }, [open]);

    return (
        <>
            <button
                onClick={() => setOpen(true)}
                aria-label="Editar agendamento"
                className="flex min-h-11 min-w-11 items-center justify-center rounded-xl text-secondary transition hover:bg-secondary/10 cursor-pointer"
            >
                {/* Ícone de lápis (SVG inline em vez de /editar.png). */}
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M12 20h9" />
                    <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z" />
                </svg>
            </button>

            <AnimatePresence>
                {open && (
                    <motion.div
                        key="backdrop"
                        onClick={() => setOpen(false)}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="fixed inset-0 z-50 flex items-center justify-center bg-primary/40 p-4 backdrop-blur-sm"
                    >
                        <motion.div
                            onClick={e => e.stopPropagation()}
                            role="dialog"
                            aria-modal="true"
                            aria-label="Editar agendamento"
                            initial={{ opacity: 0, scale: 0.96, y: 12 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.96, y: 12 }}
                            transition={{ duration: 0.22, ease: 'easeOut' }}
                            className="w-full max-w-md rounded-2xl bg-background p-6 shadow-2xl"
                        >
                            <h3 className="mb-5 text-xl font-semibold text-text">
                                Editar agendamento
                            </h3>

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
                                        className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-base focus:border-secondary focus:outline-none focus:ring-2 focus:ring-secondary"
                                    />
                                </div>

                                <div className="flex flex-col gap-1.5">
                                    <label htmlFor={`nome-${id}`} className="text-sm font-medium text-muted">
                                        Nome
                                    </label>
                                    <input
                                        id={`nome-${id}`}
                                        value={form.nome}
                                        aria-invalid={erroNome}
                                        onChange={e => {
                                            setForm({ ...form, nome: e.target.value });
                                            if (erroNome) setErroNome(false);
                                        }}
                                        className={`w-full rounded-lg px-3 py-2.5 text-base focus:border-secondary focus:outline-none focus:ring-2 focus:ring-secondary
                                            border ${erroNome ? 'border-red-400' : 'border-slate-300'}`}
                                    />
                                    {erroNome && (
                                        <p className="mt-0.5 text-sm text-red-500">
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
                                        inputMode="numeric"
                                        value={form.telefone}
                                        aria-invalid={erroTelefone}
                                        onChange={e =>
                                            setForm({ ...form, telefone: formatarTelefone(e.target.value) })
                                        }
                                        className={`w-full rounded-lg px-3 py-2.5 text-base focus:border-secondary focus:outline-none focus:ring-2 focus:ring-secondary
                                            border ${erroTelefone ? 'border-red-400' : 'border-slate-300'}`}
                                    />
                                    {erroTelefone && (
                                        <p className="mt-0.5 text-sm text-red-500">
                                            Informe um telefone válido.
                                        </p>
                                    )}
                                </div>
                            </div>

                            <div className="mt-6 flex items-center justify-between gap-3">
                                <button
                                    onClick={handleDelete}
                                    disabled={loading}
                                    className="rounded-lg px-3 py-2.5 text-sm font-medium text-red-500 transition hover:bg-red-50 disabled:opacity-50 cursor-pointer"
                                >
                                    {loading ? '…' : 'Remover'}
                                </button>

                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => setOpen(false)}
                                        className="rounded-lg px-4 py-2.5 text-sm font-medium text-text transition hover:bg-slate-100 cursor-pointer"
                                    >
                                        Cancelar
                                    </button>

                                    <button
                                        onClick={handleSave}
                                        disabled={loading}
                                        className="rounded-lg bg-secondary px-5 py-2.5 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-50 cursor-pointer"
                                    >
                                        {loading ? 'Salvando…' : 'Salvar'}
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}
