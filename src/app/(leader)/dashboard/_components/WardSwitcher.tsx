'use client';

// Card de owner (renderiza só para owner — o dashboard condiciona em ctx.isOwner):
//  1. Trocar a ala em foco — <select> padrão do sistema.
//  2. Criar uma nova ala (CreateWardForm) — seção separada, logo abaixo da troca.

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { LoadingOverlay } from '@/components/LoadingOverlay';
import { CreateWardForm } from './CreateWardForm';

type Ala = { id: number; nome: string };

export function WardSwitcher({ alas, atualId }: { alas: Ala[]; atualId: number | null }) {
    const router = useRouter();

    // Texto do overlay de carregamento na tela toda (trocar de ala / entrar na nova).
    const [transicao, setTransicao] = useState<string | null>(null);

    // Quando a ala em foco muda (após o refresh do servidor renderizar os dados
    // novos), encerra o overlay de transição.
    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setTransicao(null);
    }, [atualId]);

    // Foca a ala no servidor (cookie). false se não deu (erro ou sem internet).
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
        // Mantém o overlay até o efeito de [atualId] limpar (dados novos na tela).
        router.refresh();
    }

    // Ala criada: já entra nela (foca) e recarrega o painel. Se não deu para
    // focar, só recarrega (a ala nova aparece na lista) — sem overlay, que não
    // teria troca de ala para encerrá-lo.
    async function entrarNaNova(novaId: number | undefined) {
        if (novaId && (await focarAla(novaId))) setTransicao('Abrindo a ala…');
        router.refresh();
    }

    return (
        <>
            {/* Carregamento na tela toda durante a troca/criação de ala. */}
            {transicao && <LoadingOverlay texto={transicao} />}

            <div className="relative rounded-2xl bg-linear-to-br from-white/15 to-white/5 p-px shadow-lg ring-1 ring-white/20">
            <div className="flex flex-col gap-3 rounded-2xl bg-primary/40 px-4 py-4 backdrop-blur-sm">
                {/* Cabeçalho — papel do usuário (owner) com ícone de pessoa */}
                <div className="flex items-center gap-2.5">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/15 text-white ring-1 ring-white/20">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                            <circle cx="12" cy="7" r="4" />
                        </svg>
                    </span>
                    <div className="flex flex-col leading-tight">
                        <span className="text-sm font-semibold text-white">Acesso owner</span>
                        <span className="text-xs text-white/60">Acesso a todas as alas</span>
                    </div>
                </div>

                {/* Trocar de ala — select padrão do sistema */}
                <div className="flex flex-col gap-1.5">
                    <label htmlFor="trocar-ala" className="text-sm font-medium text-white/90">
                        Trocar de ala
                    </label>
                    <div className="relative">
                        <select
                            id="trocar-ala"
                            value={atualId ?? ''}
                            onChange={trocar}
                            disabled={transicao !== null}
                            className="min-h-12 w-full appearance-none rounded-xl border border-white/20 bg-white px-4 pr-11 text-base font-medium text-text shadow-sm transition hover:border-secondary/70 focus:border-secondary focus:outline-none focus:ring-2 focus:ring-secondary disabled:opacity-60 cursor-pointer"
                        >
                            {atualId === null && <option value="">Selecione uma ala…</option>}
                            {alas.map(a => (
                                <option key={a.id} value={a.id}>{a.nome}</option>
                            ))}
                        </select>
                        {/* appearance-none tira a setinha nativa; mostramos um chevron
                            próprio — a lista que abre continua a do sistema. */}
                        <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3.5 text-muted">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                                <path d="m6 9 6 6 6-6" />
                            </svg>
                        </span>
                    </div>
                </div>

                {/* Seção "Criar nova ala" — abaixo da troca, separada por uma linha */}
                <div className="border-t border-white/10 pt-3">
                    <CreateWardForm onCreated={entrarNaNova} />
                </div>
            </div>
            </div>
        </>
    );
}
