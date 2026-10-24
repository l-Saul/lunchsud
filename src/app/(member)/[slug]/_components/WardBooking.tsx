'use client'

// Página pública de agendamento de uma ala: calendário + mensagens + modal de
// agendar (BookingModal). Recebe do servidor o slug e os dias já ocupados e se
// mantém ao vivo pelo WebSocket; o backend continua sendo a fonte da verdade.

import { useState, useCallback } from 'react'
import { MonthCalendar } from './MonthCalendar'
import { BookingModal, type Agendado } from './BookingModal'
import { useBookingsRealtime, type MudancaAgendamento } from '@/hooks/use-bookings-realtime'
import { Flower } from '@/components/Flower'

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
    hoje: string      // 'YYYY-MM-DD' no fuso da ala (vem do servidor)
    mesAtual: string  // 'YYYY-MM' no fuso da ala (vem do servidor)
}

export default function WardBooking({ slug, alaId, nomeAla, ocupados, hoje, mesAtual }: Props) {
    const [diaSelecionado, setDiaSelecionado] = useState<number | null>(null)
    // Nome e telefone ficam aqui (e não no modal) para continuarem preenchidos se
    // a pessoa fechar o modal e abrir outro dia.
    const [nome, setNome] = useState('')
    const [telefone, setTelefone] = useState('')
    // Mensagem embaixo do calendário depois de agendar (ou de o dia ser ocupado).
    const [mensagem, setMensagem] = useState('')
    const [tipoMensagem, setTipoMensagem] = useState<'sucesso' | 'erro' | null>(null)
    const [diasOcupados, setDiasOcupados] = useState<DiaOcupado[]>(ocupados)
    const [ocupadoPor, setOcupadoPor] = useState<string | null>(null)
    // Mensagem embaixo do calendário ao tocar num dia que não abre agendamento.
    const [aviso, setAviso] = useState<'pday' | 'passado' | null>(null)

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

    useBookingsRealtime(alaId, aplicarMudanca)

    // Fecha o modal e limpa a mensagem (mantém nome/telefone digitados).
    const fecharModal = useCallback(() => {
        setDiaSelecionado(null)
        setMensagem('')
        setTipoMensagem(null)
    }, [])

    // Agendou: marca o dia na hora (o evento do WebSocket chega depois com o
    // mesmo id e só substitui), agradece e limpa o formulário.
    const aoAgendar = useCallback((agendado: Agendado) => {
        setDiasOcupados(prev => [...prev.filter(o => o.data !== agendado.data), agendado])
        setTipoMensagem('sucesso')
        setMensagem('Almoço agendado com sucesso. Muito obrigado!')
        setNome('')
        setTelefone('')
        setDiaSelecionado(null)
        setOcupadoPor(null)
    }, [])

    // Outra pessoa marcou esse dia antes: fecha o modal, avisa e atualiza o calendário.
    const aoConflito = useCallback(() => {
        setTipoMensagem('erro')
        setMensagem('Este dia acabou de ser ocupado. Escolha outro.')
        setDiaSelecionado(null)
        atualizarOcupados()
    }, [atualizarOcupados])

    // 'YYYY-MM-DD' do dia escolhido no mês visível.
    const dataSelecionada = diaSelecionado
        ? `${baseDate.getFullYear()}-${pad(baseDate.getMonth() + 1)}-${pad(diaSelecionado)}`
        : ''

    return (
        <main className="min-h-screen flex justify-center text-text">
            <div className="w-full max-w-2xl">

                {/* HEADER */}
                <div className="relative overflow-hidden px-3 pt-12 pb-7 text-center sm:px-6">
                    {/* Florzinhas decorativas nos cantos (estáticas — leves). */}
                    <span aria-hidden="true" className="pointer-events-none absolute left-4 top-6 opacity-25 sm:left-10">
                        <Flower size={32} />
                    </span>
                    <span aria-hidden="true" className="pointer-events-none absolute right-5 top-14 opacity-20 sm:right-12">
                        <Flower size={22} />
                    </span>

                    {/* Conteúdo, acima das decorações */}
                    <div className="relative z-10 flex flex-col items-center gap-4">
                        <h1 className="text-4xl font-bold text-white drop-shadow-sm">
                            {nomeAla}
                        </h1>

                        {/* Divisória com florzinha — toque delicado */}
                        <div className="flex items-center gap-3" aria-hidden="true">
                            <span className="h-px w-10 bg-linear-to-r from-transparent to-accent/70 sm:w-16" />
                            <Flower size={26} />
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
                        <MonthCalendar
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

                    {diaSelecionado && (
                        <BookingModal
                            key={dataSelecionada}
                            slug={slug}
                            dia={diaSelecionado}
                            nomeMes={mesNomeBase}
                            data={dataSelecionada}
                            nome={nome}
                            telefone={telefone}
                            onNomeChange={setNome}
                            onTelefoneChange={setTelefone}
                            onClose={fecharModal}
                            onBooked={aoAgendar}
                            onConflict={aoConflito}
                        />
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
