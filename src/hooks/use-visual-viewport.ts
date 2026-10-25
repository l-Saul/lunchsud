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
    return () => {
        vv.removeEventListener('resize', avisar);
        vv.removeEventListener('scroll', avisar);
    };
}

function medida() {
    const vv = window.visualViewport;
    if (!vv || Math.abs(vv.scale - 1) > 0.01) return '';
    return `${Math.round(vv.offsetTop)}|${Math.round(vv.height)}`;
}

export function useVisualViewport(): { top: number; height: number } | null {
    const valor = useSyncExternalStore(inscrever, medida, () => '');
    if (!valor) return null;
    const [top, height] = valor.split('|').map(Number);
    return { top, height };
}
