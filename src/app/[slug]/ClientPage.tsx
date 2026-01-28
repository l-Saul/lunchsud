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
    const [imagemSrc, setImagemSrc] = useState<string | null>(null)

    const [erroNome, setErroNome] = useState(false)
    const [erroTelefone, setErroTelefone] = useState(false)

    const hoje = new Date()
    const ano = hoje.getFullYear()
    const mes = hoje.getMonth()

    const nomeAla = formatarNomeAla(slug)

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
        setMensagem('Agendamento realizado com sucesso.')
        setNome('')
        setTelefone('')
        setDiaSelecionado(null)
        setOcupadoPor(null)
    }

    return (
        <main className="min-h-screen bg-primary flex justify-center text-text">
            <div className="w-full max-w-xl">

                {/* HEADER */}
                <div className="px-6 py-10 text-center space-y-4">
                    <h1 className="text-4xl font-extrabold text-secondary">
                        Ala {nomeAla}
                    </h1>

                    <h2 className="text-2xl font-semibold text-white">
                        Agende seu almoço para os missionários
                    </h2>

                    {imagemSrc && (
                        <img
                            src={imagemSrc}
                            alt={`Missionários da ala ${nomeAla}`}
                            className="mx-auto mt-4 rounded-2xl max-h-64 object-cover shadow-md"
                        />
                    )}

                    <p className="text-lg text-white">
                        Escolha um dia disponível abaixo
                    </p>
                </div>

                {/* CONTEÚDO */}
                <div className="px-6 py-8 space-y-8">

                    {/* CALENDÁRIO */}
                    <motion.div
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, ease: 'easeOut' }}
                        className="bg-background text-text rounded-2xl p-4 shadow-lg border border-muted/10"
                    >
                        <Calendar
                            ocupados={diasOcupados}
                            selectedDay={diaSelecionado}
                            onSelectDay={day => {
                                setDiaSelecionado(day)
                                setOcupadoPor(null)
                            }}
                            onSelectOcupado={nome => {
                                setOcupadoPor(nome)
                                setDiaSelecionado(null)
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

                    <AnimatePresence>
                        {diaSelecionado && (
                            <motion.div
                                initial={{ opacity: 0, y: 16 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: 16 }}
                                transition={{ duration: 0.25, ease: 'easeOut' }}
                                className="space-y-5 border-t border-muted/20 pt-6"
                            >
                                <h2 className="text-xl font-semibold text-white">
                                    Agendar para o dia {diaSelecionado}
                                </h2>

                                <div>
                                    <label className="block text-sm font-medium mb-1 text-white">
                                        Nome
                                    </label>
                                    <input
                                        className={`w-full rounded-lg p-3 text-lg text-text bg-background
                                            border ${erroNome ? 'border-red-500' : 'border-muted/30'}
                                            focus:ring-2 focus:ring-secondary focus:outline-none`}
                                        value={nome}
                                        onChange={e => {
                                            setNome(e.target.value)
                                            if (erroNome) setErroNome(false)
                                        }}
                                    />
                                    {erroNome && (
                                        <p className="text-sm text-secondary mt-1">
                                            Informe seu nome.
                                        </p>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium mb-1 text-white">
                                        Telefone
                                    </label>
                                    <input
                                        className={`w-full rounded-lg p-3 text-lg text-text bg-background
                                            border ${erroTelefone ? 'border-red-500' : 'border-muted/30'}
                                            focus:ring-2 focus:ring-secondary focus:outline-none`}
                                        inputMode="numeric"
                                        value={telefone}
                                        onChange={e => {
                                            setTelefone(formatarTelefone(e.target.value))
                                            if (erroTelefone) setErroTelefone(false)
                                        }}
                                    />
                                    {erroTelefone && (
                                        <p className="text-sm text-secondary mt-1">
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
                                    className="w-full bg-secondary text-white text-lg py-4 rounded-xl
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
