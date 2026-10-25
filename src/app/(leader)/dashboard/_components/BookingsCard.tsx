/**
 * Contexto e regras: leia CLAUDE.md e docs/routes_dashboard.md antes de alterar.
 * Mudou o comportamento? Atualize o doc na mesma mudança.
 */

import { formatMonthLabel, diaTile, diasDisponiveisNoMes } from '@/lib/date';
import EditBookingModal from './EditBookingModal';
import { CollapsibleMonth } from './CollapsibleMonth';

type Agendamento = {
    id: number;
    data: string;
    nome: string;
    telefone: string;
};

type Props = {
    mesAtual: string;
    mesSeguinte: string;
    agendamentos: Agendamento[];
    limites: { min: string; max: string };
};

export function BookingsCard({ mesAtual, mesSeguinte, agendamentos, limites }: Props) {
    return (
        <section className="flex flex-col gap-6 rounded-3xl bg-background p-4 shadow-md ring-1 ring-primary/10 sm:p-8">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-5">
                <span className="h-5 w-1.5 rounded-full bg-accent" />
                <h2 className="min-w-0 hyphens-auto wrap-break-word text-xl font-semibold text-text">Agendamentos</h2>
            </div>

            <div className="flex flex-col divide-y divide-slate-100">
                {[mesAtual, mesSeguinte].map(ym => {
                    const itens = agendamentos.filter(r => r.data.startsWith(ym));
                    const disponiveis = diasDisponiveisNoMes(ym, itens.map(r => r.data));

                    return (
                        <CollapsibleMonth
                            key={ym}
                            label={formatMonthLabel(ym)}
                            total={itens.length}
                            disponiveis={disponiveis}
                        >
                            {itens.length === 0 ? (
                                <p className="rounded-2xl border border-dashed border-slate-300 py-6 text-center text-base text-muted">
                                    Nenhum almoço agendado ainda.
                                </p>
                            ) : (
                                <ul className="flex flex-col gap-3">
                                    {itens.map(row => {
                                        const { dia, semana } = diaTile(row.data);
                                        return (
                                            <li
                                                key={row.id}
                                                className="flex flex-wrap items-center gap-3 rounded-2xl border border-slate-200 p-3 transition hover:border-accent/40 hover:bg-accent/5"
                                            >
                                                <div className="flex size-14 shrink-0 flex-col items-center justify-center rounded-xl bg-secondary text-white">
                                                    <span className="text-lg font-bold leading-none">{dia}</span>
                                                    <span className="mt-1 text-base leading-none text-white/85">{semana}</span>
                                                </div>
                                                <div className="min-w-0 grow basis-40">
                                                    <p className="wrap-anywhere font-semibold text-text">{row.nome}</p>
                                                    <p className="text-base text-muted">{row.telefone}</p>
                                                </div>
                                                <EditBookingModal {...row} limites={limites} />
                                            </li>
                                        );
                                    })}
                                </ul>
                            )}
                        </CollapsibleMonth>
                    );
                })}
            </div>
        </section>
    );
}
