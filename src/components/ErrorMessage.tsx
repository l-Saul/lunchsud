/**
 * Contexto e regras: leia CLAUDE.md e docs/src_components.md antes de alterar.
 * Mudou o comportamento? Atualize o doc na mesma mudança.
 */

export function ErrorMessage({ children, className = '' }: { children: React.ReactNode; className?: string }) {
    return (
        <p role="alert" className={`flex animate-aparecer items-start gap-2 rounded-xl bg-accent-soft px-3 py-2.5 text-left text-base font-medium text-accent ${className}`}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="mt-px shrink-0">
                <circle cx="12" cy="12" r="10" />
                <path d="M12 7v6M12 17h.01" />
            </svg>
            <span className="min-w-0 wrap-anywhere">{children}</span>
        </p>
    );
}
