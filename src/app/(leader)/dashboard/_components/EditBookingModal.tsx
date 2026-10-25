/**
 * Contexto e regras: leia CLAUDE.md e docs/routes_dashboard.md antes de alterar.
 * Mudou o comportamento? Atualize o doc na mesma mudança.
 */
'use client';

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { normalizarTelefone } from '@/lib/phone';
import { Spinner } from '@/components/Spinner';
import { Modal } from '@/components/Modal';
import { ErrorMessage } from '@/components/ErrorMessage';
import { botao } from '@/components/button-classes';
import { campo } from '@/components/field-classes';

type Props = {
    id: number;
    data: string;
    nome: string;
    telefone: string;
};

export default function EditBookingModal({ id, data, nome, telefone }: Props) {
    const router = useRouter();
    const [erroNome, setErroNome] = useState(false);
    const [erroTelefone, setErroTelefone] = useState(false);
    const [erro, setErro] = useState('');
    const nomeRef = useRef<HTMLInputElement>(null);
    const telefoneRef = useRef<HTMLInputElement>(null);

    const [open, setOpen] = useState(false);
    const [form, setForm] = useState({ data, nome, telefone });
    const [acao, setAcao] = useState<'salvar' | 'remover' | null>(null);
    const ocupado = acao !== null;
    const [confirmarRemocao, setConfirmarRemocao] = useState(false);

    function fechar() {
        setOpen(false);
        setConfirmarRemocao(false);
        setErro('');
    }

    async function handleSave() {
        const nomeInvalido = form.nome.trim().length < 2;
        const telefoneInvalido = !normalizarTelefone(form.telefone);

        setErroNome(nomeInvalido);
        setErroTelefone(telefoneInvalido);
        setErro('');

        if (nomeInvalido || telefoneInvalido) {
            (nomeInvalido ? nomeRef : telefoneRef).current?.focus();
            return;
        }

        await enviar('salvar');
    }

    async function enviar(tipo: 'salvar' | 'remover') {
        if (ocupado) return;
        setAcao(tipo);
        setErro('');
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
            } else if (tipo === 'salvar' && res.status === 409) {
                setErro('Já há um almoço nesse dia. Escolha outro dia e toque em Salvar de novo.');
            } else {
                setErro(tipo === 'salvar'
                    ? 'Não foi possível salvar. Confira se já não há almoço nesse dia e tente de novo.'
                    : 'Não foi possível remover. Atualize a página e tente de novo.');
            }
        } catch {
            setErro('Sem conexão com a internet. Verifique a internet e tente de novo.');
        } finally {
            setAcao(null);
        }
    }

    const tituloId = `editar-${id}-titulo`;

    return (
        <>
            <button
                onClick={() => setOpen(true)}
                aria-label="Editar agendamento"
                className="flex min-h-11 min-w-11 items-center justify-center rounded-xl text-secondary transition hover:bg-secondary/10 active:scale-95 cursor-pointer"
            >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M12 20h9" />
                    <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z" />
                </svg>
            </button>

            {open && (
                <Modal onClose={fechar} labelledBy={tituloId} className="max-w-lg">
                    <div className="mb-5 flex items-center justify-between gap-3">
                        <h3 id={tituloId} className="text-xl font-semibold text-text">
                            Editar agendamento
                        </h3>
                        <button
                            type="button"
                            onClick={fechar}
                            aria-label="Fechar"
                            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-muted transition hover:bg-slate-100 cursor-pointer"
                        >
                            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                                <path d="M18 6 6 18M6 6l12 12" />
                            </svg>
                        </button>
                    </div>

                    <form
                        noValidate
                        onSubmit={e => {
                            e.preventDefault();
                            handleSave();
                        }}
                    >
                        <div className="flex flex-col gap-4">
                            <div className="flex flex-col gap-1.5">
                                <label htmlFor={`data-${id}`} className="text-base font-semibold text-text">
                                    Data
                                </label>
                                <input
                                    id={`data-${id}`}
                                    type="date"
                                    value={form.data}
                                    onChange={e =>
                                        setForm({ ...form, data: e.target.value })
                                    }
                                    className={campo()}
                                />
                            </div>

                            <div className="flex flex-col gap-1.5">
                                <label htmlFor={`nome-${id}`} className="text-base font-semibold text-text">
                                    Nome
                                </label>
                                <input
                                    ref={nomeRef}
                                    id={`nome-${id}`}
                                    autoComplete="off"
                                    enterKeyHint="next"
                                    value={form.nome}
                                    aria-invalid={erroNome}
                                    aria-describedby={erroNome ? `nome-${id}-erro` : undefined}
                                    onChange={e => {
                                        setForm({ ...form, nome: e.target.value });
                                        if (erroNome) setErroNome(false);
                                    }}
                                    onKeyDown={e => {
                                        if (e.key === 'Enter') {
                                            e.preventDefault();
                                            telefoneRef.current?.focus();
                                        }
                                    }}
                                    className={campo(erroNome)}
                                />
                                {erroNome && (
                                    <p id={`nome-${id}-erro`} className="mt-0.5 text-base text-accent">
                                        Informe o nome.
                                    </p>
                                )}
                            </div>

                            <div className="flex flex-col gap-1.5">
                                <label htmlFor={`tel-${id}`} className="text-base font-semibold text-text">
                                    Telefone
                                </label>
                                <input
                                    ref={telefoneRef}
                                    id={`tel-${id}`}
                                    autoComplete="off"
                                    type="tel"
                                    inputMode="tel"
                                    enterKeyHint="done"
                                    maxLength={25}
                                    value={form.telefone}
                                    aria-invalid={erroTelefone}
                                    aria-describedby={erroTelefone ? `tel-${id}-erro` : undefined}
                                    onChange={e => {
                                        setForm({ ...form, telefone: e.target.value });
                                        if (erroTelefone) setErroTelefone(false);
                                    }}
                                    onBlur={() => {
                                        const lido = normalizarTelefone(form.telefone);
                                        if (lido) setForm({ ...form, telefone: lido.formatado });
                                    }}
                                    className={campo(erroTelefone)}
                                />
                                {erroTelefone && (
                                    <p id={`tel-${id}-erro`} className="mt-0.5 text-base text-accent">
                                        Confira o telefone, com DDD (ou + e o código do país).
                                    </p>
                                )}
                            </div>
                        </div>

                        {erro && <ErrorMessage key={erro} className="mt-4">{erro}</ErrorMessage>}

                        <div className="mt-6 flex flex-col gap-3">
                            <div className="flex flex-wrap gap-3">
                                <button
                                    type="button"
                                    onClick={fechar}
                                    className={`${botao('secundario', 'normal')} grow basis-28`}
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    disabled={ocupado}
                                    aria-busy={acao === 'salvar'}
                                    className={`${botao('primario', 'normal')} grow basis-28`}
                                >
                                    {acao === 'salvar' && <Spinner />}
                                    {acao === 'salvar' ? 'Salvando…' : 'Salvar'}
                                </button>
                            </div>

                            {confirmarRemocao ? (
                                <div className="flex flex-wrap gap-3">
                                    <button
                                        type="button"
                                        onClick={() => setConfirmarRemocao(false)}
                                        disabled={ocupado}
                                        className={`${botao('secundario', 'normal')} grow basis-28`}
                                    >
                                        Manter
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => enviar('remover')}
                                        disabled={ocupado}
                                        aria-busy={acao === 'remover'}
                                        className={`${botao('perigo', 'normal')} grow basis-28`}
                                    >
                                        {acao === 'remover' && <Spinner />}
                                        {acao === 'remover' ? 'Removendo…' : 'Confirmar remoção'}
                                    </button>
                                </div>
                            ) : (
                                <button
                                    type="button"
                                    onClick={() => setConfirmarRemocao(true)}
                                    disabled={ocupado}
                                    className="min-h-12 w-full rounded-xl px-4 text-base font-semibold text-accent transition hover:bg-accent/10 disabled:opacity-50 cursor-pointer"
                                >
                                    Remover agendamento
                                </button>
                            )}
                        </div>
                    </form>
                </Modal>
            )}
        </>
    );
}
