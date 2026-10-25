/**
 * Contexto e regras: leia CLAUDE.md e docs/src_app.md antes de alterar.
 * Mudou o comportamento? Atualize o doc na mesma mudança.
 */

import type { Metadata, Viewport } from "next"
import { Source_Sans_3, Source_Serif_4 } from "next/font/google"
import { Footer } from "@/components/Footer"
import { urlPublica } from "@/lib/site-url"
import "./globals.css"

const fontSans = Source_Sans_3({
    subsets: ["latin"],
    variable: "--font-source-sans",
    display: "swap",
})

const fontSerif = Source_Serif_4({
    subsets: ["latin"],
    variable: "--font-source-serif",
    display: "swap",
})

const DESCRICAO =
    "Calendário simples para alas e ramos organizarem o almoço dos missionários. " +
    "A presidência pede o calendário da ala, e as irmãs agendam pelo link, sem precisar criar conta."

export const metadata: Metadata = {
    metadataBase: new URL(urlPublica()),
    applicationName: "Almoço dos Missionários",
    title: "Almoço dos Missionários",
    description: DESCRICAO,
    keywords: [
        "almoço dos missionários",
        "calendário de almoços",
        "agendar almoço",
        "ala",
        "ramo",
        "Sociedade de Socorro",
    ],
    authors: [{ name: "Luis Henrique Engel Saul", url: "https://luishsaul.com.br" }],
    creator: "Luis Henrique Engel Saul",
    manifest: "/manifest.webmanifest",
    appleWebApp: {
        capable: true,
        statusBarStyle: "default",
        title: "Almoço",
    },
    formatDetection: {
        telephone: false,
    },
    robots: { index: true, follow: true },
    openGraph: {
        type: "website",
        locale: "pt_BR",
        siteName: "Almoço dos Missionários",
        title: "Almoço dos Missionários",
        description: DESCRICAO,
        url: "/",
    },
    twitter: {
        card: "summary_large_image",
        title: "Almoço dos Missionários",
        description: DESCRICAO,
    },
    ...(process.env.GOOGLE_SITE_VERIFICATION
        ? { verification: { google: process.env.GOOGLE_SITE_VERIFICATION } }
        : {}),
    icons: {
        icon: [
            { url: "/lunchsud32x32.png", sizes: "32x32", type: "image/png" },
            { url: "/lunchsud512x512.png", sizes: "512x512", type: "image/png" },
        ],
        apple: {
            url: "/lunchsud180x180.png",
            sizes: "180x180",
            type: "image/png",
        },
    },
}

export const viewport: Viewport = {
    themeColor: "#003057",
    colorScheme: "only light",
    width: "device-width",
    initialScale: 1,
}

export default function RootLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <html lang="pt-BR" className={`${fontSans.variable} ${fontSerif.variable}`}>
            <body className="bg-cream flex min-h-screen flex-col font-sans text-text">
                <div className="flex-1">
                    {children}
                </div>

                <Footer />
            </body>
        </html>
    )
}
