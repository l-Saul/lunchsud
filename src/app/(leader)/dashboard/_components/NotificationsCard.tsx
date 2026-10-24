/**
 * Contexto e regras: leia CLAUDE.md e docs/routes_dashboard.md antes de alterar.
 * Mudou o comportamento? Atualize o doc na mesma mudança.
 */
'use client';

import { useEffect, useRef, useState } from 'react';
import { Spinner } from '@/components/Spinner';
import { useScrollLock } from '@/hooks/use-scroll-lock';
import type { PreferenciasEmail, TipoAviso } from '@/lib/email-preferences';

type Props = {
    alaId: number;
    email: string | null;
    preferenciasIniciais: PreferenciasEmail;
};

const AVISOS: { tipo: TipoAviso; titulo: string; descricao: string }[] = [
    {
        tipo: 'novo_almoco',
        titulo: 'Novo almoço neste mês',
        descricao: 'Quando alguém agenda um almoço para um dia deste mês, chega um e-mail com o nome, o dia e o telefone.',
    },
    {
        tipo: 'dia_sem_almoco',
        titulo: 'Dia sem almoço',
        descricao: 'Quando faltam dois dias e o dia ainda está sem almoço, chega um e-mail avisando qual é o dia.',
    },
    {
        tipo: 'semana',
        titulo: 'Almoços da semana',
        descricao: 'Toda segunda-feira, chega um e-mail com os almoços de terça a domingo, com nome e telefone.',
    },
    {
        tipo: 'proximo_mes',
        titulo: 'Almoços do mês seguinte',
        descricao: 'Um dia antes do fim do mês, chega um e-mail avisando que o mês seguinte já pode ser agendado, com quem já agendou e quais dias ainda estão livres.',
    },
    {
        tipo: 'pedido_acesso',
        titulo: 'Pedido para entrar no painel',
        descricao: 'Quando outro líder cria uma conta e pede para usar o painel desta ala, chega um e-mail com um botão para abrir o painel e aprovar o pedido.',
    },
];

function Chave({ titulo, descricao, ligado, onAlternar }: {
    titulo: string;
    descricao: string;
    ligado: boolean;
    onAlternar: () => void;
}) {
    return (
        <button
            type="button"
            role="switch"
            aria-checked={ligado}
            onClick={onAlternar}
            className="flex min-h-14 w-full items-center justify-between gap-4 rounded-2xl border border-slate-200 p-4 text-left transition duration-100 hover:border-secondary/60 active:scale-[0.99] cursor-pointer"
        >
            <span className="min-w-0">
                <span className="block font-semibold text-text">{titulo}</span>
                <span className="mt-1 block text-base leading-snug text-muted">{descricao}</span>
            </span>
            <span
                aria-hidden="true"
                className={`relative inline-flex h-8 w-14 shrink-0 items-center rounded-full transition-colors duration-200 ${ligado ? 'bg-secondary' : 'bg-slate-300'}`}
            >
                <span
                    className={`inline-block h-6 w-6 rounded-full bg-white shadow transition-transform duration-200 ${ligado ? 'translate-x-7' : 'translate-x-1'}`}
                />
            </span>
        </button>
    );
}

