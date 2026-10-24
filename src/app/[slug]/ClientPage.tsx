'use client'

// Página pública de agendamento de uma ala: calendário + formulário.
// Recebe do servidor o slug e os dias já ocupados; o backend continua sendo a fonte da verdade.

import { useState, useEffect, useCallback } from 'react'
import { Calendar } from '@/components/Calendar'
import { motion, AnimatePresence } from 'framer-motion'
import { formatarTelefone, digitosTelefone } from '@/lib/phone'
import { useOcupadosRealtime, type MudancaAgendamento } from '@/hooks/use-ocupados-realtime'
import { Flor } from '@/components/Flor'

// Estilo único dos campos do modal de agendar (label claro + placeholder).
const campoBase =
    'w-full min-w-0 box-border appearance-none rounded-xl border px-4 py-3.5 text-lg text-text ' +
    'placeholder:text-muted/60 focus:border-secondary focus:outline-none focus:ring-2 focus:ring-secondary'

type DiaOcupado = {
    id: number
    data: string
    nome: string
}

// Ressincroniza ao voltar para a página só se ela ficou escondida por mais que
// isto (celular bloqueado, outro app). Troca rápida de app não gera requisição.
const RESSINCRONIZAR_APOS_MS = 30_000

const pad = (n: number) => String(n).padStart(2, '0')

type Props = {
    slug: string
    alaId: number
    nomeAla: string   // nome real da ala (vem do banco)
    ocupados: DiaOcupado[]
    mesAtual: string  // 'YYYY-MM' no fuso de São Paulo (vem do servidor)
}

