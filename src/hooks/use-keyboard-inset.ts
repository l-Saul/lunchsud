/**
 * Contexto e regras: leia CLAUDE.md e docs/src_hooks.md antes de alterar.
 * Mudou o comportamento? Atualize o doc na mesma mudança.
 */
'use client';

import { useSyncExternalStore } from 'react';

function inscrever(avisar: () => void) {
    const vv = window.visualViewport;
    if (!vv) return () => {};
    vv.addEventListener('resize', avisar);
    vv.addEventListener('scroll', avisar);
    window.addEventListener('resize', avisar);
    return () => {
        vv.removeEventListener('resize', avisar);
        vv.removeEventListener('scroll', avisar);
        window.removeEventListener('resize', avisar);
    };
}

function alturaDoTeclado() {
    const vv = window.visualViewport;
    if (!vv || Math.abs(vv.scale - 1) > 0.01) return 0;
    return Math.max(0, Math.round(window.innerHeight - vv.height - vv.offsetTop));
}

export function useKeyboardInset(): number {
    return useSyncExternalStore(inscrever, alturaDoTeclado, () => 0);
}
