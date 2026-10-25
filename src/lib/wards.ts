/**
 * Contexto e regras: leia CLAUDE.md e docs/src_lib.md antes de alterar.
 * Mudou o comportamento? Atualize o doc na mesma mudança.
 */

const PREPOSICOES = new Set(['de', 'da', 'do', 'das', 'dos', 'e']);

export type TipoUnidade = 'ala' | 'ramo';

function nomeProprio(texto: string): string {
    return texto
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

function pedacoDoSlug(texto: string): string {
    return texto
        .normalize('NFD')
        .replace(/[^\x00-\x7F]/g, '')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '_')
        .replace(/^_+|_+$/g, '');
}

export function gerarSlug(uf: string, cidade: string, nome: string): string {
    const s = [uf, cidade, nome.replace(/^ala\s+/i, '')]
        .map(pedacoDoSlug)
        .filter(Boolean)
        .join('_');
    return s.slice(0, 100).replace(/_+$/, '');
}
