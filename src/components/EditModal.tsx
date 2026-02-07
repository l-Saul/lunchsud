'use client';

import { useState } from 'react';
import { useEffect } from 'react';

function formatarTelefone(valor: string) {
    const digits = valor.replace(/\D/g, '').slice(0, 11);

    if (digits.length <= 2) return digits;
    if (digits.length <= 7) return `${digits.slice(0, 2)} ${digits.slice(2)}`;
    return `${digits.slice(0, 2)} ${digits.slice(2, 7)} ${digits.slice(7)}`;
}

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
    const [form, setForm] = useState({ data, nome, telefone });
    const [loading, setLoading] = useState(false);

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
                className="px-4 py-2 rounded-md text-white hover:opacity-90"
            >
            <img
                src="/editar.png"
                alt="Editar"
                className='cursor-pointer'
                style={{ width: '80%', height: 'auto' }}
            />
            </button>

            {open && (
                <div
                    onClick={() => setOpen(false)}
                    className="text-lg fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-md"
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
                                onChange={e => {
                                    setForm({ ...form, nome: e.target.value });
                                    if (erroNome) setErroNome(false);
                                }}
                                className={`rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-secondary
                                    border ${erroNome ? 'border-red-500' : 'border-slate-300'}`}
                            />
                            {erroNome && (
                                <p className="text-sm text-red-500 mt-1">
                                    Informe o nome.
                                </p>
                            )}
                        </div>

                        <div className="flex flex-col gap-1 mb-3">
                            <label className="text-sm text-muted">Telefone</label>
                            <input
                                value={form.telefone}
                                onChange={e =>
                                    setForm({ ...form, telefone: formatarTelefone(e.target.value) })
                                }
                                className={`rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-secondary
                                    border ${erroTelefone ? 'border-red-500' : 'border-slate-300'}`}
                            />
                            {erroTelefone && (
                                <p className="text-sm text-red-500 mt-1">
                                    Informe o telefone válido.
                                </p>
                            )}
                        </div>

                        <div className="flex justify-between items-center mt-4">
                            <button
                                onClick={() => setOpen(false)}
                                className="px-4 py-2 rounded-md text-text hover:bg-slate-100 z-200"
                            >
                                Cancelar
                            </button>

                            <button
                                onClick={handleSave}
                                disabled={loading}
                                className="px-4 py-2 rounded-md bg-secondary text-white hover:opacity-90 disabled:opacity-50"
                            >
                                {loading ? (
                                    <span className="animate-pulse">...</span>
                                ) : (
                                    'Salvar'
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
