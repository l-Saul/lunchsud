/**
 * Contexto e regras: leia CLAUDE.md e docs/src_components.md antes de alterar.
 * Mudou o comportamento? Atualize o doc na mesma mudança.
 */

const BASE =
    'inline-flex items-center justify-center gap-2 rounded-xl text-center font-semibold transition duration-100 ' +
    'active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-70 cursor-pointer';

const TAMANHO = {
    normal: 'min-h-12 px-5 text-base',
    grande: 'min-h-13 px-6 text-lg',
};

const TIPO = {
    primario: 'bg-secondary text-white shadow-md hover:opacity-90',
    secundario: 'border border-slate-300 bg-white text-text hover:bg-slate-100',
    perigo: 'bg-accent text-white shadow-md hover:opacity-90',
    dourado: 'bg-gold text-primary shadow-md hover:opacity-90',
};

export const BOTAO_FECHAR =
    'flex size-[44px] shrink-0 items-center justify-center rounded-full text-muted transition hover:bg-slate-100 cursor-pointer';

export function botao(tipo: keyof typeof TIPO = 'primario', tamanho: keyof typeof TAMANHO = 'normal') {
    return `${BASE} ${TAMANHO[tamanho]} ${TIPO[tipo]}`;
}