export function NotificationsCard({ alaId, email, preferenciasIniciais }: Props) {
    const [preferencias, setPreferencias] = useState(preferenciasIniciais);
    const [status, setStatus] = useState<'ocioso' | 'salvando' | 'salvo' | 'erro'>('ocioso');
    const [erro, setErro] = useState('');
    const [confirmar, setConfirmar] = useState<TipoAviso | null>(null);
    const salvo = useRef(preferenciasIniciais);
    const fila = useRef<PreferenciasEmail | null>(null);
    const enviando = useRef(false);

    async function salvar(proximo: PreferenciasEmail) {
        fila.current = proximo;
        if (enviando.current) return;
        enviando.current = true;
        setStatus('salvando');

        while (fila.current) {
            const atual = fila.current;
            fila.current = null;
            let mensagem = '';
            try {
                const res = await fetch('/api/avisos/preferencias', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ alaId, ...atual }),
                });
                if (!res.ok) {
                    const corpo = await res.json().catch(() => null);
                    mensagem = res.status === 409 && corpo?.error ? corpo.error : 'Não foi possível salvar. Tente de novo.';
                }
            } catch {
                mensagem = 'Sem internet. Verifique a conexão e tente de novo.';
            }
            if (mensagem) {
                fila.current = null;
                enviando.current = false;
                setPreferencias(salvo.current);
                setErro(mensagem);
                setStatus('erro');
                return;
            }
            salvo.current = atual;
        }

        enviando.current = false;
        setStatus('salvo');
    }

    function mudar(tipo: TipoAviso, ligado: boolean) {
        const proximo = { ...preferencias, [tipo]: ligado };
        setPreferencias(proximo);
        salvar(proximo);
    }

    function alternar(tipo: TipoAviso) {
        if (preferencias[tipo]) setConfirmar(tipo);
        else mudar(tipo, true);
    }

    function desligar() {
        if (!confirmar) return;
        mudar(confirmar, false);
        setConfirmar(null);
    }

    useScrollLock(confirmar !== null);

    useEffect(() => {
        if (!confirmar) return;
        const onKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') setConfirmar(null);
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [confirmar]);

    const avisoConfirmando = AVISOS.find(a => a.tipo === confirmar);

    return (
        <section className="flex flex-col gap-5 rounded-3xl bg-background p-4 shadow-md ring-1 ring-primary/10 sm:p-8">
            <div className="flex flex-col gap-2">
                <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
                    <div className="flex items-center gap-2">
                        <span className="h-5 w-1.5 rounded-full bg-accent" />
                        <h2 className="text-xl font-semibold text-text">Notificações</h2>
                    </div>
                    <p role="status" aria-live="polite" className="text-base font-medium">
                        {status === 'salvando' && (
                            <span className="flex items-center gap-2 text-muted">
                                <Spinner className="h-4 w-4" />
                                Salvando…
                            </span>
                        )}
                        {status === 'salvo' && <span className="animate-aparecer text-secondary">Salvo.</span>}
                    </p>
                </div>
                <p className="wrap-anywhere text-base leading-snug text-muted">
                    Escolha quais e-mails quer receber sobre esta ala.{' '}
                    {email ? (
                        <>Eles chegam em <strong className="text-text">{email}</strong>.</>
                    ) : (
                        'Esta conta ainda não tem e-mail cadastrado.'
                    )}
                </p>
            </div>

            {status === 'erro' && (
                <p key={erro} role="alert" className="animate-aparecer text-base font-medium text-accent">
                    {erro}
                </p>
            )}

            <div className="flex flex-col gap-3">
                {AVISOS.map(aviso => (
                    <Chave
                        key={aviso.tipo}
                        titulo={aviso.titulo}
                        descricao={aviso.descricao}
                        ligado={preferencias[aviso.tipo]}
                        onAlternar={() => alternar(aviso.tipo)}
                    />
                ))}
            </div>

            {avisoConfirmando && (
                <div
                    onClick={() => setConfirmar(null)}
                    className="fixed inset-0 z-60 flex animate-aparecer items-center justify-center bg-primary/50 p-4 backdrop-blur-sm"
                >
                    <div
                        onClick={e => e.stopPropagation()}
                        role="alertdialog"
                        aria-modal="true"
                        aria-labelledby="desligar-aviso-titulo"
                        className="w-full max-w-sm animate-surgir rounded-2xl bg-background p-6 text-center shadow-2xl"
                    >
                        <h3 id="desligar-aviso-titulo" className="text-xl font-semibold text-text">
                            Desligar este aviso?
                        </h3>
                        <div className="mt-6 flex flex-wrap gap-3">
                            <button
                                type="button"
                                autoFocus
                                onClick={() => setConfirmar(null)}
                                className="min-h-12 grow basis-28 rounded-xl border border-slate-300 px-4 text-base font-medium text-text transition hover:bg-slate-100 cursor-pointer"
                            >
                                Manter ligado
                            </button>
                            <button
                                type="button"
                                onClick={desligar}
                                className="min-h-12 grow basis-28 rounded-xl bg-accent px-4 text-base font-semibold text-white shadow-md transition duration-100 hover:opacity-95 active:scale-[0.98] cursor-pointer"
                            >
                                Desligar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </section>
    );
}
