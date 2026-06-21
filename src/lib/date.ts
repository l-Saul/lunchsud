export function formatDateBR(dateISO: string) {
    const [y, m, d] = dateISO.split('-');
    return `${d}/${m}/${y}`;
}

const TZ = 'America/Sao_Paulo';

const pad = (n: number) => String(n).padStart(2, '0');

/**
 * Intervalo do mês atual até o fim do mês seguinte.
 *
 * O "hoje" é calculado no fuso de São Paulo para o servidor (UTC) não
 * "virar o mês" perto da meia-noite.
 *
 * - inicio: 'YYYY-MM-01' do mês atual (inclusivo)
 * - fim:    'YYYY-MM-01' do mês após o seguinte (exclusivo)
 */
export function getDashboardRange(timeZone = TZ) {
    const hoje = new Intl.DateTimeFormat('en-CA', {
        timeZone,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
    }).format(new Date());

    const [ano, mes] = hoje.split('-').map(Number); // mes: 1-12

    const seguinte = new Date(ano, mes, 1); // índice 0-based = mês seguinte
    const aposSeguinte = new Date(ano, mes + 1, 1); // mês após o seguinte

    return {
        inicio: `${ano}-${pad(mes)}-01`,
        fim: `${aposSeguinte.getFullYear()}-${pad(aposSeguinte.getMonth() + 1)}-01`,
        mesAtual: `${ano}-${pad(mes)}`,
        mesSeguinte: `${seguinte.getFullYear()}-${pad(seguinte.getMonth() + 1)}`,
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

/** 'YYYY-MM' -> 'Junho 2026' */
export function formatMonthLabel(ym: string) {
    const [ano, mes] = ym.split('-').map(Number);
    return `${MESES[mes - 1]} ${ano}`;
}

/** 'YYYY-MM-DD' -> { dia: '7', mesAbrev: 'jun' } para o "tile" de data */
export function diaTile(dateISO: string) {
    const [, m, d] = dateISO.split('-');
    return { dia: String(Number(d)), mesAbrev: MESES_ABREV[Number(m) - 1] };
}

/**
 * true se a data 'YYYY-MM-DD' cair numa segunda-feira (P-day).
 * Usa UTC para o resultado não depender do fuso do servidor.
 */
export function isPday(dateISO: string) {
    return new Date(`${dateISO}T00:00:00Z`).getUTCDay() === 1; // 1 = segunda
}

/**
 * Quantidade de dias do mês 'YYYY-MM' que podem receber almoço,
 * ou seja, todos os dias menos as segundas (P-day).
 */
export function diasDisponiveisNoMes(ym: string) {
    const [ano, mes] = ym.split('-').map(Number); // mes: 1-12
    const totalDias = new Date(ano, mes, 0).getDate(); // último dia do mês

    let disponiveis = 0;
    for (let dia = 1; dia <= totalDias; dia++) {
        if (new Date(ano, mes - 1, dia).getDay() !== 1) {
            disponiveis++;
        }
    }
    return disponiveis;
}
