/**
 * Contexto e regras: leia CLAUDE.md e docs/routes_dashboard.md antes de alterar.
 * Mudou o comportamento? Atualize o doc na mesma mudança.
 */
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Spinner } from '@/components/Spinner';
import { botao } from '@/components/button-classes';

export function OpenCalendarButton({ slug }: { slug: string }) {
    const router = useRouter();
    const [loading, setLoading] = useState(false);

    function abrir() {
        if (loading) return;
        setLoading(true);
        router.push(`/${slug}`);
    }

    return (
        <button
            onClick={abrir}
            disabled={loading}
            aria-busy={loading}
            className={`${botao('primario', 'normal')} min-w-0 grow basis-40 text-balance sm:min-h-13 sm:text-lg`}
        >
            {loading ? (
                <>
                    <Spinner />
                    Abrindo…
                </>
            ) : (
                <>
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="hidden shrink-0 sm:block">
                        <rect x="3" y="4" width="18" height="18" rx="2" />
                        <path d="M16 2v4M8 2v4M3 10h18" />
                    </svg>
                    Abrir calendário
                </>
            )}
        </button>
    );
}
