import type { Metadata } from 'next';
import Link from 'next/link';
import { requireAcesso } from '@/lib/session';
import DashboardClientGuard from './DashboardClientGuard';
import { DashboardRealtime } from './DashboardRealtime';
import { LogoutButton } from './LogoutButton';
import { TrocarAla } from './TrocarAla';
import { UsuariosCard, type Usuario } from './UsuariosCard';
import { supabaseServer } from '@/lib/supabase/server';
import { getDashboardRange, getHistoricoRange, formatMonthLabel, diaTile, diasDisponiveisNoMes } from '@/lib/date';
import { semAlaTesteEmProd } from '@/lib/alas';
import EditModal from '@/components/EditModal';
import CalendarExportImage from '@/components/CalendarExportImage';
import { AnimatedCard } from './AnimatedCard';
import { MesColapsavel } from './MesColapsavel';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export const metadata: Metadata = {
    title: 'Painel da ala',
    robots: { index: false, follow: false },
};

// Painel do líder (Server Component). requireAcesso resolve o usuário (Supabase Auth)
// e a ala em foco: member → sua ala; owner → ala selecionada (troca de ala).
export default async function DashboardPage() {
    const ctx = await requireAcesso();
    const alaId = ctx.alaId;

    // Ala em foco.
    const { data: ala } = alaId !== null
        ? await supabaseServer.from('ala').select('nome, slug').eq('id', alaId).single()
        : { data: null };

    const { inicio, fim, mesAtual, mesSeguinte } = getDashboardRange();

    // Agendamentos do mês atual + seguinte (vazio se owner sem ala em foco).
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

    // Histórico: só os 3 meses anteriores ao atual.
    const { inicio: histInicio, fim: histFim } = getHistoricoRange(3);
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
    const historico = Array.from(contagem, ([ym, total]) => ({
        ym,
        total,
        disponiveis: diasDisponiveisNoMes(ym),
    })).sort((a, b) => b.ym.localeCompare(a.ym));

    // Usuários do card: sempre só os da ala EM FOCO (member: a sua; owner: a
    // selecionada na troca de ala). Como todos pertencem à mesma ala, não há
    // necessidade de mostrar o nome da ala em cada um.
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

    // Lista de alas para o owner trocar a ala em foco (sem a ala de teste em prod).
    let alasParaTroca: { id: number; nome: string; slug: string }[] = [];
    if (ctx.isOwner) {
        const { data: todasAlas } = await supabaseServer.from('ala').select('id, nome, slug').order('nome');
        alasParaTroca = semAlaTesteEmProd(todasAlas ?? []);
    }

    const usuarios: Usuario[] = listaMembros.map(m => ({
        id: m.id,
        nome: perfilPorId.get(m.user_id)?.nome ?? '',
        email: perfilPorId.get(m.user_id)?.email ?? '',
        status: m.status,
    }));

    return (
        <DashboardClientGuard>
            {/* Atualiza ao vivo quando alguém agenda/edita/remove na ala em foco. */}
            {alaId !== null && <DashboardRealtime alaId={alaId} />}
            <main className="min-h-screen px-4 py-8 sm:px-6 sm:py-12">
                <section className="mx-auto flex w-full max-w-3xl flex-col gap-6">
                    {/* Cabeçalho */}
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

                    {/* Troca de ala (somente owner) */}
                    {ctx.isOwner && alasParaTroca.length > 0 && (
                        <TrocarAla alas={alasParaTroca} atualId={alaId} />
                    )}

                    {/* Atalho para o calendário público desta ala */}
                    {ala?.slug && (
                        <Link
                            href={`/${ala.slug}`}
                            className="flex items-center justify-center gap-3 rounded-2xl bg-secondary px-5 py-4 text-base font-semibold text-white shadow-lg transition duration-200 hover:-translate-y-0.5 hover:opacity-95 hover:shadow-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60 sm:text-lg"
                        >
                            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                                <rect x="3" y="4" width="18" height="18" rx="2" />
                                <path d="M16 2v4M8 2v4M3 10h18" />
                            </svg>
                            Abrir calendário da ala
                        </Link>
                    )}

                    {/* Card 1 — Agendamentos do mês */}
                    <AnimatedCard
                        delay={0.05}
                        className="flex flex-col gap-6 rounded-3xl bg-background p-4 shadow-xl ring-1 ring-white/40 sm:p-8"
                    >
                        <div className="flex flex-col gap-4 border-b border-slate-100 pb-5 sm:flex-row sm:items-center sm:justify-between">
                            <div className="flex items-center gap-2">
                                <span className="h-5 w-1.5 rounded-full bg-accent" />
                                <h2 className="text-lg font-semibold text-text">Agendamentos</h2>
                            </div>
                            <CalendarExportImage meses={[mesAtual, mesSeguinte]} agendamentos={agendamentos} />
                        </div>

                        <div className="flex flex-col divide-y divide-slate-100">
                            {[mesAtual, mesSeguinte].map(ym => {
                                const itens = agendamentos.filter(r => r.data.startsWith(ym));
                                const disponiveis = diasDisponiveisNoMes(ym);

                                return (
                                    <MesColapsavel
                                        key={ym}
                                        label={formatMonthLabel(ym)}
                                        total={itens.length}
                                        disponiveis={disponiveis}
                                    >
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
                                                                <span className="text-lg font-bold leading-none">{dia}</span>
                                                                <span className="mt-0.5 text-[10px] uppercase leading-none opacity-80">{mesAbrev}</span>
                                                            </div>
                                                            <div className="min-w-0 flex-1">
                                                                <p className="truncate font-medium text-text">{row.nome}</p>
                                                                <p className="text-sm text-muted">{row.telefone}</p>
                                                            </div>
                                                            <EditModal {...row} />
                                                        </li>
                                                    );
                                                })}
                                            </ul>
                                        )}
                                    </MesColapsavel>
                                );
                            })}
                        </div>
                    </AnimatedCard>

                    {/* Card 2 — Histórico de almoços */}
                    <AnimatedCard
                        delay={0.12}
                        className="flex flex-col gap-5 rounded-3xl bg-background p-4 shadow-xl ring-1 ring-white/40 sm:p-8"
                    >
                        <div className="flex items-center gap-2">
                            <span className="h-5 w-1.5 rounded-full bg-accent" />
                            <h2 className="text-lg font-semibold text-text">Histórico de almoços</h2>
                        </div>

                        {historico.length === 0 ? (
                            <p className="text-sm text-muted">Ainda não há almoços anteriores.</p>
                        ) : (
                            <ul className="flex flex-col gap-3">
                                {historico.map(({ ym, total, disponiveis }) => {
                                    const pct = disponiveis ? Math.round((total / disponiveis) * 100) : 0;
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
                                                <div className="h-full rounded-full bg-accent" style={{ width: `${Math.max(pct, 6)}%` }} />
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

                    {/* Card 3 — Usuários (aprovar/remover) */}
                    <AnimatedCard
                        delay={0.18}
                        className="flex flex-col gap-5 rounded-3xl bg-background p-4 shadow-xl ring-1 ring-white/40 sm:p-8"
                    >
                        <UsuariosCard usuarios={usuarios} />
                    </AnimatedCard>
                </section>
            </main>
        </DashboardClientGuard>
    );
}
