/**
 * Contexto e regras: leia CLAUDE.md e docs/src_lib.md antes de alterar.
 * Mudou o comportamento? Atualize o doc na mesma mudança.
 */

import 'server-only';
import { createClient } from '@supabase/supabase-js';
import { supabaseServer } from '@/lib/supabase/service-role';
import type { PedidoAlaInput } from '@/lib/server/validation';

export const LIMITE_PEDIDOS_PENDENTES = 10;

export type ResultadoPedido =
    | { ok: true; alaId: number }
    | { ok: false; status: number; erro: string };

const falha = (status: number, erro: string): ResultadoPedido => ({ ok: false, status, erro });

async function senhaConfere(email: string, senha: string) {
    const anon = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
        auth: { persistSession: false, autoRefreshToken: false },
    });
    const { data, error } = await anon.auth.signInWithPassword({ email, password: senha });
    if (error || !data.session) return false;
    await supabaseServer.auth.admin.signOut(data.session.access_token, 'local').catch(() => null);
    return true;
}

async function contaDoLider(lider: PedidoAlaInput['lider']): Promise<{ userId: string; nova: boolean } | ResultadoPedido> {
    const { data: perfil } = await supabaseServer
        .from('perfil')
        .select('id')
        .eq('email', lider.email)
        .maybeSingle();

    if (perfil) {
        if (!(await senhaConfere(lider.email, lider.senha))) {
            return falha(401, 'Este e-mail já tem conta no painel, mas a senha não confere. Digite a senha dessa conta ou use outro e-mail.');
        }
        const { data: vinculo } = await supabaseServer
            .from('ala_membro')
            .select('id')
            .eq('user_id', perfil.id)
            .limit(1)
            .maybeSingle();
        if (vinculo) {
            return falha(409, 'Esta conta já está ligada a uma ala. Para pedir outra ala, use outro e-mail.');
        }
        return { userId: perfil.id, nova: false };
    }

    const { data, error } = await supabaseServer.auth.admin.createUser({
        email: lider.email,
        password: lider.senha,
        email_confirm: true,
        user_metadata: { nome: lider.nome },
    });
    if (error || !data.user) {
        if (error?.message.toLowerCase().includes('already')) {
            return falha(409, 'Este e-mail já tem conta no painel. Toque em Enviar pedido de novo.');
        }
        if (error?.message.toLowerCase().includes('password')) {
            return falha(400, 'Escolha uma senha mais forte (pelo menos 6 caracteres).');
        }
        return falha(500, 'Não foi possível enviar o pedido. Tente de novo.');
    }
    return { userId: data.user.id, nova: true };
}

export async function pedirAla({ ala, lider }: PedidoAlaInput): Promise<ResultadoPedido> {
    const { count } = await supabaseServer
        .from('ala')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'pendente');
    if ((count ?? 0) >= LIMITE_PEDIDOS_PENDENTES) {
        return falha(429, 'Há muitos pedidos esperando aprovação agora. Tente de novo daqui a alguns dias.');
    }

    const { data: existente } = await supabaseServer
        .from('ala')
        .select('status')
        .eq('slug', ala.slug)
        .maybeSingle();
    if (existente) {
        return existente.status === 'ativa'
            ? falha(409, `A ${ala.nome}, de ${ala.cidade}, já usa o calendário. Procure por ela na página inicial.`)
            : falha(409, `A ${ala.nome}, de ${ala.cidade}, já foi pedida e está esperando aprovação.`);
    }

    const conta = await contaDoLider(lider);
    if ('ok' in conta) return conta;

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

    const { error: erroVinculo } = await supabaseServer
        .from('ala_membro')
        .insert({ user_id: conta.userId, ala_id: nova.id, status: 'pendente' });
    if (erroVinculo) {
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
