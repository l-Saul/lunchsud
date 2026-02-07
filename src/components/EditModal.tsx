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

        const res = await fetch('/api/agendamento/update', {
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
            <button onClick={() => setOpen(true)}>
                Editar
            </button>

            {open && (
                <div
                    style={overlay}
                    onClick={() => setOpen(false)}
                >
                    <div
                        style={modal}
                        onClick={e => e.stopPropagation()}
                    >
                        <h3 style={title}>Editar agendamento</h3>

                        <div style={field}>
                            <label>Data</label>
                            <input
                                type="date"
                                value={form.data}
                                onChange={e =>
                                    setForm({ ...form, data: e.target.value })
                                }
                            />
                        </div>

                        <div style={field}>
                            <label>Nome</label>
                            <input
                                value={form.nome}
                                onChange={e =>
                                    setForm({ ...form, nome: e.target.value })
                                }
                            />
                        </div>

                        <div style={field}>
                            <label>Telefone</label>
                            <input
                                value={form.telefone}
                                onChange={e =>
                                    setForm({ ...form, telefone: e.target.value })
                                }
                            />
                        </div>

                        <div style={actions}>
                            <button onClick={() => setOpen(false)}>
                                Cancelar
                            </button>
                            <button onClick={handleSave} disabled={loading}>
                                Salvar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}

const overlay: React.CSSProperties = {
    position: 'fixed',
    inset: 0,
    background: 'rgba(0,0,0,0.4)',
    backdropFilter: 'blur(6px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 50
};

const modal: React.CSSProperties = {
    background: '#ffffff',
    padding: 24,
    borderRadius: 8,
    minWidth: 360,
    boxShadow: '0 10px 25px rgba(0,0,0,0.2)'
};

const title: React.CSSProperties = {
    marginBottom: 16,
    fontSize: 18,
    fontWeight: 600
};

const field: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
    marginBottom: 12
};

const actions: React.CSSProperties = {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: 8,
    marginTop: 16
};
