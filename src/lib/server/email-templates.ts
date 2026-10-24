/**
 * Contexto e regras: leia CLAUDE.md e docs/src_lib.md antes de alterar.
 * Mudou o comportamento? Atualize o doc na mesma mudança.
 */
import 'server-only';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { dataPorExtenso, diaDaSemanaEDia, isPday, nomeDoMes } from '@/lib/date';
import { siteUrl } from '@/lib/site-url';
import type { Email } from '@/lib/server/mailer';

export type AlaEmail = { nome: string; slug: string };

export type Almoco = { data: string; nome: string; telefone: string };

type ItemLista = { texto: string; telefone?: string; vazio?: boolean };

type Conteudo = {
    para: string;
    assunto: string;
    previa: string;
    titulo: string;
    destaque?: { texto: string; telefone: string };
    paragrafos: string[];
    lista?: { titulo: string; itens: ItemLista[] };
    botao?: { texto: string; url: string };
    pararDeReceber: boolean;
};

const SITE_NO_AR = 'https://lunchsud.vercel.app';
const MODELO = path.join(process.cwd(), 'messages', 'email', 'aviso.html');
const PARAR = 'Para parar de receber este aviso, desligue-o no painel, em Notificações.';
const RODAPE = 'Site independente, sem vínculo oficial com a Igreja de Jesus Cristo dos Santos dos Últimos Dias.';

let modelo: string | null = null;

function lerModelo() {
    modelo ??= readFileSync(MODELO, 'utf8');
    return modelo;
}

export function urlDoSite(caminho: string) {
    return `${siteUrl() || SITE_NO_AR}${caminho}`;
}

