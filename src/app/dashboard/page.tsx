import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { requireAdminSession } from '@/lib/auth';
import DashboardClientGuard from './DashboardClientGuard';
import { DashboardRealtime } from './DashboardRealtime';
import { LogoutButton } from './LogoutButton';
import { supabaseServer } from '@/lib/supabase/server';
import { getDashboardRange, formatMonthLabel, diaTile, diasDisponiveisNoMes } from '@/lib/date';
import EditModal from '@/components/EditModal';
import CalendarExportImage from '@/components/CalendarExportImage';
import { AnimatedCard } from './AnimatedCard';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export const metadata: Metadata = {
    title: 'Painel da ala',
    robots: { index: false, follow: false },
};

// Painel do líder (Server Component): valida a sessão, busca os agendamentos da ala
// (mês atual + seguinte) e o histórico por mês. Sem sessão, redireciona ao login.
export default async function DashboardPage() {
    try {
        const session = await requireAdminSession();

        const { data: ala, error: alaError } = await supabaseServer
            .from('ala')
            .select('nome, slug')
            .eq('id', session.alaId)
            .single();

        if (alaError) {
            throw alaError;
        }

        const { inicio, fim, mesAtual, mesSeguinte } = getDashboardRange();

        const { data, error } = await supabaseServer
            .from('agendamento')
            .select('id, data, nome, telefone')
            .eq('ala_id', session.alaId)
            .gte('data', inicio)
            .lt('data', fim)
            .order('data', { ascending: true });

        if (error) {
            throw error;
        }

        const agendamentos = data ?? [];

        // Histórico: todos os agendamentos da ala, agrupados por mês.
        const { data: historicoRaw } = await supabaseServer
            .from('agendamento')
            .select('data')
            .eq('ala_id', session.alaId)
            .order('data', { ascending: true });

        const contagem = new Map<string, number>();
        for (const r of historicoRaw ?? []) {
            const ym = r.data.slice(0, 7);
            contagem.set(ym, (contagem.get(ym) ?? 0) + 1);
        }

        const historico = Array.from(contagem, ([ym, total]) => ({
            ym,
            total,
            disponiveis: diasDisponiveisNoMes(ym),
        })).sort((a, b) => b.ym.localeCompare(a.ym)); // mais recente primeiro

        return (
            <DashboardClientGuard>
                {/* Atualiza o painel ao vivo quando alguém agenda/edita/remove nesta ala. */}
                <DashboardRealtime alaId={session.alaId} />
                <main className="min-h-screen bg-primary px-4 py-8 sm:px-6 sm:py-12">
                    <section className="mx-auto flex w-full max-w-3xl flex-col gap-6">
                        {/* Cabeçalho (fora dos cards) */}
                        <header className="flex items-center justify-between gap-3">
                            <div className="min-w-0">
                                <h1 className="text-2xl font-semibold text-white sm:text-3xl">
                                    Painel da ala
                                </h1>
                                <p className="truncate text-sm text-white/70 sm:text-base">
                                    {ala.nome}
                                </p>
                            </div>
                            <LogoutButton />
                        </header>

                        {/* Atalho para o calendário público desta ala (usa o slug real do banco). */}
                        <Link
                            href={`/${ala.slug}`}
                            className="flex items-center justify-center gap-3 rounded-2xl bg-secondary px-5 py-4 text-base font-semibold text-white shadow-lg transition hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60 sm:text-lg"
                        >
                            {/* Ícone de calendário. */}
                            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                                <rect x="3" y="4" width="18" height="18" rx="2" />
                                <path d="M16 2v4M8 2v4M3 10h18" />
                            </svg>
                            Abrir calendário da ala
                        </Link>

                        {/* Card 1 — Agendamentos do mês */}
                        <AnimatedCard
                            delay={0.05}
                            className="flex flex-col gap-6 rounded-3xl bg-background p-4 shadow-xl sm:p-8"
                        >
                            {/* Gerar imagem no topo */}
                            <div className="flex flex-col gap-4 border-b border-slate-100 pb-5 sm:flex-row sm:items-center sm:justify-between">
                                <div className="flex items-center gap-2">
                                    <span className="h-5 w-1.5 rounded-full bg-accent" />
                                    <h2 className="text-lg font-semibold text-text">
                                        Agendamentos
                                    </h2>
                                </div>
                                <CalendarExportImage
                                    meses={[mesAtual, mesSeguinte]}
                                    agendamentos={agendamentos}
                                />
                            </div>

                            <div className="flex flex-col divide-y divide-slate-100">
                                {[mesAtual, mesSeguinte].map(ym => {
                                    const itens = agendamentos.filter(r =>
                                        r.data.startsWith(ym)
                                    );
                                    const disponiveis = diasDisponiveisNoMes(ym);

                                    return (
                                        <section key={ym} className="flex flex-col gap-3 py-5 first:pt-0 last:pb-0">
                                            <div className="flex items-center justify-between gap-2">
                                                <h3 className="text-base font-semibold text-text">
                                                    {formatMonthLabel(ym)}
                                                </h3>
                                                <span className="rounded-full bg-accent/10 px-3 py-1 text-sm font-medium text-accent whitespace-nowrap">
                                                    {itens.length} de {disponiveis} dias
                                                </span>
                                            </div>

                                            {itens.length === 0 ? (
                                                <p className="rounded-2xl border border-dashed border-slate-300 py-6 text-center text-sm text-muted">
                                                    Nenhum almoço agendado ainda.
                                                </p>
                                            ) : (
                                                <ul className="grid grid-cols-1 gap-3 lg:grid-cols-2">
                                                    {itens.map(row => {
                                                        const { dia, mesAbrev } = diaTile(row.data);

                                                        return (
                                                            <li
                                                                key={row.id}
                                                                className="flex items-center gap-3 rounded-2xl border border-slate-200 p-3 transition hover:border-accent/40 hover:bg-accent/5"
                                                            >
                                                                <div className="flex h-12 w-12 shrink-0 flex-col items-center justify-center rounded-xl bg-primary text-white">
                                                                    <span className="text-lg font-bold leading-none">
                                                                        {dia}
                                                                    </span>
                                                                    <span className="mt-0.5 text-[10px] uppercase leading-none opacity-80">
                                                                        {mesAbrev}
                                                                    </span>
                                                                </div>

                                                                <div className="min-w-0 flex-1">
                                                                    <p className="truncate font-medium text-text">
                                                                        {row.nome}
                                                                    </p>
                                                                    <p className="text-sm text-muted">
                                                                        {row.telefone}
                                                                    </p>
                                                                </div>

                                                                <EditModal {...row} />
                                                            </li>
                                                        );
                                                    })}
                                                </ul>
                                            )}
                                        </section>
                                    );
                                })}
                            </div>
                        </AnimatedCard>

                        {/* Card 2 — Histórico de almoços */}
                        <AnimatedCard
                            delay={0.12}
                            className="flex flex-col gap-5 rounded-3xl bg-background p-4 shadow-xl sm:p-8"
                        >
                            <div className="flex items-center gap-2">
                                <span className="h-5 w-1.5 rounded-full bg-accent" />
                                <h2 className="text-lg font-semibold text-text">
                                    Histórico de almoços
                                </h2>
                            </div>

                            {historico.length === 0 ? (
                                <p className="text-sm text-muted">
                                    Ainda não há almoços anteriores.
                                </p>
                            ) : (
                                <ul className="flex flex-col gap-3">
                                    {historico.map(({ ym, total, disponiveis }) => {
                                        const pct = disponiveis
                                            ? Math.round((total / disponiveis) * 100)
                                            : 0;

                                        return (
                                            <li key={ym} className="flex items-center gap-3">
                                                <span className="w-24 shrink-0 text-sm font-medium text-text sm:w-32">
                                                    {formatMonthLabel(ym)}
                                                </span>
                                                <div
                                                    className="h-7 flex-1 overflow-hidden rounded-full bg-accent/10"
                                                    role="img"
                                                    aria-label={`${total} de ${disponiveis} dias`}
                                                >
                                                    <div
                                                        className="h-full rounded-full bg-accent"
                                                        style={{ width: `${Math.max(pct, 6)}%` }}
                                                    />
                                                </div>
                                                <span className="w-14 shrink-0 text-right text-sm font-semibold text-accent">
                                                    {total}/{disponiveis}
                                                </span>
                                            </li>
                                        );
                                    })}
                                </ul>
                            )}
                        </AnimatedCard>
                    </section>
                </main>
            </DashboardClientGuard>
        );
    } catch {
        redirect('/admin');
    }
}
