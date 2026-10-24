/**
 * Contexto e regras: leia CLAUDE.md e docs/src_lib.md antes de alterar.
 * Mudou o comportamento? Atualize o doc na mesma mudança.
 */

const PREPOSICOES = new Set(['de', 'da', 'do', 'das', 'dos', 'e']);

export function normalizarNomeAla(nome: string): string {
    const titulo = nome
        .replace(/\s+/g, ' ')
        .trim()
        .toLowerCase()
        .split(' ')
        .map((palavra, i) =>
            i > 0 && PREPOSICOES.has(palavra)
                ? palavra
                : palavra.charAt(0).toUpperCase() + palavra.slice(1)
        )
        .join(' ');

    return /^ala\s/i.test(titulo) ? titulo : `Ala ${titulo}`;
}

export function gerarSlug(nome: string): string {
    const s = nome
        .normalize('NFD')
        .replace(/[^\x00-\x7F]/g, '')
        .toLowerCase()
        .replace(/^ala\s+/, '')
        .replace(/[^a-z0-9]+/g, '_')
        .replace(/^_+|_+$/g, '');
    return s.slice(0, 60).replace(/_+$/, '');
}
