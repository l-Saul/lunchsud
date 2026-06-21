'use client'

// Página pública de agendamento de uma ala: calendário + formulário.
// Recebe do servidor o slug e os dias já ocupados; o backend continua sendo a fonte da verdade.

import { useState } from 'react'
import { Calendar } from '@/components/Calendar'
import { motion, AnimatePresence } from 'framer-motion'
import { formatarTelefone } from '@/lib/phone'
import { useOcupadosRealtime } from '@/hooks/use-ocupados-realtime'

type DiaOcupado = {
    data: string
    nome: string
}

type Props = {
    slug: string
    alaId: number
    ocupados: DiaOcupado[]
}

// Converte o slug da URL ("ala-exemplo") no nome exibido ("Ala Exemplo").
function formatarNomeAla(slug: string) {
    return decodeURIComponent(slug)
        .replace(/-/g, ' ')
        .replace(/\b\w/g, l => l.toUpperCase())
}

export default function ClientPage({ slug, alaId, ocupados }: Props) {
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

    const hoje = new Date()
    const mesAtual = new Date(hoje.getFullYear(), hoje.getMonth(), 1)
    const mesSeguinte = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 1)

    const [baseDate, setBaseDate] = useState(mesAtual)

    const canPrev = baseDate.getTime() !== mesAtual.getTime()
    const canNext = baseDate.getTime() !== mesSeguinte.getTime()

    const nomeAla = formatarNomeAla(slug)
    const mesNomeBase = baseDate.toLocaleDateString('pt-BR', { month: 'long' })

    // Ao vivo: se outra pessoa agendar/editar/remover nesta ala, o WebSocket dispara
    // e recarregamos os dias ocupados (uma busca por evento, nunca em loop).
    useOcupadosRealtime(alaId, () => {
        fetch(`/api/agendamentos/${slug}`, { cache: 'no-store' })
            .then(res => (res.ok ? res.json() : null))
            .then((dados: DiaOcupado[] | null) => {
                if (dados) setDiasOcupados(dados)
            })
            .catch(() => {})
    })

    async function agendar() {
        if (!slug || !diaSelecionado) return

        // Limpa estados de erro/mensagem da tentativa anterior.
        setErroNome(false)
        setErroTelefone(false)
        setMensagem('')
        setTipoMensagem(null)

        // Validação do formulário (nome preenchido e telefone com 11 dígitos).
        const nomeInvalido = !nome.trim()
        const telefoneInvalido = telefone.replace(/\D/g, '').length !== 11

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

        const res = await fetch('/api/agendar', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ slug, data, nome, telefone })
        })

        setLoading(false)

        // 409/erro: o dia foi ocupado entre abrir a tela e confirmar.
        if (!res.ok) {
            setTipoMensagem('erro')
            setMensagem('Este dia acabou de ser ocupado. Escolha outro.')
            setDiaSelecionado(null)
            return
        }

        // Sucesso: marca o dia localmente e limpa o formulário.
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
                <div className="flex flex-col items-center gap-4 px-3 pt-12 pb-6 text-center sm:px-6">
                    <h1 className="text-4xl font-bold text-white">
                        Ala {nomeAla}
                    </h1>
                    <span className="h-1 w-16 rounded-full bg-secondary" />
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
