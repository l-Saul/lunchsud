/**
 * Contexto e regras: leia CLAUDE.md e docs/src_lib.md antes de alterar.
 * Mudou o comportamento? Atualize o doc na mesma mudança.
 */

import 'server-only';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { ImageResponse } from 'next/og';
import { Flower } from '@/components/Flower';

const FONTES = path.join(process.cwd(), 'src', 'lib', 'server', 'og');

const FUNDO =
    'radial-gradient(60% 70% at 50% -25%, rgba(255,184,28,0.16), rgba(255,184,28,0) 70%), ' +
    'radial-gradient(40% 80% at 95% 0%, rgba(237,58,101,0.18), rgba(237,58,101,0) 70%), ' +
    'linear-gradient(180deg, #0b3a66 0%, #003057 60%, #00284a 100%)';

function linha(direcao: 'right' | 'left') {
    return (
        <div
            style={{
                width: 160,
                height: 3,
                backgroundImage: `linear-gradient(to ${direcao}, rgba(255,184,28,0), rgba(255,184,28,0.75))`,
            }}
        />
    );
}

export async function imagemDePrevia({ titulo, acima, abaixo }: { titulo: string; acima?: string; abaixo?: string }) {
    const [serif, sans] = await Promise.all([
        readFile(path.join(FONTES, 'SourceSerif4-Semibold.ttf')),
        readFile(path.join(FONTES, 'SourceSans3-Semibold.ttf')),
    ]);

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
                    backgroundImage: FUNDO,
                }}
            >
                {acima && (
                    <div style={{ marginBottom: 18, fontFamily: 'Source Sans', fontSize: 40, color: 'rgba(255,255,255,0.85)' }}>
                        {acima}
                    </div>
                )}
                <div
                    style={{
                        fontFamily: 'Source Serif',
                        fontSize: titulo.length > 26 ? 72 : 100,
                        lineHeight: 1.1,
                        maxWidth: '100%',
                        wordBreak: 'break-word',
                    }}
                >
                    {titulo}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 28, marginTop: 44 }}>
                    {linha('right')}
                    <Flower size={64} />
                    {linha('left')}
                </div>
                {abaixo && (
                    <div style={{ marginTop: 40, fontFamily: 'Source Sans', fontSize: 40, color: 'rgba(255,255,255,0.85)' }}>
                        {abaixo}
                    </div>
                )}
            </div>
        ),
        {
            width: 1200,
            height: 630,
            fonts: [
                { name: 'Source Serif', data: serif, weight: 600, style: 'normal' },
                { name: 'Source Sans', data: sans, weight: 600, style: 'normal' },
            ],
        }
    );
}
