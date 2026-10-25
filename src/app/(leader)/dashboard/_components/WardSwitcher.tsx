/**
 * Contexto e regras: leia CLAUDE.md e docs/routes_dashboard.md antes de alterar.
 * Mudou o comportamento? Atualize o doc na mesma mudança.
 */
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { LoadingOverlay } from '@/components/LoadingOverlay';
import { Modal } from '@/components/Modal';
import { CreateWardForm } from './CreateWardForm';

type Ala = { id: number; nome: string };

export function WardSwitcher({ alas, atualId }: { alas: Ala[]; atualId: number | null }) {
    const router = useRouter();

    const [aberto, setAberto] = useState(false);
    const [transicao, setTransicao] = useState<string | null>(null);

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setTransicao(null);
    }, [atualId]);

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

        setAberto(false);
        setTransicao('Trocando de ala…');
        if (!(await focarAla(alaId))) {
            setTransicao(null);
            return;
        }
        router.refresh();
    }

    async function entrarNaNova(novaId: number | undefined) {
        setAberto(false);
        if (novaId && (await focarAla(novaId))) setTransicao('Abrindo a ala…');
        router.refresh();
    }

    return (
        <>
            {transicao && <LoadingOverlay texto={transicao} />}

            <div className="fixed bottom-4 left-4 z-30 sm:bottom-6 sm:left-6">
                <button
                    type="button"
                    onClick={() => setAberto(true)}
                    aria-haspopup="dialog"
                    aria-label="Administração geral"
                    title="Administração geral"
                    className="flex size-15 items-center justify-center rounded-full bg-gold sm:size-18 text-primary opacity-60 shadow-md transition hover:opacity-100 focus-visible:opacity-100 active:scale-[0.98] cursor-pointer"
                >
                    <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="sm:size-9">
                        <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
                        <circle cx="12" cy="12" r="3" />
                    </svg>
                </button>
            </div>

            {aberto && (
                <Modal onClose={() => setAberto(false)} labelledBy="administracao-titulo" className="max-w-lg">
                    <div className="mb-5 flex items-center justify-between gap-3">
                        <h2 id="administracao-titulo" className="min-w-0 hyphens-auto wrap-break-word text-xl font-semibold text-text">
                            Administração geral
                        </h2>
                        <button
                            type="button"
                            onClick={() => setAberto(false)}
                            aria-label="Fechar"
                            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-muted transition hover:bg-slate-100 cursor-pointer"
                        >
                            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                                <path d="M18 6 6 18M6 6l12 12" />
                            </svg>
                        </button>
                    </div>

                    <div className="flex flex-col gap-2">
                        <p id="trocar-ala" className="text-base font-medium text-text">
                            Trocar de ala
                        </p>
                        <ul aria-labelledby="trocar-ala" className="flex flex-col gap-2">
                            {alas.map(a => {
                                const atual = a.id === atualId;
                                return (
                                    <li key={a.id}>
                                        <button
                                            type="button"
                                            onClick={() => trocar(a.id)}
                                            aria-current={atual || undefined}
                                            disabled={transicao !== null}
                                            className={`flex min-h-12 w-full items-center justify-between gap-3 rounded-xl px-4 py-2 text-left text-lg font-medium transition duration-100 active:scale-[0.98] disabled:opacity-60 cursor-pointer ${atual ? 'bg-secondary text-white shadow-md' : 'border border-slate-300 bg-white text-text hover:border-secondary hover:bg-secondary/5'}`}
                                        >
                                            <span className="min-w-0 wrap-anywhere">{a.nome}</span>
                                            {atual && (
                                                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="shrink-0">
                                                    <path d="M20 6 9 17l-5-5" />
                                                </svg>
                                            )}
                                        </button>
                                    </li>
                                );
                            })}
                        </ul>
                    </div>

                    <div className="mt-5 border-t border-slate-200 pt-5">
                        <CreateWardForm onCreated={entrarNaNova} />
                    </div>
                </Modal>
            )}
        </>
    );
}
