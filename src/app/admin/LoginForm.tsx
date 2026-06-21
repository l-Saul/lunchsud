'use client';

// Formulário de login do líder: envia usuário/senha para /api/admin/login e,
// em caso de sucesso, avisa as abas e vai para o /dashboard.

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';

export default function LoginForm() {
    const router = useRouter();
    const [username, setUsername] = useState('');
    const [senha, setSenha] = useState('');
    const [mostrarSenha, setMostrarSenha] = useState(false);
    const [erro, setErro] = useState('');
    const [loading, setLoading] = useState(false);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (loading) return;

        setErro('');
        setLoading(true);

        const res = await fetch('/api/admin/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username, senha })
        });

        if (!res.ok) {
            setErro('Credenciais inválidas');
            setLoading(false);
            return;
        }

        const bc = new BroadcastChannel('auth');
        bc.postMessage('login');
        bc.close();

        router.push('/dashboard');
    }

    return (
        <form onSubmit={handleSubmit} className="flex w-full flex-col gap-5">
            <div className="flex flex-col gap-1.5">
                <label htmlFor="username" className="text-sm font-medium text-muted">
                    Usuário
                </label>
                <input
                    id="username"
                    type="text"
                    autoComplete="username"
                    autoFocus
                    value={username}
                    onChange={e => setUsername(e.target.value)}
                    disabled={loading}
                    className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3.5 text-lg text-text focus:border-secondary focus:outline-none focus:ring-2 focus:ring-secondary"
                />
            </div>

            <div className="flex flex-col gap-1.5">
                <label htmlFor="senha" className="text-sm font-medium text-muted">
                    Senha
                </label>
                <div className="relative">
                    <input
                        id="senha"
                        type={mostrarSenha ? 'text' : 'password'}
                        autoComplete="current-password"
                        value={senha}
                        onChange={e => setSenha(e.target.value)}
                        disabled={loading}
                        className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3.5 pr-12 text-lg text-text focus:border-secondary focus:outline-none focus:ring-2 focus:ring-secondary"
                    />
                    <button
                        type="button"
                        onClick={() => setMostrarSenha(v => !v)}
                        aria-label={mostrarSenha ? 'Ocultar senha' : 'Mostrar senha'}
                        aria-pressed={mostrarSenha}
                        className="absolute inset-y-0 right-0 flex items-center px-4 text-muted transition hover:text-secondary cursor-pointer"
                    >
                        {mostrarSenha ? (
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
                <p role="alert" className="text-center text-sm font-medium text-red-500">
                    {erro}
                </p>
            )}

            <motion.button
                type="submit"
                disabled={loading}
                whileTap={{ scale: 0.98 }}
                className="mt-1 flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-secondary py-4 text-lg font-semibold text-white transition hover:opacity-90 disabled:opacity-60"
            >
                {loading && (
                    <span className="h-5 w-5 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                )}
                {loading ? 'Entrando…' : 'Entrar'}
            </motion.button>
        </form>
    );
}
