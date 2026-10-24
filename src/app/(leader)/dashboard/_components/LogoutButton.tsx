/**
 * Contexto e regras: leia CLAUDE.md e docs/routes_dashboard.md antes de alterar.
 * Mudou o comportamento? Atualize o doc na mesma mudança.
 */
'use client';

import { useState } from 'react';
import { criarSupabaseBrowser } from '@/lib/supabase/browser-session';
import { Spinner } from '@/components/Spinner';

export function LogoutButton() {
    const [supabase] = useState(() => criarSupabaseBrowser());
    const [loading, setLoading] = useState(false);

    async function handleLogout() {
        if (loading) return;

        setLoading(true);
        try {
            await supabase.auth.signOut({ scope: 'local' });
        } finally {
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
            {loading && <Spinner className="h-4 w-4" />}
            {loading ? 'Tchau' : 'Sair'}
        </button>
    );
}
