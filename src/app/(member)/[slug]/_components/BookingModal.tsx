/**
 * Contexto e regras: leia CLAUDE.md e docs/routes_slug.md antes de alterar.
 * Mudou o comportamento? Atualize o doc na mesma mudança.
 */
'use client'

import { useState, useEffect, useRef } from 'react'
import { normalizarTelefone } from '@/lib/phone'
import { tituloDoDia } from '@/lib/date'
import { linkGoogleAgenda } from '@/lib/calendar-event'
import { Spinner } from '@/components/Spinner'
import { Modal } from '@/components/Modal'
import { ErrorMessage } from '@/components/ErrorMessage'
import { botao } from '@/components/button-classes'

const campoBase =
    'w-full min-w-0 box-border appearance-none rounded-xl border px-4 py-3.5 text-lg text-text ' +
    'focus:border-secondary focus:outline-none focus:ring-2 focus:ring-secondary'

export type Agendado = { id: number; data: string; nome: string }

type Props = {
    slug: string
    nomeAla: string
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
    slug, nomeAla, data, nome, telefone,
    onNomeChange, onTelefoneChange, onClose, onBooked, onConflict,
}: Props) {
    const [erroNome, setErroNome] = useState(false)
    const [erroTelefone, setErroTelefone] = useState(false)
    const [erro, setErro] = useState('')
    const [loading, setLoading] = useState(false)
    const [confirmado, setConfirmado] = useState(false)
    const [apple] = useState(() => /iPhone|iPad|iPod|Macintosh/.test(navigator.userAgent))
    const nomeRef = useRef<HTMLInputElement>(null)
    const telefoneRef = useRef<HTMLInputElement>(null)
    const confirmadoRef = useRef<HTMLHeadingElement>(null)
    const titulo = tituloDoDia(data)

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
            setErro('Corrija os campos marcados em rosa e toque em Confirmar almoço.')
            ;(nomeInvalido ? nomeRef : telefoneRef).current?.focus()
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
            setErro('Sem conexão com a internet. Verifique a internet e toque em Confirmar almoço de novo.')
            return
        }

        setLoading(false)

        if (res.status === 409) {
            onConflict()
            return
        }

        if (!res.ok) {
            const corpo = await res.json().catch(() => null)
            setErro(corpo?.error ?? 'Não foi possível agendar. Toque em Confirmar almoço de novo.')
            return
        }

        const { id } = await res.json().catch(() => ({ id: 0 }))
        onBooked({ id, data, nome: nome.trim() })
        setConfirmado(true)
    }

    useEffect(() => {
        if (confirmado) confirmadoRef.current?.focus()
    }, [confirmado])

    return (
        <Modal onClose={onClose} labelledBy={confirmado ? 'agendado-titulo' : 'agendar-titulo'}>
            {confirmado ? (
                <div className="flex flex-col items-center gap-4 text-center">
                    <span className="flex h-16 w-16 items-center justify-center rounded-full bg-secondary text-white" aria-hidden="true">
                        <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M20 6 9 17l-5-5" />
                        </svg>
                    </span>
                    <div className="flex flex-col gap-1">
                        <h2 id="agendado-titulo" ref={confirmadoRef} tabIndex={-1} className="text-2xl font-semibold text-text focus:outline-none">
                            Almoço agendado!
                        </h2>
                        <p className="text-lg text-text">{titulo}</p>
                        <p className="wrap-anywhere text-base text-muted">{nomeAla}</p>
                    </div>
                    <a
                        href={apple ? `/api/agenda/${slug}?data=${data}` : linkGoogleAgenda(data, nomeAla)}
                        {...(apple ? {} : { target: '_blank', rel: 'noopener noreferrer' })}
                        className={`${botao('primario', 'grande')} mt-2 w-full`}
                    >
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="shrink-0">
                            <rect x="3" y="4" width="18" height="18" rx="2" />
                            <path d="M16 2v4M8 2v4M3 10h18M12 14v4M10 16h4" />
                        </svg>
                        Adicionar à agenda do celular
                    </a>
                    <button
                        type="button"
                        onClick={onClose}
                        className={`${botao('secundario', 'grande')} w-full`}
                    >
                        Voltar ao calendário
                    </button>
                    <p className="text-base text-muted">
                        Precisa desmarcar? Fale com a liderança da ala.
                    </p>
                </div>
            ) : (
            <>
            <div className="mb-5 flex items-start justify-between gap-3">
                <h2 id="agendar-titulo" className="text-xl font-semibold text-text">
                    {titulo}
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
                        ref={nomeRef}
                        id="nome"
                        name="name"
                        type="text"
                        autoComplete="name"
                        autoCapitalize="words"
                        enterKeyHint="next"
                        maxLength={80}
                        placeholder="Digite seu nome aqui"
                        aria-invalid={erroNome}
                        aria-describedby={erroNome ? 'nome-erro' : undefined}
                        className={`${campoBase} ${erroNome ? 'border-accent' : 'border-slate-300'}`}
                        value={nome}
                        onChange={e => {
                            onNomeChange(e.target.value)
                            if (erroNome) setErroNome(false)
                        }}
                        onKeyDown={e => {
                            if (e.key === 'Enter') {
                                e.preventDefault()
                                telefoneRef.current?.focus()
                            }
                        }}
                    />
                    {erroNome && (
                        <p id="nome-erro" className="text-base text-accent">
                            Informe seu nome.
                        </p>
                    )}
                </div>

                <div className="flex flex-col gap-1.5">
                    <label htmlFor="telefone" className="text-base font-medium text-text">
                        Seu telefone (com DDD)
                    </label>
                    <input
                        ref={telefoneRef}
                        id="telefone"
                        name="tel"
                        type="tel"
                        autoComplete="tel"
                        inputMode="tel"
                        enterKeyHint="done"
                        placeholder="Digite seu telefone aqui"
                        maxLength={25}
                        aria-invalid={erroTelefone}
                        aria-describedby={erroTelefone ? 'telefone-erro' : undefined}
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
                        <p id="telefone-erro" className="text-base text-accent">
                            Confira o telefone, com DDD. De outro país? Comece com + e o código do país.
                        </p>
                    )}
                </div>
            </div>

            {erro && (
                <ErrorMessage key={erro} className="mt-4">{erro}</ErrorMessage>
            )}

            <div className="mt-6 flex flex-wrap-reverse gap-3">
                <button
                    type="button"
                    onClick={onClose}
                    disabled={loading}
                    className={`${botao('secundario', 'grande')} grow basis-40`}
                >
                    Cancelar
                </button>
                <button
                    type="submit"
                    disabled={loading}
                    aria-busy={loading}
                    className={`${botao('primario', 'grande')} grow basis-40`}
                >
                    {loading && <Spinner />}
                    {loading ? 'Confirmando…' : 'Confirmar almoço'}
                </button>
            </div>
            </form>
            </>
            )}
        </Modal>
    )
}
