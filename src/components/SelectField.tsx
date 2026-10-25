/**
 * Contexto e regras: leia CLAUDE.md e docs/src_components.md antes de alterar.
 * Mudou o comportamento? Atualize o doc na mesma mudança.
 */

import { campo } from '@/components/field-classes';

type Props = React.SelectHTMLAttributes<HTMLSelectElement> & { erro?: boolean };

export function SelectField({ erro = false, className = '', children, ...props }: Props) {
    return (
        <div className="relative">
            <select {...props} className={`${campo(erro)} cursor-pointer pr-12 disabled:cursor-not-allowed ${className}`}>
                {children}
            </select>
            <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-4 text-muted">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="m6 9 6 6 6-6" />
                </svg>
            </span>
        </div>
    );
}
