/**
 * Contexto e regras: leia CLAUDE.md e docs/routes_dashboard.md antes de alterar.
 * Mudou o comportamento? Atualize o doc na mesma mudança.
 */
'use client';

import { isPday, formatMonthLabel } from '@/lib/date';
import { Flower } from '@/components/Flower';

type Props = {
    diasDoMes: {
        data: string;
        numero: number;
        agendamentos: {
            id: number;
            nome: string;
            telefone: string;
        }[];
    }[];
};

const SEMANA = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

const AZUL = '#003057';
const ROSA = '#bd0057';
const DOURADO = '#ffb81c';
const CINZA = '#676b6e';

export const LADO_DA_IMAGEM = 1024;

export default function MonthImage({ diasDoMes }: Props) {
    if (diasDoMes.length === 0) return null;

    const [y, m] = diasDoMes[0].data.split('-').map(Number);
    const firstDay = new Date(y, m - 1, 1).getDay();
    const semanas = Math.ceil((firstDay + diasDoMes.length) / 7);
    const mesAno = formatMonthLabel(`${y}-${String(m).padStart(2, '0')}`);

    return (
        <div
            style={{
                width: LADO_DA_IMAGEM,
                height: LADO_DA_IMAGEM,
                boxSizing: 'border-box',
                backgroundColor: '#faf7f5',
                padding: 12,
                display: 'flex',
            }}
        >
            <div
                style={{
                    flex: 1,
                    minHeight: 0,
                    display: 'flex',
                    flexDirection: 'column',
                    backgroundColor: '#ffffff',
                    borderRadius: 22,
                    border: '1px solid #e0e2e2',
                    overflow: 'hidden',
                }}
            >
                <div
                    style={{
                        backgroundColor: AZUL,
                        padding: '20px 24px 16px',
                        textAlign: 'center',
                        color: '#ffffff',
                    }}
                >
                    <div
                        style={{
                            fontFamily: 'var(--font-serif), Georgia, serif',
                            fontSize: 30,
                            fontWeight: 700,
                            letterSpacing: 0.3,
                        }}
                    >
                        Almoço dos Missionários
                    </div>
                    <div
                        style={{
                            fontSize: 18,
                            marginTop: 4,
                            color: 'rgba(255,255,255,0.82)',
                        }}
                    >
                        {mesAno}
                    </div>
                    <div
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: 10,
                            marginTop: 10,
                        }}
                    >
                        <span style={{ height: 3, width: 40, backgroundColor: DOURADO, borderRadius: 999 }} />
                        <Flower size={20} />
                        <span style={{ height: 3, width: 40, backgroundColor: DOURADO, borderRadius: 999 }} />
                    </div>
                </div>

                <div
                    style={{
                        flex: 1,
                        minHeight: 0,
                        display: 'flex',
                        flexDirection: 'column',
                        padding: '12px 14px 8px',
                    }}
                >
                    <div
                        style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(7, minmax(0, 1fr))',
                            gap: 6,
                            marginBottom: 8,
                        }}
                    >
                        {SEMANA.map((dia, i) => (
                            <div
                                key={dia}
                                style={{
                                    textAlign: 'center',
                                    fontWeight: 700,
                                    fontSize: 16,
                                    color: i === 0 || i === 6 ? ROSA : AZUL,
                                }}
                            >
                                {dia}
                            </div>
                        ))}
                    </div>

                    <div
                        style={{
                            flex: 1,
                            minHeight: 0,
                            display: 'grid',
                            gridTemplateColumns: 'repeat(7, minmax(0, 1fr))',
                            gridTemplateRows: `repeat(${semanas}, minmax(0, 1fr))`,
                            gap: 6,
                        }}
                    >
                        {Array.from({ length: firstDay }).map((_, i) => (
                            <div key={`empty-${i}`} />
                        ))}

                        {diasDoMes.map(dia => {
                            const pday = isPday(dia.data);
                            const temAlmoco = dia.agendamentos.length > 0;

                            return (
                                <div
                                    key={dia.data}
                                    style={{
                                        minHeight: 0,
                                        overflow: 'hidden',
                                        borderRadius: 14,
                                        border: temAlmoco
                                            ? '1px solid #fda1b2'
                                            : '1px solid #e0e2e2',
                                        padding: 6,
                                        display: 'flex',
                                        flexDirection: 'column',
                                        backgroundColor: pday
                                            ? '#eff0f0'
                                            : temAlmoco
                                                ? '#fdecf1'
                                                : '#ffffff',
                                    }}
                                >
                                    <span
                                        style={{
                                            display: 'inline-flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            width: 26,
                                            height: 26,
                                            borderRadius: 999,
                                            fontSize: 14,
                                            fontWeight: 700,
                                            color: '#ffffff',
                                            backgroundColor: pday
                                                ? CINZA
                                                : temAlmoco
                                                    ? ROSA
                                                    : AZUL,
                                        }}
                                    >
                                        {dia.numero}
                                    </span>

                                    {pday ? (
                                        <div
                                            style={{
                                                flex: 1,
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                fontSize: 16,
                                                fontWeight: 700,
                                                color: CINZA,
                                            }}
                                        >
                                            P-day
                                        </div>
                                    ) : (
                                        <div
                                            style={{
                                                flex: 1,
                                                display: 'flex',
                                                flexDirection: 'column',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                gap: 8,
                                                textAlign: 'center',
                                                padding: '2px 2px 4px',
                                            }}
                                        >
                                            {dia.agendamentos.map(a => (
                                                <div
                                                    key={a.id}
                                                    style={{
                                                        display: 'flex',
                                                        flexDirection: 'column',
                                                        alignItems: 'center',
                                                        gap: 3,
                                                    }}
                                                >
                                                    <div
                                                        style={{
                                                            fontSize: a.nome.length > 16 ? 15 : 18,
                                                            fontWeight: 700,
                                                            lineHeight: 1.2,
                                                            color: AZUL,
                                                            maxWidth: '100%',
                                                            overflowWrap: 'anywhere',
                                                            display: '-webkit-box',
                                                            WebkitLineClamp: semanas > 5 ? 2 : 3,
                                                            WebkitBoxOrient: 'vertical',
                                                            overflow: 'hidden',
                                                        }}
                                                    >
                                                        {a.nome}
                                                    </div>
                                                    <div
                                                        style={{
                                                            fontSize: 15,
                                                            color: '#53575b',
                                                            maxWidth: '100%',
                                                            overflowWrap: 'anywhere',
                                                        }}
                                                    >
                                                        {a.telefone}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>

                <div
                    style={{
                        padding: '6px 24px 14px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 10,
                    }}
                >
                    <Flower size={20} />
                    <span
                        style={{
                            fontFamily: 'var(--font-serif), Georgia, serif',
                            fontSize: 22,
                            fontWeight: 600,
                            color: AZUL,
                        }}
                    >
                        A caridade nunca falha
                    </span>
                    <Flower size={20} />
                </div>
            </div>
        </div>
    );
}
