/**
 * Contexto e regras: leia CLAUDE.md e docs/routes_slug.md antes de alterar.
 * Mudou o comportamento? Atualize o doc na mesma mudança.
 */

import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { ImageResponse } from 'next/og'
import { buscarAlaPorSlug } from '@/lib/server/public-ward'
import { Flower } from '@/components/Flower'

export const alt = 'Calendário de almoços dos missionários da ala'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

const FONTES = path.join(process.cwd(), 'src', 'app', '(member)', '[slug]', '_fonts')

function linha(direcao: 'right' | 'left') {
    return <div style={{ width: 160, height: 3, backgroundImage: `linear-gradient(to ${direcao}, rgba(255,184,28,0), rgba(255,184,28,0.75))` }} />
}

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params
    const [ala, serif, sans] = await Promise.all([
        buscarAlaPorSlug(slug),
        readFile(path.join(FONTES, 'SourceSerif4-Semibold.ttf')),
        readFile(path.join(FONTES, 'SourceSans3-Semibold.ttf')),
    ])
    const nome = ala?.nome ?? 'Almoço dos Missionários'

    return new ImageResponse(
        (
            <div
                style={{
                    width: '100%',
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '0 90px',
                    color: '#ffffff',
                    textAlign: 'center',
                    backgroundColor: '#003057',
                    backgroundImage:
                        'radial-gradient(60% 70% at 50% -25%, rgba(255,184,28,0.16), rgba(255,184,28,0) 70%), ' +
                        'radial-gradient(40% 80% at 95% 0%, rgba(237,58,101,0.18), rgba(237,58,101,0) 70%), ' +
                        'linear-gradient(180deg, #0b3a66 0%, #003057 60%, #00284a 100%)',
                }}
            >
                {ala && (
                    <div style={{ fontFamily: 'Source Sans', fontSize: 40, color: 'rgba(255,255,255,0.85)' }}>
                        Almoço dos Missionários
                    </div>
                )}
                <div
                    style={{
                        marginTop: ala ? 18 : 0,
                        fontFamily: 'Source Serif',
                        fontSize: nome.length > 26 ? 72 : 100,
                        lineHeight: 1.1,
                        maxWidth: '100%',
                        wordBreak: 'break-word',
                    }}
                >
                    {nome}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 28, marginTop: 44 }}>
                    {linha('right')}
                    <Flower size={64} />
                    {linha('left')}
                </div>
            </div>
        ),
        {
            ...size,
            fonts: [
                { name: 'Source Serif', data: serif, weight: 600, style: 'normal' },
                { name: 'Source Sans', data: sans, weight: 600, style: 'normal' },
            ],
        }
    )
}
