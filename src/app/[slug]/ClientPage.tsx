'use client'

// Página pública de agendamento de uma ala: calendário + formulário.
// Recebe do servidor o slug e os dias já ocupados; o backend continua sendo a fonte da verdade.

import { useState, useEffect, useCallback } from 'react'
import { Calendar } from '@/components/Calendar'
import { mascaraTelefone, normalizarTelefone } from '@/lib/phone'
import { useOcupadosRealtime, type MudancaAgendamento } from '@/hooks/use-ocupados-realtime'
import { Flor } from '@/components/Flor'
import { Spinner } from '@/components/Spinner'

// Estilo único dos campos do modal de agendar (label claro + placeholder).
const campoBase =
    'w-full min-w-0 box-border appearance-none rounded-xl border px-4 py-3.5 text-lg text-text ' +
    'placeholder:text-muted/60 focus:border-secondary focus:outline-none focus:ring-2 focus:ring-secondary'

type DiaOcupado = {
    id: number
    data: string
    nome: string
}

const pad = (n: number) => String(n).padStart(2, '0')

type Props = {
    slug: string
    alaId: number
    nomeAla: string   // nome real da ala (vem do banco)
    ocupados: DiaOcupado[]
    hoje: string      // 'YYYY-MM-DD' no fuso de São Paulo (vem do servidor)
    mesAtual: string  // 'YYYY-MM' no fuso de São Paulo (vem do servidor)
}

