/**
 * Contexto e regras: leia CLAUDE.md e docs/routes_slug.md antes de alterar.
 * Mudou o comportamento? Atualize o doc na mesma mudança.
 */
'use client'

import { useEffect, useRef, useState } from 'react'
import { linkGoogleAgenda, linkOutlook } from '@/lib/calendar-event'
import { botao } from '@/components/button-classes'

type Opcao = { id: string; rotulo: string; href: string; externo?: boolean; baixar?: boolean }

export function AddToCalendar({ slug, data, nomeAla }: { slug: string; data: string; nomeAla: string }) {
    const [aberto, setAberto] = useState(false)
    const [apple] = useState(() => /iPhone|iPad|iPod|Macintosh/.test(navigator.userAgent))
    const primeira = useRef<HTMLAnchorElement>(null)

    useEffect(() => {
        if (aberto) primeira.current?.focus()
    }, [aberto])

    const arquivo = `/api/agenda/${slug}?data=${data}`
    const google: Opcao = { id: 'google', rotulo: 'Google Agenda', href: linkGoogleAgenda(data, nomeAla), externo: true }
    const daApple: Opcao = { id: 'apple', rotulo: 'Agenda do iPhone ou do Mac', href: arquivo }
    const opcoes: Opcao[] = [
        ...(apple ? [daApple, google] : [google, daApple]),
        { id: 'outlook', rotulo: 'Outlook', href: linkOutlook(data, nomeAla), externo: true },
        { id: 'arquivo', rotulo: 'Outra agenda (baixar o arquivo)', href: arquivo, baixar: true },
    ]

    if (!aberto) {
        return (
            <button
                type="button"
                onClick={() => setAberto(true)}
                className={`${botao('primario', 'grande')} mt-2 w-full`}
            >
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="shrink-0">
                    <rect x="3" y="4" width="18" height="18" rx="2" />
                    <path d="M16 2v4M8 2v4M3 10h18M12 14v4M10 16h4" />
                </svg>
                Adicionar à agenda
            </button>
        )
    }

    return (
        <div className="mt-2 flex w-full animate-aparecer flex-col gap-2">
            <p id="escolher-agenda" className="text-base font-semibold text-text">Em qual agenda?</p>
            <ul aria-labelledby="escolher-agenda" className="flex flex-col gap-2">
                {opcoes.map((o, i) => (
                    <li key={o.id}>
                        <a
                            ref={i === 0 ? primeira : undefined}
                            href={o.href}
                            {...(o.externo ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
                            {...(o.baixar ? { download: 'almoco-dos-missionarios.ics' } : {})}
                            className={`${botao('secundario', 'grande')} w-full`}
                        >
                            <span className="min-w-0 wrap-anywhere">{o.rotulo}</span>
                            {o.externo && (
                                <>
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="shrink-0 text-muted">
                                        <path d="M15 3h6v6" />
                                        <path d="M10 14 21 3" />
                                        <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                                    </svg>
                                    <span className="sr-only">(abre em outra aba)</span>
                                </>
                            )}
                        </a>
                    </li>
                ))}
            </ul>
        </div>
    )
}
