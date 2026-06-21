import { redirect } from 'next/navigation';
import { requireAdminSession } from '@/lib/auth';
import DashboardClientGuard from './DashboardClientGuard';
import { LogoutButton } from './LogoutButton';
import { supabaseServer } from '@/lib/supabase-server';
import { getDashboardRange, formatMonthLabel, diaTile, diasDisponiveisNoMes } from '@/lib/date';
import EditModal from '@/components/EditModal';
import CalendarExportImage from '@/components/CalendarExportImage';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function DashboardPage() {
    try {
        const session = await requireAdminSession();

        const { data: ala, error: alaError } = await supabaseServer
            .from('ala')
            .select('nome')
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

        return (
            <DashboardClientGuard>
                <main className="min-h-screen bg-primary px-4 py-6 sm:flex sm:items-center sm:justify-center sm:px-6 sm:py-12">
                    <section className="mx-auto w-full sm:max-w-3xl">
                        <div className="flex flex-col gap-6 rounded-3xl bg-background px-4 py-6 shadow-xl sm:px-10 sm:py-10">
                            <header className="flex flex-col gap-1 text-center">
                                <h1 className="text-2xl font-semibold text-text sm:text-3xl">
                                    Painel de Controle
                                </h1>
                                <p className="text-sm text-muted sm:text-base">{ala.nome}</p>
                            </header>

                            <div className="flex flex-col gap-6">
                                {[mesAtual, mesSeguinte].map(ym => {
                                    const itens = agendamentos.filter(r =>
                                        r.data.startsWith(ym)
                                    );
                                    const disponiveis = diasDisponiveisNoMes(ym);

                                    return (
                                        <section key={ym} className="flex flex-col gap-3">
                                            <div className="flex items-center justify-between gap-2">
                                                <h2 className="text-base font-semibold text-text">
                                                    {formatMonthLabel(ym)}
                                                </h2>
                                                <span className="rounded-full bg-secondary/10 px-3 py-1 text-sm font-medium text-secondary whitespace-nowrap">
                                                    {itens.length} de {disponiveis} dias agendados
                                                </span>
                                            </div>

                                            {itens.length === 0 ? (
                                                <p className="rounded-2xl border border-dashed border-slate-300 py-6 text-center text-sm text-muted">
                                                    Nenhum agendamento neste mês.
                                                </p>
                                            ) : (
                                                <ul className="grid grid-cols-1 gap-3 lg:grid-cols-2">
                                                    {itens.map(row => {
                                                        const { dia, mesAbrev } = diaTile(row.data);

                                                        return (
                                                            <li
                                                                key={row.id}
                                                                className="flex items-center gap-3 rounded-2xl border border-slate-200 p-3"
                                                            >
                                                                <div className="flex h-12 w-12 shrink-0 flex-col items-center justify-center rounded-xl bg-primary/10 text-primary">
                                                                    <span className="text-lg font-bold leading-none">
                                                                        {dia}
                                                                    </span>
                                                                    <span className="mt-0.5 text-[10px] uppercase leading-none">
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

                            <div className="flex flex-col gap-3 pt-2 sm:flex-row sm:justify-center">
                                <CalendarExportImage
                                    meses={[mesAtual, mesSeguinte]}
                                    agendamentos={agendamentos}
                                />

                                <LogoutButton />
                            </div>
                        </div>
                    </section>
                </main>
            </DashboardClientGuard>
        );
    } catch {
        redirect('/admin');
    }
}
