/**
 * Contexto e regras: leia CLAUDE.md e docs/src_app.md antes de alterar.
 * Mudou o comportamento? Atualize o doc na mesma mudança.
 */

import type { MetadataRoute } from "next";
import { urlPublica } from "@/lib/site-url";

export default function sitemap(): MetadataRoute.Sitemap {
    return [
        {
            url: `${urlPublica()}/`,
            changeFrequency: "monthly",
            priority: 1,
        },
    ];
}
