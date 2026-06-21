'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginForm() {
    const router = useRouter();
    const [username, setUsername] = useState('');
    const [senha, setSenha] = useState('');
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
        <form
            onSubmit={handleSubmit}
            className="w-full"
            style={{ display: 'flex', flexDirection: 'column', gap: 20 }}
        >
            <input
                type="text"
                placeholder="Usuário"
                value={username}
                onChange={e => setUsername(e.target.value)}
                disabled={loading}
                className="w-full px-4 py-3 rounded-xl border bg-white text-text placeholder-muted focus:outline-none focus:ring-2 focus:ring-secondary focus:border-secondary"
                style={{ borderColor: 'rgba(15, 23, 42, 0.2)' }}
            />

            <input
                type="password"
                placeholder="Senha"
                value={senha}
                onChange={e => setSenha(e.target.value)}
                disabled={loading}
                className="w-full px-4 py-3 rounded-xl border bg-white text-text placeholder-muted focus:outline-none focus:ring-2 focus:ring-secondary focus:border-secondary"
                style={{ borderColor: 'rgba(15, 23, 42, 0.2)' }}
            />

            <button
                type="submit"
                className="w-full cursor-pointer bg-secondary text-white font-semibold py-3 rounded-xl hover:opacity-90 transition"
            >
                {loading ? 'Carregando...' : 'Entrar'}
            </button>

            {erro && (
                <p className="text-sm text-red-600 text-center">
                    {erro}
                </p>
            )}
        </form>
    );
}
