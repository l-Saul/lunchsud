/**
 * Contexto e regras: leia CLAUDE.md e docs/routes_dashboard.md antes de alterar.
 * Mudou o comportamento? Atualize o doc na mesma mudança.
 */

import type { Metadata } from 'next';
import { requireAcesso } from '@/lib/server/session';
import { HeaderBand } from '@/components/HeaderBand';
import DashboardClientGuard from './_components/DashboardClientGuard';
import { DashboardRealtime } from './_components/DashboardRealtime';
import { LogoutButton } from './_components/LogoutButton';
import { OpenCalendarButton } from './_components/OpenCalendarButton';
import { ShareLinkButtons } from './_components/ShareLinkButtons';
import { WardSwitcher, type PedidoAla } from './_components/WardSwitcher';
import { BookingsCard } from './_components/BookingsCard';
import MonthImageExport from './_components/month-image/MonthImageExport';
import { HistoryCard, type MesHistorico } from './_components/HistoryCard';
import { UsersCard, type Usuario } from './_components/UsersCard';
import { NotificationsCard } from './_components/NotificationsCard';
import { supabaseServer } from '@/lib/supabase/service-role';
import { buscarPreferenciasEmail } from '@/lib/server/notifications';
import { getDashboardRange, getHistoricoRange, diasDisponiveisNoMes, dataPorExtenso, diaNoFuso, limitesDaEdicao } from '@/lib/date';
import { FUSO_PADRAO } from '@/lib/location';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const LINHA_DA_ALA =
    'flex flex-wrap items-center justify-between gap-x-4 gap-y-3 rounded-3xl bg-linear-to-r from-secondary ' +
    'to-primary px-4 py-4 text-white shadow-md [--focus-color:var(--color-gold)] sm:px-6';

export const metadata: Metadata = {
    title: 'Painel da ala',
    robots: { index: false, follow: false },
};

type AlaParaTroca = { id: number; nome: string; slug: string; estado: string; cidade: string };

async function buscarAla(alaId: number) {
    const { data } = await supabaseServer.from('ala').select('nome, slug, fuso_horario').eq('id', alaId).single();
    return data;
}

async function buscarAgendamentos(alaId: number, inicio: string, fim: string) {
    const { data } = await supabaseServer
        .from('agendamento')
        .select('id, data, nome, telefone')
        .eq('ala_id', alaId)
        .gte('data', inicio)
        .lt('data', fim)
        .order('data', { ascending: true });
    return data ?? [];
}

async function buscarHistorico(alaId: number, inicio: string, fim: string): Promise<MesHistorico[]> {
    const { data } = await supabaseServer
        .from('agendamento')
        .select('data')
        .eq('ala_id', alaId)
        .gte('data', inicio)
        .lt('data', fim)
        .order('data', { ascending: true });

    const datasPorMes = new Map<string, string[]>();
    for (const r of data ?? []) {
        const ym = r.data.slice(0, 7);
        datasPorMes.set(ym, [...(datasPorMes.get(ym) ?? []), r.data]);
    }
    return Array.from(datasPorMes, ([ym, datas]) => ({
        ym,
        total: datas.length,
        disponiveis: diasDisponiveisNoMes(ym, datas),
    })).sort((a, b) => b.ym.localeCompare(a.ym));
}

async function buscarUsuarios(alaId: number, euId: string): Promise<Usuario[]> {
    const { data: membros } = await supabaseServer
        .from('ala_membro')
        .select('id, status, user_id')
        .eq('ala_id', alaId)
        .order('status', { ascending: true });

    const lista = membros ?? [];
    const userIds = [...new Set(lista.map(m => m.user_id))];
    const { data: perfis } = userIds.length
        ? await supabaseServer.from('perfil').select('id, nome, email').in('id', userIds)
        : { data: [] };
    const perfilPorId = new Map((perfis ?? []).map(p => [p.id, p]));

    return lista.map(m => ({
        id: m.id,
        nome: perfilPorId.get(m.user_id)?.nome ?? '',
        email: perfilPorId.get(m.user_id)?.email ?? '',
        status: m.status,
        voce: m.user_id === euId,
    }));
}

