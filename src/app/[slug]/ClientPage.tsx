'use client'

import { useEffect, useState } from 'react'
import { Calendar } from '@/components/Calendar'
import { motion, AnimatePresence } from 'framer-motion'

type DiaOcupado = {
    data: string
    nome: string
}

type Props = {
    slug: string
    ocupados: DiaOcupado[]
}

function formatarTelefone(valor: string) {
    const digits = valor.replace(/\D/g, '').slice(0, 11)

    if (digits.length <= 2) return digits
    if (digits.length <= 7) return `${digits.slice(0, 2)} ${digits.slice(2)}`
    return `${digits.slice(0, 2)} ${digits.slice(2, 7)} ${digits.slice(7)}`
}

function formatarNomeAla(slug: string) {
    return decodeURIComponent(slug)
        .replace(/-/g, ' ')
        .replace(/\b\w/g, l => l.toUpperCase())
}

export default function ClientPage({ slug, ocupados }: Props) {
    const [diaSelecionado, setDiaSelecionado] = useState<number | null>(null)
    const [nome, setNome] = useState('')
    const [telefone, setTelefone] = useState('')
    const [mensagem, setMensagem] = useState('')
    const [tipoMensagem, setTipoMensagem] = useState<'sucesso' | 'erro' | null>(null)
    const [loading, setLoading] = useState(false)
    const [diasOcupados, setDiasOcupados] = useState<DiaOcupado[]>(ocupados)
    const [ocupadoPor, setOcupadoPor] = useState<string | null>(null)
    const [pday, setPday] = useState(false)
    const [imagemSrc, setImagemSrc] = useState<string | null>(null)

    const [erroNome, setErroNome] = useState(false)
    const [erroTelefone, setErroTelefone] = useState(false)

    const hoje = new Date()
    const mesAtual = new Date(hoje.getFullYear(), hoje.getMonth(), 1)
    const mesSeguinte = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 1)

    const [baseDate, setBaseDate] = useState(mesAtual)

    const canPrev = baseDate.getTime() !== mesAtual.getTime()
    const canNext = baseDate.getTime() !== mesSeguinte.getTime()

    const nomeAla = formatarNomeAla(slug)
    const mesNomeBase = baseDate.toLocaleDateString('pt-BR', { month: 'long' })

    useEffect(() => {
        const img = new Image()
        img.src = `/alas/${slug}.jpg`

        img.onload = () => setImagemSrc(`/alas/${slug}.jpg`)
        img.onerror = () => setImagemSrc('/alas/lds.jpg')
    }, [slug])

    async function agendar() {
        if (!slug || !diaSelecionado) return

        setErroNome(false)
        setErroTelefone(false)
        setMensagem('')
        setTipoMensagem(null)

        let valido = true

            if (!nome.trim()) {
                setErroNome(true)
                valido = false
            }

            if (telefone.replace(/\D/g, '').length !== 11) {
                setErroTelefone(true)
                valido = false
            }

            if (!valido) {
                setTipoMensagem('erro')
                setMensagem('Preencha corretamente os campos destacados.')
                return
            }

            setLoading(true)


        if (!nome.trim()) {
            setTipoMensagem('erro')
            setMensagem('Informe seu nome.')
            return
        }

        if (telefone.replace(/\D/g, '').length !== 11) {
            setTipoMensagem('erro')
            setMensagem('Informe um telefone celular válido.')
            return
        }

        setLoading(true)
        setMensagem('')
        setTipoMensagem(null)

        const ano = baseDate.getFullYear()
        const mes = baseDate.getMonth()

        const mm = String(mes + 1).padStart(2, '0')
        const dd = String(diaSelecionado).padStart(2, '0')
        const data = `${ano}-${mm}-${dd}`

        const res = await fetch('/api/agendar', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ slug, data, nome, telefone })
        })

        setLoading(false)

        if (!res.ok) {
            setTipoMensagem('erro')
            setMensagem('Este dia acabou de ser ocupado. Escolha outro.')
            setDiaSelecionado(null)
            return
        }

        setDiasOcupados(prev => [...prev, { data, nome }])
        setTipoMensagem('sucesso')
        setMensagem('Almoço agendado com sucesso. Muito obrigado!')
        setNome('')
        setTelefone('')
        setDiaSelecionado(null)
        setOcupadoPor(null)
    }

    return (
        <main className="min-h-screen bg-primary flex justify-center text-text">
            <div className="w-full max-w-2xl">

                {/* HEADER */}
                <div className="px-3 sm:px-6 pt-10 pb-6 text-center space-y-4">
                    {imagemSrc && (
                        <motion.img
                            initial={{ opacity: 0, scale: 0.96 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.4, ease: 'easeOut' }}
                            src={imagemSrc}
                            alt={`Missionários da ala ${nomeAla}`}
                            className="mx-auto h-auto max-h-56 w-auto max-w-full rounded-2xl shadow-lg"
                        />
                    )}

                    <h1 className="text-4xl font-bold text-secondary">
                        Ala {nomeAla}
                    </h1>

                    <p className="text-xl leading-relaxed text-white/90">
                        Toque em um dia livre para agendar o almoço.
                    </p>
                </div>

                {/* CONTEÚDO */}
                <div className="px-3 sm:px-6 py-6 space-y-6">

                    {/* CALENDÁRIO */}
                    <motion.div
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, ease: 'easeOut' }}
                        className="bg-background text-secondary rounded-xl p-2 sm:p-4 shadow-lg border border-muted/10"
                    >
                        <Calendar
                            ocupados={diasOcupados}
                            baseDate={baseDate}
                            selectedDay={diaSelecionado}
                            canPrev={canPrev}
                            canNext={canNext}
                            onPrev={() => {
                                setBaseDate(mesAtual)
                                setDiaSelecionado(null)
                                setOcupadoPor(null)
                                setPday(false)
                            }}
                            onNext={() => {
                                setBaseDate(mesSeguinte)
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

                    <AnimatePresence>
                        {diaSelecionado && (
                            <motion.div
                                initial={{ opacity: 0, y: 16 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: 16 }}
                                transition={{ duration: 0.25, ease: 'easeOut' }}
                                className="space-y-5 border-t border-muted/20 pt-6"
                            >
                                <h2 className="text-2xl font-semibold text-white">
                                    Agendar para {diaSelecionado} de {mesNomeBase}
                                </h2>

                                <div>
                                    <label htmlFor="nome" className="block text-lg font-medium mb-2 text-white">
                                        Seu nome
                                    </label>
                                    <input
                                        id="nome"
                                        type="text"
                                        autoComplete="name"
                                        aria-invalid={erroNome}
                                        className={`w-full rounded-xl p-4 text-xl text-text bg-background
                                            border-2 ${erroNome ? 'border-red-500' : 'border-transparent'}
                                            focus:ring-2 focus:ring-secondary focus:outline-none`}
                                        value={nome}
                                        onChange={e => {
                                            setNome(e.target.value)
                                            if (erroNome) setErroNome(false)
                                        }}
                                    />
                                    {erroNome && (
                                        <p role="alert" className="text-base text-red-300 mt-2">
                                            Informe seu nome.
                                        </p>
                                    )}
                                </div>

                                <div>
                                    <label htmlFor="telefone" className="block text-lg font-medium mb-2 text-white">
                                        Seu telefone
                                    </label>
                                    <input
                                        id="telefone"
                                        type="tel"
                                        autoComplete="tel"
                                        inputMode="numeric"
                                        aria-invalid={erroTelefone}
                                        className={`w-full rounded-xl p-4 text-xl text-text bg-background
                                            border-2 ${erroTelefone ? 'border-red-500' : 'border-transparent'}
                                            focus:ring-2 focus:ring-secondary focus:outline-none`}
                                        value={telefone}
                                        onChange={e => {
                                            setTelefone(formatarTelefone(e.target.value))
                                            if (erroTelefone) setErroTelefone(false)
                                        }}
                                    />
                                    {erroTelefone && (
                                        <p role="alert" className="text-base text-red-300 mt-2">
                                            Informe um telefone celular válido.
                                        </p>
                                    )}
                                </div>

                                <motion.button
                                    onClick={agendar}
                                    disabled={loading}
                                    aria-busy={loading}
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.97 }}
                                    transition={{ duration: 0.15 }}
                                    className="w-full bg-secondary text-white text-xl font-semibold py-5 rounded-xl cursor-pointer
                                            shadow-md disabled:opacity-60 disabled:cursor-not-allowed"
                                >
                                    {loading ? 'Confirmando...' : 'Confirmar agendamento'}
                                </motion.button>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <AnimatePresence>
                        {mensagem && (
                            <motion.p
                                role="status"
                                aria-live="polite"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ duration: 0.2 }}
                                className="text-center text-lg font-medium text-primary"
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