export default function ClientPage({ slug, alaId, nomeAla, ocupados, hoje, mesAtual }: Props) {
    const [diaSelecionado, setDiaSelecionado] = useState<number | null>(null)
    const [nome, setNome] = useState('')
    const [telefone, setTelefone] = useState('')
    const [mensagem, setMensagem] = useState('')
    const [tipoMensagem, setTipoMensagem] = useState<'sucesso' | 'erro' | null>(null)
    const [loading, setLoading] = useState(false)
    const [diasOcupados, setDiasOcupados] = useState<DiaOcupado[]>(ocupados)
    const [ocupadoPor, setOcupadoPor] = useState<string | null>(null)
    // Mensagem embaixo do calendário ao tocar num dia que não abre agendamento.
    const [aviso, setAviso] = useState<'pday' | 'passado' | null>(null)

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

    // Janela agendável em texto ('YYYY-MM-DD'), para filtrar o que chega ao vivo:
    // de hoje (dias passados ficam bloqueados) até o fim do mês seguinte.
    const inicioJanela = hoje
    const aposJanela = new Date(anoBase, mesBase + 1, 1)
    const fimJanela = `${aposJanela.getFullYear()}-${pad(aposJanela.getMonth() + 1)}-01`

    // Busca a lista inteira no servidor. Só para ressincronizar (WebSocket
    // reconectou, inclusive ao voltar para a página; dia que acabou de ser
    // ocupado) — as mudanças normais chegam prontas pelo WebSocket.
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

    async function agendar() {
        if (!slug || !diaSelecionado) return

        // Limpa estados de erro/mensagem da tentativa anterior.
        setErroNome(false)
        setErroTelefone(false)
        setMensagem('')
        setTipoMensagem(null)

        // Validação do formulário (nome com 2+ letras e telefone com 11 dígitos).
        const nomeInvalido = nome.trim().length < 2
        const telefoneInvalido = !normalizarTelefone(telefone)

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
                {/* Margens enxutas no celular: cada px vira largura dos 7 dias. Em 360px
                    os dias chegam a 44px (alvo de toque recomendado, WCAG 2.5.5). */}
                <div className="px-2 sm:px-6 py-6 space-y-6">

                    {/* CALENDÁRIO — sem animação de entrada: aparece junto com a página. */}
                    <div className="relative overflow-hidden bg-background text-secondary rounded-2xl p-1.5 sm:p-4 shadow-xl ring-1 ring-white/40 border border-muted/10">
                        {/* Fitinha de acento no topo (verde → rosa → verde). */}
                        <span aria-hidden="true" className="absolute inset-x-0 top-0 h-1.5 bg-linear-to-r from-secondary via-accent to-secondary" />
                        <Calendar
                            ocupados={diasOcupados}
                            baseDate={baseDate}
                            hoje={hoje}
                            selectedDay={diaSelecionado}
                            canPrev={canPrev}
                            canNext={canNext}
                            onPrev={() => {
                                setBaseDate(inicioMesAtual)
                                setDiaSelecionado(null)
                                setOcupadoPor(null)
                                setAviso(null)
                            }}
                            onNext={() => {
                                setBaseDate(inicioMesSeguinte)
                                setDiaSelecionado(null)
                                setOcupadoPor(null)
                                setAviso(null)
                            }}
                            onSelectDay={day => {
                                setDiaSelecionado(day)
                                setOcupadoPor(null)
                                setAviso(null)
                            }}
                            onSelectOcupado={nome => {
                                setOcupadoPor(nome)
                                setDiaSelecionado(null)
                                setAviso(null)
                            }}
                            onSelectPday={() => {
                                setAviso('pday')
                                setDiaSelecionado(null)
                                setOcupadoPor(null)
                            }}
                            onSelectPassado={() => {
                                setAviso('passado')
                                setDiaSelecionado(null)
                                setOcupadoPor(null)
                            }}
                        />
                    </div>

                    {/* Mensagens embaixo do calendário: fade curto para chamar o olho.
                        A key refaz o fade quando a mensagem muda. */}
                    {ocupadoPor && (
                        // wrap-anywhere: nome sem espaço (ou muito longo) quebra em vez de
                        // empurrar a página para o lado.
                        <p key={ocupadoPor} className="animate-aparecer wrap-anywhere text-center text-lg font-medium text-white">
                            Este dia já foi agendado por <strong>{ocupadoPor}</strong>.
                        </p>
                    )}

                    {aviso === 'pday' && (
                        <p className="animate-aparecer text-center text-lg font-medium text-white">
                            Segunda-feira é dia de <strong>P-day</strong>. Escolha outro dia.
                        </p>
                    )}

                    {aviso === 'passado' && (
                        <p className="animate-aparecer text-center text-lg font-medium text-white">
                            Esse dia <strong>já passou</strong>. Escolha outro dia.
                        </p>
                    )}

                    {/* MODAL DE AGENDAR — popup com fundo desfocado, trava o scroll e tem
                        Cancelar. Abre com um fade curto (avisa que uma camada apareceu);
                        fecha na hora. */}
                    {diaSelecionado && (
                        <div className="fixed inset-0 z-50 animate-aparecer overflow-y-auto overscroll-contain bg-primary/50 backdrop-blur-sm">
                            {/* Container rolável: com o teclado aberto no mobile o modal
                                pode passar da tela e ainda assim dá pra rolar até os botões. */}
                            <div
                                onClick={fecharModal}
                                className="flex min-h-full items-center justify-center p-4"
                            >
                            <div
                                onClick={e => e.stopPropagation()}
                                role="dialog"
                                aria-modal="true"
                                aria-label={`Agendar dia ${diaSelecionado} de ${mesNomeBase}`}
                                className="w-full max-w-md animate-surgir rounded-2xl bg-background p-6 shadow-2xl"
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
                                            // "tel" (não "numeric"): o teclado de telefone tem a tecla "+".
                                            inputMode="tel"
                                            placeholder="Digite seu telefone aqui"
                                            aria-invalid={erroTelefone}
                                            className={`${campoBase} ${erroTelefone ? 'border-accent' : 'border-slate-300'}`}
                                            value={telefone}
                                            onChange={e => {
                                                setTelefone(mascaraTelefone(e.target.value))
                                                if (erroTelefone) setErroTelefone(false)
                                            }}
                                            // Ao sair do campo mostra o número como foi entendido
                                            // (ex.: o 9 do celular antigo, o país separado).
                                            onBlur={() => {
                                                const lido = normalizarTelefone(telefone)
                                                if (lido) setTelefone(lido.formatado)
                                            }}
                                        />
                                        {erroTelefone && (
                                            <p role="alert" className="text-sm text-accent">
                                                Confira o telefone, com DDD. De outro país? Comece com + e o código do país.
                                            </p>
                                        )}
                                    </div>
                                </div>

                                {tipoMensagem === 'erro' && mensagem && (
                                    <p key={mensagem} role="alert" className="mt-4 animate-aparecer text-center text-sm font-medium text-accent">
                                        {mensagem}
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
                                        onClick={fecharModal}
                                        disabled={loading}
                                        className="min-h-13 grow basis-28 rounded-xl border border-slate-300 px-4 text-lg font-medium text-text transition hover:bg-slate-100 disabled:opacity-50 cursor-pointer"
                                    >
                                        Cancelar
                                    </button>
                                    {/* Toque responde na hora; enquanto envia: travado, girando e
                                        dizendo "Confirmando…" — tocar de novo não faz nada. */}
                                    <button
                                        onClick={agendar}
                                        disabled={loading}
                                        aria-busy={loading}
                                        className="flex min-h-13 grow basis-28 items-center justify-center gap-2 rounded-xl bg-secondary px-4 text-lg font-semibold text-white shadow-md transition duration-100 hover:opacity-95 hover:shadow-lg enabled:active:scale-[0.98] disabled:opacity-70 cursor-pointer"
                                    >
                                        {loading && <Spinner />}
                                        {loading ? 'Confirmando…' : 'Confirmar'}
                                    </button>
                                </div>
                            </div>
                            </div>
                        </div>
                    )}

                    {mensagem && !diaSelecionado && (
                        <p
                            key={mensagem}
                            role="status"
                            aria-live="polite"
                            // Cor conforme o tipo: erro em rosa, sucesso em verde (antes ficava
                            // azul sobre o fundo azul = invisível).
                            className={`animate-aparecer text-center text-lg font-medium ${
                                tipoMensagem === 'erro' ? 'text-accent' : 'text-secondary'
                            }`}
                        >
                            {mensagem}
                        </p>
                    )}

                </div>
            </div>
        </main>
    )
}
