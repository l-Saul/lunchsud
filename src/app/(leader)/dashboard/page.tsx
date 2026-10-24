/**
 * Contexto e regras: leia CLAUDE.md e docs/routes_dashboard.md antes de alterar.
 * Mudou o comportamento? Atualize o doc na mesma mudança.
 */

import type { Metadata } from 'next';
import { requireAcesso } from '@/lib/server/session';
import DashboardClientGuard from './_components/DashboardClientGuard';
import { DashboardRealtime } from './_components/DashboardRealtime';
import { LogoutButton } from './_components/LogoutButton';
import { OpenCalendarButton } from './_components/OpenCalendarButton';
import { WardSwitcher } from './_components/WardSwitcher';
import { BookingsCard } from './_components/BookingsCard';
import { HistoryCard, type MesHistorico } from './_components/HistoryCard';
import { UsersCard, type Usuario } from './_components/UsersCard';
import { supabaseServer } from '@/lib/supabase/service-role';
import { getDashboardRange, getHistoricoRange, diasDisponiveisNoMes } from '@/lib/date';
import { FUSO_PADRAO } from '@/lib/location';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export const metadata: Metadata = {
    title: 'Painel da ala',
    robots: { index: false, follow: false },
};

export default async function DashboardPage() {
    const ctx = await requireAcesso();
    const alaId = ctx.alaId;

    const { data: ala } = alaId !== null
        ? await supabaseServer.from('ala').select('nome, slug, fuso_horario').eq('id', alaId).single()
        : { data: null };

    const fuso = ala?.fuso_horario ?? FUSO_PADRAO;
    const { inicio, fim, mesAtual, mesSeguinte } = getDashboardRange(fuso);

    const { data: agData } = alaId !== null
        ? await supabaseServer
            .from('agendamento')
            .select('id, data, nome, telefone')
            .eq('ala_id', alaId)
            .gte('data', inicio)
            .lt('data', fim)
            .order('data', { ascending: true })
        : { data: [] };
    const agendamentos = agData ?? [];

    const { inicio: histInicio, fim: histFim } = getHistoricoRange(3, fuso);
    const { data: historicoRaw } = alaId !== null
        ? await supabaseServer
            .from('agendamento')
            .select('data')
            .eq('ala_id', alaId)
            .gte('data', histInicio)
            .lt('data', histFim)
            .order('data', { ascending: true })
        : { data: [] };

    const contagem = new Map<string, number>();
    for (const r of historicoRaw ?? []) {
        const ym = r.data.slice(0, 7);
        contagem.set(ym, (contagem.get(ym) ?? 0) + 1);
    }
    const historico: MesHistorico[] = Array.from(contagem, ([ym, total]) => ({
        ym,
        total,
        disponiveis: diasDisponiveisNoMes(ym),
    })).sort((a, b) => b.ym.localeCompare(a.ym));

    const { data: membros } = alaId !== null
        ? await supabaseServer
            .from('ala_membro')
            .select('id, status, user_id')
            .eq('ala_id', alaId)
            .order('status', { ascending: true })
        : { data: [] };

    const listaMembros = membros ?? [];
    const userIds = [...new Set(listaMembros.map(m => m.user_id))];
    const { data: perfis } = userIds.length
        ? await supabaseServer.from('perfil').select('id, nome, email').in('id', userIds)
        : { data: [] };
    const perfilPorId = new Map((perfis ?? []).map(p => [p.id, p]));

    let alasParaTroca: { id: number; nome: string; slug: string }[] = [];
    if (ctx.isOwner) {
        const { data: todasAlas } = await supabaseServer.from('ala').select('id, nome, slug').order('nome');
        alasParaTroca = todasAlas ?? [];
    }

    const usuarios: Usuario[] = listaMembros.map(m => ({
        id: m.id,
        nome: perfilPorId.get(m.user_id)?.nome ?? '',
        email: perfilPorId.get(m.user_id)?.email ?? '',
        status: m.status,
    }));

    return (
        <DashboardClientGuard>
            {alaId !== null && <DashboardRealtime alaId={alaId} />}
            <main className="min-h-screen px-4 py-8 sm:px-6 sm:py-12">
                <section className="mx-auto flex w-full max-w-3xl flex-col gap-6">
                    <header className="flex items-center justify-between gap-3">
                        <div className="min-w-0">
                            <h1 className="text-2xl font-semibold text-white sm:text-3xl">
                                Painel da ala
                            </h1>
                            <p className="truncate text-sm text-white/70 sm:text-base">
                                {ala?.nome ?? 'Selecione uma ala'}
                                {ctx.isOwner && ' · owner'}
                            </p>
                        </div>
                        <LogoutButton />
                    </header>

                    {ctx.isOwner && alasParaTroca.length > 0 && (
                        <WardSwitcher alas={alasParaTroca} atualId={alaId} />
                    )}

                    {ala?.slug && <OpenCalendarButton slug={ala.slug} />}

                    <BookingsCard mesAtual={mesAtual} mesSeguinte={mesSeguinte} agendamentos={agendamentos} />

                    <HistoryCard historico={historico} />

                    <UsersCard usuarios={usuarios} />
                </section>
            </main>
        </DashboardClientGuard>
    );
}
