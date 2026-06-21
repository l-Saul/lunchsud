'use client';

// Versão "bonita" do calendário usada APENAS na imagem exportada (WhatsApp).
// Usa estilos inline + SVG de propósito: o html-to-image não depende do Tailwind,
// então renderiza igual em qualquer aparelho.

import { isPday, formatMonthLabel } from '@/lib/date';
import { Flor } from './Flor';

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

const AZUL = '#143157';
const VERDE = '#1fb9a0';
const ROSA = '#e0588f';

export default function CalendarMonthView({ diasDoMes }: Props) {
    if (diasDoMes.length === 0) return null;

    const [y, m] = diasDoMes[0].data.split('-').map(Number);
    const firstDay = new Date(y, m - 1, 1).getDay();
    const mesAno = formatMonthLabel(`${y}-${String(m).padStart(2, '0')}`);

    return (
        <div style={{ backgroundColor: '#f4f8f7', padding: 28 }}>
            <div
                style={{
                    backgroundColor: '#ffffff',
                    borderRadius: 28,
                    border: '1px solid #e6eceb',
                    overflow: 'hidden',
                }}
            >
                {/* Cabeçalho */}
                <div
                    style={{
                        backgroundColor: AZUL,
                        padding: '30px 32px 26px',
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
                            marginTop: 14,
                        }}
                    >
                        <span style={{ height: 3, width: 40, backgroundColor: VERDE, borderRadius: 999 }} />
                        <Flor size={20} />
                        <span style={{ height: 3, width: 40, backgroundColor: VERDE, borderRadius: 999 }} />
                    </div>
                </div>

                {/* Corpo */}
                <div style={{ padding: 24 }}>
                    {/* Dias da semana */}
                    <div
                        style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(7, 1fr)',
                            gap: 8,
                            marginBottom: 10,
                        }}
                    >
                        {SEMANA.map((dia, i) => (
                            <div
                                key={dia}
                                style={{
                                    textAlign: 'center',
                                    fontWeight: 700,
                                    fontSize: 14,
                                    textTransform: 'uppercase',
                                    letterSpacing: 1,
                                    color: i === 0 || i === 6 ? VERDE : AZUL,
                                }}
                            >
                                {dia}
                            </div>
                        ))}
                    </div>

                    {/* Grade de dias */}
                    <div
                        style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(7, 1fr)',
                            gap: 8,
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
                                        minHeight: 128,
                                        borderRadius: 16,
                                        border: temAlmoco
                                            ? '1px solid #f6d6e6'
                                            : '1px solid #e6eceb',
                                        padding: 8,
                                        display: 'flex',
                                        flexDirection: 'column',
                                        backgroundColor: pday
                                            ? '#f1f5f9'
                                            : temAlmoco
                                                ? '#fdf2f8'
                                                : '#ffffff',
                                    }}
                                >
                                    {/* Medalhão com o número do dia */}
                                    <span
                                        style={{
                                            display: 'inline-flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            width: 28,
                                            height: 28,
                                            borderRadius: 999,
                                            fontSize: 14,
                                            fontWeight: 700,
                                            color: '#ffffff',
                                            backgroundColor: pday
                                                ? '#cbd5e1'
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
                                                fontSize: 13,
                                                fontWeight: 700,
                                                textTransform: 'uppercase',
                                                letterSpacing: 1,
                                                color: '#94a3b8',
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
                                                            fontSize: 18,
                                                            fontWeight: 700,
                                                            lineHeight: 1.2,
                                                            color: AZUL,
                                                        }}
                                                    >
                                                        {a.nome}
                                                    </div>
                                                    <div
                                                        style={{
                                                            fontSize: 15,
                                                            color: '#475569',
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

                {/* Rodapé */}
                <div
                    style={{
                        padding: '4px 24px 24px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 8,
                        color: '#64748b',
                        fontSize: 14,
                    }}
                >
                    <Flor size={16} />
                    <span>Obrigada por servir os missionários</span>
                    <Flor size={16} />
                </div>
            </div>
        </div>
    );
}
