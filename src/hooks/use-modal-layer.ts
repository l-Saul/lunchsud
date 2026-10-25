/**
 * Contexto e regras: leia CLAUDE.md e docs/src_hooks.md antes de alterar.
 * Mudou o comportamento? Atualize o doc na mesma mudança.
 */
'use client';

import { useEffect, useRef, useState, type RefObject } from 'react';
import { useScrollLock } from '@/hooks/use-scroll-lock';

export function useModalLayer(camada: RefObject<HTMLElement | null>, onEscape?: () => void) {
    const [origem] = useState(() => (typeof document === 'undefined' ? null : document.activeElement as HTMLElement | null));
    const onEscapeRef = useRef(onEscape);

    useEffect(() => {
        onEscapeRef.current = onEscape;
    }, [onEscape]);

    useScrollLock();

    useEffect(() => {
        const el = camada.current;
        if (!el) return;

        const fundo = Array.from(document.body.children).filter(
            filho => filho !== el && !filho.contains(el) && !filho.hasAttribute('inert')
        );
        fundo.forEach(filho => filho.setAttribute('inert', ''));

        const alvo = el.querySelector<HTMLElement>('[data-foco-inicial]')
            ?? el.querySelector<HTMLElement>('[role="dialog"], [role="alertdialog"]');
        alvo?.focus({ preventScroll: true });

        const onKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onEscapeRef.current?.();
        };
        window.addEventListener('keydown', onKey);

        return () => {
            window.removeEventListener('keydown', onKey);
            fundo.forEach(filho => filho.removeAttribute('inert'));
            if (origem?.isConnected) origem.focus({ preventScroll: true });
        };
    }, [camada, origem]);
}
