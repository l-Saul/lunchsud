import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
    title: "Almoço dos Missionários",
    description: "Agendamento de almoço para missionários",

    authors: [{name: "Luis Henrique Engel Saul"}],

    keywords: [
        "Almoço",
        "Missionários",
        "Agendamento",
        "Igreja",
        "Eventos",
        "Sistema de agendamento"
    ],

    icons: {
        icon: "/favicon.png",
        apple: "/apple-touch-icon.png",
        other: [
        {
            rel: "icon",
            url: "/android-chrome-192x192.png",
            sizes: "192x192",
            type: "image/png"
        },
        {
            rel: "icon",
            url: "/android-chrome-512x512.png",
            sizes: "512x512",
            type: "image/png"
        }
        ]
    },

    openGraph: {
        title: "Almoço dos Missionários",
        description: "Sistema de agendamento de almoço para missionários.",
        url: "https://lunchsud.vercel.app",
        siteName: "Almoço dos Missionários",
        locale: "pt_BR",
        type: "website",
        images: [
        {
            url: "/og-image.png",
            width: 1200,
            height: 630,
            alt: "Almoço dos Missionários"
        }
        ]
    }
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="pt-BR">
        <body className="antialiased">
            {children}
        </body>
        </html>
    );
}
