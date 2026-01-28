import type { Metadata } from "next"
import { Footer } from "@/components/Footer"
import "./globals.css"

export const metadata: Metadata = {
    title: "Almoço dos Missionários",
    description: "Agendamento de almoço para missionários",
    robots: {
        index: false,
        follow: false,
    },
    icons: {
        icon: {
            url: "/lunchsud32x32.png",
            sizes: "32x32",
            type: "image/png",
        },
        apple: {
            url: "/lunchsud180x180.png",
            sizes: "180x180",
            type: "image/png",
        },
    },
}

export default function RootLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <html lang="pt-BR">
            <body className="">
                <main className="">
                    {children}
                </main>

                <Footer />
            </body>
        </html>
    )
}
