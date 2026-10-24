'use client'

// Modal de agendar um dia: nome + telefone → /api/agendar. Popup com fundo
// desfocado; trava o scroll da página atrás e fecha por Cancelar, X, Esc ou
// toque fora. Nome e telefone vêm de fora (WardBooking) para continuarem
// preenchidos se a pessoa fechar e abrir outro dia; os erros são daqui.

import { useState, useEffect, useRef } from 'react'
import { normalizarTelefone } from '@/lib/phone'
import { Spinner } from '@/components/Spinner'

// Estilo único dos campos (label claro + placeholder).
const campoBase =
    'w-full min-w-0 box-border appearance-none rounded-xl border px-4 py-3.5 text-lg text-text ' +
    'placeholder:text-muted/60 focus:border-secondary focus:outline-none focus:ring-2 focus:ring-secondary'

export type Agendado = { id: number; data: string; nome: string }

type Props = {
    slug: string
    dia: number          // dia do mês, para o título
    nomeMes: string      // 'novembro'
    data: string         // 'YYYY-MM-DD' enviado à API
    nome: string
    telefone: string
    onNomeChange: (nome: string) => void
    onTelefoneChange: (telefone: string) => void
    onClose: () => void
    onBooked: (agendado: Agendado) => void
    onConflict: () => void   // 409: outra pessoa marcou o dia antes
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

        // Limpa os erros da tentativa anterior.
        setErroNome(false)
        setErroTelefone(false)
        setErro('')

        // Validação do formulário (nome com 2+ letras e telefone que dá para entender).
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
            // Sem internet / conexão caiu: o modal continua aberto com o que foi
            // digitado (antes o botão ficava preso em "Confirmando…").
            setLoading(false)
            setErro('Sem conexão com a internet. Verifique e tente de novo.')
            return
        }

        setLoading(false)

        // 409: outra pessoa marcou esse dia entre abrir a tela e confirmar.
        if (res.status === 409) {
            onConflict()
            return
        }

        // Demais erros: mostra a mensagem da API aqui, com o modal aberto (nome e
        // telefone ficam) para tentar de novo.
        if (!res.ok) {
            const corpo = await res.json().catch(() => null)
            setErro(corpo?.error ?? 'Não foi possível agendar. Tente de novo.')
            return
        }

        // Sucesso: o id casa com o evento do WebSocket que chega em seguida.
        const { id } = await res.json().catch(() => ({ id: 0 }))
        onBooked({ id, data, nome: nome.trim() })
    }

    // Guarda o onClose mais recente: a trava abaixo roda só ao abrir/fechar.
    const onCloseRef = useRef(onClose)
    useEffect(() => {
        onCloseRef.current = onClose
    }, [onClose])

    // Aberto: trava o scroll do fundo e fecha com a tecla Esc.
    useEffect(() => {
        // Trava o scroll de forma confiável no mobile: o iOS ignora `overflow:hidden`
        // no body para toque, então fixamos o body e guardamos a posição (restaurada
        // ao fechar). Sem isso, rolar dentro do modal mexia a página atrás.
        const scrollY = window.scrollY
        const { style } = document.body
        style.position = 'fixed'
        style.top = `-${scrollY}px`
        style.left = '0'
        style.right = '0'
        style.width = '100%'

        const onKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onCloseRef.current()
        }
        window.addEventListener('keydown', onKey)

        return () => {
            style.position = ''
            style.top = ''
            style.left = ''
            style.right = ''
            style.width = ''
            window.scrollTo(0, scrollY)
            window.removeEventListener('keydown', onKey)
        }
    }, [])

    // Abre com um fade curto (avisa que uma camada apareceu); fecha na hora.
    return (
        <div className="fixed inset-0 z-50 animate-aparecer overflow-y-auto overscroll-contain bg-primary/50 backdrop-blur-sm">
            {/* Container rolável: com o teclado aberto no mobile o modal
                pode passar da tela e ainda assim dá pra rolar até os botões. */}
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

                {/* <form> + name + autocomplete: é o que faz o celular oferecer
                    o nome e o telefone salvos (preenchimento automático) e a tecla
                    "Ir" do teclado enviar. noValidate: os erros são os nossos,
                    em português, embaixo de cada campo. */}
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
                            <p role="alert" className="text-sm text-accent">
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
                            // "tel" (não "numeric"): o teclado de telefone tem a tecla "+".
                            inputMode="tel"
                            placeholder="Digite seu telefone aqui"
                            maxLength={25}
                            aria-invalid={erroTelefone}
                            className={`${campoBase} ${erroTelefone ? 'border-accent' : 'border-slate-300'}`}
                            value={telefone}
                            // Sem máscara enquanto digita: o campo guarda exatamente o
                            // que a pessoa escreveu (com espaço, traço, + …). Reformatar
                            // a cada tecla jogava o cursor para o fim e impedia corrigir
                            // um dígito no meio.
                            onChange={e => {
                                onTelefoneChange(e.target.value)
                                if (erroTelefone) setErroTelefone(false)
                            }}
                            // Ao sair do campo mostra o número como foi entendido
                            // (ex.: o 9 do celular antigo, o país separado).
                            onBlur={() => {
                                const lido = normalizarTelefone(telefone)
                                if (lido) onTelefoneChange(lido.formatado)
                            }}
                        />
                        {erroTelefone && (
                            <p role="alert" className="text-sm text-accent">
                                Confira o telefone, com DDD. De outro país? Comece com + e o código do país.
                            </p>
                        )}
                    </div>
                </div>

                {erro && (
                    <p key={erro} role="alert" className="mt-4 animate-aparecer text-center text-sm font-medium text-accent">
                        {erro}
                    </p>
                )}

                {/* Lado a lado quando cabe; um embaixo do outro em tela
                    estreita ou letra grande (basis em rem cresce com a letra).
                    Antes, com letra 130%, o Confirmar saía da tela.
                    wrap-reverse: empilhado, o Confirmar fica em cima.
                    Não fixar a barra no rodapé (sticky): testado em 320px com
                    letra 130%, ela cobria o campo de telefone — melhor rolar na
                    ordem natural (nome → telefone → Confirmar). */}
                <div className="mt-6 flex flex-wrap-reverse gap-3">
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={loading}
                        className="min-h-13 grow basis-28 rounded-xl border border-slate-300 px-4 text-lg font-medium text-text transition hover:bg-slate-100 disabled:opacity-50 cursor-pointer"
                    >
                        Cancelar
                    </button>
                    {/* Toque responde na hora; enquanto envia: travado, girando e
                        dizendo "Confirmando…" — tocar de novo não faz nada. */}
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
