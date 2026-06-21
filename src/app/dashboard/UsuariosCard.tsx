'use client';

// Card de Usuários do painel. Mostra sempre os usuários da ala em foco (member: a
// sua; owner: a ala selecionada). Permite aprovar pendentes e remover acesso —
// a remoção pede confirmação num modal que cobre a tela com fundo desfocado.

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';

export type Usuario = {
    id: number;          // id do vínculo ala_membro
    nome: string;
    email: string;
    status: 'pendente' | 'aprovado';
};

export function UsuariosCard({ usuarios }: { usuarios: Usuario[] }) {
    const router = useRouter();
    const [carregando, setCarregando] = useState<number | null>(null);
    const [confirmar, setConfirmar] = useState<Usuario | null>(null);

    async function acao(url: string, membroId: number) {
        if (carregando) return;
        setCarregando(membroId);
        const res = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ membroId }),
        });
        setCarregando(null);
        if (res.ok) router.refresh();
        else alert('Não foi possível concluir a ação.');
    }

    async function confirmarRemocao() {
        if (!confirmar) return;
        const alvo = confirmar;
        setConfirmar(null);
        await acao('/api/acesso/remover', alvo.id);
    }

    // Fecha a confirmação com a tecla Esc.
    useEffect(() => {
        if (!confirmar) return;
        const onKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') setConfirmar(null);
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [confirmar]);

    const pendentes = usuarios.filter(u => u.status === 'pendente');
    const aprovados = usuarios.filter(u => u.status === 'aprovado');

    function Linha({ u }: { u: Usuario }) {
        return (
            <li className="flex items-center gap-3 rounded-2xl border border-slate-200 p-3">
                <div className="min-w-0 flex-1">
                    <p className="truncate font-medium text-text">{u.nome || '(sem nome)'}</p>
                    <p className="truncate text-sm text-muted">{u.email}</p>
                </div>

                {u.status === 'pendente' && (
                    <button
                        onClick={() => acao('/api/acesso/aprovar', u.id)}
                        disabled={carregando === u.id}
                        className="min-h-11 rounded-xl bg-secondary px-3 text-sm font-semibold text-white shadow-sm transition duration-200 hover:opacity-95 enabled:hover:-translate-y-0.5 enabled:hover:shadow-md disabled:opacity-50 cursor-pointer"
                    >
                        Aprovar
                    </button>
                )}

                <button
                    onClick={() => setConfirmar(u)}
                    disabled={carregando === u.id}
                    aria-label="Remover usuário"
                    className="min-h-11 rounded-xl px-3 text-sm font-medium text-accent transition duration-200 hover:bg-accent/10 enabled:active:scale-95 disabled:opacity-50 cursor-pointer"
                >
                    Remover
                </button>
            </li>
        );
    }

    return (
        <>
            <div className="flex items-center gap-2">
                <span className="h-5 w-1.5 rounded-full bg-accent" />
                <h2 className="text-lg font-semibold text-text">Usuários</h2>
            </div>

            {usuarios.length === 0 ? (
                <p className="text-sm text-muted">Nenhum usuário vinculado ainda.</p>
            ) : (
                <div className="flex flex-col gap-5">
                    {pendentes.length > 0 && (
                        <div className="flex flex-col gap-3">
                            <h3 className="text-base font-semibold text-text">
                                Aguardando aprovação
                            </h3>
                            <ul className="flex flex-col gap-3">
                                {pendentes.map(u => <Linha key={u.id} u={u} />)}
                            </ul>
                        </div>
                    )}

                    <div className="flex flex-col gap-3">
                        <h3 className="text-base font-semibold text-text">Com acesso</h3>
                        {aprovados.length === 0 ? (
                            <p className="text-sm text-muted">Ninguém com acesso ainda.</p>
                        ) : (
                            <ul className="flex flex-col gap-3">
                                {aprovados.map(u => <Linha key={u.id} u={u} />)}
                            </ul>
                        )}
                    </div>
                </div>
            )}

            {/* Confirmação de remoção — cobre a tela, fundo desfocado. */}
            <AnimatePresence>
                {confirmar && (
                    <motion.div
                        onClick={() => setConfirmar(null)}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="fixed inset-0 z-60 flex items-center justify-center bg-primary/50 p-4 backdrop-blur-sm"
                    >
                        <motion.div
                            onClick={e => e.stopPropagation()}
                            role="alertdialog"
                            aria-modal="true"
                            aria-label="Confirmar remoção de acesso"
                            initial={{ opacity: 0, scale: 0.96, y: 12 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.96, y: 12 }}
                            transition={{ duration: 0.2, ease: 'easeOut' }}
                            className="w-full max-w-sm rounded-2xl bg-background p-6 text-center shadow-2xl"
                        >
                            <h3 className="text-xl font-semibold text-text">Remover acesso?</h3>
                            <p className="mt-3 text-base text-muted">
                                Tem certeza que deseja remover o acesso de{' '}
                                <strong className="text-text">{confirmar.nome || confirmar.email}</strong>?
                                Para voltar, a pessoa precisará pedir acesso de novo.
                            </p>

                            <div className="mt-6 flex gap-3">
                                <button
                                    onClick={() => setConfirmar(null)}
                                    className="min-h-12 flex-1 rounded-xl border border-slate-300 px-4 text-base font-medium text-text transition hover:bg-slate-100 cursor-pointer"
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={confirmarRemocao}
                                    className="min-h-12 flex-1 rounded-xl bg-accent px-4 text-base font-semibold text-white shadow-md transition hover:opacity-95 cursor-pointer"
                                >
                                    Remover
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}
