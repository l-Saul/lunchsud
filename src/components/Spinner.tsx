/**
 * Contexto e regras: leia CLAUDE.md e docs/src_components.md antes de alterar.
 * Mudou o comportamento? Atualize o doc na mesma mudança.
 */

export function Spinner({ className = 'h-5 w-5' }: { className?: string }) {
    return (
        <span
            aria-hidden="true"
            className={`inline-block shrink-0 animate-spin rounded-full border-2 border-current border-t-transparent ${className}`}
        />
    );
}
