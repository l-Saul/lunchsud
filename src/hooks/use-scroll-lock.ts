/**
 * Contexto e regras: leia CLAUDE.md e docs/src_hooks.md antes de alterar.
 * Mudou o comportamento? Atualize o doc na mesma mudança.
 */
'use client';

import { useEffect } from 'react';

let travas = 0;
let posicao = 0;

function travar() {
    travas += 1;
    if (travas > 1) return;
    posicao = window.scrollY;
    const { style } = document.body;
    style.position = 'fixed';
    style.top = `-${posicao}px`;
    style.left = '0';
    style.right = '0';
    style.width = '100%';
}

function soltar() {
    travas = Math.max(0, travas - 1);
    if (travas > 0) return;
    const { style } = document.body;
    style.position = '';
    style.top = '';
    style.left = '';
    style.right = '';
    style.width = '';
    window.scrollTo({ top: posicao, behavior: 'instant' });
}

export function useScrollLock(ativo = true) {
    useEffect(() => {
        if (!ativo) return;
        travar();
        return soltar;
    }, [ativo]);
}
