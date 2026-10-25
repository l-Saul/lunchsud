/**
 * Contexto e regras: leia CLAUDE.md e docs/routes_home.md antes de alterar.
 * Mudou o comportamento? Atualize o doc na mesma mudança.
 */
'use client';

import { useEffect, useState } from 'react';
import { Modal } from '@/components/Modal';
import { WardForm, type ContaLogada } from '@/components/WardForm';
import { Spinner } from '@/components/Spinner';
import { botao } from '@/components/button-classes';

async function buscarConta(): Promise<ContaLogada | null> {
    try {
        const res = await fetch('/api/conta', { cache: 'no-store' });
        const json = await res.json();
        return json?.logado ? { nome: json.nome ?? '', email: json.email ?? '', ala: json.ala ?? null } : null;
    } catch {
        return null;
    }
}

export function RequestWard() {
    const [aberto, setAberto] = useState(false);
    const [conta, setConta] = useState<ContaLogada | null | undefined>(undefined);
    const [enviado, setEnviado] = useState<{ email: string; usouConta: boolean } | null>(null);

    async function abrir() {
        setConta(undefined);
        setAberto(true);
        setConta(await buscarConta());
    }

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        if (window.location.hash === '#nova-ala') abrir();
    }, []);

    function fechar() {
        setAberto(false);
        setEnviado(null);
    }

    return (
        <section id="nova-ala" aria-labelledby="nova-ala-titulo" className="scroll-mt-6">
            <div className="flex flex-col gap-4 rounded-2xl bg-background p-5 shadow-md ring-1 ring-primary/10 sm:p-6">
                <div>
                    <h2 id="nova-ala-titulo" className="text-xl font-semibold text-text">
                        Sua ala ou ramo ainda não usa o calendário?
                    </h2>
                    <p className="mt-2 text-base text-muted">
                        Quem faz parte da presidência pode pedir. Quando o pedido for aprovado, a ala
                        aparece aqui e chega um e-mail.
                    </p>
                </div>
                <button type="button" onClick={abrir} aria-haspopup="dialog" className={`${botao('secundario')} w-full`}>
                    Pedir para usar o calendário
                </button>
            </div>

            {aberto && (
                <Modal onClose={fechar} labelledBy="pedido-titulo" className="max-w-lg">
                    <div className="mb-5 flex items-center justify-between gap-3">
                        <h2 id="pedido-titulo" className="min-w-0 hyphens-auto wrap-break-word text-xl font-semibold text-text">
                            {enviado ? 'Pedido enviado!' : 'Pedir para usar o calendário'}
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

                    {enviado ? (
                        <div role="status" className="flex animate-aparecer flex-col gap-4">
                            <p className="text-lg text-text">
                                Quando a ala e o acesso ao painel forem aprovados, chega um e-mail para{' '}
                                <strong className="wrap-anywhere">{enviado.email}</strong>.
                            </p>
                            <p className="text-base text-muted">
                                {enviado.usouConta
                                    ? 'Depois, é só entrar no painel com a sua conta.'
                                    : 'Depois, é só entrar no painel com esse e-mail e a senha que você escolheu.'}
                            </p>
                            <button type="button" onClick={fechar} className={`${botao('primario', 'grande')} w-full`}>
                                Fechar
                            </button>
                        </div>
                    ) : conta === undefined ? (
                        <p role="status" className="flex items-center justify-center gap-2 py-6 text-base text-muted">
                            <Spinner className="h-5 w-5" /> Carregando…
                        </p>
                    ) : (
                        <WardForm modo="pedido" contaLogada={conta} onEnviado={(email, usouConta) => setEnviado({ email, usouConta })} />
                    )}
                </Modal>
            )}
        </section>
    );
}
