/**
 * Contexto e regras: leia CLAUDE.md e docs/src_lib.md antes de alterar.
 * Mudou o comportamento? Atualize o doc na mesma mudança.
 */

import 'server-only';
import { supabaseServer } from '@/lib/supabase/service-role';
import { gerarSlug } from '@/lib/wards';
import type { NovaAlaInput, PedidoAlaInput } from '@/lib/server/validation';

export const LIMITE_PEDIDOS_PENDENTES = 10;

export type ResultadoPedido =
    | { ok: true; alaId: number }
    | { ok: false; status: number; erro: string };

const falha = (status: number, erro: string): ResultadoPedido => ({ ok: false, status, erro });

export async function buscarAlaIgual(ala: NovaAlaInput): Promise<{ status: string } | null> {
    const [{ data: mesmoLink }, { data: doEstado }] = await Promise.all([
        supabaseServer.from('ala').select('status').eq('slug', ala.slug).maybeSingle(),
        supabaseServer.from('ala').select('nome, cidade, status').eq('estado', ala.estado),
    ]);
    if (mesmoLink) return mesmoLink;
    return (doEstado ?? []).find(a => gerarSlug(ala.estado, a.cidade, a.nome) === ala.slug) ?? null;
}

async function contaNova(lider: NonNullable<PedidoAlaInput['lider']>): Promise<{ userId: string } | ResultadoPedido> {
    const { data: perfil } = await supabaseServer
        .from('perfil')
        .select('id')
        .eq('email', lider.email)
        .maybeSingle();
    if (perfil) {
        return falha(409, 'Este e-mail já tem conta no painel. Use outro e-mail para o líder responsável.');
    }

    const { data, error } = await supabaseServer.auth.admin.createUser({
        email: lider.email,
        password: lider.senha,
        email_confirm: true,
        user_metadata: { nome: lider.nome },
    });
    if (error || !data.user) {
        if (error?.message.toLowerCase().includes('already')) {
            return falha(409, 'Este e-mail já tem conta no painel. Use outro e-mail para o líder responsável.');
        }
        if (error?.message.toLowerCase().includes('password')) {
            return falha(400, 'Escolha uma senha mais forte (pelo menos 6 caracteres).');
        }
        return falha(500, 'Não foi possível enviar o pedido. Tente de novo.');
    }
    return { userId: data.user.id };
}

export async function pedirAla({ ala, lider }: PedidoAlaInput, userIdLogado?: string): Promise<ResultadoPedido> {
    const { count } = await supabaseServer
        .from('ala')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'pendente');
    if ((count ?? 0) >= LIMITE_PEDIDOS_PENDENTES) {
        return falha(429, 'Há muitos pedidos esperando aprovação agora. Tente de novo daqui a alguns dias.');
    }

    const existente = await buscarAlaIgual(ala);
    if (existente) {
        return existente.status === 'ativa'
            ? falha(409, `A ${ala.nome}, de ${ala.cidade}, já usa o calendário. Procure por ela na página inicial.`)
            : falha(409, `A ${ala.nome}, de ${ala.cidade}, já foi pedida e está esperando aprovação.`);
    }

    let conta: { userId: string; nova: boolean };
    if (userIdLogado) {
        conta = { userId: userIdLogado, nova: false };
    } else {
        if (!lider) return falha(400, 'Digite o nome do líder responsável.');
        const criada = await contaNova(lider);
        if ('ok' in criada) return criada;
        conta = { userId: criada.userId, nova: true };
    }

    const desfazerConta = async () => {
        if (conta.nova) await supabaseServer.auth.admin.deleteUser(conta.userId).catch(() => null);
    };

    const { data: nova, error } = await supabaseServer
        .from('ala')
        .insert({
            nome: ala.nome,
            slug: ala.slug,
            estado: ala.estado,
            cidade: ala.cidade,
            fuso_horario: ala.fuso,
            status: 'pendente',
            pedido_por: conta.userId,
            pedido_conta_nova: conta.nova,
        })
        .select('id')
        .single();
    if (error || !nova) {
        await desfazerConta();
        return error?.code === '23505'
            ? falha(409, `A ${ala.nome}, de ${ala.cidade}, já foi pedida e está esperando aprovação.`)
            : falha(500, 'Não foi possível enviar o pedido. Tente de novo.');
    }

    const { data: antigos } = conta.nova
        ? { data: [] }
        : await supabaseServer.from('ala_membro').select('ala_id, status, aprovado_por').eq('user_id', conta.userId);
    if (antigos?.length) {
        await supabaseServer.from('ala_membro').delete().eq('user_id', conta.userId);
    }

    const { error: erroVinculo } = await supabaseServer
        .from('ala_membro')
        .insert({ user_id: conta.userId, ala_id: nova.id, status: 'pendente' });
    if (erroVinculo) {
        if (antigos?.length) {
            await supabaseServer.from('ala_membro').insert(antigos.map(v => ({ ...v, user_id: conta.userId })));
        }
        await supabaseServer.from('ala').delete().eq('id', nova.id);
        await desfazerConta();
        return falha(500, 'Não foi possível enviar o pedido. Tente de novo.');
    }

    return { ok: true, alaId: nova.id };
}

export async function recusarPedido(alaId: number): Promise<boolean> {
    const { data: ala } = await supabaseServer
        .from('ala')
        .select('id, pedido_por, pedido_conta_nova')
        .eq('id', alaId)
        .eq('status', 'pendente')
        .maybeSingle();
    if (!ala) return false;

    const { error } = await supabaseServer.from('ala').delete().eq('id', ala.id).eq('status', 'pendente');
    if (error) return false;

    if (ala.pedido_conta_nova && ala.pedido_por) {
        const [{ data: outroVinculo }, { data: perfil }] = await Promise.all([
            supabaseServer.from('ala_membro').select('id').eq('user_id', ala.pedido_por).limit(1).maybeSingle(),
            supabaseServer.from('perfil').select('is_owner').eq('id', ala.pedido_por).maybeSingle(),
        ]);
        if (!outroVinculo && !perfil?.is_owner) {
            await supabaseServer.auth.admin.deleteUser(ala.pedido_por).catch(() => null);
        }
    }
    return true;
}
