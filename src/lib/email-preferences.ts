/**
 * Contexto e regras: leia CLAUDE.md e docs/src_lib.md antes de alterar.
 * Mudou o comportamento? Atualize o doc na mesma mudança.
 */

export type PreferenciasEmail = {
    novo_almoco: boolean;
    dia_sem_almoco: boolean;
    proximo_mes: boolean;
    semana: boolean;
    pedido_acesso: boolean;
};

export type TipoAviso = keyof PreferenciasEmail;

export const TIPOS_AVISO: TipoAviso[] = [
    'novo_almoco',
    'dia_sem_almoco',
    'proximo_mes',
    'semana',
    'pedido_acesso',
];

export const PREFERENCIAS_PADRAO: PreferenciasEmail = {
    novo_almoco: false,
    dia_sem_almoco: false,
    proximo_mes: false,
    semana: false,
    pedido_acesso: false,
};
