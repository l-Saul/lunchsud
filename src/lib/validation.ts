// Validação e saneamento da entrada das rotas públicas. Princípio: tudo que vem
// do cliente é hostil até prova em contrário — limita tamanho, formato e o
// conjunto de caracteres ANTES de tocar no banco.

import { gerarSlug, normalizarNomeAla } from '@/lib/alas';

// Erro de validação: as rotas pegam com try/catch e respondem 400 genérico
// (sem ecoar detalhes que ajudem um atacante a sondar a API).
export class ValidationError extends Error {}

// Slug aceita letras minúsculas, números, hífen e sublinhado (`_`). O `_` entra
// pela convenção de nomes de ala ("Jardim Brasil" → "jardim_brasil").
const SLUG_RE = /^[a-z0-9_-]{1,60}$/;
const DATA_RE = /^\d{4}-\d{2}-\d{2}$/;

function asString(v: unknown): string {
    return typeof v === 'string' ? v : '';
}

// Nome: 2–80 chars, sem < > (anti-HTML/script) nem caracteres de controle (\p{Cc}).
function nomeSaneado(v: unknown): string {
    const nome = asString(v).replace(/\s+/g, ' ').trim();
    if (nome.length < 2 || nome.length > 80 || /[<>]/.test(nome) || /\p{Cc}/u.test(nome)) {
        throw new ValidationError('Nome inválido');
    }
    return nome;
}

// Endereço (rua/número) — texto livre opcional, só um campo do banco. Limita
// tamanho e bloqueia < > e caracteres de controle. Vazio vira null.
function enderecoSaneado(v: unknown): string | null {
    const s = asString(v).replace(/\s+/g, ' ').trim();
    if (!s) return null;
    if (s.length > 200 || /[<>]/.test(s) || /\p{Cc}/u.test(s)) {
        throw new ValidationError('Endereço inválido');
    }
    return s;
}

// Telefone: exatamente 11 dígitos (DDD + 9). Mantém o formato enviado ("DD NNNNN NNNN").
function telefoneSaneado(v: unknown): string {
    const digitos = asString(v).replace(/\D/g, '');
    if (digitos.length !== 11) throw new ValidationError('Telefone inválido');
    return asString(v).trim().slice(0, 20);
}

// Data 'YYYY-MM-DD' real (formato + data existente).
function dataSaneada(v: unknown): string {
    const data = asString(v).trim();
    if (!DATA_RE.test(data) || Number.isNaN(Date.parse(data))) {
        throw new ValidationError('Data inválida');
    }
    return data;
}

// Id inteiro positivo (chave primária do agendamento).
function idSaneado(v: unknown): number {
    const id = Number(v);
    if (!Number.isInteger(id) || id <= 0) throw new ValidationError('Id inválido');
    return id;
}

// Lê o corpo como JSON com teto de tamanho e checagem de Content-Type. Evita
// payloads gigantes ("lançar várias informações") e corpos malformados.
export async function lerJson(req: Request, maxBytes = 10_000): Promise<unknown> {
    const contentType = req.headers.get('content-type') ?? '';
    if (!contentType.includes('application/json')) {
        throw new ValidationError('Content-Type inválido');
    }

    // Rejeita cedo pelo Content-Length, antes de bufferizar o corpo.
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

// Valida o payload de /api/agendar. Garante slug seguro, data 'YYYY-MM-DD' real,
// nome 2–80 sem caracteres de controle/HTML e telefone com exatamente 11 dígitos.
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

// Valida o payload de /api/agendamentos/update (admin): id + campos editáveis.
export function parseEdicao(raw: unknown): EdicaoInput {
    const o = (raw ?? {}) as Record<string, unknown>;

    return {
        id: idSaneado(o.id),
        data: dataSaneada(o.data),
        nome: nomeSaneado(o.nome),
        telefone: telefoneSaneado(o.telefone),
    };
}

// Valida o payload de /api/agendamentos/delete (admin): só o id.
export function parseId(raw: unknown): number {
    const o = (raw ?? {}) as Record<string, unknown>;
    return idSaneado(o.id);
}

// Valida um slug vindo da URL (rota dinâmica). Normaliza para minúsculas.
export function parseSlug(slug: string): string {
    const s = asString(slug).trim().toLowerCase();
    if (!SLUG_RE.test(s)) throw new ValidationError('Ala inválida');
    return s;
}

export type NovaAlaInput = { nome: string; slug: string; endereco: string | null };

// Valida o payload de criação de ala (owner):
//  - nome: saneado e normalizado ("Ala São Lourenço" — vira nome próprio com "Ala");
//  - slug: SEMPRE gerado automaticamente a partir do nome (link público da ala);
//  - endereco: texto livre opcional (rua/número) — só um campo do banco.
export function parseNovaAla(raw: unknown): NovaAlaInput {
    const o = (raw ?? {}) as Record<string, unknown>;
    const nome = normalizarNomeAla(nomeSaneado(o.nome));

    const slug = gerarSlug(nome);
    if (!SLUG_RE.test(slug)) {
        throw new ValidationError('Não foi possível gerar um link válido a partir desse nome');
    }

    return { nome, slug, endereco: enderecoSaneado(o.endereco) };
}
