/**
 * Contexto e regras: leia CLAUDE.md e docs/routes_slug.md antes de alterar.
 * Mudou o comportamento? Atualize o doc na mesma mudança.
 */
'use client'

import { useEffect, useRef, useState } from 'react'
import { linkGoogleAgenda, linkOutlook } from '@/lib/calendar-event'
import { botao } from '@/components/button-classes'

type Opcao = { id: string; rotulo: string; detalhe?: string; href: string; externo?: boolean; baixar?: boolean }

export function AddToCalendar({ slug, data, nomeAla }: { slug: string; data: string; nomeAla: string }) {
    const [aberto, setAberto] = useState(false)
    const [apple] = useState(() => /iPhone|iPad|iPod|Macintosh/.test(navigator.userAgent))
    const primeira = useRef<HTMLAnchorElement>(null)

    useEffect(() => {
        if (aberto) primeira.current?.focus()
    }, [aberto])

    const arquivo = `/api/agenda/${slug}?data=${data}`
    const google: Opcao = { id: 'google', rotulo: 'Google Agenda', href: linkGoogleAgenda(data, nomeAla), externo: true }
    const daApple: Opcao = { id: 'apple', rotulo: 'Agenda da Apple', href: arquivo }
    const opcoes: Opcao[] = [
        ...(apple ? [daApple, google] : [google, daApple]),
        { id: 'outlook', rotulo: 'Outlook', href: linkOutlook(data, nomeAla), externo: true },
        { id: 'arquivo', rotulo: 'Outra agenda', detalhe: 'baixa um arquivo', href: arquivo, baixar: true },
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
        <div className="@container mt-2 flex w-full animate-aparecer flex-col gap-2">
            <p id="escolher-agenda" className="text-base font-semibold text-text">Em qual agenda?</p>
            <ul aria-labelledby="escolher-agenda" className="grid grid-cols-2 gap-2 @max-[15rem]:grid-cols-1">
                {opcoes.map((o, i) => (
                    <li key={o.id} className="flex">
                        <a
                            ref={i === 0 ? primeira : undefined}
                            href={o.href}
                            {...(o.externo ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
                            {...(o.baixar ? { download: 'almoco-dos-missionarios.ics' } : {})}
                            className={`${botao('secundario')} w-full`}
                        >
                            <span className="flex min-w-0 flex-col text-balance wrap-break-word">
                                {o.rotulo}
                                {o.detalhe && <span className="font-normal text-muted @max-[17rem]:sr-only">{o.detalhe}</span>}
                                {o.externo && <span className="sr-only">(abre em outra aba)</span>}
                            </span>
                        </a>
                    </li>
                ))}
            </ul>
        </div>
    )
}
