/**
 * Contexto e regras: leia CLAUDE.md e docs/src_lib.md antes de alterar.
 * Mudou o comportamento? Atualize o doc na mesma mudança.
 */

import 'server-only';

import { gerarSlug, nomeSemTipo, normalizarCidade, normalizarNomeAla } from '@/lib/wards';
import { normalizarTelefone } from '@/lib/phone';
import { UFS } from '@/lib/location';
import { TIPOS_AVISO, type PreferenciasEmail } from '@/lib/email-preferences';

export class ValidationError extends Error {}

const SLUG_RE = /^[a-z0-9_-]{1,100}$/;
const EMAIL_RE = /^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/;
const DATA_RE = /^\d{4}-\d{2}-\d{2}$/;

function asString(v: unknown): string {
    return typeof v === 'string' ? v : '';
}

function nomeSaneado(v: unknown): string {
    const nome = asString(v).replace(/\s+/g, ' ').trim();
    if (nome.length < 2 || nome.length > 80 || /[<>]/.test(nome) || /[\p{Cc}\p{Cf}]/u.test(nome)) {
        throw new ValidationError('Nome inválido');
    }
    return nome;
}

function textoSaneado(v: unknown, min: number, max: number, erro: string): string {
    const s = asString(v).replace(/\s+/g, ' ').trim();
    if (s.length < min || s.length > max || /[<>]/.test(s) || /[\p{Cc}\p{Cf}]/u.test(s)) {
        throw new ValidationError(erro);
    }
    return s;
}

function telefoneSaneado(v: unknown): string {
    const telefone = normalizarTelefone(asString(v).slice(0, 40));
    if (!telefone) throw new ValidationError('Telefone inválido');
    return telefone.formatado;
}

function dataSaneada(v: unknown): string {
    const data = asString(v).trim();
    const real = DATA_RE.test(data) ? new Date(`${data}T12:00:00Z`) : null;
    if (!real || Number.isNaN(real.getTime()) || real.toISOString().slice(0, 10) !== data) {
        throw new ValidationError('Data inválida');
    }
    return data;
}

function idSaneado(v: unknown): number {
    const id = Number(v);
    if (!Number.isInteger(id) || id <= 0) throw new ValidationError('Id inválido');
    return id;
}

export async function lerJson(req: Request, maxBytes = 10_000): Promise<unknown> {
    const contentType = req.headers.get('content-type') ?? '';
    if (!contentType.includes('application/json')) {
        throw new ValidationError('Content-Type inválido');
    }

    const declarado = Number(req.headers.get('content-length') ?? 0);
    if (declarado > maxBytes) {
        throw new ValidationError('Corpo grande demais');
    }

    const texto = await req.text();
    if (texto.length > maxBytes) {
        throw new ValidationError('Corpo grande demais');
    }

    try {
        return JSON.parse(texto);
    } catch {
        throw new ValidationError('JSON inválido');
    }
}

export type AgendarInput = {
    slug: string;
    data: string;
    nome: string;
    telefone: string;
};

export function parseAgendar(raw: unknown): AgendarInput {
    const o = (raw ?? {}) as Record<string, unknown>;

    const slug = asString(o.slug).trim().toLowerCase();
    if (!SLUG_RE.test(slug)) throw new ValidationError('Ala inválida');

    return {
        slug,
        data: dataSaneada(o.data),
        nome: nomeSaneado(o.nome),
        telefone: telefoneSaneado(o.telefone),
    };
}

export type EdicaoInput = {
    id: number;
    data: string;
    nome: string;
    telefone: string;
};

export function parseEdicao(raw: unknown): EdicaoInput {
    const o = (raw ?? {}) as Record<string, unknown>;

    return {
        id: idSaneado(o.id),
        data: dataSaneada(o.data),
        nome: nomeSaneado(o.nome),
        telefone: telefoneSaneado(o.telefone),
    };
}

