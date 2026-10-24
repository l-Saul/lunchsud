/**
 * Contexto e regras: leia CLAUDE.md e docs/routes_dashboard.md antes de alterar.
 * Mudou o comportamento? Atualize o doc na mesma mudança.
 */
'use client';

import { useEffect, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Spinner } from '@/components/Spinner';
import { useScrollLock } from '@/hooks/use-scroll-lock';

export type Usuario = {
    id: number;
    nome: string;
    email: string;
    status: 'pendente' | 'aprovado';
};

type Acao = 'aprovar' | 'remover';

export function UsersCard({ usuarios }: { usuarios: Usuario[] }) {
    const router = useRouter();
    const [emAndamento, setEmAndamento] = useState<{ id: number; acao: Acao } | null>(null);
    const [, iniciarAtualizacao] = useTransition();
    const [confirmar, setConfirmar] = useState<Usuario | null>(null);

    async function executar(acao: Acao, membroId: number) {
        if (emAndamento) return;
        setEmAndamento({ id: membroId, acao });
        try {
            const res = await fetch(`/api/acesso/${acao}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ membroId }),
            });
            if (!res.ok) {
                setEmAndamento(null);
                alert('Não foi possível concluir a ação.');
                return;
            }
            iniciarAtualizacao(() => {
                router.refresh();
                setEmAndamento(null);
            });
        } catch {
            setEmAndamento(null);
            alert('Sem conexão com a internet. Verifique e tente de novo.');
        }
    }

    async function confirmarRemocao() {
        if (!confirmar) return;
        const alvo = confirmar;
        setConfirmar(null);
        await executar('remover', alvo.id);
    }

    useScrollLock(confirmar !== null);

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
        const aprovando = emAndamento?.id === u.id && emAndamento.acao === 'aprovar';
        const removendo = emAndamento?.id === u.id && emAndamento.acao === 'remover';

        return (
            <li className="flex flex-wrap items-center gap-x-3 gap-y-2 rounded-2xl border border-slate-200 p-3">
                <div className="min-w-0 flex-1 basis-40">
                    <p className="wrap-anywhere font-medium text-text">{u.nome || '(sem nome)'}</p>
                    <p className="wrap-anywhere text-base text-muted">{u.email}</p>
                </div>

                {u.status === 'pendente' && (
                    <button
                        onClick={() => executar('aprovar', u.id)}
                        disabled={emAndamento !== null}
                        aria-busy={aprovando}
                        className="flex min-h-11 items-center gap-2 rounded-xl bg-secondary px-3 text-base font-semibold text-white shadow-sm transition duration-100 hover:opacity-95 enabled:hover:shadow-md enabled:active:scale-[0.97] disabled:opacity-60 cursor-pointer"
                    >
                        {aprovando && <Spinner className="h-4 w-4" />}
                        {aprovando ? 'Aprovando…' : 'Aprovar'}
                    </button>
                )}

                <button
                    onClick={() => setConfirmar(u)}
                    disabled={emAndamento !== null}
                    aria-busy={removendo}
                    className="flex min-h-11 items-center gap-2 rounded-xl px-3 text-base font-medium text-accent transition duration-100 hover:bg-accent/10 enabled:active:scale-[0.97] disabled:opacity-60 cursor-pointer"
                >
                    {removendo && <Spinner className="h-4 w-4" />}
                    {removendo ? 'Removendo…' : 'Remover'}
                </button>
            </li>
        );
    }

    return (
        <section className="flex flex-col gap-5 rounded-3xl bg-background p-4 shadow-md ring-1 ring-primary/10 sm:p-8">
            <div className="flex items-center gap-2">
                <span className="h-5 w-1.5 rounded-full bg-accent" />
                <h2 className="text-xl font-semibold text-text">Usuários</h2>
            </div>

            {usuarios.length === 0 ? (
                <p className="text-base text-muted">Nenhum usuário vinculado ainda.</p>
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
                            <p className="text-base text-muted">Ninguém com acesso ainda.</p>
                        ) : (
                            <ul className="flex flex-col gap-3">
                                {aprovados.map(u => <Linha key={u.id} u={u} />)}
                            </ul>
                        )}
                    </div>
                </div>
            )}

            {confirmar && (
                <div
                    onClick={() => setConfirmar(null)}
                    className="fixed inset-0 z-60 flex animate-aparecer items-center justify-center bg-primary/50 p-4 backdrop-blur-sm"
                >
                    <div
                        onClick={e => e.stopPropagation()}
                        role="alertdialog"
                        aria-modal="true"
                        aria-label="Confirmar remoção de acesso"
                        className="w-full max-w-sm animate-surgir rounded-2xl bg-background p-6 text-center shadow-2xl"
                    >
                        <h3 className="text-xl font-semibold text-text">Remover acesso?</h3>
                        <p className="mt-3 text-base text-muted">
                            Tem certeza que deseja remover o acesso de{' '}
                            <strong className="text-text">{confirmar.nome || confirmar.email}</strong>?
                            Para voltar, a pessoa precisará pedir acesso de novo.
                        </p>

                        <div className="mt-6 flex flex-wrap gap-3">
                            <button
                                onClick={() => setConfirmar(null)}
                                className="min-h-12 grow basis-28 rounded-xl border border-slate-300 px-4 text-base font-medium text-text transition hover:bg-slate-100 cursor-pointer"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={confirmarRemocao}
                                className="min-h-12 grow basis-28 rounded-xl bg-accent px-4 text-base font-semibold text-white shadow-md transition duration-100 hover:opacity-95 active:scale-[0.98] cursor-pointer"
                            >
                                Remover
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </section>
    );
}
