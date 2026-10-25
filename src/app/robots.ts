/**
 * Contexto e regras: leia CLAUDE.md e docs/src_app.md antes de alterar.
 * Mudou o comportamento? Atualize o doc na mesma mudança.
 */

import type { MetadataRoute } from "next";
import { urlPublica } from "@/lib/site-url";

export default function robots(): MetadataRoute.Robots {
    const site = urlPublica();
    return {
        rules: {
            userAgent: "*",
            allow: "/",
            disallow: ["/admin", "/acesso", "/dashboard", "/redefinir-senha", "/auth/", "/api/"],
        },
        sitemap: `${site}/sitemap.xml`,
        host: site,
    };
}
