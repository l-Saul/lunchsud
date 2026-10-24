// Telefone celular brasileiro: normalização + máscara. Usado nos formulários
// (público e admin) e na validação do servidor — a mesma regra nos dois lados.

// Só os dígitos "DDD + número", sem o que vem na frente:
//  - +55 do país: o autopreenchimento do celular insere "+55 41 99999-9999";
//    antes isso virava "55 41999 9999" (11 dígitos, passava e salvava errado);
//  - zeros do hábito antigo de discagem ("041 99999-9999").
// O 55 só sai quando sobra número (13+ dígitos, ou 12 com "+"), para não comer
// o DDD 55 (RS) de quem digita o próprio número.
export function digitosTelefone(valor: string) {
    let digitos = valor.replace(/\D/g, '');
    const comPais = digitos.length >= 13 || (digitos.length === 12 && valor.trim().startsWith('+'));
    if (comPais && digitos.startsWith('55')) digitos = digitos.slice(2);
    return digitos.replace(/^0+/, '');
}

// Aplica a máscara "DD NNNNN NNNN" conforme o usuário digita (máx. 11 dígitos).
export function formatarTelefone(valor: string) {
    const digits = digitosTelefone(valor).slice(0, 11);

    if (digits.length <= 2) return digits;
    if (digits.length <= 7) return `${digits.slice(0, 2)} ${digits.slice(2)}`;
    return `${digits.slice(0, 2)} ${digits.slice(2, 7)} ${digits.slice(7)}`;
}