function escapar(texto: string) {
    return texto
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function maiuscula(texto: string) {
    return texto.charAt(0).toUpperCase() + texto.slice(1);
}

function bloco(html: string, nome: string, manter: boolean) {
    return html.replace(new RegExp(`<!--${nome}-->([\\s\\S]*?)<!--/${nome}-->`), (_, dentro: string) => (manter ? dentro : ''));
}

function linhaDoDia(data: string, almoco?: Almoco): ItemLista {
    const dia = maiuscula(diaDaSemanaEDia(data));
    return almoco
        ? { texto: `${dia} — ${almoco.nome}`, telefone: almoco.telefone }
        : { texto: `${dia} — sem almoço`, vazio: true };
}

function linhasDoMes(mes: string, almocos: Almoco[]): ItemLista[] {
    const [ano, numero] = mes.split('-').map(Number);
    const total = new Date(Date.UTC(ano, numero, 0)).getUTCDate();
    const porData = new Map(almocos.map(a => [a.data, a]));
    const itens: ItemLista[] = [];
    for (let dia = 1; dia <= total; dia++) {
        const data = `${mes}-${String(dia).padStart(2, '0')}`;
        const almoco = porData.get(data);
        if (!almoco && isPday(data)) continue;
        itens.push(linhaDoDia(data, almoco));
    }
    return itens;
}

function montar(c: Conteudo): Email {
    const blocos: string[] = [];
    const topo = () => (blocos.length ? '20px' : '0');

    if (c.destaque) {
        blocos.push(`<div style="margin:${topo()} 0 0;padding:16px 18px;border-radius:14px;background-color:#fdf2f8;border:1px solid #f6d6e6;font-size:20px;line-height:1.45;color:#0f172a;text-align:left;">${escapar(c.destaque.texto)}<br>Telefone: ${escapar(c.destaque.telefone)}</div>`);
    }
    for (const p of c.paragrafos) {
        blocos.push(`<p style="margin:${topo()} 0 0;font-size:20px;line-height:1.5;color:#0f172a;">${escapar(p)}</p>`);
    }
    if (c.lista) {
        const titulo = c.lista.titulo
            ? `<p style="margin:0 0 4px;font-size:18px;font-weight:700;line-height:1.4;color:#0f172a;text-align:left;">${escapar(c.lista.titulo)}</p>`
            : '';
        const linhas = c.lista.itens
            .map(item => `<tr><td style="padding:12px 0;border-bottom:1px solid #e2e8f0;font-size:20px;line-height:1.45;color:${item.vazio ? '#64748b' : '#0f172a'};text-align:left;">${escapar(item.texto)}${item.telefone ? `<br>${escapar(item.telefone)}` : ''}</td></tr>`)
            .join('');
        blocos.push(`<div style="margin:${topo()} 0 0;">${titulo}<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">${linhas}</table></div>`);
    }

    const valores: Record<string, string> = {
        titulo: escapar(c.titulo),
        previa: escapar(c.previa),
        site: escapar(urlDoSite('')),
        conteudo: blocos.join(''),
        botao_texto: escapar(c.botao?.texto ?? ''),
        botao_url: escapar(c.botao?.url ?? ''),
    };
    const html = bloco(bloco(lerModelo(), 'botao', Boolean(c.botao)), 'parar', c.pararDeReceber)
        .replace(/\{\{(\w+)\}\}/g, (_, chave: string) => valores[chave] ?? '');

    const linha = (item: ItemLista) => `- ${item.texto}${item.telefone ? `, ${item.telefone}` : ''}`;
    const texto = [
        c.titulo,
        ...(c.destaque ? [`${c.destaque.texto}\nTelefone: ${c.destaque.telefone}`] : []),
        ...c.paragrafos,
        ...(c.lista ? [c.lista.titulo, c.lista.itens.map(linha).join('\n')].filter(Boolean) : []),
        ...(c.botao ? [`${c.botao.texto}: ${c.botao.url}`] : []),
        ...(c.pararDeReceber ? [PARAR] : []),
        RODAPE,
    ].join('\n\n');

    return { para: c.para, assunto: c.assunto, html, texto };
}

export function emailNovoAlmoco(p: { para: string; ala: AlaEmail; almoco: Almoco }) {
    const frase = `${p.almoco.nome} agendou o almoço dos missionários para ${dataPorExtenso(p.almoco.data)}.`;
    return montar({
        para: p.para,
        assunto: `Novo almoço no dia ${Number(p.almoco.data.slice(8))} — ${p.ala.nome}`,
        previa: frase,
        titulo: 'Novo almoço agendado',
        destaque: { texto: frase, telefone: p.almoco.telefone },
        paragrafos: [],
        pararDeReceber: true,
    });
}

export function emailDiaSemAlmoco(p: { para: string; ala: AlaEmail; data: string }) {
    const quando = maiuscula(dataPorExtenso(p.data));
    return montar({
        para: p.para,
        assunto: `Depois de amanhã ainda não tem almoço — ${p.ala.nome}`,
        previa: `${quando}, ainda não tem ninguém para dar o almoço aos missionários.`,
        titulo: 'Depois de amanhã ainda não tem almoço',
        paragrafos: [
            `${quando}, ainda não tem ninguém para dar o almoço aos missionários na ${p.ala.nome}.`,
            'Ainda dá tempo de alguém agendar pelo calendário da ala.',
        ],
        pararDeReceber: true,
    });
}

export function emailSemana(p: { para: string; ala: AlaEmail; dias: { data: string; almoco?: Almoco }[] }) {
    return montar({
        para: p.para,
        assunto: `Almoços desta semana — ${p.ala.nome}`,
        previa: 'Os almoços dos missionários de terça a domingo.',
        titulo: 'Almoços desta semana',
        paragrafos: [`Estes são os almoços dos missionários da ${p.ala.nome}, de terça a domingo:`],
        lista: { titulo: '', itens: p.dias.map(d => linhaDoDia(d.data, d.almoco)) },
        pararDeReceber: true,
    });
}

export function emailProximoMes(p: { para: string; ala: AlaEmail; mes: string; almocos: Almoco[] }) {
    const nome = nomeDoMes(p.mes);
    const mes = nome.toLowerCase();
    const itens = linhasDoMes(p.mes, p.almocos);
    const agendados = itens.filter(i => !i.vazio).length;
    const livres = itens.length - agendados;
    const plural = (n: number, um: string, varios: string) => `${n} ${n === 1 ? um : varios}`;
    const resumo = agendados
        ? `${nome} já tem ${plural(agendados, 'almoço agendado', 'almoços agendados')} e ainda tem ${plural(livres, 'dia livre', 'dias livres')}.`
        : `${nome} ainda não tem nenhum almoço agendado.`;
    return montar({
        para: p.para,
        assunto: `Almoços de ${mes} — ${p.ala.nome}`,
        previa: resumo,
        titulo: `Almoços de ${mes}`,
        paragrafos: [
            `Os membros da ${p.ala.nome} já podem agendar os almoços de ${mes}.`,
            resumo,
        ],
        lista: { titulo: `Dias de ${mes}:`, itens },
        pararDeReceber: true,
    });
}

export function emailPedidoAcesso(p: { para: string; ala: AlaEmail; solicitante: { nome: string; email: string } }) {
    const quem = p.solicitante.nome || p.solicitante.email;
    const comEmail = p.solicitante.nome ? `${p.solicitante.nome} (${p.solicitante.email})` : p.solicitante.email;
    return montar({
        para: p.para,
        assunto: `${quem} pediu para entrar no painel — ${p.ala.nome}`,
        previa: `${quem} pediu para usar o painel da ${p.ala.nome}.`,
        titulo: 'Pedido para entrar no painel',
        paragrafos: [
            `${comEmail} criou uma conta de líder e pediu para usar o painel da ${p.ala.nome}.`,
            'Para aceitar, abra o painel e toque em "Aprovar", na parte Usuários.',
        ],
        botao: { texto: 'Abrir o painel', url: urlDoSite('/dashboard') },
        pararDeReceber: true,
    });
}

export function emailAcessoAprovado(p: { para: string; ala: AlaEmail }) {
    return montar({
        para: p.para,
        assunto: `Pedido aprovado — ${p.ala.nome}`,
        previa: `O pedido para usar o painel da ${p.ala.nome} foi aprovado.`,
        titulo: 'Pedido aprovado',
        paragrafos: [
            `O seu pedido para usar o painel da ${p.ala.nome} foi aprovado.`,
            'Toque no botão abaixo para entrar.',
        ],
        botao: { texto: 'Entrar no painel', url: urlDoSite('/dashboard') },
        pararDeReceber: false,
    });
}
