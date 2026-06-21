// Escrituras do Livro de Mórmon — teor positivo, de força e esperança, para
// fortalecer os membros. Usadas como referência nas páginas e como descrição
// (sorteada) do compartilhamento da página da ala. Texto conferido na versão
// oficial em português da Igreja de Jesus Cristo dos Santos dos Últimos Dias.
export const ESCRITURAS = [
    '«Prosseguir com firmeza em Cristo, tendo um perfeito esplendor de esperança e amor a Deus e a todos os homens.» — 2 Néfi 31:20',
    '«Quando estais a serviço de vosso próximo, estais somente a serviço de vosso Deus.» — Mosias 2:17',
    '«Os homens existem para que tenham alegria.» — 2 Néfi 2:25',
    '«É por meio de coisas pequenas e simples que as grandes são realizadas.» — Alma 37:6',
    '«Minha graça basta a todos os que se humilham perante mim.» — Éter 12:27',
    '«É sobre a rocha de nosso Redentor, que é Cristo, o Filho de Deus, que deveis construir os vossos alicerces.» — Helamã 5:12',
] as const;

// Uma escritura ao acaso — faz a descrição do compartilhamento variar a cada vez.
export function escrituraAleatoria(): string {
    return ESCRITURAS[Math.floor(Math.random() * ESCRITURAS.length)];
}
