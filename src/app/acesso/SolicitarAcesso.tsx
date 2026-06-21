'use client';

// Card do /acesso: usuário logado sem ala aprovada. Pede acesso a uma ala ou
// vê o aviso de "aguardando aprovação". Sempre tem um Sair (caso conta errada).

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { criarSupabaseBrowser } from '@/lib/supabase/browser';
import { Flor } from '@/components/Flor';

type Ala = { id: number; nome: string };

export default function SolicitarAcesso({
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

    async function pedirAcesso() {
        if (!alaId || loading) return;

        setLoading(true);
        setErro('');
        const res = await fetch('/api/acesso/solicitar', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ alaId }),
        });
        setLoading(false);

        if (!res.ok) {
            setErro('Não foi possível solicitar. Tente novamente.');
            return;
        }
        router.refresh();
    }

    async function sair() {
        await supabase.auth.signOut();
        router.push('/admin');
        router.refresh();
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
            className="relative flex flex-col items-center gap-6 overflow-hidden rounded-3xl bg-background px-6 py-10 text-center shadow-2xl ring-1 ring-white/40 sm:px-10"
        >
            <span aria-hidden="true" className="absolute inset-x-0 top-0 h-1.5 bg-linear-to-r from-secondary via-accent to-secondary" />

            <div className="flex items-center gap-3" aria-hidden="true">
                <span className="h-px w-8 bg-linear-to-r from-transparent to-secondary/70" />
                <Flor size={22} />
                <span className="h-px w-8 bg-linear-to-l from-transparent to-secondary/70" />
            </div>

            {pendenteEm ? (
                <>
                    <h1 className="text-2xl font-semibold text-text">Quase lá, {nome}!</h1>
                    <p className="text-base text-muted">
                        Seu acesso à <strong className="text-text">{pendenteEm}</strong> está
                        aguardando a aprovação de um responsável da ala.
                    </p>
                    <button
                        onClick={() => router.refresh()}
                        className="min-h-13 w-full rounded-xl bg-secondary px-4 text-lg font-semibold text-white transition duration-200 hover:-translate-y-0.5 hover:opacity-95 hover:shadow-lg cursor-pointer"
                    >
                        Já fui aprovado? Atualizar
                    </button>
                </>
            ) : (
                <>
                    <h1 className="text-2xl font-semibold text-text">Olá, {nome}!</h1>
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
                        <p role="alert" className="text-sm font-medium text-accent">{erro}</p>
                    )}

                    <button
                        onClick={pedirAcesso}
                        disabled={!alaId || loading}
                        className="min-h-13 w-full rounded-xl bg-secondary px-4 text-lg font-semibold text-white transition duration-200 hover:-translate-y-0.5 hover:opacity-95 hover:shadow-lg disabled:opacity-60 cursor-pointer"
                    >
                        {loading ? 'Enviando…' : 'Pedir acesso'}
                    </button>
                </>
            )}

            <button
                onClick={sair}
                className="text-sm text-muted underline underline-offset-4 transition hover:text-secondary cursor-pointer"
            >
                Sair
            </button>
        </motion.div>
    );
}
