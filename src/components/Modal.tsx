/**
 * Contexto e regras: leia CLAUDE.md e docs/src_components.md antes de alterar.
 * Mudou o comportamento? Atualize o doc na mesma mudança.
 */
'use client';

import { useRef } from 'react';
import { createPortal } from 'react-dom';
import { useModalLayer } from '@/hooks/use-modal-layer';

type Props = {
    onClose: () => void;
    labelledBy: string;
    alerta?: boolean;
    className?: string;
    children: React.ReactNode;
};

export function Modal({ onClose, labelledBy, alerta = false, className = 'max-w-md', children }: Props) {
    const camada = useRef<HTMLDivElement>(null);
    useModalLayer(camada, onClose);

    return createPortal(
        <div ref={camada} className="fixed inset-0 z-60 animate-aparecer overflow-y-auto overscroll-contain bg-primary/50 backdrop-blur-sm">
            <div onClick={onClose} className="flex min-h-full items-center justify-center p-3 sm:p-4">
                <div
                    onClick={e => e.stopPropagation()}
                    role={alerta ? 'alertdialog' : 'dialog'}
                    aria-modal="true"
                    aria-labelledby={labelledBy}
                    tabIndex={-1}
                    className={`w-full animate-surgir rounded-2xl bg-background p-5 shadow-2xl sm:p-6 focus:outline-none ${className}`}
                >
                    {children}
                </div>
            </div>
        </div>,
        document.body
    );
}
