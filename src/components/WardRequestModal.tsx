/**
 * Contexto e regras: leia CLAUDE.md e docs/src_components.md antes de alterar.
 * Mudou o comportamento? Atualize o doc na mesma mudança.
 */
'use client';

import { useEffect, useState } from 'react';
import { Modal } from '@/components/Modal';
import { WardForm, type ContaLogada } from '@/components/WardForm';
import { Spinner } from '@/components/Spinner';
import { BOTAO_FECHAR, botao } from '@/components/button-classes';

type Props = {
    onClose: () => void;
    conta?: ContaLogada | null;
    onEnviado?: (usouConta: boolean) => void;
};

async function buscarConta(): Promise<ContaLogada | null> {
    try {
        const res = await fetch('/api/conta', { cache: 'no-store' });
        const json = await res.json();
        return json?.logado ? { nome: json.nome ?? '', email: json.email ?? '', ala: json.ala ?? null } : null;
    } catch {
        return null;
    }
}

export function WardRequestModal({ onClose, conta: contaConhecida, onEnviado }: Props) {
    const [contaBuscada, setContaBuscada] = useState<ContaLogada | null | undefined>(undefined);
    const [enviado, setEnviado] = useState<{ email: string; usouConta: boolean } | null>(null);
    const conta = contaConhecida !== undefined ? contaConhecida : contaBuscada;
    const precisaBuscar = contaConhecida === undefined;

    useEffect(() => {
        if (!precisaBuscar) return;
        let ativo = true;
        buscarConta().then(c => {
            if (ativo) setContaBuscada(c);
        });
        return () => {
            ativo = false;
        };
    }, [precisaBuscar]);

    return (
        <Modal onClose={onClose} labelledBy="pedido-titulo" className="max-w-lg">
            <div className="mb-5 flex items-center justify-between gap-3">
                <h2 id="pedido-titulo" className="min-w-0 hyphens-auto wrap-break-word text-xl font-semibold text-text">
                    {enviado ? 'Pedido enviado!' : 'Pedir para usar o calendário'}
                </h2>
                <button
                    type="button"
                    onClick={onClose}
                    aria-label="Fechar"
                    className={BOTAO_FECHAR}
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
                    <button type="button" onClick={onClose} className={`${botao('primario', 'grande')} w-full`}>
                        Fechar
                    </button>
                </div>
            ) : conta === undefined ? (
                <p role="status" className="flex items-center justify-center gap-2 py-6 text-base text-muted">
                    <Spinner className="h-5 w-5" /> Carregando…
                </p>
            ) : (
                <WardForm
                    modo="pedido"
                    contaLogada={conta}
                    onEnviado={(email, usouConta) => {
                        setEnviado({ email, usouConta });
                        onEnviado?.(usouConta);
                    }}
                />
            )}
        </Modal>
    );
}
