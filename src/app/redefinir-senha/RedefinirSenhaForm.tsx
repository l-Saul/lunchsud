'use client';

// Formulário de nova senha. A sessão já foi criada por /auth/confirmar (troca do
// código do e-mail), então basta atualizar a senha do usuário logado.

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { criarSupabaseBrowser } from '@/lib/supabase/browser';
import { Flor } from '@/components/Flor';

export default function RedefinirSenhaForm() {
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
        'placeholder:text-muted/60 focus:border-secondary focus:outline-none focus:ring-2 focus:ring-secondary';

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
            setErro('O link expirou. Peça um novo link de redefinição na tela de login.');
            return;
        }

        setPronto(true);
        setTimeout(() => {
            router.push('/dashboard');
            router.refresh();
        }, 1200);
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

            {pronto ? (
                <>
                    <h1 className="text-2xl font-semibold text-text">Senha atualizada!</h1>
                    <p className="text-base text-muted">Redirecionando para o painel…</p>
                </>
            ) : (
                <>
                    <h1 className="text-2xl font-semibold text-text">Nova senha</h1>
                    <p className="text-base text-muted">Escolha uma nova senha para a sua conta.</p>

                    <form onSubmit={handleSubmit} className="flex w-full flex-col gap-5 text-left">
                        <div className="flex flex-col gap-1.5">
                            <label htmlFor="nova-senha" className="text-base font-medium text-text">
                                Nova senha
                            </label>
                            <div className="relative">
                                <input
                                    id="nova-senha"
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

                        <motion.button
                            type="submit"
                            disabled={loading}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            className="mt-1 flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-secondary py-4 text-lg font-semibold text-white transition hover:opacity-90 disabled:opacity-60"
                        >
                            {loading && (
                                <span className="h-5 w-5 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                            )}
                            {loading ? 'Salvando…' : 'Salvar nova senha'}
                        </motion.button>
                    </form>
                </>
            )}
        </motion.div>
    );
}
