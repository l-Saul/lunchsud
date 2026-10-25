/**
 * Contexto e regras: leia CLAUDE.md e docs/src_lib.md antes de alterar.
 * Mudou o comportamento? Atualize o doc na mesma mudança.
 */

import { somarDias } from '@/lib/date';

const TITULO = 'Almoço dos missionários';
const LEMBRETE = 'Amanhã é o almoço dos missionários';

function descricao(nomeAla: string) {
    return `Almoço dos missionários da ${nomeAla}. Precisa desmarcar? Fale com a liderança da ala.`;
}

function semTracos(dateISO: string) {
    return dateISO.replaceAll('-', '');
}

export function linkGoogleAgenda(dateISO: string, nomeAla: string) {
    const params = new URLSearchParams({
        action: 'TEMPLATE',
        text: TITULO,
        dates: `${semTracos(dateISO)}/${semTracos(somarDias(dateISO, 1))}`,
        details: descricao(nomeAla),
    });
    return `https://calendar.google.com/calendar/render?${params}`;
}

export function linkOutlook(dateISO: string, nomeAla: string) {
    const params = new URLSearchParams({
        path: '/calendar/action/compose',
        rru: 'addevent',
        subject: TITULO,
        startdt: dateISO,
        enddt: somarDias(dateISO, 1),
        allday: 'true',
        body: descricao(nomeAla),
    });
    return `https://outlook.live.com/calendar/0/deeplink/compose?${params}`;
}

function escaparIcs(texto: string) {
    return texto
        .replace(/\\/g, '\\\\')
        .replace(/;/g, '\\;')
        .replace(/,/g, '\\,')
        .replace(/\r?\n/g, '\\n');
}

function dobrarLinha(linha: string) {
    const codificador = new TextEncoder();
    const partes: string[] = [];
    let atual = '';
    let bytes = 0;
    for (const letra of linha) {
        const tamanho = codificador.encode(letra).length;
        if (bytes + tamanho > (partes.length ? 74 : 75)) {
            partes.push(atual);
            atual = '';
            bytes = 0;
        }
        atual += letra;
        bytes += tamanho;
    }
    partes.push(atual);
    return partes.join('\r\n ');
}

export function arquivoIcs({ dateISO, nomeAla, slug, agora }: {
    dateISO: string;
    nomeAla: string;
    slug: string;
    agora: Date;
}) {
    const carimbo = agora.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
    const linhas = [
        'BEGIN:VCALENDAR',
        'VERSION:2.0',
        'PRODID:-//Almoco dos Missionarios//PT-BR',
        'CALSCALE:GREGORIAN',
        'METHOD:PUBLISH',
        'BEGIN:VEVENT',
        `UID:almoco-${slug}-${dateISO}@lunchsud.vercel.app`,
        `DTSTAMP:${carimbo}`,
        `DTSTART;VALUE=DATE:${semTracos(dateISO)}`,
        `DTEND;VALUE=DATE:${semTracos(somarDias(dateISO, 1))}`,
        `SUMMARY:${escaparIcs(TITULO)}`,
        `DESCRIPTION:${escaparIcs(descricao(nomeAla))}`,
        'TRANSP:TRANSPARENT',
        'BEGIN:VALARM',
        'ACTION:DISPLAY',
        `DESCRIPTION:${escaparIcs(LEMBRETE)}`,
        'TRIGGER:-PT15H',
        'END:VALARM',
        'END:VEVENT',
        'END:VCALENDAR',
    ];
    return linhas.map(dobrarLinha).join('\r\n') + '\r\n';
}
