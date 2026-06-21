import type { MetadataRoute } from "next"

export default function manifest(): MetadataRoute.Manifest {
    return {
        name: "Almoço dos Missionários",
        short_name: "Almoço",
        description:
            "Agende um almoço para os missionários da sua ala, de forma simples e rápida.",
        lang: "pt-BR",
        start_url: "/",
        display: "standalone",
        background_color: "#143157",
        theme_color: "#143157",
        icons: [
            {
                src: "/lunchsud512x512.png",
                sizes: "512x512",
                type: "image/png",
                purpose: "any",
            },
            {
                src: "/lunchsud1024x1024.png",
                sizes: "1024x1024",
                type: "image/png",
            },
        ],
    }
}
