'use client';

// Botão "Abrir calendário da ala": navega para a página pública (/[slug]) e
// mantém o loading até a navegação trocar a tela (a página é server-side e demora
// um instante para carregar) — assim o líder vê que a ação foi acionada.

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export function AbrirCalendarioButton({ slug }: { slug: string }) {
    const router = useRouter();
    const [loading, setLoading] = useState(false);

    function abrir() {
        if (loading) return;
        setLoading(true);
        router.push(`/${slug}`);
        // loading fica ligado de propósito até a navegação desmontar esta tela.
    }

    return (
        <button
            onClick={abrir}
            disabled={loading}
            aria-busy={loading}
            className="flex items-center justify-center gap-3 rounded-2xl bg-secondary px-5 py-4 text-base font-semibold text-white shadow-lg transition duration-200 hover:-translate-y-0.5 hover:opacity-95 hover:shadow-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60 disabled:opacity-80 sm:text-lg cursor-pointer"
        >
            {loading ? (
                <>
                    <span className="h-5 w-5 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                    Abrindo…
                </>
            ) : (
                <>
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <rect x="3" y="4" width="18" height="18" rx="2" />
                        <path d="M16 2v4M8 2v4M3 10h18" />
                    </svg>
                    Abrir calendário da ala
                </>
            )}
        </button>
    );
}
