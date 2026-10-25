/**
 * Contexto e regras: leia CLAUDE.md e docs/src_lib.md antes de alterar.
 * Mudou o comportamento? Atualize o doc na mesma mudança.
 */

import 'server-only';
import { cache } from 'react';
import { supabaseServer } from '@/lib/supabase/service-role';
import { getDashboardRange } from '@/lib/date';
import { parseSlug, ValidationError } from '@/lib/server/validation';

export type DiaOcupado = {
    id: number;
    data: string;
    nome: string;
};

export const buscarAlaPorSlug = cache(async (slugCru: string) => {
    let slug: string;
    try {
        slug = parseSlug(slugCru);
    } catch (e) {
        if (e instanceof ValidationError) return null;
        throw e;
    }

    const { data } = await supabaseServer
        .from('ala')
        .select('id, nome, slug, fuso_horario')
        .eq('slug', slug)
        .eq('status', 'ativa')
        .maybeSingle();

    return data as AlaPublica | null;
});

export type AlaPublica = { id: number; nome: string; slug: string; fuso_horario: string };

export async function buscarOcupados(ala: AlaPublica): Promise<DiaOcupado[] | null> {
    const { hoje, fim } = getDashboardRange(ala.fuso_horario);
    const alaId = ala.id;

    const { data, error } = await supabaseServer
        .from('agendamento')
        .select('id, data::text, nome')
        .eq('ala_id', alaId)
        .gte('data', hoje)
        .lt('data', fim)
        .order('data');

    if (error) return null;
    return data as DiaOcupado[];
}
