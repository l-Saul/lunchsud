/**
 * Contexto e regras: leia CLAUDE.md e docs/src_lib.md antes de alterar.
 * Mudou o comportamento? Atualize o doc na mesma mudança.
 */

export function siteUrl(): string {
    const fromEnv = process.env.NEXT_PUBLIC_BASE_URL?.replace(/\/+$/, '');
    if (fromEnv) return fromEnv;
    if (typeof window !== 'undefined') return window.location.origin;
    return '';
}

export const SITE_NO_AR = 'https://lunchsud.vercel.app';

export function urlPublica(): string {
    return siteUrl() || SITE_NO_AR;
}
