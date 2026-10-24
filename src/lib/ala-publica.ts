import { cache } from 'react';
import { supabaseServer } from '@/lib/supabase/server';
import { getDashboardRange } from '@/lib/date';
import { parseSlug, ValidationError } from '@/lib/validation';

// Dados da página pública da ala (servidor, service-role). Usado pela página
// `[slug]` e por /api/agendamentos/[slug], que a página chama só para
// ressincronizar (reconexão do WebSocket ou volta para a aba) — as mudanças do
// dia a dia chegam pelo próprio WebSocket.

export type DiaOcupado = {
    id: number; // casa os eventos do Realtime (DELETE só traz o id)
    data: string; // 'YYYY-MM-DD'
    nome: string;
};

// Ala pelo slug do link público. O `cache` evita ir ao banco duas vezes no mesmo
// carregamento (generateMetadata + página). Normaliza o slug (link digitado com
// maiúscula também funciona) e descarta lixo (ex.: robôs pedindo /wp-login.php)
// sem consultar o banco.
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
        .select('id, nome, slug')
        .eq('slug', slug)
        .maybeSingle();

    return data as { id: number; nome: string; slug: string } | null;
});

// Dias ocupados da ala só na janela agendável (de hoje até o fim do mês
// seguinte, fuso de São Paulo). Dias passados aparecem bloqueados no calendário,
// então não precisam de dados. Sem esse filtro a lista crescia com todo o
// histórico. null = erro no banco.
export async function buscarOcupados(alaId: number): Promise<DiaOcupado[] | null> {
    const { hoje, fim } = getDashboardRange();

    // data::text mantém 'YYYY-MM-DD' (sem timezone).
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
