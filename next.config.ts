import type { NextConfig } from "next";

// Headers de segurança aplicados a todas as respostas. CSP foi deixada de fora
// de propósito: o app usa estilos inline (imagem do calendário) e fontes/SWR
// que uma CSP malfeita quebraria — adicionar depois, com cuidado e testando.
const securityHeaders = [
  // Impede o browser de "adivinhar" o tipo do conteúdo (anti MIME-sniffing).
  { key: "X-Content-Type-Options", value: "nosniff" },
  // Bloqueia o site dentro de <iframe> de terceiros (anti clickjacking).
  { key: "X-Frame-Options", value: "DENY" },
  // Não vaza a URL completa de referência para outros domínios.
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // Desliga APIs sensíveis que o app não usa.
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
  // Força HTTPS por 2 anos (a Vercel já serve HTTPS).
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
];

const nextConfig: NextConfig = {
  reactStrictMode: true,
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
