// Formatação de telefone celular brasileiro, usada nos formulários (público e admin).

// Aplica a máscara "DD NNNNN NNNN" conforme o usuário digita (máx. 11 dígitos).
export function formatarTelefone(valor: string) {
    const digits = valor.replace(/\D/g, '').slice(0, 11);

    if (digits.length <= 2) return digits;
    if (digits.length <= 7) return `${digits.slice(0, 2)} ${digits.slice(2)}`;
    return `${digits.slice(0, 2)} ${digits.slice(2, 7)} ${digits.slice(7)}`;
}
