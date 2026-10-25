/**
 * Contexto e regras: leia CLAUDE.md e docs/src_lib.md antes de alterar.
 * Mudou o comportamento? Atualize o doc na mesma mudança.
 */

import { comArtigo } from '@/lib/wards';

export const DESCRICAO_DA_ALA = 'Escolha um dia livre e agende o almoço dos missionários. Não precisa criar conta.';

export function tituloDaAla(nomeAla: string): string {
    return `Calendário de almoços ${comArtigo(nomeAla, 'de')}`;
}
