/**
 * Contexto e regras: leia CLAUDE.md e docs/src_lib.md antes de alterar.
 * Mudou o comportamento? Atualize o doc na mesma mudança.
 */

const CHAVE = 'ultima-ala';

export function lembrarAla(slug: string) {
    try {
        localStorage.setItem(CHAVE, slug);
    } catch {
        return;
    }
}

export function alaLembrada(): string | null {
    try {
        return localStorage.getItem(CHAVE);
    } catch {
        return null;
    }
}