async function buscarDadosDoOwner(): Promise<{ alasParaTroca: AlaParaTroca[]; pedidos: PedidoAla[] }> {
    const [{ data: todasAlas }, { data: pendentes }] = await Promise.all([
        supabaseServer.from('ala').select('id, nome, slug, estado, cidade').eq('status', 'ativa').order('nome'),
        supabaseServer
            .from('ala')
            .select('id, nome, cidade, estado, criado_em, pedido_por, pedido_conta_nova')
            .eq('status', 'pendente')
            .order('criado_em'),
    ]);

    const lideresIds = [...new Set((pendentes ?? []).map(p => p.pedido_por).filter((id): id is string => !!id))];
    const { data: lideres } = lideresIds.length
        ? await supabaseServer.from('perfil').select('id, nome, email').in('id', lideresIds)
        : { data: [] };
    const liderPorId = new Map((lideres ?? []).map(l => [l.id, l]));

    const pedidos = (pendentes ?? []).map(p => {
        const lider = p.pedido_por ? liderPorId.get(p.pedido_por) : undefined;
        return {
            id: p.id,
            nome: p.nome,
            cidade: p.cidade,
            estado: p.estado,
            pedidoEm: dataPorExtenso(diaNoFuso(p.criado_em)),
            contaNova: p.pedido_conta_nova,
            lider: lider ? { nome: lider.nome || lider.email || '', email: lider.email ?? '' } : null,
        };
    });
    return { alasParaTroca: todasAlas ?? [], pedidos };
}

async function buscarMeuEmail(userId: string) {
    const { data } = await supabaseServer.from('perfil').select('email').eq('id', userId).maybeSingle();
    return data?.email ?? null;
}

export default async function DashboardPage() {
    const ctx = await requireAcesso();
    const alaId = ctx.alaId;

    const [ala, usuarios, { alasParaTroca, pedidos }, meuEmail, avisos] = await Promise.all([
        alaId !== null ? buscarAla(alaId) : null,
        alaId !== null ? buscarUsuarios(alaId, ctx.userId) : [],
        ctx.isOwner ? buscarDadosDoOwner() : { alasParaTroca: [], pedidos: [] },
        alaId !== null ? buscarMeuEmail(ctx.userId) : null,
        alaId !== null ? buscarPreferenciasEmail(ctx.userId, alaId) : null,
    ]);

    const fuso = ala?.fuso_horario ?? FUSO_PADRAO;
    const { inicio, fim, mesAtual, mesSeguinte } = getDashboardRange(fuso);
    const { inicio: histInicio, fim: histFim } = getHistoricoRange(3, fuso);

    const [agendamentos, historico] = alaId !== null
        ? await Promise.all([buscarAgendamentos(alaId, inicio, fim), buscarHistorico(alaId, histInicio, histFim)])
        : [[], []];

    return (
        <DashboardClientGuard>
            {alaId !== null && <DashboardRealtime alaId={alaId} />}
            <HeaderBand title="Painel da ala" />

            <main className="px-4 py-8 sm:px-6 sm:py-10">
                <section className="mx-auto flex w-full max-w-3xl flex-col gap-[1.575rem]">
                    <div className={LINHA_DA_ALA}>
                        <p className="min-w-0 wrap-anywhere text-xl font-semibold">
                            {ala?.nome ?? 'Selecione uma ala'}
                        </p>
                        <LogoutButton />
                    </div>

                    {ala?.slug && (
                        <div className="flex flex-wrap items-stretch gap-2 sm:gap-3">
                            <OpenCalendarButton slug={ala.slug} />
                            <ShareLinkButtons slug={ala.slug} nomeAla={ala.nome} />
                        </div>
                    )}

                    <MonthImageExport meses={[mesAtual, mesSeguinte]} agendamentos={agendamentos} />

                    <BookingsCard mesAtual={mesAtual} mesSeguinte={mesSeguinte} agendamentos={agendamentos} limites={limitesDaEdicao(fuso)} />

                    <HistoryCard historico={historico} />

                    {alaId !== null && avisos && (
                        <NotificationsCard
                            key={alaId}
                            alaId={alaId}
                            email={meuEmail}
                            preferenciasIniciais={avisos}
                        />
                    )}

                    <UsersCard usuarios={usuarios} />
                </section>

                {ctx.isOwner && (
                    <WardSwitcher alas={alasParaTroca} atualId={alaId} pedidos={pedidos} />
                )}
            </main>
        </DashboardClientGuard>
    );
}
