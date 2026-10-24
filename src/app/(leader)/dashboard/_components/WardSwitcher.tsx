/**
 * Contexto e regras: leia CLAUDE.md e docs/routes_dashboard.md antes de alterar.
 * Mudou o comportamento? Atualize o doc na mesma mudança.
 */
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { LoadingOverlay } from '@/components/LoadingOverlay';
import { CreateWardForm } from './CreateWardForm';

type Ala = { id: number; nome: string };

export function WardSwitcher({ alas, atualId }: { alas: Ala[]; atualId: number | null }) {
    const router = useRouter();

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

    async function trocar(e: React.ChangeEvent<HTMLSelectElement>) {
        const alaId = Number(e.target.value);
        if (!alaId || alaId === atualId || transicao) return;

        setTransicao('Trocando de ala…');
        if (!(await focarAla(alaId))) {
            setTransicao(null);
            return;
        }
        router.refresh();
    }

    async function entrarNaNova(novaId: number | undefined) {
        if (novaId && (await focarAla(novaId))) setTransicao('Abrindo a ala…');
        router.refresh();
    }

    return (
        <>
            {transicao && <LoadingOverlay texto={transicao} />}

            <section className="flex flex-col gap-3 rounded-3xl bg-background p-4 shadow-md ring-1 ring-primary/10 sm:p-6">
                <div className="flex items-center gap-2.5">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-secondary/10 text-secondary">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                            <circle cx="12" cy="7" r="4" />
                        </svg>
                    </span>
                    <div className="flex flex-col leading-tight">
                        <span className="text-sm font-semibold text-text">Acesso owner</span>
                        <span className="text-xs text-muted">Acesso a todas as alas</span>
                    </div>
                </div>

                <div className="flex flex-col gap-1.5">
                    <label htmlFor="trocar-ala" className="text-sm font-medium text-text">
                        Trocar de ala
                    </label>
                    <div className="relative">
                        <select
                            id="trocar-ala"
                            value={atualId ?? ''}
                            onChange={trocar}
                            disabled={transicao !== null}
                            className="min-h-12 w-full appearance-none rounded-xl border border-slate-300 bg-white px-4 pr-11 text-base font-medium text-text shadow-sm transition hover:border-secondary/70 focus:border-secondary focus:outline-none focus:ring-2 focus:ring-secondary disabled:opacity-60 cursor-pointer"
                        >
                            {atualId === null && <option value="">Selecione uma ala…</option>}
                            {alas.map(a => (
                                <option key={a.id} value={a.id}>{a.nome}</option>
                            ))}
                        </select>
                        <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3.5 text-muted">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                                <path d="m6 9 6 6 6-6" />
                            </svg>
                        </span>
                    </div>
                </div>

                <div className="border-t border-slate-200 pt-3">
                    <CreateWardForm onCreated={entrarNaNova} />
                </div>
            </section>
        </>
    );
}
