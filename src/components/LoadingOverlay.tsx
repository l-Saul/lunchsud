/**
 * Contexto e regras: leia CLAUDE.md e docs/src_components.md antes de alterar.
 * Mudou o comportamento? Atualize o doc na mesma mudança.
 */

import { Spinner } from '@/components/Spinner';

export function LoadingOverlay({ texto = 'Carregando…' }: { texto?: string }) {
    return (
        <div
            role="status"
            aria-live="polite"
            className="fixed inset-0 z-80 flex animate-aparecer flex-col items-center justify-center gap-4 bg-primary/45 text-white backdrop-blur-sm"
        >
            <Spinner className="h-12 w-12 border-4" />
            <span className="text-base font-medium drop-shadow-sm">{texto}</span>
        </div>
    );
}
