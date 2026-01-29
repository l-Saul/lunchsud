'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminLoginPage() {
    const router = useRouter();
    const [username, setUsername] = useState('');
    const [senha, setSenha] = useState('');
    const [erro, setErro] = useState('');

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setErro('');

        const res = await fetch('/api/admin/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username, senha })
        });

        if (!res.ok) {
            setErro('Credenciais inválidas');
            return;
        }

        router.push('/dashboard');
    }

    return (
        <main>
            <h1>Login admin</h1>

            <form onSubmit={handleSubmit}>
                <input
                    type="text"
                    placeholder="Usuário"
                    value={username}
                    onChange={e => setUsername(e.target.value)}
                />

                <input
                    type="password"
                    placeholder="Senha"
                    value={senha}
                    onChange={e => setSenha(e.target.value)}
                />

                <button type="submit">Entrar</button>

                {erro && <p>{erro}</p>}
            </form>
        </main>
    );
}
