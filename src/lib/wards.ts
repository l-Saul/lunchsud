/**
 * Contexto e regras: leia CLAUDE.md e docs/src_lib.md antes de alterar.
 * Mudou o comportamento? Atualize o doc na mesma mudança.
 */

const PREPOSICOES = new Set(['de', 'da', 'do', 'das', 'dos', 'e']);
const ROMANO = /^(x{0,3})(ix|iv|v?i{0,3})$/;

export type TipoUnidade = 'ala' | 'ramo';

function maiusculas(palavra: string): string {
    return palavra.replace(/(^|[-'’/._(])(\p{L})/gu, (_, antes: string, letra: string) => antes + letra.toUpperCase());
}

function nomeProprio(texto: string): string {
    return texto
        .replace(/\s+/g, ' ')
        .trim()
        .toLowerCase()
        .split(' ')
        .map((palavra, i) => {
            if (i > 0 && PREPOSICOES.has(palavra)) return palavra;
            if (i > 0 && ROMANO.test(palavra)) return palavra.toUpperCase();
            if (i > 0 && /^d['’]\p{L}/u.test(palavra)) return palavra.slice(0, 2) + maiusculas(palavra.slice(2));
            return maiusculas(palavra);
        })
        .join(' ');
}

const ARTIGOS = {
    de: ['da', 'do'],
    a: ['à', 'ao'],
    em: ['na', 'no'],
    o: ['a', 'o'],
} as const;

export function ehRamo(nome: string): boolean {
    return /^ramo(\s|$)/i.test(nome.trim());
}

export function artigo(nome: string, forma: keyof typeof ARTIGOS): string {
    const [feminino, masculino] = ARTIGOS[forma];
    return ehRamo(nome) ? masculino : feminino;
}

export function comArtigo(nome: string, forma: keyof typeof ARTIGOS): string {
    return `${artigo(nome, forma)} ${nome}`;
}

export function nomeSemTipo(nome: string): string {
    return nomeProprio(nome).replace(/^(ala|ramo)(\s+|$)/i, '');
}

export function normalizarNomeAla(nome: string, tipo: TipoUnidade = 'ala'): string {
    return `${tipo === 'ramo' ? 'Ramo' : 'Ala'} ${nomeSemTipo(nome)}`;
}

export function normalizarCidade(cidade: string): string {
    return nomeProprio(cidade);
}

const LIMITE_SLUG = 100;

function pedacoDoSlug(texto: string): string {
    return texto
        .normalize('NFKD')
        .replace(/[^\x00-\x7F]/g, '')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
}

export function gerarSlug(uf: string, cidade: string, nome: string): string {
    const partes = [uf, cidade, nome.replace(/^ala\s+/i, '')].map(pedacoDoSlug);
    if (partes.some(p => !p)) return '';
    return partes.join('_').slice(0, LIMITE_SLUG).replace(/[-_]+$/, '');
}
