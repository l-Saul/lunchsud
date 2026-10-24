/**
 * Contexto e regras: leia CLAUDE.md e docs/src_lib.md antes de alterar.
 * Mudou o comportamento? Atualize o doc na mesma mudança.
 */

import 'server-only';
import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { criarSupabaseServidor } from '@/lib/supabase/server-session';
import { supabaseServer } from '@/lib/supabase/service-role';

export type Contexto = {
    userId: string;
    nome: string;
    isOwner: boolean;
    alaId: number | null;
};

export async function getUsuario() {
    const supabase = await criarSupabaseServidor();
    const {
        data: { user },
    } = await supabase.auth.getUser();
    return user;
}

export async function getContexto(): Promise<Contexto | null> {
    const user = await getUsuario();
    if (!user) return null;

    const { data: perfil } = await supabaseServer
        .from('perfil')
        .select('nome, is_owner')
        .eq('id', user.id)
        .single();

    const isOwner = perfil?.is_owner ?? false;
    let alaId: number | null = null;

    if (isOwner) {
        const cookieStore = await cookies();
        const selecionada = Number(cookieStore.get('ala_atual')?.value);

        if (selecionada) {
            alaId = selecionada;
        } else {
            const { data: primeira } = await supabaseServer
                .from('ala')
                .select('id')
                .order('nome')
                .limit(1)
                .single();
            alaId = primeira?.id ?? null;
        }
    } else {
        const { data: vinculo } = await supabaseServer
            .from('ala_membro')
            .select('ala_id')
            .eq('user_id', user.id)
            .eq('status', 'aprovado')
            .limit(1)
            .single();
        alaId = vinculo?.ala_id ?? null;
    }

    return {
        userId: user.id,
        nome: perfil?.nome ?? '',
        isOwner,
        alaId,
    };
}

export async function requireAcesso(): Promise<Contexto> {
    const ctx = await getContexto();
    if (!ctx) redirect('/admin');
    if (!ctx.isOwner && ctx.alaId === null) redirect('/acesso');
    return ctx;
}

export async function podeEditarAla(userId: string, isOwner: boolean, alaId: number) {
    if (isOwner) return true;
    const { data } = await supabaseServer
        .from('ala_membro')
        .select('id')
        .eq('user_id', userId)
        .eq('ala_id', alaId)
        .eq('status', 'aprovado')
        .limit(1)
        .single();
    return Boolean(data);
}
