/**
 * Contexto e regras: leia CLAUDE.md e docs/routes_acesso.md antes de alterar.
 * Mudou o comportamento? Atualize o doc na mesma mudança.
 */
'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { criarSupabaseBrowser } from '@/lib/supabase/browser-session';
import { Spinner } from '@/components/Spinner';
import { ErrorMessage } from '@/components/ErrorMessage';
import { botao } from '@/components/button-classes';

type Ala = { id: number; nome: string };

export default function RequestAccess({
    nome,
    alas,
    pendenteEm,
}: {
    nome: string;
    alas: Ala[];
    pendenteEm: string | null;
}) {
    const router = useRouter();
    const [supabase] = useState(() => criarSupabaseBrowser());
    const [alaId, setAlaId] = useState<number | ''>('');
    const [loading, setLoading] = useState(false);
    const [erro, setErro] = useState('');
    const [atualizando, iniciarAtualizar] = useTransition();
    const [saindo, setSaindo] = useState(false);

    async function pedirAcesso() {
        if (!alaId || loading) return;

        setLoading(true);
        setErro('');
        try {
            const res = await fetch('/api/acesso/solicitar', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ alaId }),
            });
            if (!res.ok) {
                setErro('Não foi possível solicitar. Tente novamente.');
                return;
            }
            router.refresh();
        } catch {
            setErro('Sem conexão com a internet. Verifique e tente de novo.');
        } finally {
            setLoading(false);
        }
    }

    async function sair() {
        if (saindo) return;
        setSaindo(true);
        await supabase.auth.signOut();
        router.push('/admin');
        router.refresh();
    }

    return (
        <div className="relative flex flex-col items-center gap-6 overflow-hidden rounded-3xl bg-background px-6 py-10 text-center shadow-lg ring-1 ring-primary/10 sm:px-10">
            <span aria-hidden="true" className="absolute inset-x-0 top-0 h-1.5 bg-linear-to-r from-accent via-gold to-accent" />

            {pendenteEm ? (
                <>
                    <h2 className="text-xl font-semibold text-text">Quase lá, {nome}!</h2>
                    <p className="text-base text-muted">
                        Seu acesso à <strong className="text-text">{pendenteEm}</strong> está
                        aguardando a aprovação de um responsável da ala. Você recebe um e-mail
                        quando for aprovado.
                    </p>
                    <button
                        onClick={() => iniciarAtualizar(() => router.refresh())}
                        disabled={atualizando}
                        aria-busy={atualizando}
                        className={`${botao('primario', 'grande')} w-full`}
                    >
                        {atualizando && <Spinner />}
                        {atualizando ? 'Atualizando…' : 'Já fui aprovado? Atualizar'}
                    </button>
                </>
            ) : (
                <>
                    <h2 className="text-xl font-semibold text-text">Olá, {nome}!</h2>
                    <p className="text-base text-muted">
                        Escolha a sua ala para pedir acesso ao painel.
                    </p>

                    <div className="flex w-full flex-col gap-1.5 text-left">
                        <label htmlFor="ala" className="text-base font-medium text-text">
                            Sua ala
                        </label>
                        <div className="relative">
                            <select
                                id="ala"
                                value={alaId}
                                onChange={e => setAlaId(Number(e.target.value) || '')}
                                className="min-h-13 w-full appearance-none rounded-xl border border-slate-300 bg-white px-4 pr-11 text-lg text-text transition hover:border-secondary/70 focus:border-secondary focus:outline-none focus:ring-2 focus:ring-secondary cursor-pointer"
                            >
                                <option value="">Selecione…</option>
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

                    {erro && (
                        <ErrorMessage key={erro}>{erro}</ErrorMessage>
                    )}

                    <button
                        onClick={pedirAcesso}
                        disabled={!alaId || loading}
                        aria-busy={loading}
                        className={`${botao('primario', 'grande')} w-full`}
                    >
                        {loading && <Spinner />}
                        {loading ? 'Enviando…' : 'Pedir acesso'}
                    </button>
                </>
            )}

            <button
                onClick={sair}
                disabled={saindo}
                className="flex min-h-11 items-center gap-2 text-base text-muted underline underline-offset-4 transition hover:text-secondary disabled:no-underline cursor-pointer"
            >
                {saindo && <Spinner className="h-4 w-4" />}
                {saindo ? 'Saindo…' : 'Sair'}
            </button>
        </div>
    );
}
