'use client';

// Botão Sair: encerra a sessão do Supabase Auth e volta para o login.

import { useState } from 'react';
import { criarSupabaseBrowser } from '@/lib/supabase/browser';

export function LogoutButton() {
    const [supabase] = useState(() => criarSupabaseBrowser());
    const [loading, setLoading] = useState(false);

    async function handleLogout() {
        if (loading) return;

        setLoading(true);
        try {
            // scope 'local' só limpa os cookies da sessão neste aparelho, sem o
            // round-trip de rede que o 'global' (padrão) faz para revogar a sessão
            // em todos os dispositivos — é o que deixava o Sair lento.
            await supabase.auth.signOut({ scope: 'local' });
        } finally {
            // Navegação REAL (não router.push): faz uma requisição limpa ao /admin
            // com os cookies já apagados, sem cache de RSC. Evita o ping-pong
            // /admin ↔ /dashboard que prendia a tela "renderizando sem sair".
            window.location.assign('/admin');
        }
    }

    return (
        <button
            onClick={handleLogout}
            disabled={loading}
            className={`
                px-4 py-2 rounded-lg font-medium text-white
                transition duration-200 cursor-pointer
                flex items-center justify-center gap-2
                ${loading
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-secondary shadow-sm hover:opacity-95 hover:-translate-y-0.5 hover:shadow-md active:translate-y-0'}
            `}
        >
            {loading && (
                <span className="h-4 w-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
            )}
            {loading ? 'Tchau' : 'Sair'}
        </button>
    );
}
