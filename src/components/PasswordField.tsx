/**
 * Contexto e regras: leia CLAUDE.md e docs/src_components.md antes de alterar.
 * Mudou o comportamento? Atualize o doc na mesma mudança.
 */
'use client';

import { useState } from 'react';
import { campo } from '@/components/field-classes';

type Props = Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> & { erro?: boolean };

export function PasswordField({ erro = false, className = '', ...props }: Props) {
    const [mostrar, setMostrar] = useState(false);

    return (
        <div className="relative">
            <input {...props} type={mostrar ? 'text' : 'password'} className={`${campo(erro)} pr-12 ${className}`} />
            <button
                type="button"
                onClick={() => setMostrar(v => !v)}
                aria-label={mostrar ? 'Ocultar senha' : 'Mostrar senha'}
                aria-pressed={mostrar}
                className="absolute inset-y-0 right-0 flex items-center px-4 text-muted transition hover:text-secondary cursor-pointer"
            >
                {mostrar ? (
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
                        <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />
                        <line x1="1" y1="1" x2="23" y2="23" />
                    </svg>
                ) : (
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7z" />
                        <circle cx="12" cy="12" r="3" />
                    </svg>
                )}
            </button>
        </div>
    );
}
