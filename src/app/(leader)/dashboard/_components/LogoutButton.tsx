/**
 * Contexto e regras: leia CLAUDE.md e docs/routes_dashboard.md antes de alterar.
 * Mudou o comportamento? Atualize o doc na mesma mudança.
 */
'use client';

import { useState } from 'react';
import { criarSupabaseBrowser } from '@/lib/supabase/browser-session';
import { Spinner } from '@/components/Spinner';
import { botao } from '@/components/button-classes';

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
            aria-busy={loading}
            className={`${botao('dourado', 'normal')} shrink-0`}
        >
            {loading ? (
                <Spinner className="h-5 w-5" />
            ) : (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="shrink-0">
                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                    <path d="m16 17 5-5-5-5" />
                    <path d="M21 12H9" />
                </svg>
            )}
            {loading ? 'Saindo…' : 'Sair'}
        </button>
    );
}