export default function ClientPage({ slug, alaId, nomeAla, ocupados, mesAtual }: Props) {
    const [diaSelecionado, setDiaSelecionado] = useState<number | null>(null)
    const [nome, setNome] = useState('')
    const [telefone, setTelefone] = useState('')
    const [mensagem, setMensagem] = useState('')
    const [tipoMensagem, setTipoMensagem] = useState<'sucesso' | 'erro' | null>(null)
    const [loading, setLoading] = useState(false)
    const [diasOcupados, setDiasOcupados] = useState<DiaOcupado[]>(ocupados)
    const [ocupadoPor, setOcupadoPor] = useState<string | null>(null)
    const [pday, setPday] = useState(false)

    const [erroNome, setErroNome] = useState(false)
    const [erroTelefone, setErroTelefone] = useState(false)

    // Janela navegável = mês atual + seguinte, a mesma que o /api/agendar aceita.
    // O mês atual vem do servidor: o relógio/fuso do celular pode estar em outro mês.
    const [anoBase, mesBase] = mesAtual.split('-').map(Number)
    const inicioMesAtual = new Date(anoBase, mesBase - 1, 1)
    const inicioMesSeguinte = new Date(anoBase, mesBase, 1)

    const [baseDate, setBaseDate] = useState(inicioMesAtual)

    const canPrev = baseDate.getTime() !== inicioMesAtual.getTime()
    const canNext = baseDate.getTime() !== inicioMesSeguinte.getTime()

    const mesNomeBase = baseDate.toLocaleDateString('pt-BR', { month: 'long' })

    // Mesma janela em texto ('YYYY-MM-DD'), para filtrar o que chega ao vivo.
    const inicioJanela = `${mesAtual}-01`
    const aposJanela = new Date(anoBase, mesBase + 1, 1)
    const fimJanela = `${aposJanela.getFullYear()}-${pad(aposJanela.getMonth() + 1)}-01`

    // Busca a lista inteira no servidor. Só para ressincronizar (reconexão do
    // WebSocket, volta para a página, dia que acabou de ser ocupado) — as
    // mudanças normais chegam prontas pelo WebSocket.
    const atualizarOcupados = useCallback(() => {
        fetch(`/api/agendamentos/${slug}`, { cache: 'no-store' })
            .then(res => (res.ok ? res.json() : null))
            .then((dados: DiaOcupado[] | null) => {
                if (dados) setDiasOcupados(dados)
            })
            .catch(() => {})
    }, [slug])

    // Ao vivo: aplica a mudança que veio pelo WebSocket direto na tela, sem
    // requisição. Com 50 pessoas olhando a mesma ala, um agendamento antes gerava
    // 50 buscas no servidor; agora, nenhuma.
    const aplicarMudanca = useCallback((mudanca: MudancaAgendamento) => {
        if (!mudanca) {
            atualizarOcupados()
            return
        }
        setDiasOcupados(prev => {
            if (mudanca.tipo === 'DELETE') return prev.filter(o => o.id !== mudanca.id)
            const novo = mudanca.agendamento
            // Um almoço por dia: sai o que tinha esse id ou ocupava essa data.
            const resto = prev.filter(o => o.id !== novo.id && o.data !== novo.data)
            // O líder pode mover um almoço para fora da janela visível.
            return novo.data >= inicioJanela && novo.data < fimJanela ? [...resto, novo] : resto
        })
    }, [atualizarOcupados, inicioJanela, fimJanela])

    useOcupadosRealtime(alaId, aplicarMudanca)

    // Celular bloqueado ou outro app por um tempo: o WebSocket pode ter caído sem
    // perceber e perdido eventos. Ao voltar, ressincroniza para não oferecer um
    // dia já ocupado.
    useEffect(() => {
        let escondidaDesde = 0
        const aoMudarVisibilidade = () => {
            if (document.visibilityState === 'hidden') {
                escondidaDesde = Date.now()
            } else if (escondidaDesde && Date.now() - escondidaDesde > RESSINCRONIZAR_APOS_MS) {
                atualizarOcupados()
            }
        }
        document.addEventListener('visibilitychange', aoMudarVisibilidade)
        return () => document.removeEventListener('visibilitychange', aoMudarVisibilidade)
    }, [atualizarOcupados])

    async function agendar() {
        if (!slug || !diaSelecionado) return

        // Limpa estados de erro/mensagem da tentativa anterior.
        setErroNome(false)
        setErroTelefone(false)
        setMensagem('')
        setTipoMensagem(null)

        // Validação do formulário (nome com 2+ letras e telefone com 11 dígitos).
        const nomeInvalido = nome.trim().length < 2
        const telefoneInvalido = digitosTelefone(telefone).length !== 11

        if (nomeInvalido || telefoneInvalido) {
            setErroNome(nomeInvalido)
            setErroTelefone(telefoneInvalido)
            setTipoMensagem('erro')
            setMensagem('Preencha corretamente os campos destacados.')
            return
        }

        setLoading(true)

        // Monta a data 'YYYY-MM-DD' do dia escolhido no mês visível.
        const ano = baseDate.getFullYear()
        const mes = baseDate.getMonth()
        const data = `${ano}-${String(mes + 1).padStart(2, '0')}-${String(diaSelecionado).padStart(2, '0')}`

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
            setTipoMensagem('erro')
            setMensagem('Sem conexão com a internet. Verifique e tente de novo.')
            return
        }

        setLoading(false)

        // 409: outra pessoa marcou esse dia entre abrir a tela e confirmar.
        if (res.status === 409) {
            setTipoMensagem('erro')
            setMensagem('Este dia acabou de ser ocupado. Escolha outro.')
            setDiaSelecionado(null)
            atualizarOcupados()
            return
        }

        // Demais erros: mostra a mensagem da API dentro do modal, que continua
        // aberto (nome e telefone ficam) para tentar de novo.
        if (!res.ok) {
            const corpo = await res.json().catch(() => null)
            setTipoMensagem('erro')
            setMensagem(corpo?.error ?? 'Não foi possível agendar. Tente de novo.')
            return
        }

        // Sucesso: marca o dia na hora (o evento do WebSocket chega depois com o
        // mesmo id e só substitui) e limpa o formulário.
        const { id } = await res.json().catch(() => ({ id: 0 }))
        setDiasOcupados(prev => [...prev.filter(o => o.data !== data), { id, data, nome: nome.trim() }])
        setTipoMensagem('sucesso')
        setMensagem('Almoço agendado com sucesso. Muito obrigado!')
        setNome('')
        setTelefone('')
        setDiaSelecionado(null)
        setOcupadoPor(null)
    }

    // Fecha o modal de agendar e limpa erros/mensagem (mantém nome/telefone digitados).
    const fecharModal = useCallback(() => {
        setDiaSelecionado(null)
        setErroNome(false)
        setErroTelefone(false)
        setMensagem('')
        setTipoMensagem(null)
    }, [])

    // Com o modal aberto: trava o scroll do fundo e fecha com a tecla Esc.
    useEffect(() => {
        if (!diaSelecionado) return

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
            if (e.key === 'Escape') fecharModal()
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
    }, [diaSelecionado, fecharModal])

    return (
        <main className="min-h-screen flex justify-center text-text">
            <div className="w-full max-w-2xl">

                {/* HEADER */}
                <div className="relative overflow-hidden px-3 pt-12 pb-7 text-center sm:px-6">
                    {/* Florzinhas decorativas nos cantos (estáticas — leves). */}
                    <span aria-hidden="true" className="pointer-events-none absolute left-4 top-6 opacity-25 sm:left-10">
                        <Flor size={32} />
                    </span>
                    <span aria-hidden="true" className="pointer-events-none absolute right-5 top-14 opacity-20 sm:right-12">
                        <Flor size={22} />
                    </span>

                    {/* Conteúdo, acima das decorações */}
                    <div className="relative z-10 flex flex-col items-center gap-4">
                        <h1 className="text-4xl font-bold text-white drop-shadow-sm">
                            {nomeAla}
                        </h1>

                        {/* Divisória com florzinha — toque delicado */}
                        <div className="flex items-center gap-3" aria-hidden="true">
                            <span className="h-px w-10 bg-linear-to-r from-transparent to-accent/70 sm:w-16" />
                            <Flor size={26} />
                            <span className="h-px w-10 bg-linear-to-l from-transparent to-accent/70 sm:w-16" />
                        </div>

                        <p className="text-xl leading-relaxed text-white/90">
                            Toque em um dia livre para agendar o almoço.
                        </p>
                    </div>
                </div>

                {/* CONTEÚDO */}
                <div className="px-3 sm:px-6 py-6 space-y-6">

                    {/* CALENDÁRIO */}
                    <motion.div
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, ease: 'easeOut' }}
                        className="relative overflow-hidden bg-background text-secondary rounded-2xl p-2 sm:p-4 shadow-xl ring-1 ring-white/40 border border-muted/10"
                    >
                        {/* Fitinha de acento no topo (verde → rosa → verde). */}
                        <span aria-hidden="true" className="absolute inset-x-0 top-0 h-1.5 bg-linear-to-r from-secondary via-accent to-secondary" />
                        <Calendar
                            ocupados={diasOcupados}
                            baseDate={baseDate}
                            selectedDay={diaSelecionado}
                            canPrev={canPrev}
                            canNext={canNext}
                            onPrev={() => {
                                setBaseDate(inicioMesAtual)
                                setDiaSelecionado(null)
                                setOcupadoPor(null)
                                setPday(false)
                            }}
                            onNext={() => {
                                setBaseDate(inicioMesSeguinte)
                                setDiaSelecionado(null)
                                setOcupadoPor(null)
                                setPday(false)
                            }}
                            onSelectDay={day => {
                                setDiaSelecionado(day)
                                setOcupadoPor(null)
                                setPday(false)
                            }}
                            onSelectOcupado={nome => {
                                setOcupadoPor(nome)
                                setDiaSelecionado(null)
                                setPday(false)
                            }}
                            onSelectPday={() => {
                                setPday(true)
                                setDiaSelecionado(null)
                                setOcupadoPor(null)
                            }}
                        />
                    </motion.div>

                    {ocupadoPor && (
                        <motion.p
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ duration: 0.2 }}
                            className="text-center text-lg font-medium text-white"
                        >
                            Este dia já foi agendado por <strong>{ocupadoPor}</strong>.
                        </motion.p>
                    )}

                    {pday && (
                        <motion.p
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ duration: 0.2 }}
                            className="text-center text-lg font-medium text-white"
                        >
                            Segunda-feira é dia de <strong>P-day</strong>. Escolha outro dia.
                        </motion.p>
                    )}

                    {/* MODAL DE AGENDAR — popup com fundo desfocado, trava o scroll e tem Cancelar. */}
                    <AnimatePresence>
                        {diaSelecionado && (
                            <motion.div
                                key="agendar-backdrop"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                transition={{ duration: 0.2 }}
                                className="fixed inset-0 z-50 overflow-y-auto overscroll-contain bg-primary/50 backdrop-blur-sm"
                            >
                                {/* Container rolável: com o teclado aberto no mobile o modal
                                    pode passar da tela e ainda assim dá pra rolar até os botões. */}
                                <div
                                    onClick={fecharModal}
                                    className="flex min-h-full items-center justify-center p-4"
                                >
                                <motion.div
                                    onClick={e => e.stopPropagation()}
                                    role="dialog"
                                    aria-modal="true"
                                    aria-label={`Agendar dia ${diaSelecionado} de ${mesNomeBase}`}
                                    initial={{ opacity: 0, scale: 0.96, y: 12 }}
                                    animate={{ opacity: 1, scale: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.96, y: 12 }}
                                    transition={{ duration: 0.2, ease: 'easeOut' }}
                                    className="w-full max-w-md rounded-2xl bg-background p-6 shadow-2xl"
                                >
                                    <div className="mb-5 flex items-start justify-between gap-3">
                                        <h2 className="text-xl font-semibold text-text">
                                            Agendar dia {diaSelecionado} de {mesNomeBase}
                                        </h2>
                                        <button
                                            onClick={fecharModal}
                                            aria-label="Fechar"
                                            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-muted transition hover:bg-slate-100 cursor-pointer"
                                        >
                                            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                                                <path d="M18 6 6 18M6 6l12 12" />
                                            </svg>
                                        </button>
                                    </div>

                                    <div className="flex flex-col gap-4">
                                        <div className="flex flex-col gap-1.5">
                                            <label htmlFor="nome" className="text-base font-medium text-text">
                                                Seu nome
                                            </label>
                                            <input
                                                id="nome"
                                                type="text"
                                                autoComplete="name"
                                                maxLength={80}
                                                placeholder="Digite seu nome aqui"
                                                aria-invalid={erroNome}
                                                className={`${campoBase} ${erroNome ? 'border-accent' : 'border-slate-300'}`}
                                                value={nome}
                                                onChange={e => {
                                                    setNome(e.target.value)
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
                                                type="tel"
                                                autoComplete="tel"
                                                inputMode="numeric"
                                                placeholder="Digite seu telefone aqui"
                                                aria-invalid={erroTelefone}
                                                className={`${campoBase} ${erroTelefone ? 'border-accent' : 'border-slate-300'}`}
                                                value={telefone}
                                                onChange={e => {
                                                    setTelefone(formatarTelefone(e.target.value))
                                                    if (erroTelefone) setErroTelefone(false)
                                                }}
                                            />
                                            {erroTelefone && (
                                                <p role="alert" className="text-sm text-accent">
                                                    Informe um telefone celular válido.
                                                </p>
                                            )}
                                        </div>
                                    </div>

                                    {tipoMensagem === 'erro' && mensagem && (
                                        <p role="alert" className="mt-4 text-center text-sm font-medium text-accent">
                                            {mensagem}
                                        </p>
                                    )}

                                    <div className="mt-6 flex gap-3">
                                        <button
                                            onClick={fecharModal}
                                            disabled={loading}
                                            className="min-h-13 flex-1 rounded-xl border border-slate-300 px-4 text-lg font-medium text-text transition hover:bg-slate-100 disabled:opacity-50 cursor-pointer"
                                        >
                                            Cancelar
                                        </button>
                                        <button
                                            onClick={agendar}
                                            disabled={loading}
                                            aria-busy={loading}
                                            className="min-h-13 flex-1 rounded-xl bg-secondary px-4 text-lg font-semibold text-white shadow-md transition duration-200 hover:-translate-y-0.5 hover:opacity-95 hover:shadow-lg disabled:opacity-60 cursor-pointer"
                                        >
                                            {loading ? 'Confirmando…' : 'Confirmar'}
                                        </button>
                                    </div>
                                </motion.div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <AnimatePresence>
                        {mensagem && !diaSelecionado && (
                            <motion.p
                                role="status"
                                aria-live="polite"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ duration: 0.2 }}
                                // Cor conforme o tipo: erro em rosa, sucesso em verde (antes ficava
                                // azul sobre o fundo azul = invisível).
                                className={`text-center text-lg font-medium ${
                                    tipoMensagem === 'erro' ? 'text-accent' : 'text-secondary'
                                }`}
                            >
                                {mensagem}
                            </motion.p>
                        )}
                    </AnimatePresence>

                </div>
            </div>
        </main>
    )
}
