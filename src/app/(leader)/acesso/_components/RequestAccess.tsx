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
import { WardFilter } from '@/components/WardFilter';
import { WardForm } from '@/components/WardForm';
import { artigo } from '@/lib/wards';

const BOTAO_VOLTAR =
    'inline-flex min-h-12 items-center gap-2 self-start rounded-xl bg-accent-soft px-4 py-2 text-left text-base ' +
    'font-semibold text-accent ring-1 ring-accent/25 transition duration-100 hover:bg-accent/15 active:scale-[0.98] ' +
    'cursor-pointer';

type Ala = { id: number; nome: string; estado: string; cidade: string };

export default function RequestAccess({
    nome,
    email,
    alas,
    pendenteEm,
    alaEsperando,
}: {
    nome: string;
    email: string;
    alas: Ala[];
    pendenteEm: string | null;
    alaEsperando: boolean;
}) {
    const router = useRouter();
    const [supabase] = useState(() => criarSupabaseBrowser());
    const [alaId, setAlaId] = useState<number | null>(null);
    const [loading, setLoading] = useState(false);
    const [erro, setErro] = useState('');
    const [atualizando, iniciarAtualizar] = useTransition();
    const [saindo, setSaindo] = useState(false);
    const [pedindoAla, setPedindoAla] = useState(false);
    const [enviadoPara, setEnviadoPara] = useState<string | null>(null);

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
                    {alaEsperando ? (
                        <p className="text-base text-muted">
                            O pedido {artigo(pendenteEm, 'de')} <strong className="text-text">{pendenteEm}</strong> ainda está
                            esperando aprovação. Depois que a ala for aprovada, o seu acesso ao painel
                            também é aprovado. Você recebe um e-mail quando tudo estiver pronto.
                        </p>
                    ) : (
                        <p className="text-base text-muted">
                            Seu acesso {artigo(pendenteEm, 'a')} <strong className="text-text">{pendenteEm}</strong> está
                            aguardando a aprovação de um responsável da ala. Você recebe um e-mail
                            quando for aprovado.
                        </p>
                    )}
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

                    {pedindoAla ? (
                        <div className="flex w-full animate-aparecer flex-col gap-7 text-left">
                            <button
                                type="button"
                                onClick={() => { setPedindoAla(false); setEnviadoPara(null); }}
                                className={BOTAO_VOLTAR}
                            >
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="shrink-0">
                                    <path d="m15 18-6-6 6-6" />
                                </svg>
                                Voltar e procurar a minha ala
                            </button>
                            <div>
                                <h3 className="text-lg font-semibold text-text">Pedir uma ala nova</h3>
                                <p className="mt-1.5 text-base text-muted">
                                    Quando o pedido for aprovado, a ala aparece no site e chega um e-mail.
                                </p>
                            </div>
                            {enviadoPara ? (
                                <div role="status" className="flex animate-aparecer flex-col gap-2">
                                    <p className="text-lg font-semibold text-text">Pedido enviado!</p>
                                    <p className="text-base text-muted">
                                        Quando a ala e o acesso ao painel forem aprovados, chega um e-mail para{' '}
                                        <strong className="wrap-anywhere text-text">{enviadoPara}</strong>.
                                    </p>
                                </div>
                            ) : (
                                <WardForm
                                    modo="pedido"
                                    contaLogada={{ nome, email, ala: null }}
                                    onEnviado={(para, usouConta) => {
                                        if (usouConta) router.refresh();
                                        else setEnviadoPara(para);
                                    }}
                                />
                            )}
                        </div>
                    ) : (
                        <>
                            <p className="text-base text-muted">
                                Escolha a sua ala para pedir acesso ao painel.
                            </p>

                            <div className="w-full text-left">
                                <WardFilter
                                    alas={alas.map(a => ({ ...a, chave: String(a.id) }))}
                                    instrucao="Toque na sua ala:"
                                    marcada={alaId === null ? null : String(alaId)}
                                    desativado={loading}
                                    onEscolher={a => {
                                        setAlaId(Number(a.chave));
                                        setErro('');
                                    }}
                                />
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

                            <div className="mt-6 flex w-full flex-col gap-4 border-t border-primary/10 pt-8 text-left">
                                <div>
                                    <h3 className="text-lg font-semibold text-text">Sua ala ainda não usa o calendário?</h3>
                                    <p className="mt-1 text-base text-muted">
                                        A presidência pode pedir agora. Quando o pedido for aprovado, a ala aparece no site.
                                    </p>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => { setPedindoAla(true); setAlaId(null); setErro(''); }}
                                    disabled={loading}
                                    className={`${botao('secundario', 'grande')} w-full`}
                                >
                                    Pedir para usar o calendário
                                </button>
                            </div>
                        </>
                    )}
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
