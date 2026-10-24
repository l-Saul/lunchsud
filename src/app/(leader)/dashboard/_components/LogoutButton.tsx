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
                min-h-11 shrink-0 px-4 py-2 rounded-lg font-medium text-white ring-1 ring-white/40
                transition duration-100 cursor-pointer
                flex items-center justify-center gap-2
                ${loading
                    ? 'bg-white/20 cursor-not-allowed'
                    : 'bg-white/10 hover:bg-white/20 active:scale-[0.98]'}
            `}
        >
            {loading && <Spinner className="h-4 w-4" />}
            {loading ? 'Tchau' : 'Sair'}
        </button>
    );
}
