// Regras de visibilidade e criação das alas.
//
// A ala de testes (slug `teste`) só é útil em desenvolvimento (localhost). Em
// produção ela é escondida das listas da interface (home, troca de ala, pedido de
// acesso) para não poluir a tela dos membros. Use sempre este módulo — não espalhe
// a checagem de "é teste?" pelos componentes.

export const SLUG_ALA_TESTE = 'teste';

// "Localhost", para o nosso fluxo, = ambiente de desenvolvimento (`npm run dev`).
// Em produção (build/Vercel) o NODE_ENV é 'production'.
export const emDesenvolvimento = process.env.NODE_ENV !== 'production';

// Remove a ala de teste das listas em produção (mantém em desenvolvimento).
export function semAlaTesteEmProd<T extends { slug: string }>(alas: T[]): T[] {
    if (emDesenvolvimento) return alas;
    return alas.filter(a => a.slug !== SLUG_ALA_TESTE);
}

// Preposições que ficam em minúsculo no meio do nome ("Ala Vila do Sol").
const PREPOSICOES = new Set(['de', 'da', 'do', 'das', 'dos', 'e']);

// Normaliza o NOME (de exibição) da ala antes de gravar:
//  - title case (primeira letra de cada palavra em maiúscula; preposições no meio
//    ficam minúsculas), porque é um nome próprio;
//  - garante o prefixo "Ala " — se a pessoa digitar só "são lourenço", vira
//    "Ala São Lourenço". (Os acentos só existem se a pessoa os digitar.)
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

// Gera o slug (endereço da URL pública) a partir do nome da ala, seguindo a
// convenção do projeto: tira o "Ala " da frente, remove acentos, e troca espaços
// e separadores por "_" (ex.: "Ala Jardim Brasil" → "jardim_brasil"). O resultado
// fica no formato aceito pela validação (`[a-z0-9_-]`). Pode dar string vazia se
// o nome não tiver letras/números — quem chama deve tratar.
export function gerarSlug(nome: string): string {
    const s = nome
        .normalize('NFD')                // separa letra + acento
        .replace(/[^\x00-\x7F]/g, '')    // remove acentos (tudo não-ASCII)
        .toLowerCase()
        .replace(/^ala\s+/, '')          // tira "ala " da frente
        .replace(/[^a-z0-9]+/g, '_')     // espaços/pontuação viram "_"
        .replace(/^_+|_+$/g, '');        // tira "_" das pontas
    return s.slice(0, 60).replace(/_+$/, '');
}
