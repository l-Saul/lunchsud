/**
 * Contexto e regras: leia CLAUDE.md e docs/src_lib.md antes de alterar.
 * Mudou o comportamento? Atualize o doc na mesma mudança.
 */

export const FUSO_PADRAO = 'America/Sao_Paulo';

export const UFS = [
    { sigla: 'AC', nome: 'Acre', fuso: 'America/Rio_Branco' },
    { sigla: 'AL', nome: 'Alagoas', fuso: 'America/Maceio' },
    { sigla: 'AP', nome: 'Amapá', fuso: 'America/Belem' },
    { sigla: 'AM', nome: 'Amazonas', fuso: 'America/Manaus' },
    { sigla: 'BA', nome: 'Bahia', fuso: 'America/Bahia' },
    { sigla: 'CE', nome: 'Ceará', fuso: 'America/Fortaleza' },
    { sigla: 'DF', nome: 'Distrito Federal', fuso: 'America/Sao_Paulo' },
    { sigla: 'ES', nome: 'Espírito Santo', fuso: 'America/Sao_Paulo' },
    { sigla: 'GO', nome: 'Goiás', fuso: 'America/Sao_Paulo' },
    { sigla: 'MA', nome: 'Maranhão', fuso: 'America/Fortaleza' },
    { sigla: 'MT', nome: 'Mato Grosso', fuso: 'America/Cuiaba' },
    { sigla: 'MS', nome: 'Mato Grosso do Sul', fuso: 'America/Campo_Grande' },
    { sigla: 'MG', nome: 'Minas Gerais', fuso: 'America/Sao_Paulo' },
    { sigla: 'PA', nome: 'Pará', fuso: 'America/Belem' },
    { sigla: 'PB', nome: 'Paraíba', fuso: 'America/Fortaleza' },
    { sigla: 'PR', nome: 'Paraná', fuso: 'America/Sao_Paulo' },
    { sigla: 'PE', nome: 'Pernambuco', fuso: 'America/Recife' },
    { sigla: 'PI', nome: 'Piauí', fuso: 'America/Fortaleza' },
    { sigla: 'RJ', nome: 'Rio de Janeiro', fuso: 'America/Sao_Paulo' },
    { sigla: 'RN', nome: 'Rio Grande do Norte', fuso: 'America/Fortaleza' },
    { sigla: 'RS', nome: 'Rio Grande do Sul', fuso: 'America/Sao_Paulo' },
    { sigla: 'RO', nome: 'Rondônia', fuso: 'America/Porto_Velho' },
    { sigla: 'RR', nome: 'Roraima', fuso: 'America/Boa_Vista' },
    { sigla: 'SC', nome: 'Santa Catarina', fuso: 'America/Sao_Paulo' },
    { sigla: 'SP', nome: 'São Paulo', fuso: 'America/Sao_Paulo' },
    { sigla: 'SE', nome: 'Sergipe', fuso: 'America/Maceio' },
    { sigla: 'TO', nome: 'Tocantins', fuso: 'America/Araguaina' },
] as const;

export const PAISES = [
    { codigo: 'BR', nome: 'Brasil', fuso: 'America/Sao_Paulo' },
    { codigo: 'AR', nome: 'Argentina', fuso: 'America/Argentina/Buenos_Aires' },
    { codigo: 'BO', nome: 'Bolívia', fuso: 'America/La_Paz' },
    { codigo: 'CA', nome: 'Canadá', fuso: 'America/Toronto' },
    { codigo: 'CL', nome: 'Chile', fuso: 'America/Santiago' },
    { codigo: 'CO', nome: 'Colômbia', fuso: 'America/Bogota' },
    { codigo: 'CR', nome: 'Costa Rica', fuso: 'America/Costa_Rica' },
    { codigo: 'EC', nome: 'Equador', fuso: 'America/Guayaquil' },
    { codigo: 'SV', nome: 'El Salvador', fuso: 'America/El_Salvador' },
    { codigo: 'US', nome: 'Estados Unidos', fuso: 'America/New_York' },
    { codigo: 'GT', nome: 'Guatemala', fuso: 'America/Guatemala' },
    { codigo: 'HN', nome: 'Honduras', fuso: 'America/Tegucigalpa' },
    { codigo: 'MX', nome: 'México', fuso: 'America/Mexico_City' },
    { codigo: 'NI', nome: 'Nicarágua', fuso: 'America/Managua' },
    { codigo: 'PA', nome: 'Panamá', fuso: 'America/Panama' },
    { codigo: 'PY', nome: 'Paraguai', fuso: 'America/Asuncion' },
    { codigo: 'PE', nome: 'Peru', fuso: 'America/Lima' },
    { codigo: 'PR', nome: 'Porto Rico', fuso: 'America/Puerto_Rico' },
    { codigo: 'DO', nome: 'República Dominicana', fuso: 'America/Santo_Domingo' },
    { codigo: 'UY', nome: 'Uruguai', fuso: 'America/Montevideo' },
    { codigo: 'VE', nome: 'Venezuela', fuso: 'America/Caracas' },
] as const;

export function fusoValido(fuso: string) {
    if (!/^[A-Za-z]+(\/[A-Za-z0-9_+-]+)+$/.test(fuso)) return false;
    try {
        new Intl.DateTimeFormat('en-US', { timeZone: fuso });
        return true;
    } catch {
        return false;
    }
}

export function fusosDasAmericas(): string[] {
    const todos = typeof Intl.supportedValuesOf === 'function' ? Intl.supportedValuesOf('timeZone') : [];
    return todos.filter(f => f.startsWith('America/'));
}
