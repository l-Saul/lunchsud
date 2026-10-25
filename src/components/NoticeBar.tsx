/**
 * Contexto e regras: leia CLAUDE.md e docs/src_components.md antes de alterar.
 * Mudou o comportamento? Atualize o doc na mesma mudança.
 */
'use client'

import { useEffect, useRef } from 'react'

export type Aviso = { tipo: 'info' | 'sucesso' | 'erro'; conteudo: React.ReactNode }

const CAIXA =
    'pointer-events-auto mx-auto flex max-w-xl animate-aparecer items-start gap-3 rounded-2xl border-l-4 ' +
    'bg-background p-4 shadow-2xl ring-1 ring-primary/10'

const ICONE = {
    info: <path d="M12 16v-5M12 8h.01" />,
    sucesso: <path d="m8 12.5 3 3 5-6.5" />,
    erro: <path d="M12 7v6M12 17h.01" />,
}

export function NoticeBar({ aviso, onClose }: { aviso: Aviso | null; onClose?: () => void }) {
    const caixa = useRef<HTMLDivElement>(null)

    useEffect(() => {
        const raiz = document.documentElement
        const el = caixa.current
        if (!aviso || !el) return
        const medir = () => raiz.style.setProperty('--altura-aviso', `${el.offsetHeight + 24}px`)
        medir()
        const observador = new ResizeObserver(medir)
        observador.observe(el)
        return () => {
            observador.disconnect()
            raiz.style.removeProperty('--altura-aviso')
        }
    }, [aviso])

    const erro = aviso?.tipo === 'erro'

    return (
        <div className="pointer-events-none fixed inset-x-0 top-0 z-70 px-3 pt-[max(0.75rem,env(safe-area-inset-top))]">
            <div
                ref={caixa}
                className={aviso ? `${CAIXA} ${erro ? 'border-accent' : 'border-secondary'}` : ''}
            >
                <div role="status" aria-live="polite" className="flex min-w-0 flex-1 items-start gap-3">
                    {aviso && (
                        <>
                            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className={`mt-0.5 shrink-0 ${erro ? 'text-accent' : 'text-secondary'}`}>
                                <circle cx="12" cy="12" r="10" />
                                {ICONE[aviso.tipo]}
                            </svg>
                            <p className="wrap-anywhere text-lg text-text">{aviso.conteudo}</p>
                        </>
                    )}
                </div>
                {aviso && onClose && (
                    <button
                        type="button"
                        onClick={onClose}
                        aria-label="Fechar aviso"
                        className="-m-1.5 flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-muted transition hover:bg-slate-100 cursor-pointer"
                    >
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                            <path d="M18 6 6 18M6 6l12 12" />
                        </svg>
                    </button>
                )}
            </div>
        </div>
    )
}
