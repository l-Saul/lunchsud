/**
 * Contexto e regras: leia CLAUDE.md e docs/src_components.md antes de alterar.
 * Mudou o comportamento? Atualize o doc na mesma mudança.
 */
'use client';

import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useModalLayer } from '@/hooks/use-modal-layer';
import { useKeyboardInset } from '@/hooks/use-keyboard-inset';

type Props = {
    onClose: () => void;
    labelledBy: string;
    alerta?: boolean;
    className?: string;
    children: React.ReactNode;
};

export function Modal({ onClose, labelledBy, alerta = false, className = 'max-w-md', children }: Props) {
    const camada = useRef<HTMLDivElement>(null);
    const espera = useRef<number | undefined>(undefined);
    const teclado = useKeyboardInset();
    useModalLayer(camada, onClose);

    useEffect(() => () => window.clearTimeout(espera.current), []);

    function aoFocar(e: React.FocusEvent<HTMLDivElement>) {
        const alvo = e.target;
        if (!alvo.matches('input, select, textarea')) return;
        window.clearTimeout(espera.current);
        espera.current = window.setTimeout(() => alvo.scrollIntoView({ block: 'center' }), 350);
    }

    return createPortal(
        <div
            ref={camada}
            onFocus={aoFocar}
            style={teclado ? { scrollPaddingBottom: teclado + 16 } : undefined}
            className="fixed inset-0 z-60 animate-aparecer overflow-y-auto overscroll-contain bg-primary/50 backdrop-blur-sm"
        >
            <div
                onClick={onClose}
                style={teclado ? { paddingBottom: teclado + 16 } : undefined}
                className="flex min-h-full items-center justify-center p-[min(0.75rem,4vw)] sm:p-4"
            >
                <div
                    onClick={e => e.stopPropagation()}
                    role={alerta ? 'alertdialog' : 'dialog'}
                    aria-modal="true"
                    aria-labelledby={labelledBy}
                    tabIndex={-1}
                    className={`w-full animate-surgir rounded-2xl bg-background p-[min(1.25rem,6vw)] shadow-2xl sm:p-6 focus:outline-none ${className}`}
                >
                    {children}
                </div>
            </div>
        </div>,
        document.body
    );
}
