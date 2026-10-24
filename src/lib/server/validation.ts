/**
 * Contexto e regras: leia CLAUDE.md e docs/src_lib.md antes de alterar.
 * Mudou o comportamento? Atualize o doc na mesma mudança.
 */

import 'server-only';

import { gerarSlug, normalizarNomeAla } from '@/lib/wards';
import { normalizarTelefone } from '@/lib/phone';
import { PAISES, UFS, fusoValido } from '@/lib/location';
import { TIPOS_AVISO, type PreferenciasEmail } from '@/lib/email-preferences';

export class ValidationError extends Error {}

const SLUG_RE = /^[a-z0-9_-]{1,60}$/;
const DATA_RE = /^\d{4}-\d{2}-\d{2}$/;

function asString(v: unknown): string {
    return typeof v === 'string' ? v : '';
}

function nomeSaneado(v: unknown): string {
    const nome = asString(v).replace(/\s+/g, ' ').trim();
    if (nome.length < 2 || nome.length > 80 || /[<>]/.test(nome) || /\p{Cc}/u.test(nome)) {
        throw new ValidationError('Nome inválido');
    }
    return nome;
}

function enderecoSaneado(v: unknown): string | null {
    const s = asString(v).replace(/\s+/g, ' ').trim();
    if (!s) return null;
    if (s.length > 200 || /[<>]/.test(s) || /\p{Cc}/u.test(s)) {
        throw new ValidationError('Endereço inválido');
    }
    return s;
}

function textoSaneado(v: unknown, min: number, max: number, erro: string): string {
    const s = asString(v).replace(/\s+/g, ' ').trim();
    if (s.length < min || s.length > max || /[<>]/.test(s) || /\p{Cc}/u.test(s)) {
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
    if (!DATA_RE.test(data) || Number.isNaN(Date.parse(data))) {
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

export function parseSlug(slug: string): string {
    const s = asString(slug).trim().toLowerCase();
    if (!SLUG_RE.test(s)) throw new ValidationError('Ala inválida');
    return s;
}

export type NovaAlaInput = {
    nome: string;
    slug: string;
    endereco: string | null;
    pais: string;
    estado: string;
    cidade: string;
    fuso: string;
};

export function parseNovaAla(raw: unknown): NovaAlaInput {
    const o = (raw ?? {}) as Record<string, unknown>;
    const nome = normalizarNomeAla(nomeSaneado(o.nome));

    const slug = gerarSlug(nome);
    if (!SLUG_RE.test(slug)) {
        throw new ValidationError('Não foi possível gerar um link válido a partir desse nome');
    }

    const pais = asString(o.pais).trim().toUpperCase();
    if (!PAISES.some(p => p.codigo === pais)) throw new ValidationError('Escolha o país.');

    let estado: string;
    let fuso: string;
    if (pais === 'BR') {
        const uf = UFS.find(u => u.sigla === asString(o.estado).trim().toUpperCase());
        if (!uf) throw new ValidationError('Escolha o estado.');
        estado = uf.sigla;
        fuso = uf.fuso;
    } else {
        estado = textoSaneado(o.estado, 1, 60, 'Informe o estado ou província.');
        fuso = asString(o.fuso).trim();
        if (!fusoValido(fuso)) throw new ValidationError('Escolha o fuso horário.');
    }

    const cidade = textoSaneado(o.cidade, 2, 80, 'Informe a cidade.');

    return { nome, slug, endereco: enderecoSaneado(o.endereco), pais, estado, cidade, fuso };
}