export function parseId(raw: unknown): number {
    const o = (raw ?? {}) as Record<string, unknown>;
    return idSaneado(o.id);
}

export function parseMembroId(raw: unknown): number {
    const o = (raw ?? {}) as Record<string, unknown>;
    return idSaneado(o.membroId);
}

export function parseAlaId(raw: unknown): number {
    const o = (raw ?? {}) as Record<string, unknown>;
    return idSaneado(o.alaId);
}

export function parsePreferencias(raw: unknown): PreferenciasEmail {
    const o = (raw ?? {}) as Record<string, unknown>;
    const preferencias = {} as PreferenciasEmail;
    for (const tipo of TIPOS_AVISO) {
        if (typeof o[tipo] !== 'boolean') throw new ValidationError('Preferência inválida');
        preferencias[tipo] = o[tipo];
    }
    return preferencias;
}

export function parseData(raw: unknown): string {
    return dataSaneada(raw);
}

export function parseSlug(slug: string): string {
    const s = asString(slug).trim().toLowerCase();
    if (!SLUG_RE.test(s)) throw new ValidationError('Ala inválida');
    return s;
}

export type NovaAlaInput = {
    nome: string;
    slug: string;
    estado: string;
    cidade: string;
    fuso: string;
};

export function parseNovaAla(raw: unknown): NovaAlaInput {
    const o = (raw ?? {}) as Record<string, unknown>;
    const tipo = o.tipo === 'ramo' ? 'ramo' : 'ala';

    const base = nomeSemTipo(textoSaneado(o.nome, 2, 80, `Digite o nome ${tipo === 'ramo' ? 'do ramo' : 'da ala'}.`));
    if (base.length < 2) throw new ValidationError(`Digite o nome ${tipo === 'ramo' ? 'do ramo' : 'da ala'}.`);
    const nome = normalizarNomeAla(base, tipo);

    const uf = UFS.find(u => u.sigla === asString(o.estado).trim().toUpperCase());
    if (!uf) throw new ValidationError('Escolha o estado.');

    const cidade = normalizarCidade(textoSaneado(o.cidade, 2, 80, 'Digite a cidade.'));

    const slug = gerarSlug(uf.sigla, cidade, nome);
    if (!SLUG_RE.test(slug)) {
        throw new ValidationError('Escreva o nome e a cidade com letras ou números.');
    }

    return { nome, slug, estado: uf.sigla, cidade, fuso: uf.fuso };
}

export type PedidoAlaInput = {
    ala: NovaAlaInput;
    lider: { nome: string; email: string; senha: string } | null;
    usarConta: boolean;
    pareceRobo: boolean;
    rapidoDemais: boolean;
};

export const TEMPO_MINIMO_PEDIDO_MS = 5000;

export function parsePedidoAla(raw: unknown): PedidoAlaInput {
    const o = (raw ?? {}) as Record<string, unknown>;
    const ala = parseNovaAla(o);
    const usarConta = o.usarConta === true;

    let lider: PedidoAlaInput['lider'] = null;
    if (!usarConta) {
        const l = (o.lider ?? {}) as Record<string, unknown>;
        const nome = textoSaneado(l.nome, 2, 80, 'Digite o nome do líder responsável.');
        const email = asString(l.email).trim().toLowerCase();
        if (email.length > 254 || !EMAIL_RE.test(email)) {
            throw new ValidationError('Digite um e-mail válido.');
        }
        const senha = asString(l.senha);
        if (senha.length < 6 || senha.length > 72) {
            throw new ValidationError('A senha precisa ter pelo menos 6 caracteres.');
        }
        lider = { nome, email, senha };
    }

    const tempo = Number(o.tempo);
    return {
        ala,
        lider,
        usarConta,
        pareceRobo: asString(o.website).trim() !== '',
        rapidoDemais: !Number.isFinite(tempo) || tempo < TEMPO_MINIMO_PEDIDO_MS,
    };
}
