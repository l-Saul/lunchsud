/**
 * Contexto e regras: leia CLAUDE.md e docs/routes_dashboard.md antes de alterar.
 * Mudou o comportamento? Atualize o doc na mesma mudança.
 */
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Spinner } from '@/components/Spinner';

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
            className="flex min-w-0 flex-1 items-center justify-center gap-3 rounded-2xl bg-secondary px-3 py-4 sm:px-4 text-center text-balance text-base font-semibold text-white shadow-lg transition duration-100 hover:opacity-95 hover:shadow-xl active:scale-[0.98] disabled:opacity-80 sm:text-lg cursor-pointer"
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
