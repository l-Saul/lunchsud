import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
    return {
        rules: {
            userAgent: "*",
            allow: "/",
            // Áreas administrativas não devem ser indexadas.
            disallow: ["/admin", "/dashboard", "/api/"],
        },
        host: "https://lunchsud.vercel.app",
    };
}
