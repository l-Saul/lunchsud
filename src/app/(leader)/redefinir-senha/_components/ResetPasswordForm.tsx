/**
 * Contexto e regras: leia CLAUDE.md e docs/routes_redefinir-senha.md antes de alterar.
 * Mudou o comportamento? Atualize o doc na mesma mudança.
 */
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { criarSupabaseBrowser } from '@/lib/supabase/browser-session';
import { Flower } from '@/components/Flower';
import { Spinner } from '@/components/Spinner';

export default function ResetPasswordForm({ email }: { email: string | null }) {
    const router = useRouter();
    const [supabase] = useState(() => criarSupabaseBrowser());

    const [senha, setSenha] = useState('');
    const [confirmar, setConfirmar] = useState('');
    const [mostrar, setMostrar] = useState(false);
    const [mostrarConfirmar, setMostrarConfirmar] = useState(false);
    const [erro, setErro] = useState('');
    const [pronto, setPronto] = useState(false);
    const [loading, setLoading] = useState(false);

    const campo =
        'w-full min-w-0 box-border rounded-xl border border-slate-300 bg-white px-4 py-3.5 text-lg text-text ' +
        'focus:border-secondary focus:outline-none focus:ring-2 focus:ring-secondary';

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (loading) return;
        setErro('');

        if (senha.length < 6) {
            setErro('A senha precisa ter pelo menos 6 caracteres.');
            return;
        }
        if (senha !== confirmar) {
            setErro('As senhas não conferem.');
            return;
        }

        setLoading(true);
        const { error } = await supabase.auth.updateUser({ password: senha });
        setLoading(false);

        if (error) {
            if (error.code === 'same_password') {
                setErro('A nova senha precisa ser diferente da senha antiga.');
            } else if (error.code === 'weak_password') {
                setErro('Escolha uma senha mais forte, com pelo menos 6 caracteres.');
            } else {
                setErro('O link expirou. Peça um novo na tela de entrar, em "Esqueci minha senha".');
            }
            return;
        }

        setPronto(true);
        setTimeout(() => {
            router.push('/dashboard');
            router.refresh();
        }, 1200);
    }

    return (
        <div className="relative flex flex-col items-center gap-6 overflow-hidden rounded-3xl bg-background px-6 py-10 text-center shadow-lg ring-1 ring-primary/10 sm:px-10">
            <span aria-hidden="true" className="absolute inset-x-0 top-0 h-1.5 bg-linear-to-r from-accent via-gold to-accent" />

            <div className="flex items-center gap-3" aria-hidden="true">
                <span className="h-px w-8 bg-linear-to-r from-transparent to-gold/70" />
                <Flower size={22} />
                <span className="h-px w-8 bg-linear-to-l from-transparent to-gold/70" />
            </div>

            {!email ? (
                <>
                    <h1 className="text-2xl font-semibold text-text">Link expirado</h1>
                    <p className="text-base text-muted">
                        O link para criar uma nova senha expirou ou já foi usado. Peça um novo na tela de entrar, em &quot;Esqueci minha senha&quot;.
                    </p>
                    <Link
                        href="/admin"
                        className="flex min-h-13 w-full items-center justify-center rounded-xl bg-secondary px-4 text-lg font-semibold text-white transition duration-100 hover:opacity-90 active:scale-[0.98]"
                    >
                        Ir para a tela de entrar
                    </Link>
                </>
            ) : pronto ? (
                <>
                    <h1 className="text-2xl font-semibold text-text">Senha atualizada!</h1>
                    <p className="text-base text-muted">Abrindo o painel…</p>
                </>
            ) : (
                <>
                    <h1 className="text-2xl font-semibold text-text">Nova senha</h1>
                    <p className="wrap-anywhere text-base text-muted">
                        Escolha uma nova senha para a conta <strong className="text-text">{email}</strong>.
                    </p>

                    <form onSubmit={handleSubmit} className="flex w-full flex-col gap-5 text-left">
                        <input
                            type="email"
                            name="username"
                            autoComplete="username"
                            value={email}
                            readOnly
                            hidden
                        />
                        <div className="flex flex-col gap-1.5">
                            <label htmlFor="nova-senha" className="text-base font-medium text-text">
                                Nova senha
                            </label>
                            <div className="relative">
                                <input
                                    id="nova-senha"
                                    name="new-password"
                                    type={mostrar ? 'text' : 'password'}
                                    autoComplete="new-password"
                                    placeholder="Digite a nova senha"
                                    value={senha}
                                    onChange={e => setSenha(e.target.value)}
                                    disabled={loading}
                                    required
                                    className={`${campo} pr-12`}
                                />
                                <button
                                    type="button"
                                    onClick={() => setMostrar(v => !v)}
                                    aria-label={mostrar ? 'Ocultar senha' : 'Mostrar senha'}
                                    aria-pressed={mostrar}
                                    className="absolute inset-y-0 right-0 flex items-center px-4 text-muted transition hover:text-secondary cursor-pointer"
                                >
                                    {mostrar ? (
                                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                                            <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
                                            <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />
                                            <line x1="1" y1="1" x2="23" y2="23" />
                                        </svg>
                                    ) : (
                                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                                            <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7z" />
                                            <circle cx="12" cy="12" r="3" />
                                        </svg>
                                    )}
                                </button>
                            </div>
                        </div>

                        <div className="flex flex-col gap-1.5">
                            <label htmlFor="confirmar-nova-senha" className="text-base font-medium text-text">
                                Confirmar senha
                            </label>
                            <div className="relative">
                                <input
                                    id="confirmar-nova-senha"
                                    name="new-password-confirm"
                                    type={mostrarConfirmar ? 'text' : 'password'}
                                    autoComplete="new-password"
                                    placeholder="Digite a senha novamente"
                                    value={confirmar}
                                    onChange={e => setConfirmar(e.target.value)}
                                    disabled={loading}
                                    required
                                    className={`${campo} pr-12`}
                                />
                                <button
                                    type="button"
                                    onClick={() => setMostrarConfirmar(v => !v)}
                                    aria-label={mostrarConfirmar ? 'Ocultar senha' : 'Mostrar senha'}
                                    aria-pressed={mostrarConfirmar}
                                    className="absolute inset-y-0 right-0 flex items-center px-4 text-muted transition hover:text-secondary cursor-pointer"
                                >
                                    {mostrarConfirmar ? (
                                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                                            <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
                                            <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />
                                            <line x1="1" y1="1" x2="23" y2="23" />
                                        </svg>
                                    ) : (
                                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                                            <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7z" />
                                            <circle cx="12" cy="12" r="3" />
                                        </svg>
                                    )}
                                </button>
                            </div>
                        </div>

                        {erro && (
                            <p role="alert" className="text-sm font-medium text-accent">{erro}</p>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            aria-busy={loading}
                            className="mt-1 flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-secondary py-4 text-lg font-semibold text-white transition duration-100 hover:opacity-90 enabled:active:scale-[0.98] disabled:opacity-70"
                        >
                            {loading && <Spinner />}
                            {loading ? 'Salvando…' : 'Salvar nova senha'}
                        </button>
                    </form>
                </>
            )}
        </div>
    );
}
