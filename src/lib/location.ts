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

export function nomeDaUf(sigla: string): string {
    return UFS.find(u => u.sigla === sigla)?.nome ?? sigla;
}
