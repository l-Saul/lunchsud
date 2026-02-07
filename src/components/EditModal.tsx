'use client';

import { useState } from 'react';

type Props = {
    id: number;
    data: string;
    nome: string;
    telefone: string;
};

export default function EditModal({ id, data, nome, telefone }: Props) {
    const [open, setOpen] = useState(false);
    const [form, setForm] = useState({ data, nome, telefone });
    const [loading, setLoading] = useState(false);

    async function handleSave() {
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

    return (
        <>
            <button
                onClick={() => setOpen(true)}
                className="px-4 py-2 rounded-md bg-primary text-white hover:opacity-90"
            >
                Editar
            </button>

            {open && (
                <div
                    onClick={() => setOpen(false)}
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-md"
                >
                    <div
                        onClick={e => e.stopPropagation()}
                        className="bg-background rounded-lg shadow-xl p-6 min-w-90"
                    >
                        <h3 className="mb-4 text-lg font-semibold text-text">
                            Editar agendamento
                        </h3>

                        <div className="flex flex-col gap-1 mb-3">
                            <label className="text-sm text-muted">Data</label>
                            <input
                                type="date"
                                value={form.data}
                                onChange={e =>
                                    setForm({ ...form, data: e.target.value })
                                }
                                className="rounded-md border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-secondary"
                            />
                        </div>

                        <div className="flex flex-col gap-1 mb-3">
                            <label className="text-sm text-muted">Nome</label>
                            <input
                                value={form.nome}
                                onChange={e =>
                                    setForm({ ...form, nome: e.target.value })
                                }
                                className="rounded-md border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-secondary"
                            />
                        </div>

                        <div className="flex flex-col gap-1 mb-3">
                            <label className="text-sm text-muted">Telefone</label>
                            <input
                                value={form.telefone}
                                onChange={e =>
                                    setForm({ ...form, telefone: e.target.value })
                                }
                                className="rounded-md border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-secondary"
                            />
                        </div>

                        <div className="flex justify-end gap-2 mt-4">
                            <button
                                onClick={() => setOpen(false)}
                                className="px-4 py-2 rounded-md text-text hover:bg-slate-100"
                            >
                                Cancelar
                            </button>

                            <button
                                onClick={handleSave}
                                disabled={loading}
                                className="px-4 py-2 rounded-md bg-secondary text-white hover:opacity-90 disabled:opacity-50"
                            >
                                Salvar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
