import type { Metadata, Viewport } from "next"
import { Source_Sans_3, Source_Serif_4 } from "next/font/google"
import { Footer } from "@/components/Footer"
import "./globals.css"

// Source Sans / Source Serif: a família tipográfica oficial da Igreja.
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

export const metadata: Metadata = {
    metadataBase: new URL("https://lunchsud.vercel.app"),
    applicationName: "Almoço dos Missionários",
    title: {
        default: "Almoço dos Missionários",
        template: "%s · Almoço dos Missionários",
    },
    description:
        "Agende um almoço para os missionários da sua ala. Escolha um dia disponível no calendário, de forma simples e rápida.",
    keywords: [
        "almoço",
        "missionários",
        "agendamento",
        "ala",
        "Igreja de Jesus Cristo dos Santos dos Últimos Dias",
    ],
    authors: [{ name: "LunchSud" }],
    creator: "LunchSud",
    manifest: "/manifest.webmanifest",
    appleWebApp: {
        capable: true,
        statusBarStyle: "default",
        title: "Almoço",
    },
    formatDetection: {
        telephone: false,
    },
    openGraph: {
        type: "website",
        locale: "pt_BR",
        siteName: "Almoço dos Missionários",
        title: "Almoço dos Missionários",
        description:
            "Agende um almoço para os missionários da sua ala em poucos toques.",
        url: "/",
        images: [
            {
                url: "/lunchsud512x512.png",
                width: 512,
                height: 512,
                alt: "Almoço dos Missionários",
            },
        ],
    },
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
    themeColor: "#143157",
    width: "device-width",
    initialScale: 1,
}

// Layout raiz: aplica as fontes, o fundo azul e o rodapé fixo em todas as páginas.
export default function RootLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <html lang="pt-BR" className={`${fontSans.variable} ${fontSerif.variable}`}>
            <body className="bg-primary flex min-h-screen flex-col font-sans">
                <div className="flex-1">
                    {children}
                </div>

                <Footer />
            </body>
        </html>
    )
}
