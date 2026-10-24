// Telefone: Brasil (celular e fixo) e internacional, com foco em América Latina
// e EUA/Canadá. Mesma regra no formulário (público e admin) e no servidor.
//
// Como lê o número (a ordem importa):
//  1. Com "+" ou "00" na frente → internacional: os primeiros dígitos são o país
//     (qualquer país do mundo, até 15 dígitos — padrão E.164).
//  2. Sem código do país → Brasil (o app é de alas brasileiras). 11 dígitos =
//     celular (DDD + 9 + 8), 10 = fixo (DDD + 8). Celular antigo digitado sem o
//     9 ganha o 9. Um zero na frente ("041…") é o prefixo de discagem e sai.
//  3. Sem "+" mas não fecha como número brasileiro → tenta os países da América
//     Latina e EUA/Canadá ("1 415 555 2671", "54 9 11 1234 5678", "598 9…").
//     Outros países só com "+", para um erro de digitação não virar outro país.
//
// Grava: Brasil sem o 55 ("41 99999 9999" / "41 3333 4444", como os dados
// antigos); os demais com o país na frente ("+1 415 555 2671", "+54 911 1234 5678").
//
// No formulário NÃO há máscara enquanto digita: com tantos formatos ela nunca
// fica previsível, e reescrever o campo a cada tecla joga o cursor para o fim
// (não dá para corrigir um dígito no meio). O campo guarda o que a pessoa
// escreveu e só é arrumado ao sair dele (onBlur) — e de novo no servidor.

// DDDs que existem no Brasil.
const DDDS = new Set([
    11, 12, 13, 14, 15, 16, 17, 18, 19, 21, 22, 24, 27, 28,
    31, 32, 33, 34, 35, 37, 38, 41, 42, 43, 44, 45, 46, 47, 48, 49,
    51, 53, 54, 55, 61, 62, 63, 64, 65, 66, 67, 68, 69,
    71, 73, 74, 75, 77, 79, 81, 82, 83, 84, 85, 86, 87, 88, 89,
    91, 92, 93, 94, 95, 96, 97, 98, 99,
]);

// Códigos de país de 2 dígitos. Os códigos formam um conjunto "sem prefixo"
// (nenhum é começo de outro): começa com 1 ou 7 → 1 dígito; está nesta lista →
// 2; senão → 3. Assim dá para separar o país de qualquer número do mundo.
const PAISES_2_DIGITOS = new Set([
    '20', '27', '30', '31', '32', '33', '34', '36', '39', '40', '41', '43', '44', '45',
    '46', '47', '48', '49', '51', '52', '53', '54', '55', '56', '57', '58', '60', '61',
    '62', '63', '64', '65', '66', '81', '82', '84', '86', '90', '91', '92', '93', '94',
    '95', '98',
]);

// Países aceitos mesmo sem "+": América Latina + EUA/Canadá/Caribe (+1).
const PAISES_SEM_MAIS = new Set([
    '1', '51', '52', '53', '54', '56', '57', '58',
    '501', '502', '503', '504', '505', '506', '507', '509',
    '591', '592', '593', '594', '595', '597', '598',
]);

export type Telefone = {
    formatado: string; // como é gravado e mostrado
    internacional: boolean;
};

function codigoDoPais(digitos: string) {
    if (digitos[0] === '1' || digitos[0] === '7') return digitos.slice(0, 1);
    if (PAISES_2_DIGITOS.has(digitos.slice(0, 2))) return digitos.slice(0, 2);
    return digitos.slice(0, 3);
}

// Brasil, sem o 55. null se não for um número brasileiro válido.
function brasil(digitos: string): Telefone | null {
    if (!DDDS.has(Number(digitos.slice(0, 2)))) return null;
    const ddd = digitos.slice(0, 2);
    const numero = digitos.slice(2);

    // Celular: 9 + 8 dígitos.
    if (numero.length === 9 && numero[0] === '9') {
        return { formatado: `${ddd} ${numero.slice(0, 5)} ${numero.slice(5)}`, internacional: false };
    }
    if (numero.length === 8) {
        // Fixo começa com 2–5.
        if ('2345'.includes(numero[0])) {
            return { formatado: `${ddd} ${numero.slice(0, 4)} ${numero.slice(4)}`, internacional: false };
        }
        // Celular antigo, de antes do 9 (começava com 6–9): ganha o 9.
        if ('6789'.includes(numero[0])) {
            return { formatado: `${ddd} 9${numero.slice(0, 4)} ${numero.slice(4)}`, internacional: false };
        }
    }
    return null;
}

// Internacional: dígitos já com o país na frente. null se não fizer sentido.
function internacional(digitos: string, soAmericaLatina: boolean): Telefone | null {
    if (digitos.length < 7 || digitos.length > 15) return null;
    const pais = codigoDoPais(digitos);
    const nacional = digitos.slice(pais.length);
    if (soAmericaLatina && !PAISES_SEM_MAIS.has(pais)) return null;

    if (pais === '55') return brasil(nacional);

    if (pais === '1') {
        // EUA/Canadá/Caribe: 10 dígitos; código de área e central não começam com 0/1.
        if (nacional.length !== 10 || '01'.includes(nacional[0]) || '01'.includes(nacional[3])) return null;
        return {
            formatado: `+1 ${nacional.slice(0, 3)} ${nacional.slice(3, 6)} ${nacional.slice(6)}`,
            internacional: true,
        };
    }

    if (nacional.length < 4) return null;
    // Agrupa de 4 em 4 a partir do fim, só para ficar legível ("911 1234 5678").
    const grupos: string[] = [];
    for (let fim = nacional.length; fim > 0; fim -= 4) grupos.unshift(nacional.slice(Math.max(0, fim - 4), fim));
    return { formatado: `+${pais} ${grupos.join(' ')}`, internacional: true };
}

// Lê o que a pessoa digitou (ou o autopreenchimento do celular colocou) e
// devolve o número arrumado, ou null se não der para entender.
export function normalizarTelefone(valor: string): Telefone | null {
    const texto = valor.trim();
    let digitos = texto.replace(/\D/g, '');
    if (!digitos) return null;

    // "+…" ou "00…" (prefixo internacional): o país vem em seguida.
    if (texto.startsWith('+')) return internacional(digitos, false);
    if (digitos.startsWith('00')) return internacional(digitos.replace(/^0+/, ''), false);

    // Prefixo de discagem nacional ("0 41 …").
    digitos = digitos.replace(/^0+/, '');

    // Brasil com 55 sem "+" (12–13 dígitos). Só por tamanho: um número
    // brasileiro sem país tem no máximo 11, então não come o DDD 55 (RS).
    if ((digitos.length === 12 || digitos.length === 13) && digitos.startsWith('55')) {
        return brasil(digitos.slice(2));
    }

    // Sem país: Brasil primeiro; se não fechar, América Latina / EUA.
    if (digitos.length === 10 || digitos.length === 11) {
        const br = brasil(digitos);
        if (br) return br;
    }
    return internacional(digitos, true);
}
