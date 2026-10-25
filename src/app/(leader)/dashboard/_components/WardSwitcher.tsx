/**
 * Contexto e regras: leia CLAUDE.md e docs/routes_dashboard.md antes de alterar.
 * Mudou o comportamento? Atualize o doc na mesma mudança.
 */
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { LoadingOverlay } from '@/components/LoadingOverlay';
import { Modal } from '@/components/Modal';
import { WardForm } from '@/components/WardForm';
import { WardFilter } from '@/components/WardFilter';
import { ErrorMessage } from '@/components/ErrorMessage';
import { Spinner } from '@/components/Spinner';
import { botao } from '@/components/button-classes';

type Ala = { id: number; nome: string; estado: string; cidade: string };

export type PedidoAla = {
    id: number;
    nome: string;
    cidade: string;
    estado: string;
    pedidoEm: string;
    contaNova: boolean;
    lider: { nome: string; email: string } | null;
};

export function WardSwitcher({ alas, atualId, pedidos }: { alas: Ala[]; atualId: number | null; pedidos: PedidoAla[] }) {
    const router = useRouter();

    const [aberto, setAberto] = useState(false);
    const [criando, setCriando] = useState(false);
    const [transicao, setTransicao] = useState<string | null>(null);
    const [acao, setAcao] = useState<{ id: number; tipo: 'aprovar' | 'recusar' } | null>(null);
    const [confirmarRecusa, setConfirmarRecusa] = useState<number | null>(null);
    const [erro, setErro] = useState('');

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setTransicao(null);
    }, [atualId]);

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setAcao(null);
        setConfirmarRecusa(null);
    }, [pedidos]);

    function fechar() {
        setAberto(false);
        setCriando(false);
        setConfirmarRecusa(null);
        setErro('');
    }

    async function focarAla(alaId: number) {
        const res = await fetch('/api/ala-atual', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ alaId }),
        }).catch(() => null);
        return res?.ok === true;
    }

    async function trocar(alaId: number) {
        if (alaId === atualId || transicao) return;

        fechar();
        setTransicao('Trocando de ala…');
        if (!(await focarAla(alaId))) {
            setTransicao(null);
            return;
        }
        router.refresh();
    }

    async function entrarNaNova(novaId: number | undefined) {
        fechar();
        if (novaId && (await focarAla(novaId))) setTransicao('Abrindo a ala…');
        router.refresh();
    }

    async function decidir(alaId: number, tipo: 'aprovar' | 'recusar') {
        if (acao) return;
        setAcao({ id: alaId, tipo });
        setErro('');
        const res = await fetch(`/api/alas/${tipo}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ alaId }),
        }).catch(() => null);

        if (!res?.ok) {
            setAcao(null);
            setErro(res
                ? `Não foi possível ${tipo === 'aprovar' ? 'aprovar' : 'recusar'} o pedido. Tente de novo.`
                : 'Sem conexão com a internet. Verifique e tente de novo.');
            return;
        }

        if (tipo === 'aprovar') {
            await entrarNaNova(alaId);
        } else {
            router.refresh();
        }
    }

    const esperando = pedidos.length;
    const rotuloBotao = esperando
        ? `Administração geral: ${esperando} ${esperando === 1 ? 'ala esperando' : 'alas esperando'} aprovação`
        : 'Administração geral';

    return (
        <>
            {transicao && <LoadingOverlay texto={transicao} />}

            <div className="fixed bottom-4 left-4 z-30 sm:bottom-6 sm:left-6">
                <button
                    type="button"
                    onClick={() => setAberto(true)}
                    aria-haspopup="dialog"
                    aria-label={rotuloBotao}
                    title={rotuloBotao}
                    className={`relative flex size-15 items-center justify-center rounded-full bg-gold text-primary shadow-md transition hover:opacity-100 focus-visible:opacity-100 active:scale-[0.98] cursor-pointer sm:size-18 ${esperando ? 'opacity-100' : 'opacity-60'}`}
                >
                    <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="sm:size-9">
                        <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
                        <circle cx="12" cy="12" r="3" />
                    </svg>
                    {esperando > 0 && (
                        <span aria-hidden="true" className="absolute -right-1 -top-1 flex h-7 min-w-7 items-center justify-center rounded-full bg-accent px-1.5 text-base font-bold leading-none text-white ring-2 ring-white">
                            {esperando}
                        </span>
                    )}
                </button>
            </div>

            {aberto && (
                <Modal onClose={fechar} labelledBy="administracao-titulo" className="max-w-lg">
                    <div className="mb-5 flex items-center justify-between gap-3">
                        <h2 id="administracao-titulo" className="min-w-0 hyphens-auto wrap-break-word text-xl font-semibold text-text">
                            Administração geral
                        </h2>
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

                    {esperando > 0 && (
                        <div className="mb-5 flex flex-col gap-3 border-b border-slate-200 pb-5">
                            <h3 id="pedidos-titulo" className="text-lg font-semibold text-text">
                                Esperando aprovação ({esperando})
                            </h3>
                            {erro && <ErrorMessage key={erro}>{erro}</ErrorMessage>}
                            <ul aria-labelledby="pedidos-titulo" className="flex flex-col gap-3">
                                {pedidos.map(p => {
                                    const ocupado = acao?.id === p.id;
                                    return (
                                        <li key={p.id} className="flex flex-col gap-3 rounded-2xl border border-slate-200 p-4">
                                            <div className="min-w-0">
                                                <p className="wrap-anywhere text-base font-semibold text-text">{p.nome}</p>
                                                <p className="text-base text-muted">{p.cidade} ({p.estado}) · pedido em {p.pedidoEm}</p>
                                                {p.lider && (
                                                    <p className="wrap-anywhere text-base text-muted">
                                                        Líder: <span className="text-text">{p.lider.nome}</span> · {p.lider.email}
                                                    </p>
                                                )}
                                            </div>

                                            {confirmarRecusa === p.id ? (
                                                <div className="flex flex-col gap-3 rounded-xl bg-accent-soft p-3">
                                                    <p className="text-base text-text">
                                                        Recusar e apagar este pedido?
                                                        {p.contaNova && ' A conta criada no pedido também é apagada.'}
                                                    </p>
                                                    <div className="flex flex-wrap gap-3">
                                                        <button
                                                            type="button"
                                                            onClick={() => setConfirmarRecusa(null)}
                                                            disabled={ocupado}
                                                            className={`${botao('secundario')} grow basis-32`}
                                                        >
                                                            Voltar
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => decidir(p.id, 'recusar')}
                                                            disabled={acao !== null}
                                                            aria-busy={ocupado}
                                                            className={`${botao('perigo')} grow basis-32`}
                                                        >
                                                            {ocupado && <Spinner className="h-4 w-4" />}
                                                            {ocupado ? 'Recusando…' : 'Sim, recusar'}
                                                        </button>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="flex flex-wrap gap-3">
                                                    <button
                                                        type="button"
                                                        onClick={() => decidir(p.id, 'aprovar')}
                                                        disabled={acao !== null}
                                                        aria-busy={ocupado}
                                                        className={`${botao('primario')} grow basis-40`}
                                                    >
                                                        {ocupado && <Spinner className="h-4 w-4" />}
                                                        {ocupado ? 'Aprovando…' : 'Aprovar ala'}
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => setConfirmarRecusa(p.id)}
                                                        disabled={acao !== null}
                                                        className={`${botao('secundario')} grow basis-32`}
                                                    >
                                                        Recusar
                                                    </button>
                                                </div>
                                            )}
                                        </li>
                                    );
                                })}
                            </ul>
                            <p className="text-base text-muted">
                                Depois de aprovar a ala, aprove o líder na parte Usuários do painel dela.
                            </p>
                        </div>
                    )}

                    {alas.length > 0 && (
                        <div className="flex flex-col gap-4">
                            <h3 className="text-lg font-semibold text-text">Trocar de ala</h3>
                            <WardFilter
                                alas={alas.map(a => ({ ...a, chave: String(a.id) }))}
                                instrucao="Toque na ala que quer abrir."
                                marcada={atualId === null ? null : String(atualId)}
                                desativado={transicao !== null}
                                onEscolher={a => trocar(Number(a.chave))}
                            />
                        </div>
                    )}

                    <div className={alas.length > 0 ? 'mt-5 border-t border-slate-200 pt-5' : ''}>
                        {criando ? (
                            <div className="flex animate-aparecer flex-col gap-4">
                                <h3 className="text-lg font-semibold text-text">Nova ala</h3>
                                <WardForm modo="owner" onCriada={entrarNaNova} onCancelar={() => setCriando(false)} />
                            </div>
                        ) : (
                            <button
                                type="button"
                                onClick={() => setCriando(true)}
                                className="flex min-h-12 w-full items-center justify-center gap-2 rounded-xl border border-dashed border-slate-300 px-4 text-base font-semibold text-secondary transition hover:border-solid hover:border-secondary hover:bg-secondary/10 cursor-pointer"
                            >
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                                    <path d="M12 5v14M5 12h14" />
                                </svg>
                                Criar nova ala
                            </button>
                        )}
                    </div>
                </Modal>
            )}
        </>
    );
}
