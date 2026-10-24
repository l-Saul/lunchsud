/**
 * Contexto e regras: leia CLAUDE.md e docs/routes_dashboard.md antes de alterar.
 * Mudou o comportamento? Atualize o doc na mesma mudança.
 */

import { formatMonthLabel } from '@/lib/date';

export type MesHistorico = {
    ym: string;
    total: number;
    disponiveis: number;
};

export function HistoryCard({ historico }: { historico: MesHistorico[] }) {
    return (
        <section className="flex flex-col gap-5 rounded-3xl bg-background p-4 shadow-md ring-1 ring-primary/10 sm:p-8">
            <div className="flex items-center gap-2">
                <span className="h-5 w-1.5 rounded-full bg-accent" />
                <h2 className="text-xl font-semibold text-text">Histórico de almoços</h2>
            </div>

            {historico.length === 0 ? (
                <p className="text-base text-muted">Ainda não há almoços anteriores.</p>
            ) : (
                <ul className="flex flex-col gap-3">
                    {historico.map(({ ym, total, disponiveis }) => {
                        const pct = disponiveis ? Math.round((total / disponiveis) * 100) : 0;
                        return (
                            <li key={ym} className="flex items-center gap-3">
                                <span className="w-32 shrink-0 text-base font-medium text-text">
                                    {formatMonthLabel(ym)}
                                </span>
                                <div
                                    className="h-7 flex-1 overflow-hidden rounded-full bg-accent/10"
                                    role="img"
                                    aria-label={`${total} de ${disponiveis} dias`}
                                >
                                    <div className="h-full rounded-full bg-accent" style={{ width: `${Math.max(pct, 6)}%` }} />
                                </div>
                                <span className="w-14 shrink-0 text-right text-base font-semibold text-accent">
                                    {total}/{disponiveis}
                                </span>
                            </li>
                        );
                    })}
                </ul>
            )}
        </section>
    );
}
