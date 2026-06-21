// URL pública do site, para montar links absolutos (ex.: o redirect do e-mail de
// redefinição de senha precisa apontar para o domínio em produção, não localhost).
//
// Usa `NEXT_PUBLIC_BASE_URL` (já definida no ambiente como https://lunchsud.vercel.app)
// — em produção é o que garante que o link do e-mail vá para o site no ar. Sem ela,
// cai na origin atual do navegador (bom o suficiente em desenvolvimento).
export function siteUrl(): string {
    const fromEnv = process.env.NEXT_PUBLIC_BASE_URL?.replace(/\/+$/, '');
    if (fromEnv) return fromEnv;
    if (typeof window !== 'undefined') return window.location.origin;
    return '';
}
