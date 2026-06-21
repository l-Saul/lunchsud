'use client';

// Botão de lápis + modal para o líder editar/remover um agendamento (usado no painel).
// Mobile-first: inputs de altura uniforme, alvos de toque ≥48px, confirmação de
// remoção inline (sem window.confirm, que falha em alguns celulares) e fechamento
// por clique fora, tecla Esc ou botão X.

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { formatarTelefone } from '@/lib/phone';

type Props = {
    id: number;
    data: string;
    nome: string;
    telefone: string;
};

// Estilo único para os três campos → mesma altura/aparência no celular.
const campoBase =
    'h-12 w-full box-border rounded-lg border px-3 text-base text-text ' +
    'focus:border-secondary focus:outline-none focus:ring-2 focus:ring-secondary';

export default function EditModal({ id, data, nome, telefone }: Props) {
    const [erroNome, setErroNome] = useState(false);
    const [erroTelefone, setErroTelefone] = useState(false);

    const [open, setOpen] = useState(false);
    const [form, setForm] = useState({ data, nome, telefone }); // cópia editável da linha
    const [loading, setLoading] = useState(false);
    const [confirmarRemocao, setConfirmarRemocao] = useState(false);

    // Fecha o modal e zera estados transitórios.
    function fechar() {
        setOpen(false);
        setConfirmarRemocao(false);
    }

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
            fechar();
            location.reload();
        } else {
            alert('Erro ao atualizar');
        }
    }

    // Remove o agendamento (já confirmado pelo passo inline) e recarrega.
    async function handleDelete() {
        setLoading(true);

        const res = await fetch('/api/agendamentos/delete', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id })
        });

        setLoading(false);

        if (res.ok) {
            fechar();
            location.reload();
        } else {
            alert('Erro ao remover');
        }
    }

    // Trava o scroll do fundo e habilita Esc para fechar enquanto o modal está aberto.
    useEffect(() => {
        if (!open) return;

        document.body.style.overflow = 'hidden';

        const onKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') fechar();
        };
        window.addEventListener('keydown', onKey);

        return () => {
            document.body.style.overflow = '';
            window.removeEventListener('keydown', onKey);
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
                        onClick={fechar}
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
                            className="flex max-h-[90vh] w-full max-w-md flex-col overflow-y-auto rounded-2xl bg-background p-6 shadow-2xl"
                        >
                            <div className="mb-5 flex items-center justify-between gap-3">
                                <h3 className="text-xl font-semibold text-text">
                                    Editar agendamento
                                </h3>
                                {/* Botão X: fecho explícito (mobile pode não pegar o clique no fundo). */}
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
                                        inputMode="numeric"
                                        value={form.telefone}
                                        aria-invalid={erroTelefone}
                                        onChange={e =>
                                            setForm({ ...form, telefone: formatarTelefone(e.target.value) })
                                        }
                                        className={`${campoBase} ${erroTelefone ? 'border-accent' : 'border-slate-300'}`}
                                    />
                                    {erroTelefone && (
                                        <p className="mt-0.5 text-sm text-accent">
                                            Informe um telefone válido.
                                        </p>
                                    )}
                                </div>
                            </div>

                            {/* Ações: empilhadas e largas (mobile-first). */}
                            <div className="mt-6 flex flex-col gap-3">
                                <div className="flex gap-3">
                                    <button
                                        onClick={fechar}
                                        className="min-h-12 flex-1 rounded-xl border border-slate-300 px-4 text-base font-medium text-text transition hover:bg-slate-100 cursor-pointer"
                                    >
                                        Cancelar
                                    </button>
                                    <button
                                        onClick={handleSave}
                                        disabled={loading}
                                        className="min-h-12 flex-1 rounded-xl bg-secondary px-5 text-base font-semibold text-white transition hover:opacity-90 disabled:opacity-50 cursor-pointer"
                                    >
                                        {loading ? 'Salvando…' : 'Salvar'}
                                    </button>
                                </div>

                                {/* Remover com confirmação inline (substitui o window.confirm). */}
                                {confirmarRemocao ? (
                                    <div className="flex gap-3">
                                        <button
                                            onClick={() => setConfirmarRemocao(false)}
                                            disabled={loading}
                                            className="min-h-12 flex-1 rounded-xl border border-slate-300 px-4 text-base font-medium text-text transition hover:bg-slate-100 disabled:opacity-50 cursor-pointer"
                                        >
                                            Manter
                                        </button>
                                        <button
                                            onClick={handleDelete}
                                            disabled={loading}
                                            className="min-h-12 flex-1 rounded-xl bg-accent px-4 text-base font-semibold text-white transition hover:opacity-90 disabled:opacity-50 cursor-pointer"
                                        >
                                            {loading ? 'Removendo…' : 'Confirmar remoção'}
                                        </button>
                                    </div>
                                ) : (
                                    <button
                                        onClick={() => setConfirmarRemocao(true)}
                                        disabled={loading}
                                        className="min-h-12 w-full rounded-xl px-4 text-base font-medium text-accent transition hover:bg-accent/10 disabled:opacity-50 cursor-pointer"
                                    >
                                        Remover agendamento
                                    </button>
                                )}
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}
