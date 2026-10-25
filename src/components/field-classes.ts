/**
 * Contexto e regras: leia CLAUDE.md e docs/src_components.md antes de alterar.
 * Mudou o comportamento? Atualize o doc na mesma mudança.
 */

const BASE =
    'w-full min-w-0 appearance-none rounded-xl border bg-white px-4 py-3.5 text-lg text-text ' +
    'focus:border-secondary focus:outline-none focus:ring-2 focus:ring-secondary disabled:opacity-60';

export function campo(erro = false) {
    return `${BASE} ${erro ? 'border-accent' : 'border-slate-300'}`;
}

export const rotulo = 'text-base font-semibold text-text';
