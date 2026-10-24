/**
 * Contexto e regras: leia CLAUDE.md e docs/routes_dashboard.md antes de alterar.
 * Mudou o comportamento? Atualize o doc na mesma mudança.
 */

import { formatMonthLabel, diaTile, diasDisponiveisNoMes } from '@/lib/date';
import EditBookingModal from './EditBookingModal';
import MonthImageExport from './month-image/MonthImageExport';
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
};

export function BookingsCard({ mesAtual, mesSeguinte, agendamentos }: Props) {
    return (
        <section className="flex flex-col gap-6 rounded-3xl bg-background p-4 shadow-xl ring-1 ring-white/40 sm:p-8">
            <div className="flex flex-col gap-4 border-b border-slate-100 pb-5 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-2">
                    <span className="h-5 w-1.5 rounded-full bg-accent" />
                    <h2 className="text-lg font-semibold text-text">Agendamentos</h2>
                </div>
                <MonthImageExport meses={[mesAtual, mesSeguinte]} agendamentos={agendamentos} />
            </div>

            <div className="flex flex-col divide-y divide-slate-100">
                {[mesAtual, mesSeguinte].map(ym => {
                    const itens = agendamentos.filter(r => r.data.startsWith(ym));
                    const disponiveis = diasDisponiveisNoMes(ym);

                    return (
                        <CollapsibleMonth
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
                                                <EditBookingModal {...row} />
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
