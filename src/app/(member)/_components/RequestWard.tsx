/**
 * Contexto e regras: leia CLAUDE.md e docs/routes_home.md antes de alterar.
 * Mudou o comportamento? Atualize o doc na mesma mudança.
 */
'use client';

import { useEffect, useState } from 'react';
import { Modal } from '@/components/Modal';
import { WardForm } from '@/components/WardForm';
import { botao } from '@/components/button-classes';

export function RequestWard() {
    const [aberto, setAberto] = useState(false);
    const [enviadoPara, setEnviadoPara] = useState<string | null>(null);

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        if (window.location.hash === '#nova-ala') setAberto(true);
    }, []);

    function fechar() {
        setAberto(false);
        setEnviadoPara(null);
    }

    return (
        <section id="nova-ala" aria-labelledby="nova-ala-titulo" className="scroll-mt-6">
            <div className="flex flex-col gap-4 rounded-2xl bg-background px-5 py-5 ring-1 ring-primary/10">
                <div>
                    <h2 id="nova-ala-titulo" className="text-lg font-semibold text-text">
                        Sua ala ou ramo ainda não está aqui?
                    </h2>
                    <p className="mt-1 text-base text-muted">
                        A presidência pode pedir para usar o calendário. O pedido é conferido antes
                        de a ala aparecer no site.
                    </p>
                </div>
                <button type="button" onClick={() => setAberto(true)} aria-haspopup="dialog" className={`${botao('secundario')} w-full`}>
                    Pedir para usar o calendário
                </button>
            </div>

            {aberto && (
                <Modal onClose={fechar} labelledBy="pedido-titulo" className="max-w-lg">
                    <div className="mb-5 flex items-center justify-between gap-3">
                        <h2 id="pedido-titulo" className="min-w-0 hyphens-auto wrap-break-word text-xl font-semibold text-text">
                            {enviadoPara ? 'Pedido enviado!' : 'Pedir para usar o calendário'}
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

                    {enviadoPara ? (
                        <div role="status" className="flex animate-aparecer flex-col gap-4">
                            <p className="text-lg text-text">
                                O pedido foi enviado. Quando a ala e o acesso ao painel forem aprovados, chega
                                um e-mail para <strong className="wrap-anywhere">{enviadoPara}</strong>.
                            </p>
                            <p className="text-base text-muted">
                                Depois, é só entrar no painel com esse e-mail e a senha que você escolheu.
                            </p>
                            <button type="button" onClick={fechar} className={`${botao('primario', 'grande')} w-full`}>
                                Fechar
                            </button>
                        </div>
                    ) : (
                        <WardForm modo="pedido" onEnviado={setEnviadoPara} />
                    )}
                </Modal>
            )}
        </section>
    );
}
