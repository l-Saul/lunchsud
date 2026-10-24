/**
 * Contexto e regras: leia CLAUDE.md e docs/routes_slug.md antes de alterar.
 * Mudou o comportamento? Atualize o doc na mesma mudança.
 */
'use client'

import { useState, useEffect, useRef } from 'react'
import { normalizarTelefone } from '@/lib/phone'
import { Spinner } from '@/components/Spinner'
import { useScrollLock } from '@/hooks/use-scroll-lock'

const campoBase =
    'w-full min-w-0 box-border appearance-none rounded-xl border px-4 py-3.5 text-lg text-text ' +
    'focus:border-secondary focus:outline-none focus:ring-2 focus:ring-secondary'

export type Agendado = { id: number; data: string; nome: string }

type Props = {
    slug: string
    dia: number
    nomeMes: string
    data: string
    nome: string
    telefone: string
    onNomeChange: (nome: string) => void
    onTelefoneChange: (telefone: string) => void
    onClose: () => void
    onBooked: (agendado: Agendado) => void
    onConflict: () => void
}

export function BookingModal({
    slug, dia, nomeMes, data, nome, telefone,
    onNomeChange, onTelefoneChange, onClose, onBooked, onConflict,
}: Props) {
    const [erroNome, setErroNome] = useState(false)
    const [erroTelefone, setErroTelefone] = useState(false)
    const [erro, setErro] = useState('')
    const [loading, setLoading] = useState(false)

    async function agendar() {
        if (loading) return

        setErroNome(false)
        setErroTelefone(false)
        setErro('')

        const nomeInvalido = nome.trim().length < 2
        const telefoneInvalido = !normalizarTelefone(telefone)

        if (nomeInvalido || telefoneInvalido) {
            setErroNome(nomeInvalido)
            setErroTelefone(telefoneInvalido)
            setErro('Preencha corretamente os campos destacados.')
            return
        }

        setLoading(true)

        let res: Response
        try {
            res = await fetch('/api/agendar', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ slug, data, nome, telefone })
            })
        } catch {
            setLoading(false)
            setErro('Sem conexão com a internet. Verifique e tente de novo.')
            return
        }

        setLoading(false)

        if (res.status === 409) {
            onConflict()
            return
        }

        if (!res.ok) {
            const corpo = await res.json().catch(() => null)
            setErro(corpo?.error ?? 'Não foi possível agendar. Tente de novo.')
            return
        }

        const { id } = await res.json().catch(() => ({ id: 0 }))
        onBooked({ id, data, nome: nome.trim() })
    }

    const onCloseRef = useRef(onClose)
    useEffect(() => {
        onCloseRef.current = onClose
    }, [onClose])

    useScrollLock()

    useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onCloseRef.current()
        }
        window.addEventListener('keydown', onKey)
        return () => window.removeEventListener('keydown', onKey)
    }, [])

    return (
        <div className="fixed inset-0 z-50 animate-aparecer overflow-y-auto overscroll-contain bg-primary/50 backdrop-blur-sm">
            <div
                onClick={onClose}
                className="flex min-h-full items-center justify-center p-4"
            >
            <div
                onClick={e => e.stopPropagation()}
                role="dialog"
                aria-modal="true"
                aria-label={`Agendar dia ${dia} de ${nomeMes}`}
                className="w-full max-w-md animate-surgir rounded-2xl bg-background p-6 shadow-2xl"
            >
                <div className="mb-5 flex items-start justify-between gap-3">
                    <h2 className="text-xl font-semibold text-text">
                        Agendar dia {dia} de {nomeMes}
                    </h2>
                    <button
                        onClick={onClose}
                        aria-label="Fechar"
                        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-muted transition hover:bg-slate-100 cursor-pointer"
                    >
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                            <path d="M18 6 6 18M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <form
                    noValidate
                    onSubmit={e => {
                        e.preventDefault()
                        agendar()
                    }}
                >
                <div className="flex flex-col gap-4">
                    <div className="flex flex-col gap-1.5">
                        <label htmlFor="nome" className="text-base font-medium text-text">
                            Seu nome
                        </label>
                        <input
                            id="nome"
                            name="name"
                            type="text"
                            autoComplete="name"
                            autoCapitalize="words"
                            maxLength={80}
                            placeholder="Digite seu nome aqui"
                            aria-invalid={erroNome}
                            className={`${campoBase} ${erroNome ? 'border-accent' : 'border-slate-300'}`}
                            value={nome}
                            onChange={e => {
                                onNomeChange(e.target.value)
                                if (erroNome) setErroNome(false)
                            }}
                        />
                        {erroNome && (
                            <p role="alert" className="text-base text-accent">
                                Informe seu nome.
                            </p>
                        )}
                    </div>

                    <div className="flex flex-col gap-1.5">
                        <label htmlFor="telefone" className="text-base font-medium text-text">
                            Seu telefone (com DDD)
                        </label>
                        <input
                            id="telefone"
                            name="tel"
                            type="tel"
                            autoComplete="tel"
                            inputMode="tel"
                            placeholder="Digite seu telefone aqui"
                            maxLength={25}
                            aria-invalid={erroTelefone}
                            className={`${campoBase} ${erroTelefone ? 'border-accent' : 'border-slate-300'}`}
                            value={telefone}
                            onChange={e => {
                                onTelefoneChange(e.target.value)
                                if (erroTelefone) setErroTelefone(false)
                            }}
                            onBlur={() => {
                                const lido = normalizarTelefone(telefone)
                                if (lido) onTelefoneChange(lido.formatado)
                            }}
                        />
                        {erroTelefone && (
                            <p role="alert" className="text-base text-accent">
                                Confira o telefone, com DDD. De outro país? Comece com + e o código do país.
                            </p>
                        )}
                    </div>
                </div>

                {erro && (
                    <p key={erro} role="alert" className="mt-4 animate-aparecer text-center text-base font-medium text-accent">
                        {erro}
                    </p>
                )}

                <div className="mt-6 flex flex-wrap-reverse gap-3">
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={loading}
                        className="min-h-13 grow basis-28 rounded-xl border border-slate-300 px-4 text-lg font-medium text-text transition hover:bg-slate-100 disabled:opacity-50 cursor-pointer"
                    >
                        Cancelar
                    </button>
                    <button
                        type="submit"
                        disabled={loading}
                        aria-busy={loading}
                        className="flex min-h-13 grow basis-28 items-center justify-center gap-2 rounded-xl bg-secondary px-4 text-lg font-semibold text-white shadow-md transition duration-100 hover:opacity-95 hover:shadow-lg enabled:active:scale-[0.98] disabled:opacity-70 cursor-pointer"
                    >
                        {loading && <Spinner />}
                        {loading ? 'Confirmando…' : 'Confirmar'}
                    </button>
                </div>
                </form>
            </div>
            </div>
        </div>
    )
}
