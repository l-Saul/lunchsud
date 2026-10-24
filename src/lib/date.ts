/**
 * Contexto e regras: leia CLAUDE.md e docs/src_lib.md antes de alterar.
 * Mudou o comportamento? Atualize o doc na mesma mudança.
 */

const TZ = 'America/Sao_Paulo';

const pad = (n: number) => String(n).padStart(2, '0');

export function getDashboardRange(timeZone = TZ) {
    const hoje = new Intl.DateTimeFormat('en-CA', {
        timeZone,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
    }).format(new Date());

    const [ano, mes] = hoje.split('-').map(Number);

    const seguinte = new Date(ano, mes, 1);
    const aposSeguinte = new Date(ano, mes + 1, 1);

    return {
        inicio: `${ano}-${pad(mes)}-01`,
        fim: `${aposSeguinte.getFullYear()}-${pad(aposSeguinte.getMonth() + 1)}-01`,
        hoje,
        mesAtual: `${ano}-${pad(mes)}`,
        mesSeguinte: `${seguinte.getFullYear()}-${pad(seguinte.getMonth() + 1)}`,
    };
}

export function getHistoricoRange(mesesAtras = 3, timeZone = TZ) {
    const hoje = new Intl.DateTimeFormat('en-CA', {
        timeZone,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
    }).format(new Date());

    const [ano, mes] = hoje.split('-').map(Number);

    const inicioAtual = new Date(ano, mes - 1, 1);
    const inicioHist = new Date(ano, mes - 1 - mesesAtras, 1);

    return {
        inicio: `${inicioHist.getFullYear()}-${pad(inicioHist.getMonth() + 1)}-01`,
        fim: `${inicioAtual.getFullYear()}-${pad(inicioAtual.getMonth() + 1)}-01`,
    };
}

const MESES = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
];

const MESES_ABREV = [
    'jan', 'fev', 'mar', 'abr', 'mai', 'jun',
    'jul', 'ago', 'set', 'out', 'nov', 'dez',
];

export function formatMonthLabel(ym: string) {
    const [ano, mes] = ym.split('-').map(Number);
    return `${MESES[mes - 1]} ${ano}`;
}

export function nomeDoMes(ym: string) {
    return MESES[Number(ym.split('-')[1]) - 1];
}

export function somarDias(dateISO: string, dias: number) {
    const data = new Date(`${dateISO}T12:00:00Z`);
    data.setUTCDate(data.getUTCDate() + dias);
    return data.toISOString().slice(0, 10);
}

export function dataPorExtenso(dateISO: string) {
    return new Intl.DateTimeFormat('pt-BR', { timeZone: 'UTC', weekday: 'long', day: 'numeric', month: 'long' })
        .format(new Date(`${dateISO}T12:00:00Z`));
}

export function diaDaSemanaEDia(dateISO: string) {
    return new Intl.DateTimeFormat('pt-BR', { timeZone: 'UTC', weekday: 'long', day: 'numeric' })
        .format(new Date(`${dateISO}T12:00:00Z`));
}

export function diaTile(dateISO: string) {
    const [, m, d] = dateISO.split('-');
    return { dia: String(Number(d)), mesAbrev: MESES_ABREV[Number(m) - 1] };
}

export function isPday(dateISO: string) {
    return new Date(`${dateISO}T00:00:00Z`).getUTCDay() === 1;
}

export function diasDisponiveisNoMes(ym: string) {
    const [ano, mes] = ym.split('-').map(Number);
    const totalDias = new Date(ano, mes, 0).getDate();

    let disponiveis = 0;
    for (let dia = 1; dia <= totalDias; dia++) {
        if (new Date(ano, mes - 1, dia).getDay() !== 1) {
            disponiveis++;
        }
    }
    return disponiveis;
}
