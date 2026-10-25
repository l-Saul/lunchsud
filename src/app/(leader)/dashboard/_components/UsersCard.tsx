/**
 * Contexto e regras: leia CLAUDE.md e docs/routes_dashboard.md antes de alterar.
 * Mudou o comportamento? Atualize o doc na mesma mudança.
 */
'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Spinner } from '@/components/Spinner';
import { Modal } from '@/components/Modal';
import { ErrorMessage } from '@/components/ErrorMessage';
import { botao } from '@/components/button-classes';

export type Usuario = {
    id: number;
    nome: string;
    email: string;
    status: 'pendente' | 'aprovado';
    voce: boolean;
};

type Acao = 'aprovar' | 'remover';

function Linha({ u, emAndamento, onAprovar, onRemover }: {
    u: Usuario;
    emAndamento: { id: number; acao: Acao } | null;
    onAprovar: () => void;
    onRemover: () => void;
}) {
    const aprovando = emAndamento?.id === u.id && emAndamento.acao === 'aprovar';
    const removendo = emAndamento?.id === u.id && emAndamento.acao === 'remover';

    return (
        <li className="flex flex-wrap items-center gap-x-3 gap-y-2 rounded-2xl border border-slate-200 p-3">
            <div className="min-w-0 flex-1 basis-40">
                <p className="wrap-anywhere font-semibold text-text">
                    {u.nome || '(sem nome)'}
                    {u.voce && <span className="font-normal text-muted"> (você)</span>}
                </p>
                <p className="wrap-anywhere text-base text-muted">{u.email}</p>
            </div>

            {u.status === 'pendente' && (
                <button
                    onClick={onAprovar}
                    disabled={emAndamento !== null}
                    aria-busy={aprovando}
                    className={botao('primario', 'normal')}
                >
                    {aprovando && <Spinner className="h-4 w-4" />}
                    {aprovando ? 'Aprovando…' : 'Aprovar'}
                </button>
            )}

            <button
                onClick={onRemover}
                disabled={emAndamento !== null}
                aria-busy={removendo}
                className="flex min-h-11 items-center gap-2 rounded-xl px-3 text-base font-semibold text-accent transition duration-100 hover:bg-accent/10 enabled:active:scale-[0.97] disabled:opacity-60 cursor-pointer"
            >
                {removendo && <Spinner className="h-4 w-4" />}
                {removendo ? 'Removendo…' : 'Remover'}
            </button>
        </li>
    );
}

export function UsersCard({ usuarios }: { usuarios: Usuario[] }) {
    const router = useRouter();
    const [emAndamento, setEmAndamento] = useState<{ id: number; acao: Acao } | null>(null);
    const [, iniciarAtualizacao] = useTransition();
    const [confirmar, setConfirmar] = useState<Usuario | null>(null);
    const [erro, setErro] = useState('');

    async function executar(acao: Acao, membroId: number, proprio = false) {
        if (emAndamento) return;
        setErro('');
        setEmAndamento({ id: membroId, acao });
        try {
            const res = await fetch(`/api/acesso/${acao}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ membroId }),
            });
            if (!res.ok) {
                setEmAndamento(null);
                setErro(acao === 'aprovar'
                    ? 'Não foi possível aprovar. Atualize a página e tente de novo.'
                    : 'Não foi possível remover o acesso. Atualize a página e tente de novo.');
                return;
            }
            if (proprio) {
                router.push('/acesso');
                return;
            }
            iniciarAtualizacao(() => {
                router.refresh();
                setEmAndamento(null);
            });
        } catch {
            setEmAndamento(null);
            setErro('Sem conexão com a internet. Verifique a internet e tente de novo.');
        }
    }

    async function confirmarRemocao() {
        if (!confirmar) return;
        const alvo = confirmar;
        setConfirmar(null);
        await executar('remover', alvo.id, alvo.voce);
    }

    const pendentes = usuarios.filter(u => u.status === 'pendente');
    const aprovados = usuarios.filter(u => u.status === 'aprovado');
    const unicoComAcesso = confirmar?.voce && confirmar.status === 'aprovado' && aprovados.length === 1;

    return (
        <section className="flex flex-col gap-5 rounded-3xl bg-background p-4 shadow-md ring-1 ring-primary/10 sm:p-8">
            <div className="flex items-center gap-2">
                <span className="h-5 w-1.5 rounded-full bg-accent" />
                <h2 className="min-w-0 hyphens-auto wrap-break-word text-xl font-semibold text-text">Usuários</h2>
            </div>

            {erro && <ErrorMessage key={erro}>{erro}</ErrorMessage>}

            {usuarios.length === 0 ? (
                <p className="text-base text-muted">Nenhum usuário vinculado ainda.</p>
            ) : (
                <div className="flex flex-col gap-5">
                    {pendentes.length > 0 && (
                        <div className="flex flex-col gap-3">
                            <h3 className="text-lg font-semibold text-text">
                                Aguardando aprovação
                            </h3>
                            <ul className="flex flex-col gap-3">
                                {pendentes.map(u => (
                                    <Linha key={u.id} u={u} emAndamento={emAndamento} onAprovar={() => executar('aprovar', u.id)} onRemover={() => setConfirmar(u)} />
                                ))}
                            </ul>
                        </div>
                    )}

                    <div className="flex flex-col gap-3">
                        <h3 className="text-lg font-semibold text-text">Com acesso</h3>
                        {aprovados.length === 0 ? (
                            <p className="text-base text-muted">Ninguém com acesso ainda.</p>
                        ) : (
                            <ul className="flex flex-col gap-3">
                                {aprovados.map(u => (
                                    <Linha key={u.id} u={u} emAndamento={emAndamento} onAprovar={() => executar('aprovar', u.id)} onRemover={() => setConfirmar(u)} />
                                ))}
                            </ul>
                        )}
                    </div>
                </div>
            )}

            {confirmar && (
                <Modal onClose={() => setConfirmar(null)} labelledBy="remover-acesso-titulo" alerta className="max-w-sm text-center">
                    <h3 id="remover-acesso-titulo" className="text-xl font-semibold text-text">
                        {confirmar.voce ? 'Tirar o seu acesso?' : 'Remover acesso?'}
                    </h3>
                    {confirmar.voce ? (
                        <>
                            {unicoComAcesso && (
                                <p className="mt-3 rounded-xl bg-accent-soft px-3 py-2.5 text-base font-semibold text-accent">
                                    Você é a única pessoa com acesso a esta ala. Sem você, ninguém vê os almoços nem aprova pedidos.
                                </p>
                            )}
                            <p className="mt-3 text-base text-muted">
                                Você vai sair do painel desta ala. Para voltar, precisa pedir acesso de novo.
                            </p>
                        </>
                    ) : (
                        <p className="mt-3 text-base text-muted">
                            Tem certeza que deseja remover o acesso de{' '}
                            <strong className="text-text">{confirmar.nome || confirmar.email}</strong>?
                            Para voltar, a pessoa precisará pedir acesso de novo.
                        </p>
                    )}

                    <div className="mt-6 flex flex-wrap gap-3">
                        <button
                            onClick={() => setConfirmar(null)}
                            data-foco-inicial
                            className={`${botao('secundario', 'normal')} grow basis-28`}
                        >
                            Cancelar
                        </button>
                        <button
                            onClick={confirmarRemocao}
                            className={`${botao('perigo', 'normal')} grow basis-28`}
                        >
                            {confirmar.voce ? 'Tirar meu acesso' : 'Remover'}
                        </button>
                    </div>
                </Modal>
            )}
        </section>
    );
}
